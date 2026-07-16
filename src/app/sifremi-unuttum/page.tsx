import type { Metadata } from "next";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import SupabaseNotice from "@/components/auth/SupabaseNotice";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Şifremi Unuttum" };

interface SifremiUnuttumPageProps {
  searchParams: Promise<{ audience?: string }>;
}

export default async function SifremiUnuttumPage({
  searchParams,
}: SifremiUnuttumPageProps) {
  const params = await searchParams;
  const audience = params.audience === "teacher" ? "teacher" : "student";

  if (!isSupabaseConfigured()) {
    return (
      <div className="flex flex-1 items-center justify-center bg-surface px-4 py-16">
        <SupabaseNotice />
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-surface px-4 py-16">
      <ForgotPasswordForm audience={audience} />
    </div>
  );
}
