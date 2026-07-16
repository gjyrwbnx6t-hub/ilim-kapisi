"use client";

import { useActionState } from "react";
import { KeyRound } from "lucide-react";
import type { AuthActionState } from "@/app/auth/actions";
import { useSitePreferences } from "@/components/settings/SitePreferencesProvider";

export type PasswordAction = (
  prev: AuthActionState,
  formData: FormData,
) => Promise<AuthActionState>;

export default function PasswordChangeForm({
  action,
}: {
  action: PasswordAction;
}) {
  const [state, formAction, pending] = useActionState<
    AuthActionState,
    FormData
  >(action, {});
  const { copy, direction, language } = useSitePreferences();
  const labels = copy.settings;

  return (
    <form action={formAction} className="mt-5 flex flex-col gap-4" dir={direction}>
      <input type="hidden" name="language" value={language} />
      <div>
        <h3 className="text-base font-bold text-slate-900">
          {labels.passwordTitle}
        </h3>
        <p className="mt-1 text-sm text-surface-muted">
          {labels.passwordDescription}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
          {labels.newPassword}
          <input
            name="password"
            type="password"
            minLength={6}
            required
            autoComplete="new-password"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-primary"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
          {labels.confirmPassword}
          <input
            name="confirm_password"
            type="password"
            minLength={6}
            required
            autoComplete="new-password"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-primary"
          />
        </label>
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
        className="inline-flex w-fit items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
      >
        <KeyRound className="h-4 w-4" aria-hidden="true" />
        {pending ? labels.updatingPassword : labels.updatePassword}
      </button>
    </form>
  );
}
