import type { Metadata } from "next";
import PasswordResetSessionGate from "@/components/auth/PasswordResetSessionGate";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import SupabaseNotice from "@/components/auth/SupabaseNotice";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Yeni Şifre Oluştur" };

interface SifreYenilePageProps {
  searchParams: Promise<{ audience?: string }>;
}

export default async function SifreYenilePage({
  searchParams,
}: SifreYenilePageProps) {
  const params = await searchParams;
  const audience = params.audience === "teacher" ? "teacher" : "student";

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

  return (
    <div className="flex flex-1 items-center justify-center bg-surface px-4 py-16">
      {user ? (
        <ResetPasswordForm audience={audience} />
      ) : (
        <PasswordResetSessionGate audience={audience} />
      )}
    </div>
  );
}
