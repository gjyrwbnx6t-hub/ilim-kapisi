"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import type { AuthActionState } from "@/app/auth/actions";
import { requestPasswordReset } from "@/app/auth/actions";

interface ForgotPasswordFormProps {
  audience?: "student" | "teacher";
}

export default function ForgotPasswordForm({
  audience = "student",
}: ForgotPasswordFormProps) {
  const [redirectOrigin, setRedirectOrigin] = useState("");
  const [state, formAction, pending] = useActionState<
    AuthActionState,
    FormData
  >(requestPasswordReset, {});

  useEffect(() => {
    setRedirectOrigin(window.location.origin);
  }, []);

  const isTeacher = audience === "teacher";
  const signInHref = isTeacher ? "/ogretmen/giris" : "/giris";

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="mb-1 text-2xl font-bold text-primary">Şifremi Unuttum</h1>
      <p className="mb-6 text-sm text-surface-muted">
        Kayıtlı e-posta adresinize şifre sıfırlama bağlantısı göndereceğiz.
      </p>

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="audience" value={audience} />
        <input type="hidden" name="redirect_origin" value={redirectOrigin} />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-slate-700">
            E-posta
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-primary"
          />
        </div>

        {state.error && (
          <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">
            {state.error}
          </p>
        )}
        {state.message && (
          <p className="rounded-lg bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
            {state.message}
          </p>
        )}

        <button
          type="submit"
          disabled={pending || !redirectOrigin}
          className="mt-2 rounded-lg bg-primary py-3 font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
        >
          {pending ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-surface-muted">
        <Link href={signInHref} className="font-semibold text-primary hover:underline">
          Giriş ekranına dön
        </Link>
      </div>
    </div>
  );
}
