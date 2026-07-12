import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Breadcrumb from "@/components/layout/Breadcrumb";
import SupabaseNotice from "@/components/auth/SupabaseNotice";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type {
  ActivityEvent,
  Profile,
  StudyProgress,
} from "@/lib/supabase/types";

export const metadata: Metadata = { title: "Öğretmen Paneli" };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface StudentSummary {
  id: string;
  name: string;
  eventCount: number;
  vocabCount: number;
  bestScore: number | null;
  progressCount: number;
  lastActivity: string | null;
}

export default async function PanelPage() {
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

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // Yalnızca öğretmen erişebilir.
  if ((myProfile as { role?: string } | null)?.role !== "teacher") {
    redirect("/profil");
  }

  // RLS: öğretmen tüm satırları okuyabilir.
  const [{ data: profilesData }, { data: eventsData }, { data: progressData }] =
    await Promise.all([
      supabase.from("profiles").select("*"),
      supabase
        .from("activity_events")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("study_progress").select("*"),
    ]);

  const profiles = (profilesData ?? []) as Profile[];
  const events = (eventsData ?? []) as ActivityEvent[];
  const progress = (progressData ?? []) as StudyProgress[];

  const students = profiles.filter((p) => p.role === "student");

  const summaries: StudentSummary[] = students.map((s) => {
    const own = events.filter((e) => e.user_id === s.id);
    const vocabScores = own
      .filter((e) => e.type === "vocab" && typeof e.score === "number")
      .map((e) => e.score as number);
    return {
      id: s.id,
      name: s.full_name || "(isimsiz)",
      eventCount: own.length,
      vocabCount: vocabScores.length,
      bestScore: vocabScores.length ? Math.max(...vocabScores) : null,
      progressCount: progress.filter((p) => p.user_id === s.id).length,
      lastActivity: own[0]?.created_at ?? null,
    };
  });

  summaries.sort((a, b) => {
    if (!a.lastActivity) return 1;
    if (!b.lastActivity) return -1;
    return a.lastActivity < b.lastActivity ? 1 : -1;
  });

  const totalEvents = events.length;

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Ana Sayfa", href: "/" },
          { label: "Öğretmen Paneli" },
        ]}
      />

      <div className="mx-auto w-full max-w-5xl px-[5%] py-12">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary">Öğretmen Paneli</h1>
            <p className="mt-1 text-sm text-surface-muted">
              {students.length} öğrenci · {totalEvents} toplam aktivite
            </p>
          </div>
          <Link
            href="/profil"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            Profilime Dön
          </Link>
        </div>

        {summaries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-surface-muted shadow-sm">
            Henüz kayıtlı öğrenci yok.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-surface-muted">
                <tr>
                  <th className="px-5 py-3 font-semibold">Öğrenci</th>
                  <th className="px-5 py-3 font-semibold">Aktivite</th>
                  <th className="px-5 py-3 font-semibold">Kelime Çalışma</th>
                  <th className="px-5 py-3 font-semibold">En Yüksek Skor</th>
                  <th className="px-5 py-3 font-semibold">Şema İlerleme</th>
                  <th className="px-5 py-3 font-semibold">Son Aktivite</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summaries.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-800">
                      {s.name}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{s.eventCount}</td>
                    <td className="px-5 py-3 text-slate-600">{s.vocabCount}</td>
                    <td className="px-5 py-3">
                      {s.bestScore !== null ? (
                        <span className="font-bold text-emerald-600">
                          {s.bestScore}
                        </span>
                      ) : (
                        <span className="text-surface-muted">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {s.progressCount} ders
                    </td>
                    <td className="px-5 py-3 text-surface-muted">
                      {s.lastActivity ? formatDate(s.lastActivity) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
