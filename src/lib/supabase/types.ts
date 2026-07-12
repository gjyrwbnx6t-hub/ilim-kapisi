/**
 * Veritabanı satır tipleri. supabase/schema.sql ile aynı yapıda tutulmalı.
 */

export type UserRole = "student" | "teacher";

export type ActivityType = "vocab" | "mindmap" | "visit";

export interface Profile {
  id: string;
  full_name: string | null;
  role: UserRole;
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
