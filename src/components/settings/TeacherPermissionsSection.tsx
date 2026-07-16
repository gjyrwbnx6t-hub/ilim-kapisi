"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  KeyRound,
  MessageSquareText,
  Save,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import type {
  TeacherFeedbackView,
  TeacherPermissionView,
} from "@/lib/supabase/types";
import type {
  TeacherPermissionAction,
  TeacherPermissionActionState,
} from "@/app/ayarlar/actions";
import { useSitePreferences } from "@/components/settings/SitePreferencesProvider";

interface TeacherPermissionsSectionProps {
  feedback: TeacherFeedbackView[];
  isTeacher: boolean;
  permissions: TeacherPermissionView[];
  revokeAction: TeacherPermissionAction;
  saveAction: TeacherPermissionAction;
  teacherCode?: string | null;
}

const initialState: TeacherPermissionActionState = {};

function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function ScopeCheckbox({
  defaultChecked,
  label,
  name,
}: {
  defaultChecked?: boolean;
  label: string;
  name: string;
}) {
  return (
    <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
      <input
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
      />
      {label}
    </label>
  );
}

function PermissionMessage({ state }: { state: TeacherPermissionActionState }) {
  if (state.error) {
    return (
      <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
        {state.error}
      </p>
    );
  }

  if (state.message) {
    return (
      <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
        {state.message}
      </p>
    );
  }

  return null;
}

function PermissionCard({
  permission,
  revokeAction,
  saveAction,
}: {
  permission: TeacherPermissionView;
  revokeAction: TeacherPermissionAction;
  saveAction: TeacherPermissionAction;
}) {
  const { language } = useSitePreferences();
  const locale = language === "ar" ? "ar-JO" : "tr-TR";
  const [saveState, saveFormAction, savePending] = useActionState(
    saveAction,
    initialState,
  );
  const [revokeState, revokeFormAction, revokePending] = useActionState(
    revokeAction,
    initialState,
  );

  return (
    <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-900">
            {permission.teacher_name || "Öğretmen"}
          </h3>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-surface-muted">
            {permission.teacher_code || permission.teacher_id}
          </p>
          <p className="mt-2 text-xs text-surface-muted">
            Güncelleme: {formatDate(permission.updated_at, locale)}
          </p>
        </div>
        <form action={revokeFormAction}>
          <input type="hidden" name="permission_id" value={permission.id} />
          <button
            type="submit"
            disabled={revokePending}
            className="inline-flex items-center gap-2 rounded-lg border border-red-100 bg-white px-3 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Kaldır
          </button>
        </form>
      </div>

      <form action={saveFormAction} className="mt-4 space-y-3">
        <input type="hidden" name="teacher_id" value={permission.teacher_id} />
        <div className="flex flex-wrap gap-2">
          <ScopeCheckbox
            name="allow_rearapca"
            label="Rearapça verileri"
            defaultChecked={permission.allow_rearapca}
          />
          <ScopeCheckbox
            name="allow_career"
            label="Kariyer verileri"
            defaultChecked={permission.allow_career}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={savePending}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {savePending ? "Kaydediliyor..." : "İzni Güncelle"}
          </button>
          <PermissionMessage state={saveState} />
          <PermissionMessage state={revokeState} />
        </div>
      </form>
    </article>
  );
}

export default function TeacherPermissionsSection({
  feedback,
  isTeacher,
  permissions,
  revokeAction,
  saveAction,
  teacherCode,
}: TeacherPermissionsSectionProps) {
  const { language } = useSitePreferences();
  const locale = language === "ar" ? "ar-JO" : "tr-TR";
  const [state, formAction, pending] = useActionState(saveAction, initialState);

  if (isTeacher) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
        <div className="flex items-start gap-3">
          <span className="rounded-lg bg-primary-light p-2 text-primary">
            <KeyRound className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Öğretmen Kodunuz
            </h2>
            <p className="mt-1 text-sm text-surface-muted">
              Öğrenciler bu kodla size veri izni verebilir.
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <code className="rounded-lg bg-slate-100 px-4 py-3 text-lg font-bold tracking-widest text-primary">
            {teacherCode || "Kod oluşturulmadı"}
          </code>
          <Link
            href="/panel"
            className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink-light"
          >
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Öğretmen Paneli
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
      <div className="flex items-start gap-3">
        <span className="rounded-lg bg-primary-light p-2 text-primary">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Öğretmen İzinleri
          </h2>
          <p className="mt-1 text-sm text-surface-muted">
            Öğretmen kodunu girip paylaşmak istediğiniz veri alanlarını seçin.
          </p>
        </div>
      </div>

      <form action={formAction} className="mt-6 rounded-lg bg-slate-50 p-4">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <label
              htmlFor="teacher_code"
              className="block text-sm font-bold text-slate-800"
            >
              Öğretmen Kodu
            </label>
            <input
              id="teacher_code"
              name="teacher_code"
              type="text"
              autoCapitalize="characters"
              autoComplete="off"
              placeholder="ÖRN: A1B2C3D4"
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 font-semibold uppercase tracking-wide text-slate-900 outline-none transition-colors focus:border-primary"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
          >
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            {pending ? "Kaydediliyor..." : "İzin Ver"}
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <ScopeCheckbox name="allow_rearapca" label="Rearapça verileri" />
          <ScopeCheckbox name="allow_career" label="Kariyer verileri" />
        </div>
        <div className="mt-3">
          <PermissionMessage state={state} />
        </div>
      </form>

      {permissions.length > 0 && (
        <div className="mt-6 space-y-3">
          {permissions.map((permission) => (
            <PermissionCard
              key={permission.id}
              permission={permission}
              revokeAction={revokeAction}
              saveAction={saveAction}
            />
          ))}
        </div>
      )}

      {feedback.length > 0 && (
        <div className="mt-6 rounded-lg border border-slate-200 p-4">
          <div className="flex items-center gap-2">
            <MessageSquareText className="h-5 w-5 text-primary" aria-hidden="true" />
            <h3 className="font-bold text-slate-900">Öğretmen Geri Bildirimleri</h3>
          </div>
          <ul className="mt-4 divide-y divide-slate-100">
            {feedback.map((item) => (
              <li key={item.id} className="py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold text-slate-800">
                    {item.teacher_name || "Öğretmen"}
                  </p>
                  <p className="text-xs text-surface-muted">
                    {formatDate(item.created_at, locale)}
                  </p>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">
                  {item.message}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
