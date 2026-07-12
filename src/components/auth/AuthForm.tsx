"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { AuthActionState } from "@/app/auth/actions";

type AuthAction = (
  prev: AuthActionState,
  formData: FormData,
) => Promise<AuthActionState>;

interface AuthFormProps {
  mode: "signin" | "signup";
  action: AuthAction;
}

export default function AuthForm({ mode, action }: AuthFormProps) {
  const [state, formAction, pending] = useActionState<
    AuthActionState,
    FormData
  >(action, {});

  const isSignup = mode === "signup";

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="mb-1 text-2xl font-bold text-primary">
        {isSignup ? "Kayıt Ol" : "Giriş Yap"}
      </h1>
      <p className="mb-6 text-sm text-surface-muted">
        {isSignup
          ? "Çalışma aktivitenizi kaydetmek için bir hesap oluşturun."
          : "Hesabınıza giriş yaparak kaldığınız yerden devam edin."}
      </p>

      <form action={formAction} className="flex flex-col gap-4">
        {isSignup && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="full_name" className="text-sm font-medium text-slate-700">
              Ad Soyad
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              autoComplete="name"
              className="rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-primary"
            />
          </div>
        )}

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

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-slate-700">
            Şifre
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete={isSignup ? "new-password" : "current-password"}
            minLength={6}
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
          disabled={pending}
          className="mt-2 rounded-lg bg-primary py-3 font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
        >
          {pending
            ? "Lütfen bekleyin..."
            : isSignup
              ? "Kayıt Ol"
              : "Giriş Yap"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-surface-muted">
        {isSignup ? (
          <>
            Zaten hesabınız var mı?{" "}
            <Link href="/giris" className="font-semibold text-primary hover:underline">
              Giriş yapın
            </Link>
          </>
        ) : (
          <>
            Hesabınız yok mu?{" "}
            <Link href="/kayit" className="font-semibold text-primary hover:underline">
              Kayıt olun
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
