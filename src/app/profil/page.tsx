import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Breadcrumb from "@/components/layout/Breadcrumb";
import SupabaseNotice from "@/components/auth/SupabaseNotice";
import RearapcaAnalyticsPanel from "@/components/rearapca/RearapcaAnalyticsPanel";
import { signOut } from "@/app/auth/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getCourseBySlug } from "@/data/courses";
import type {
  ActivityEvent,
  Profile,
  StudyProgress,
} from "@/lib/supabase/types";
import {
  aggregateStudyTimeTotalsByModuleLabel,
  formatStudyDuration,
} from "@/lib/study-time";

export const metadata: Metadata = { title: "Profilim" };

function courseTitle(slug: string | null): string {
  if (!slug) return "—";
  if (slug === "rearapca") return "Rearapça";
  return getCourseBySlug(slug)?.titleAr ?? slug;
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

  const [{ data: profileData }, { data: progress }, { data: timeEvents }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase
        .from("study_progress")
        .select("*")
        .order("updated_at", { ascending: false }),
      supabase
        .from("activity_events")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5000),
    ]);

  const profile = profileData as Profile | null;
  const activityEvents = (timeEvents ?? []) as ActivityEvent[];
  const studyProgress = (progress ?? []) as StudyProgress[];
  const moduleStudyTimes = aggregateStudyTimeTotalsByModuleLabel(
    activityEvents,
    courseTitle,
  );

  const isTeacher = profile?.role === "teacher";

  if (isTeacher) {
    redirect("/panel");
  }

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

        <section className="mb-6">
          <RearapcaAnalyticsPanel />
        </section>

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

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-primary">
            Modül Çalışma Süreleri
          </h2>
          {moduleStudyTimes.length === 0 ? (
            <p className="text-sm text-surface-muted">
              Henüz kayıtlı çalışma süresi yok. Rearapça, anahtar kelimeler veya
              zihin şeması bölümlerinde çalışmaya başlayın.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {moduleStudyTimes.map((entry) => (
                <li
                  key={entry.moduleLabel}
                  className="flex items-center justify-between gap-4 py-3 text-sm"
                >
                  <p className="font-semibold text-slate-800">
                    {entry.moduleLabel}
                  </p>
                  <span className="shrink-0 rounded-lg bg-primary-light px-3 py-1.5 text-sm font-bold text-primary">
                    {formatStudyDuration(entry.totalSeconds)}
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
