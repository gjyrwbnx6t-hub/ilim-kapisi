import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthForm from "@/components/auth/AuthForm";
import SupabaseNotice from "@/components/auth/SupabaseNotice";
import { teacherSignUp } from "@/app/auth/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Öğretmen Kaydı" };

export default async function OgretmenKayitPage() {
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
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    redirect(
      (profile as { role?: string } | null)?.role === "teacher"
        ? "/panel"
        : "/profil",
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-surface px-4 py-16">
      <AuthForm mode="signup" audience="teacher" action={teacherSignUp} />
    </div>
  );
}
