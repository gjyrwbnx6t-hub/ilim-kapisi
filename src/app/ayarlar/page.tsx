import type { Metadata } from "next";
import SettingsClient from "@/components/settings/SettingsClient";
import { signOut, updatePassword } from "@/app/auth/actions";
import {
  revokeTeacherPermission,
  saveTeacherPermission,
} from "@/app/ayarlar/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type {
  Profile,
  TeacherFeedback,
  TeacherFeedbackView,
  TeacherPermission,
  TeacherPermissionView,
} from "@/lib/supabase/types";

export const metadata: Metadata = { title: "Ayarlar" };

type TeacherJoin = {
  full_name: string | null;
  teacher_code?: string | null;
};

type PermissionRow = TeacherPermission & {
  teacher?: TeacherJoin | TeacherJoin[] | null;
};

type FeedbackRow = TeacherFeedback & {
  teacher?: Pick<TeacherJoin, "full_name"> | Array<Pick<TeacherJoin, "full_name">> | null;
};

function firstJoin<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export default async function AyarlarPage() {
  const accountAvailable = isSupabaseConfigured();
  let isAuthed = false;
  let email: string | undefined;
  let feedback: TeacherFeedbackView[] = [];
  let permissions: TeacherPermissionView[] = [];
  let profile: Profile | null = null;

  if (accountAvailable) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      isAuthed = true;
      email = user.email;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      profile = profileData as Profile | null;

      if (profile?.role === "student") {
        const [{ data: permissionData }, { data: feedbackData }] =
          await Promise.all([
            supabase
              .from("teacher_permissions")
              .select(
                "id,student_id,teacher_id,allow_rearapca,allow_career,created_at,updated_at,teacher:profiles!teacher_permissions_teacher_id_fkey(full_name,teacher_code)",
              )
              .eq("student_id", user.id)
              .order("updated_at", { ascending: false }),
            supabase
              .from("teacher_feedback")
              .select(
                "id,teacher_id,student_id,message,created_at,teacher:profiles!teacher_feedback_teacher_id_fkey(full_name)",
              )
              .eq("student_id", user.id)
              .order("created_at", { ascending: false })
              .limit(20),
          ]);

        permissions = ((permissionData ?? []) as PermissionRow[]).map((row) => {
          const teacher = firstJoin(row.teacher);
          return {
            ...row,
            teacher_name: teacher?.full_name ?? null,
            teacher_code: teacher?.teacher_code ?? null,
          };
        });

        feedback = ((feedbackData ?? []) as FeedbackRow[]).map((row) => {
          const teacher = firstJoin(row.teacher);
          return {
            ...row,
            teacher_name: teacher?.full_name ?? null,
          };
        });
      }
    }
  }

  return (
    <SettingsClient
      accountAvailable={accountAvailable}
      email={email}
      feedback={feedback}
      isAuthed={isAuthed}
      isTeacher={profile?.role === "teacher"}
      passwordAction={updatePassword}
      permissions={permissions}
      revokeTeacherPermissionAction={revokeTeacherPermission}
      saveTeacherPermissionAction={saveTeacherPermission}
      signOutAction={signOut}
      teacherCode={profile?.teacher_code}
    />
  );
}
