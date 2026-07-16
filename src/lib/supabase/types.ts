/**
 * Veritabanı satır tipleri. supabase/schema.sql ile aynı yapıda tutulmalı.
 */

export type UserRole = "student" | "teacher";

export type ActivityType = "vocab" | "mindmap" | "visit";

export interface Profile {
  id: string;
  full_name: string | null;
  role: UserRole;
  teacher_code: string | null;
  created_at: string;
}

export interface ActivityEvent {
  id: string;
  user_id: string;
  type: ActivityType;
  course_slug: string | null;
  unit_id: string | null;
  score: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface StudyProgress {
  user_id: string;
  course_slug: string;
  module: string;
  last_week: number | null;
  percent: number | null;
  updated_at: string;
}

export interface TeacherPermission {
  id: string;
  student_id: string;
  teacher_id: string;
  allow_rearapca: boolean;
  allow_career: boolean;
  created_at: string;
  updated_at: string;
}

export interface TeacherPermissionView extends TeacherPermission {
  teacher_name: string | null;
  teacher_code: string | null;
}

export interface TeacherFeedback {
  id: string;
  teacher_id: string;
  student_id: string;
  message: string;
  created_at: string;
}

export interface TeacherFeedbackView extends TeacherFeedback {
  teacher_name: string | null;
}

export interface CareerCourseRisk {
  name: string;
  termLabel: string;
  percent: number;
  targetScore: number;
  status: "at_risk" | "failed";
}

export interface CareerTermSummary {
  label: string;
  courseCount: number;
  credits: number;
  gpa: number | null;
}

export interface CareerSnapshotSummary {
  universityCount: number;
  termCount: number;
  courseCount: number;
  gradedCourseCount: number;
  creditCount: number;
  gpa: number | null;
  latestTermLabel: string | null;
  atRiskCourses: CareerCourseRisk[];
  terms: CareerTermSummary[];
}

export interface CareerSnapshot {
  user_id: string;
  summary: CareerSnapshotSummary;
  updated_at: string;
}

/** İstemciden /api/activity'ye gönderilen olay yükü. */
export interface ActivityInput {
  type: ActivityType;
  courseSlug?: string;
  unitId?: string;
  score?: number;
  metadata?: Record<string, unknown>;
  progress?: {
    module: string;
    lastWeek?: number;
    percent?: number;
  };
}
