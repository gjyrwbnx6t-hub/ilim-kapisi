import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Breadcrumb from "@/components/layout/Breadcrumb";
import SupabaseNotice from "@/components/auth/SupabaseNotice";
import { signOut } from "@/app/auth/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getCourseBySlug } from "@/data/courses";
import type {
  ActivityEvent,
  Profile,
  StudyProgress,
} from "@/lib/supabase/types";

export const metadata: Metadata = { title: "Profilim" };

function courseTitle(slug: string | null): string {
  if (!slug) return "—";
  return getCourseBySlug(slug)?.titleAr ?? slug;
}

const TYPE_LABEL: Record<string, string> = {
  vocab: "Kelime Çalışması",
  mindmap: "Zihin Şeması",
  visit: "Ziyaret",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ProfilPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="flex flex-1 items-center justify-center bg-surface px-4 py-16">
        <SupabaseNotice />
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/giris");

  const [{ data: profileData }, { data: events }, { data: progress }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase
        .from("activity_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(25),
      supabase
        .from("study_progress")
        .select("*")
        .order("updated_at", { ascending: false }),
    ]);

  const profile = profileData as Profile | null;
  const activityEvents = (events ?? []) as ActivityEvent[];
  const studyProgress = (progress ?? []) as StudyProgress[];

  const isTeacher = profile?.role === "teacher";

  // Kelime skorlarının ders+ünite bazında en yükseğini özetle.
  const bestVocab = new Map<string, { title: string; score: number }>();
  for (const e of activityEvents) {
    if (e.type !== "vocab" || typeof e.score !== "number") continue;
    const key = `${e.course_slug}:${e.unit_id}`;
    const title = `${courseTitle(e.course_slug)} — ${
      (e.metadata?.unitTitle as string) ?? e.unit_id ?? ""
    }`;
    const prev = bestVocab.get(key);
    if (!prev || e.score > prev.score) bestVocab.set(key, { title, score: e.score });
  }

  return (
    <>
      <Breadcrumb
        items={[{ label: "Ana Sayfa", href: "/" }, { label: "Profilim" }]}
      />

      <div className="mx-auto w-full max-w-4xl px-[5%] py-12">
        {/* Başlık kartı */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-primary">
              {profile?.full_name || "Öğrenci"}
            </h1>
            <p className="mt-1 text-sm text-surface-muted">{user.email}</p>
            <span className="mt-2 inline-block rounded-full bg-primary-light px-3 py-0.5 text-xs font-semibold text-primary">
              {isTeacher ? "Öğretmen" : "Öğrenci"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {isTeacher && (
              <Link
                href="/panel"
                className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-ink-light"
              >
                Öğretmen Paneli
              </Link>
            )}
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              >
                Çıkış Yap
              </button>
            </form>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Kelime skorları */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-primary">
              Kelime Skorları
            </h2>
            {bestVocab.size === 0 ? (
              <p className="text-sm text-surface-muted">
                Henüz kelime çalışması yok. Bir dersin “Anahtar Kelimeler”
                bölümünden başlayın.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {[...bestVocab.values()].map((v, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-3 rounded-lg bg-surface px-3 py-2 text-sm"
                  >
                    <span className="truncate text-slate-700">{v.title}</span>
                    <span className="shrink-0 font-bold text-emerald-600">
                      {v.score}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Zihin şeması ilerlemesi */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-primary">
              Zihin Şeması İlerlemesi
            </h2>
            {studyProgress.length === 0 ? (
              <p className="text-sm text-surface-muted">
                Henüz zihin şeması ilerlemesi yok.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {studyProgress.map((p, i) => (
                  <li key={i}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="truncate text-slate-700">
                        {courseTitle(p.course_slug)}
                      </span>
                      <span className="shrink-0 text-surface-muted">
                        {p.percent ?? 0}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${p.percent ?? 0}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Son aktivite */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-primary">Son Aktivite</h2>
          {activityEvents.length === 0 ? (
            <p className="text-sm text-surface-muted">Henüz aktivite yok.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {activityEvents.slice(0, 15).map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between gap-3 py-2.5 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {TYPE_LABEL[e.type] ?? e.type}
                    </span>
                    <span className="truncate text-slate-700">
                      {courseTitle(e.course_slug)}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3 text-surface-muted">
                    {typeof e.score === "number" && (
                      <span className="font-semibold text-emerald-600">
                        {e.score}
                      </span>
                    )}
                    <span>{formatDate(e.created_at)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
