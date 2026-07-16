"use client";

import { useState } from "react";
import { MessageSquareText, Send } from "lucide-react";
import { sendTeacherFeedback } from "@/app/panel/actions";
import RearapcaAnalyticsPanel from "@/components/rearapca/RearapcaAnalyticsPanel";
import type {
  CareerSnapshotSummary,
  TeacherFeedback,
  TeacherPermission,
} from "@/lib/supabase/types";
import { formatStudyDuration } from "@/lib/study-time";

type PanelTab = "rearapca" | "time" | "career";

const TABS: { id: PanelTab; label: string }[] = [
  { id: "rearapca", label: "Rearapça" },
  { id: "time", label: "Çalışma Süresi" },
  { id: "career", label: "Üniversite" },
];

export interface StudentPanelCardProps {
  student: {
    id: string;
    name: string;
    permission: TeacherPermission;
    lastActivityLabel: string;
    scopes: string[];
    bestVocab: { title: string; score: number }[];
    studyProgress: { courseTitle: string; percent: number | null }[];
    moduleStudyTimes: { moduleLabel: string; totalSeconds: number }[];
    studyTimeByCourse: {
      moduleLabel: string;
      courseTitle: string;
      totalSeconds: number;
    }[];
    career: CareerSnapshotSummary | null;
    feedback: TeacherFeedback[];
  };
}

function formatGpa(value: number | null | undefined) {
  if (typeof value !== "number") return "—";
  return value.toLocaleString("tr-TR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function StudentPanelCard({ student }: StudentPanelCardProps) {
  const defaultTab: PanelTab = student.permission.allow_rearapca
    ? "rearapca"
    : student.permission.allow_career
      ? "career"
      : "time";
  const [tab, setTab] = useState<PanelTab>(defaultTab);

  const career = student.career;
  const atRiskCourses = career?.atRiskCourses ?? [];
  const totalStudySeconds = student.moduleStudyTimes.reduce(
    (sum, entry) => sum + entry.totalSeconds,
    0,
  );

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{student.name}</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {student.scopes.map((scope) => (
              <span
                key={scope}
                className="rounded-full bg-primary-light px-3 py-1 text-xs font-bold text-primary"
              >
                {scope}
              </span>
            ))}
          </div>
        </div>
        <p className="text-sm text-surface-muted">
          Son aktivite: {student.lastActivityLabel}
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-1 rounded-full bg-[#d8d8de] p-1">
        {TABS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setTab(option.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              tab === option.id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === "rearapca" && (
          <div className="space-y-5">
            {!student.permission.allow_rearapca ? (
              <p className="rounded-lg bg-slate-50 px-4 py-8 text-center text-sm text-surface-muted">
                Öğrenci Rearapça iznini kapattı.
              </p>
            ) : (
              <>
                <RearapcaAnalyticsPanel studentId={student.id} />

                <div className="grid gap-5 lg:grid-cols-2">
                  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="text-lg font-bold text-primary">Kelime Skorları</h3>
                    {student.bestVocab.length === 0 ? (
                      <p className="mt-3 text-sm text-surface-muted">
                        Henüz kelime çalışması yok.
                      </p>
                    ) : (
                      <ul className="mt-4 flex flex-col gap-2">
                        {student.bestVocab.map((entry, index) => (
                          <li
                            key={`${entry.title}-${index}`}
                            className="flex items-center justify-between gap-3 rounded-lg bg-surface px-3 py-2 text-sm"
                          >
                            <span className="truncate text-slate-700">
                              {entry.title}
                            </span>
                            <span className="shrink-0 font-bold text-emerald-600">
                              {entry.score}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>

                  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="text-lg font-bold text-primary">
                      Zihin Şeması İlerlemesi
                    </h3>
                    {student.studyProgress.length === 0 ? (
                      <p className="mt-3 text-sm text-surface-muted">
                        Henüz zihin şeması ilerlemesi yok.
                      </p>
                    ) : (
                      <ul className="mt-4 flex flex-col gap-3">
                        {student.studyProgress.map((entry, index) => (
                          <li key={`${entry.courseTitle}-${index}`}>
                            <div className="mb-1 flex items-center justify-between text-sm">
                              <span className="truncate text-slate-700">
                                {entry.courseTitle}
                              </span>
                              <span className="shrink-0 text-surface-muted">
                                {entry.percent ?? 0}%
                              </span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${entry.percent ?? 0}%` }}
                              />
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </div>
              </>
            )}
          </div>
        )}

        {tab === "time" && (
          <div className="space-y-5">
            {!student.permission.allow_rearapca ? (
              <p className="rounded-lg bg-slate-50 px-4 py-8 text-center text-sm text-surface-muted">
                Çalışma süresi verileri Rearapça izniyle paylaşılır.
              </p>
            ) : (
              <>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-bold text-primary">
                      Modül Bazında Süre
                    </h3>
                    {totalStudySeconds > 0 && (
                      <span className="rounded-lg bg-primary-light px-3 py-1.5 text-sm font-bold text-primary">
                        Toplam {formatStudyDuration(totalStudySeconds)}
                      </span>
                    )}
                  </div>
                  {student.moduleStudyTimes.length === 0 ? (
                    <p className="mt-4 text-sm text-surface-muted">
                      Henüz kayıtlı çalışma süresi yok.
                    </p>
                  ) : (
                    <ul className="mt-4 divide-y divide-slate-100">
                      {student.moduleStudyTimes.map((entry) => {
                        const share =
                          totalStudySeconds > 0
                            ? Math.round(
                                (entry.totalSeconds / totalStudySeconds) * 100,
                              )
                            : 0;
                        return (
                          <li
                            key={entry.moduleLabel}
                            className="py-3 text-sm"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <p className="font-semibold text-slate-800">
                                {entry.moduleLabel}
                              </p>
                              <span className="shrink-0 rounded-lg bg-primary-light px-3 py-1.5 font-bold text-primary">
                                {formatStudyDuration(entry.totalSeconds)}
                              </span>
                            </div>
                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${share}%` }}
                              />
                            </div>
                            <p className="mt-1 text-xs text-surface-muted">
                              Toplam sürenin %{share}&apos;i
                            </p>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-lg font-bold text-primary">
                    Ders ve Aktivite Detayı
                  </h3>
                  {student.studyTimeByCourse.length === 0 ? (
                    <p className="mt-4 text-sm text-surface-muted">
                      Ders bazında süre kaydı yok.
                    </p>
                  ) : (
                    <ul className="mt-4 divide-y divide-slate-100">
                      {student.studyTimeByCourse.map((entry) => (
                        <li
                          key={`${entry.moduleLabel}-${entry.courseTitle}`}
                          className="flex items-center justify-between gap-4 py-3 text-sm"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800">
                              {entry.moduleLabel}
                            </p>
                            <p className="truncate text-xs text-surface-muted">
                              {entry.courseTitle}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-lg bg-slate-100 px-3 py-1.5 font-bold text-slate-700">
                            {formatStudyDuration(entry.totalSeconds)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </>
            )}
          </div>
        )}

        {tab === "career" && (
          <div className="space-y-5">
            {!student.permission.allow_career ? (
              <p className="rounded-lg bg-slate-50 px-4 py-8 text-center text-sm text-surface-muted">
                Öğrenci kariyer iznini kapattı.
              </p>
            ) : !career ? (
              <p className="rounded-lg bg-slate-50 px-4 py-8 text-center text-sm text-surface-muted">
                Henüz kariyer verisi paylaşılmamış.
              </p>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg bg-slate-50 px-4 py-3">
                    <p className="text-xs font-bold text-surface-muted">GPA</p>
                    <p className="mt-1 text-2xl font-bold text-primary">
                      {formatGpa(career.gpa)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-4 py-3">
                    <p className="text-xs font-bold text-surface-muted">Üniversite</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">
                      {career.universityCount}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-4 py-3">
                    <p className="text-xs font-bold text-surface-muted">Dönem</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">
                      {career.termCount}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-4 py-3">
                    <p className="text-xs font-bold text-surface-muted">Ders / Kredi</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">
                      {career.courseCount} / {career.creditCount}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-slate-200 px-4 py-3">
                    <p className="text-xs font-bold text-surface-muted">
                      Notlandırılan Ders
                    </p>
                    <p className="mt-1 text-xl font-bold text-slate-900">
                      {career.gradedCourseCount}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 px-4 py-3 sm:col-span-2">
                    <p className="text-xs font-bold text-surface-muted">
                      Son Dönem
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {career.latestTermLabel ?? "—"}
                    </p>
                  </div>
                </div>

                {career.terms.length > 0 && (
                  <section className="rounded-2xl border border-slate-200 p-5 shadow-sm">
                    <h3 className="text-lg font-bold text-primary">Dönem Özeti</h3>
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full min-w-[480px] text-left text-sm">
                        <thead>
                          <tr className="text-xs uppercase tracking-wide text-slate-400">
                            <th className="pb-2 font-semibold">Dönem</th>
                            <th className="pb-2 font-semibold">Ders</th>
                            <th className="pb-2 font-semibold">Kredi</th>
                            <th className="pb-2 font-semibold">GPA</th>
                          </tr>
                        </thead>
                        <tbody>
                          {career.terms.map((term) => (
                            <tr
                              key={term.label}
                              className="border-t border-slate-100"
                            >
                              <td className="py-2.5 font-semibold text-slate-800">
                                {term.label}
                              </td>
                              <td className="py-2.5 text-slate-700">
                                {term.courseCount}
                              </td>
                              <td className="py-2.5 text-slate-700">
                                {term.credits}
                              </td>
                              <td className="py-2.5 font-bold text-primary">
                                {formatGpa(term.gpa)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}

                {atRiskCourses.length > 0 && (
                  <section className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5">
                    <h3 className="text-lg font-bold text-amber-900">
                      Riskteki Dersler
                    </h3>
                    <ul className="mt-4 grid gap-2 md:grid-cols-2">
                      {atRiskCourses.map((course) => (
                        <li
                          key={`${course.termLabel}-${course.name}`}
                          className="rounded-lg bg-white px-3 py-3 text-sm text-amber-900 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold">{course.name}</span>
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${
                                course.status === "failed"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {course.status === "failed" ? "Kaldı" : "Risk"}
                            </span>
                          </div>
                          <span className="mt-1 block text-xs text-amber-800/80">
                            {course.termLabel} · %{Math.round(course.percent)} /
                            hedef %{course.targetScore}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <form action={sendTeacherFeedback} className="rounded-lg bg-slate-50 p-4">
          <input type="hidden" name="student_id" value={student.id} />
          <label
            htmlFor={`message-${student.id}`}
            className="flex items-center gap-2 text-sm font-bold text-slate-800"
          >
            <MessageSquareText className="h-4 w-4 text-primary" aria-hidden="true" />
            Geri Bildirim
          </label>
          <textarea
            id={`message-${student.id}`}
            name="message"
            rows={3}
            maxLength={1000}
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-primary"
          />
          <button
            type="submit"
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            Gönder
          </button>
        </form>

        <div className="rounded-lg border border-slate-200 p-4">
          <h3 className="text-sm font-bold text-slate-900">Son Geri Bildirimler</h3>
          {student.feedback.length === 0 ? (
            <p className="mt-3 text-sm text-surface-muted">Henüz geri bildirim yok.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {student.feedback.slice(0, 2).map((item) => (
                <li
                  key={item.id}
                  className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700"
                >
                  <p>{item.message}</p>
                  <p className="mt-1 text-xs text-surface-muted">
                    {formatDate(item.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </article>
  );
}
