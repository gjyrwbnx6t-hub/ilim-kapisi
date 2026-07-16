"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { AuthActionState } from "@/app/auth/actions";
import { completePasswordReset } from "@/app/auth/actions";

interface ResetPasswordFormProps {
  audience?: "student" | "teacher";
}

export default function ResetPasswordForm({
  audience = "student",
}: ResetPasswordFormProps) {
  const [state, formAction, pending] = useActionState<
    AuthActionState,
    FormData
  >(completePasswordReset, {});

  const isTeacher = audience === "teacher";
  const forgotHref = isTeacher
    ? "/sifremi-unuttum?audience=teacher"
    : "/sifremi-unuttum";

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="mb-1 text-2xl font-bold text-primary">Yeni Şifre Oluştur</h1>
      <p className="mb-6 text-sm text-surface-muted">
        Yeni şifrenizi iki kez girin. En az 6 karakter olmalıdır.
      </p>

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="audience" value={audience} />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-slate-700">
            Yeni şifre
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className="rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-primary"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="confirm_password"
            className="text-sm font-medium text-slate-700"
          >
            Yeni şifre tekrar
          </label>
          <input
            id="confirm_password"
            name="confirm_password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className="rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-primary"
          />
        </div>

        {state.error && (
          <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 rounded-lg bg-primary py-3 font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
        >
          {pending ? "Kaydediliyor..." : "Şifreyi Kaydet"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-surface-muted">
        Bağlantı çalışmıyor mu?{" "}
        <Link href={forgotHref} className="font-semibold text-primary hover:underline">
          Yeniden gönder
        </Link>
      </div>
    </div>
  );
}
