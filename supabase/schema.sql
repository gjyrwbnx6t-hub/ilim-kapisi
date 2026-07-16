-- İlim Kapısı - Profil ve Aktivite Takibi şeması
-- Supabase panelinde: SQL Editor > New query > bu dosyanın tamamını yapıştır > Run.
-- Tekrar çalıştırılabilir (idempotent) olacak şekilde yazılmıştır.

-- ============================================================
-- 1. Roller ve profiles tablosu
-- ============================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('student', 'teacher');
  end if;
end$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role user_role not null default 'student',
  teacher_code text,
  created_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists teacher_code text;

create unique index if not exists profiles_teacher_code_key
  on public.profiles (teacher_code)
  where teacher_code is not null;

update public.profiles
set teacher_code = upper(substr(replace(id::text, '-', ''), 1, 8))
where role = 'teacher' and teacher_code is null;

update public.profiles p
set role = 'teacher',
    teacher_code = coalesce(
      p.teacher_code,
      upper(substr(replace(p.id::text, '-', ''), 1, 8))
    )
from auth.users u
where p.id = u.id
  and u.raw_user_meta_data ->> 'role' = 'teacher'
  and (p.role <> 'teacher' or p.teacher_code is null);

update public.profiles p
set role = 'teacher',
    teacher_code = coalesce(
      p.teacher_code,
      upper(substr(replace(p.id::text, '-', ''), 1, 8))
    )
from auth.users u
where p.id = u.id
  and lower(u.email) in ('adminportalconnect@gmail.com')
  and (p.role <> 'teacher' or p.teacher_code is null);

-- ============================================================
-- 2. Aktivite olayları
-- ============================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'activity_type') then
    create type activity_type as enum ('vocab', 'mindmap', 'visit');
  end if;
end$$;

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type activity_type not null,
  course_slug text,
  unit_id text,
  score integer,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_events_user_idx
  on public.activity_events (user_id, created_at desc);

-- ============================================================
-- 3. Ders ilerlemesi (upsert edilir)
-- ============================================================

create table if not exists public.study_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  course_slug text not null,
  module text not null,
  last_week integer,
  percent integer,
  updated_at timestamptz not null default now(),
  primary key (user_id, course_slug, module)
);

-- ============================================================
-- 4. Öğretmen izinleri, kariyer özetleri ve geri bildirimler
-- ============================================================

create table if not exists public.teacher_permissions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null constraint teacher_permissions_student_id_fkey
    references public.profiles (id) on delete cascade,
  teacher_id uuid not null constraint teacher_permissions_teacher_id_fkey
    references public.profiles (id) on delete cascade,
  allow_rearapca boolean not null default false,
  allow_career boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint teacher_permissions_student_teacher_key unique (student_id, teacher_id),
  constraint teacher_permissions_not_self check (student_id <> teacher_id)
);

create index if not exists teacher_permissions_teacher_idx
  on public.teacher_permissions (teacher_id);

create table if not exists public.career_snapshots (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  summary jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.teacher_feedback (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null constraint teacher_feedback_teacher_id_fkey
    references public.profiles (id) on delete cascade,
  student_id uuid not null constraint teacher_feedback_student_id_fkey
    references public.profiles (id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists teacher_feedback_student_idx
  on public.teacher_feedback (student_id, created_at desc);

create index if not exists teacher_feedback_teacher_idx
  on public.teacher_feedback (teacher_id, created_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_teacher_permissions_updated_at
  on public.teacher_permissions;
create trigger touch_teacher_permissions_updated_at
  before update on public.teacher_permissions
  for each row execute function public.touch_updated_at();

-- ============================================================
-- 5. Yardımcılar: öğretmen kontrolü ve izinli erişim
--    SECURITY DEFINER ile RLS'i atlar)
-- ============================================================

create or replace function public.is_teacher()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'teacher'
  );
$$;

create or replace function public.can_teacher_access_student(
  target_student_id uuid,
  requested_scope text default null
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.teacher_permissions tp
    join public.profiles teacher on teacher.id = tp.teacher_id
    where tp.teacher_id = auth.uid()
      and tp.student_id = target_student_id
      and teacher.role = 'teacher'
      and (
        requested_scope is null
        or (requested_scope = 'rearapca' and tp.allow_rearapca)
        or (requested_scope = 'career' and tp.allow_career)
      )
  );
$$;

create or replace function public.get_teacher_by_code(lookup_code text)
returns table (id uuid, full_name text, teacher_code text)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, p.full_name, p.teacher_code
  from public.profiles p
  where auth.uid() is not null
    and p.role = 'teacher'
    and p.teacher_code = upper(trim(lookup_code))
  limit 1;
$$;

create or replace function public.sync_current_user_profile()
returns table (
  id uuid,
  full_name text,
  role public.user_role,
  teacher_code text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  auth_user auth.users%rowtype;
  next_role public.user_role;
  next_teacher_code text;
begin
  select *
  into auth_user
  from auth.users
  where auth.users.id = auth.uid();

  if not found then
    return;
  end if;

  next_role := case
    when auth_user.raw_user_meta_data ->> 'role' = 'teacher'
      or lower(auth_user.email) in ('adminportalconnect@gmail.com')
      then 'teacher'::public.user_role
    else 'student'::public.user_role
  end;

  next_teacher_code := case
    when next_role = 'teacher'
      then upper(substr(replace(auth_user.id::text, '-', ''), 1, 8))
    else null
  end;

  insert into public.profiles (id, full_name, role, teacher_code)
  values (
    auth_user.id,
    coalesce(auth_user.raw_user_meta_data ->> 'full_name', ''),
    next_role,
    next_teacher_code
  )
  on conflict (id) do update
    set full_name = coalesce(
          nullif(excluded.full_name, ''),
          public.profiles.full_name
        ),
        role = case
          when excluded.role = 'teacher' then 'teacher'::public.user_role
          else public.profiles.role
        end,
        teacher_code = case
          when excluded.role = 'teacher'
            then coalesce(public.profiles.teacher_code, excluded.teacher_code)
          else public.profiles.teacher_code
        end;

  return query
    select p.id, p.full_name, p.role, p.teacher_code, p.created_at
    from public.profiles p
    where p.id = auth_user.id;
end;
$$;

-- ============================================================
-- 6. Yeni kullanıcı kaydında otomatik profil oluşturma trigger'ı
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_role public.user_role;
  next_teacher_code text;
begin
  next_role := case
    when new.raw_user_meta_data ->> 'role' = 'teacher'
      or lower(new.email) in ('adminportalconnect@gmail.com')
      then 'teacher'::public.user_role
    else 'student'::public.user_role
  end;

  next_teacher_code := case
    when next_role = 'teacher'
      then upper(substr(replace(new.id::text, '-', ''), 1, 8))
    else null
  end;

  insert into public.profiles (id, full_name, role, teacher_code)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    next_role,
    next_teacher_code
  )
  on conflict (id) do update
    set full_name = coalesce(
          nullif(excluded.full_name, ''),
          public.profiles.full_name
        ),
        role = case
          when excluded.role = 'teacher' then 'teacher'::public.user_role
          else public.profiles.role
        end,
        teacher_code = case
          when excluded.role = 'teacher'
            then coalesce(public.profiles.teacher_code, excluded.teacher_code)
          else public.profiles.teacher_code
        end;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 7. Row Level Security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.activity_events enable row level security;
alter table public.study_progress enable row level security;
alter table public.teacher_permissions enable row level security;
alter table public.career_snapshots enable row level security;
alter table public.teacher_feedback enable row level security;

-- profiles: kişi kendi profilini görür; öğrenciler öğretmen kodu için öğretmenleri,
-- öğretmenler de yalnız izinli öğrencileri görebilir.
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (
    id = auth.uid()
    or (auth.uid() is not null and role = 'teacher')
    or public.can_teacher_access_student(id)
  );

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and role = 'student');
-- Not: with check role = 'student' -> kullanıcı kendini teacher yapamaz.
-- Öğretmen atamasını panelden/SQL ile siz yaparsınız (aşağıya bkz).

-- activity_events: öğrenci kendi olaylarını ekler/görür; öğretmen yalnız
-- Rearapça izni olan öğrencilerin olaylarını görür.
drop policy if exists activity_insert_own on public.activity_events;
create policy activity_insert_own on public.activity_events
  for insert with check (user_id = auth.uid());

drop policy if exists activity_select_own_or_teacher on public.activity_events;
create policy activity_select_own_or_teacher on public.activity_events
  for select using (
    user_id = auth.uid()
    or public.can_teacher_access_student(user_id, 'rearapca')
  );

drop policy if exists activity_delete_own on public.activity_events;
create policy activity_delete_own on public.activity_events
  for delete using (user_id = auth.uid());

-- study_progress: öğrenci kendi ilerlemesini yazar/görür; öğretmen yalnız
-- Rearapça izni olan öğrencilerin ilerlemesini görür.
drop policy if exists progress_insert_own on public.study_progress;
create policy progress_insert_own on public.study_progress
  for insert with check (user_id = auth.uid());

drop policy if exists progress_update_own on public.study_progress;
create policy progress_update_own on public.study_progress
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists progress_select_own_or_teacher on public.study_progress;
create policy progress_select_own_or_teacher on public.study_progress
  for select using (
    user_id = auth.uid()
    or public.can_teacher_access_student(user_id, 'rearapca')
  );

-- teacher_permissions: öğrenci kendi izinlerini yönetir; öğretmen kendisine
-- verilmiş izinleri okuyabilir.
drop policy if exists teacher_permissions_select_related on public.teacher_permissions;
create policy teacher_permissions_select_related on public.teacher_permissions
  for select using (student_id = auth.uid() or teacher_id = auth.uid());

drop policy if exists teacher_permissions_insert_own on public.teacher_permissions;
create policy teacher_permissions_insert_own on public.teacher_permissions
  for insert with check (student_id = auth.uid());

drop policy if exists teacher_permissions_update_own on public.teacher_permissions;
create policy teacher_permissions_update_own on public.teacher_permissions
  for update using (student_id = auth.uid())
  with check (student_id = auth.uid());

drop policy if exists teacher_permissions_delete_own on public.teacher_permissions;
create policy teacher_permissions_delete_own on public.teacher_permissions
  for delete using (student_id = auth.uid());

-- career_snapshots: öğrenci kendi kariyer özetini yazar; öğretmen yalnız
-- Kariyer izni verilen öğrencilerin özetlerini görür.
drop policy if exists career_snapshots_select_own_or_teacher on public.career_snapshots;
create policy career_snapshots_select_own_or_teacher on public.career_snapshots
  for select using (
    user_id = auth.uid()
    or public.can_teacher_access_student(user_id, 'career')
  );

drop policy if exists career_snapshots_insert_own on public.career_snapshots;
create policy career_snapshots_insert_own on public.career_snapshots
  for insert with check (user_id = auth.uid());

drop policy if exists career_snapshots_update_own on public.career_snapshots;
create policy career_snapshots_update_own on public.career_snapshots
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- teacher_feedback: öğretmen izinli öğrencisine geri bildirim yazar;
-- öğrenci kendisine gelenleri görür.
drop policy if exists teacher_feedback_select_related on public.teacher_feedback;
create policy teacher_feedback_select_related on public.teacher_feedback
  for select using (student_id = auth.uid() or teacher_id = auth.uid());

drop policy if exists teacher_feedback_insert_permitted_teacher on public.teacher_feedback;
create policy teacher_feedback_insert_permitted_teacher on public.teacher_feedback
  for insert with check (
    teacher_id = auth.uid()
    and public.can_teacher_access_student(student_id)
  );

-- ============================================================
-- 8. Öğretmen atama (elle) - ihtiyaç oldukça çalıştırın
-- ============================================================
-- Bir kullanıcıyı öğretmen yapmak için (e-postasını yazın):
--
--   update public.profiles
--   set role = 'teacher',
--       teacher_code = coalesce(teacher_code, upper(substr(replace(id::text, '-', ''), 1, 8)))
--   where id = (select id from auth.users where email = 'ogretmen@example.com');
--
-- Yeni /ogretmen/kayit ekranı öğretmen hesabını doğrudan 'teacher' olarak açar.
-- Öğrenci verisi yine yalnız öğrencinin verdiği izin kapsamıyla görünür.
