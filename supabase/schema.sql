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
  created_at timestamptz not null default now()
);

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
-- 4. Yardımcı: is_teacher() (RLS özyinelemesini önlemek için
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

-- ============================================================
-- 5. Yeni kullanıcı kaydında otomatik profil oluşturma trigger'ı
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'student'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 6. Row Level Security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.activity_events enable row level security;
alter table public.study_progress enable row level security;

-- profiles: kendi profilini gör/güncelle; öğretmen hepsini görebilir
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (id = auth.uid() or public.is_teacher());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and role = 'student');
-- Not: with check role = 'student' -> kullanıcı kendini teacher yapamaz.
-- Öğretmen atamasını panelden/SQL ile siz yaparsınız (aşağıya bkz).

-- activity_events: öğrenci kendi olaylarını ekler/görür; öğretmen hepsini görür
drop policy if exists activity_insert_own on public.activity_events;
create policy activity_insert_own on public.activity_events
  for insert with check (user_id = auth.uid());

drop policy if exists activity_select_own_or_teacher on public.activity_events;
create policy activity_select_own_or_teacher on public.activity_events
  for select using (user_id = auth.uid() or public.is_teacher());

-- study_progress: öğrenci kendi ilerlemesini yazar/görür; öğretmen hepsini görür
drop policy if exists progress_insert_own on public.study_progress;
create policy progress_insert_own on public.study_progress
  for insert with check (user_id = auth.uid());

drop policy if exists progress_update_own on public.study_progress;
create policy progress_update_own on public.study_progress
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists progress_select_own_or_teacher on public.study_progress;
create policy progress_select_own_or_teacher on public.study_progress
  for select using (user_id = auth.uid() or public.is_teacher());

-- ============================================================
-- 7. Öğretmen atama (elle) - ihtiyaç oldukça çalıştırın
-- ============================================================
-- Bir kullanıcıyı öğretmen yapmak için (e-postasını yazın):
--
--   update public.profiles
--   set role = 'teacher'
--   where id = (select id from auth.users where email = 'ogretmen@example.com');
--
-- Böylece kimse kayıt sırasında kendini öğretmen yapamaz; yetkiyi siz verirsiniz.
