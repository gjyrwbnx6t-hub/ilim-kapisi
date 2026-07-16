import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthForm from "@/components/auth/AuthForm";
import SupabaseNotice from "@/components/auth/SupabaseNotice";
import { teacherSignIn } from "@/app/auth/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { isBootstrapTeacherEmail } from "@/lib/teacher-accounts";

export const metadata: Metadata = { title: "Öğretmen Girişi" };

export default async function OgretmenGirisPage() {
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

  if (user) {
    let { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (
      (profile as { role?: string } | null)?.role !== "teacher" &&
      isBootstrapTeacherEmail(user.email)
    ) {
      const { data: syncedProfile } = await supabase.rpc(
        "sync_current_user_profile",
      );
      profile = Array.isArray(syncedProfile)
        ? syncedProfile[0]
        : syncedProfile;
    }

    redirect(
      (profile as { role?: string } | null)?.role === "teacher"
        ? "/panel"
        : "/profil",
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-surface px-4 py-16">
      <AuthForm mode="signin" audience="teacher" action={teacherSignIn} />
    </div>
  );
}
