"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface PasswordResetSessionGateProps {
  audience: "student" | "teacher";
}

export default function PasswordResetSessionGate({
  audience,
}: PasswordResetSessionGateProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "failed">("loading");

  useEffect(() => {
    let cancelled = false;

    async function establishSession() {
      const supabase = createClient();
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const tokenHash = url.searchParams.get("token_hash");
      const type = url.searchParams.get("type");

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (tokenHash && type === "recovery") {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "recovery",
          });
          if (error) throw error;
        } else if (window.location.hash.includes("access_token")) {
          const { error } = await supabase.auth.getSession();
          if (error) throw error;
        } else {
          throw new Error("missing recovery credentials");
        }

        url.searchParams.delete("code");
        url.searchParams.delete("token_hash");
        url.searchParams.delete("type");
        const cleanSearch = url.searchParams.toString();
        const cleanUrl = `${url.pathname}${cleanSearch ? `?${cleanSearch}` : ""}`;
        window.history.replaceState({}, "", cleanUrl);

        if (!cancelled) {
          router.refresh();
        }
        return;
      } catch {
        if (!cancelled) {
          setStatus("failed");
        }
      }
    }

    void establishSession();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const forgotHref =
    audience === "teacher"
      ? "/sifremi-unuttum?audience=teacher"
      : "/sifremi-unuttum";

  if (status === "loading") {
    return (
      <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-medium text-slate-700">
          Sıfırlama bağlantısı doğrulanıyor...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <h1 className="text-2xl font-bold text-primary">Bağlantı geçersiz</h1>
      <p className="mt-3 text-sm text-surface-muted">
        Şifre sıfırlama oturumu kurulamadı. Bağlantının süresi dolmuş veya daha
        önce kullanılmış olabilir.
      </p>
      <Link
        href={forgotHref}
        className="mt-6 inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
      >
        Yeniden sıfırlama iste
      </Link>
    </div>
  );
}
