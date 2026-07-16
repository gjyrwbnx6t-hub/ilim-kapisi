import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { KeyRound } from "lucide-react";
import Breadcrumb from "@/components/layout/Breadcrumb";
import StudentPanelCard from "@/components/panel/StudentPanelCard";
import SupabaseNotice from "@/components/auth/SupabaseNotice";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getCourseBySlug } from "@/data/courses";
import type {
  ActivityEvent,
  CareerSnapshot,
  CareerSnapshotSummary,
  Profile,
  StudyProgress,
  TeacherFeedback,
  TeacherPermission,
} from "@/lib/supabase/types";
import {
  aggregateStudyTimeByModule,
  aggregateStudyTimeTotalsByModuleLabel,
} from "@/lib/study-time";

export const metadata: Metadata = { title: "Öğretmen Paneli" };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function courseTitle(slug: string | null): string {
  if (!slug) return "—";
  if (slug === "rearapca") return "Rearapça";
  return getCourseBySlug(slug)?.titleAr ?? slug;
}

function scopeLabels(permission: TeacherPermission) {
  const labels: string[] = [];
  if (permission.allow_rearapca) labels.push("Rearapça");
  if (permission.allow_career) labels.push("Kariyer");
  return labels;
}

function groupByStudent<T extends { student_id: string }>(rows: T[]) {
  const grouped = new Map<string, T[]>();
  for (const row of rows) {
    grouped.set(row.student_id, [...(grouped.get(row.student_id) ?? []), row]);
  }
  return grouped;
}

function buildBestVocab(events: ActivityEvent[]) {
  const bestVocab = new Map<string, { title: string; score: number }>();
  for (const event of events) {
    if (event.type !== "vocab" || typeof event.score !== "number") continue;
    const key = `${event.course_slug}:${event.unit_id}`;
    const title = `${courseTitle(event.course_slug)} — ${
      (event.metadata?.unitTitle as string) ?? event.unit_id ?? ""
    }`;
    const prev = bestVocab.get(key);
    if (!prev || event.score > prev.score) {
      bestVocab.set(key, { title, score: event.score });
    }
  }
  return [...bestVocab.values()].sort((a, b) => b.score - a.score);
}

interface StudentPanelData {
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

  if (!user) redirect("/ogretmen/giris");

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role,teacher_code")
    .eq("id", user.id)
    .single();

  if ((myProfile as { role?: string } | null)?.role !== "teacher") {
    redirect("/profil");
  }

  const [
    { data: permissionsData },
    { data: profilesData },
    { data: eventsData },
    { data: progressData },
    { data: careerData },
    { data: feedbackData },
  ] = await Promise.all([
    supabase
      .from("teacher_permissions")
      .select("*")
      .eq("teacher_id", user.id)
      .order("updated_at", { ascending: false }),
    supabase.from("profiles").select("*"),
    supabase
      .from("activity_events")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("study_progress").select("*"),
    supabase.from("career_snapshots").select("*"),
    supabase
      .from("teacher_feedback")
      .select("*")
      .eq("teacher_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const permissions = (permissionsData ?? []) as TeacherPermission[];
  const profiles = (profilesData ?? []) as Profile[];
  const events = (eventsData ?? []) as ActivityEvent[];
  const progress = (progressData ?? []) as StudyProgress[];
  const careers = (careerData ?? []) as CareerSnapshot[];
  const feedback = (feedbackData ?? []) as TeacherFeedback[];

  const permissionByStudent = new Map(
    permissions.map((permission) => [permission.student_id, permission]),
  );
  const careerByStudent = new Map(
    careers.map((snapshot) => [snapshot.user_id, snapshot.summary]),
  );
  const feedbackByStudent = groupByStudent(feedback);

  const students: StudentPanelData[] = profiles
    .filter(
      (profile) =>
        profile.role === "student" && permissionByStudent.has(profile.id),
    )
    .map((student) => {
      const permission = permissionByStudent.get(student.id)!;
      const ownEvents = events.filter((event) => event.user_id === student.id);
      const ownProgress = progress.filter((item) => item.user_id === student.id);
      const moduleStudyTimes = aggregateStudyTimeTotalsByModuleLabel(
        ownEvents,
        courseTitle,
      );
      const studyTimeByCourse = aggregateStudyTimeByModule(
        ownEvents,
        courseTitle,
      ).map((entry) => ({
        moduleLabel: entry.moduleLabel,
        courseTitle: entry.courseTitle,
        totalSeconds: entry.totalSeconds,
      }));

      return {
        id: student.id,
        name: student.full_name || "(isimsiz)",
        permission,
        lastActivityLabel: ownEvents[0]?.created_at
          ? formatDate(ownEvents[0].created_at)
          : "—",
        scopes: scopeLabels(permission),
        bestVocab: buildBestVocab(ownEvents),
        studyProgress: ownProgress.map((item) => ({
          courseTitle: courseTitle(item.course_slug),
          percent: item.percent,
        })),
        moduleStudyTimes,
        studyTimeByCourse,
        career: careerByStudent.get(student.id) ?? null,
        feedback: feedbackByStudent.get(student.id) ?? [],
      };
    });

  students.sort((a, b) => {
    if (a.lastActivityLabel === "—") return 1;
    if (b.lastActivityLabel === "—") return -1;
    return a.lastActivityLabel < b.lastActivityLabel ? 1 : -1;
  });

  const teacherCode =
    (myProfile as { teacher_code?: string | null } | null)?.teacher_code ?? null;

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Ana Sayfa", href: "/" },
          { label: "Öğretmen Paneli" },
        ]}
      />

      <div className="mx-auto w-full max-w-6xl px-[5%] py-12">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary">Öğretmen Paneli</h1>
            <p className="mt-1 text-sm text-surface-muted">
              {students.length} izinli öğrenci · {events.length} görünür aktivite
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold text-primary">
              <KeyRound className="h-4 w-4" aria-hidden="true" />
              {teacherCode || "Kod yok"}
            </span>
            <Link
              href="/ayarlar"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            >
              Ayarlar
            </Link>
          </div>
        </div>

        {students.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center text-surface-muted shadow-sm">
            Henüz size izin veren öğrenci yok.
          </div>
        ) : (
          <div className="grid gap-5">
            {students.map((student) => (
              <StudentPanelCard key={student.id} student={student} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
