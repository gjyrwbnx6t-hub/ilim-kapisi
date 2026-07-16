"use client";

import Link from "next/link";
import {
  Languages,
  LogIn,
  LogOut,
  MonitorCog,
  Moon,
  Sun,
  UserCircle,
} from "lucide-react";
import PasswordChangeForm, {
  type PasswordAction,
} from "@/components/settings/PasswordChangeForm";
import TeacherPermissionsSection from "@/components/settings/TeacherPermissionsSection";
import { useSitePreferences } from "@/components/settings/SitePreferencesProvider";
import type {
  TeacherFeedbackView,
  TeacherPermissionView,
} from "@/lib/supabase/types";
import type { TeacherPermissionAction } from "@/app/ayarlar/actions";

type SignOutAction = () => Promise<void>;

interface SettingsClientProps {
  accountAvailable: boolean;
  email?: string;
  feedback: TeacherFeedbackView[];
  isAuthed: boolean;
  isTeacher: boolean;
  passwordAction: PasswordAction;
  permissions: TeacherPermissionView[];
  revokeTeacherPermissionAction: TeacherPermissionAction;
  saveTeacherPermissionAction: TeacherPermissionAction;
  signOutAction: SignOutAction;
  teacherCode?: string | null;
}

export default function SettingsClient({
  accountAvailable,
  email,
  feedback,
  isAuthed,
  isTeacher,
  passwordAction,
  permissions,
  revokeTeacherPermissionAction,
  saveTeacherPermissionAction,
  signOutAction,
  teacherCode,
}: SettingsClientProps) {
  const {
    copy,
    direction,
    language,
    theme,
    toggleLanguage,
    toggleTheme,
  } = useSitePreferences();
  const labels = copy.settings;

  return (
    <div
      className={`mx-auto w-full max-w-5xl px-[5%] py-12 ${
        language === "ar" ? "font-arabic" : ""
      }`}
      dir={direction}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary">{labels.title}</h1>
        <p className="mt-2 max-w-2xl text-surface-muted">{labels.subtitle}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="rounded-lg bg-primary-light p-2 text-primary">
              <Languages className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {labels.languageTitle}
              </h2>
              <p className="mt-1 text-sm text-surface-muted">
                {labels.languageDescription}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
              {labels.languageCurrent}:{" "}
              {language === "ar" ? labels.arabic : labels.turkish}
            </span>
            <button
              type="button"
              onClick={toggleLanguage}
              aria-pressed={language === "ar"}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
            >
              <Languages className="h-4 w-4" aria-hidden="true" />
              {language === "ar"
                ? labels.switchToTurkish
                : labels.switchToArabic}
            </button>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="rounded-lg bg-primary-light p-2 text-primary">
              <MonitorCog className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {labels.themeTitle}
              </h2>
              <p className="mt-1 text-sm text-surface-muted">
                {labels.themeDescription}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
              {labels.themeCurrent}:{" "}
              {theme === "dark" ? labels.dark : labels.light}
            </span>
            <button
              type="button"
              onClick={toggleTheme}
              aria-pressed={theme === "dark"}
              className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink-light"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Moon className="h-4 w-4" aria-hidden="true" />
              )}
              {theme === "dark" ? labels.switchToLight : labels.switchToDark}
            </button>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-start gap-3">
            <span className="rounded-lg bg-primary-light p-2 text-primary">
              <UserCircle className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {labels.accountTitle}
              </h2>
              <p className="mt-1 text-sm text-surface-muted">
                {labels.accountDescription}
              </p>
            </div>
          </div>

          {!accountAvailable ? (
            <p className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              {labels.accountUnavailable}
            </p>
          ) : !isAuthed ? (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <p className="text-sm text-surface-muted">
                {labels.signInRequired}
              </p>
              <Link
                href="/giris"
                className="inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-gold-light"
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
                {labels.signIn}
              </Link>
            </div>
          ) : (
            <div className="mt-6">
              {email && (
                <p className="rounded-lg bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
                  {labels.signedInAs}: {email}
                </p>
              )}

              <PasswordChangeForm action={passwordAction} />

              <form action={signOutAction} className="mt-6">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  {labels.signOut}
                </button>
              </form>
            </div>
          )}
        </section>

        {accountAvailable && isAuthed && (
          <TeacherPermissionsSection
            feedback={feedback}
            isTeacher={isTeacher}
            permissions={permissions}
            revokeAction={revokeTeacherPermissionAction}
            saveAction={saveTeacherPermissionAction}
            teacherCode={teacherCode}
          />
        )}
      </div>
    </div>
  );
}
