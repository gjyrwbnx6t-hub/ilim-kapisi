"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isBootstrapTeacherEmail } from "@/lib/teacher-accounts";

export interface AuthActionState {
  error?: string;
  message?: string;
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;
type ExpectedRole = "student" | "teacher";

interface SignedInUser {
  email?: string;
  id: string;
  user_metadata?: Record<string, unknown>;
}

interface ProfileSyncResult {
  errorCode?: string;
  errorMessage?: string;
  role: string | null;
}

async function readRoleForUser(
  supabase: SupabaseServerClient,
  userId: string,
) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  return (profile as { role?: string } | null)?.role ?? null;
}

async function syncCurrentUserProfile(
  supabase: SupabaseServerClient,
): Promise<ProfileSyncResult> {
  const { data, error } = await supabase.rpc("sync_current_user_profile");

  if (error) {
    return {
      errorCode: error.code,
      errorMessage: error.message,
      role: null,
    };
  }

  const row = Array.isArray(data) ? data[0] : data;
  return {
    role: (row as { role?: string } | null)?.role ?? null,
  };
}

async function resolveRoleForSignedInUser(
  supabase: SupabaseServerClient,
  user: SignedInUser | null,
  expectedRole?: ExpectedRole,
) {
  if (!user) return null;

  const role = await readRoleForUser(supabase, user.id);
  const shouldBeTeacher =
    user.user_metadata?.role === "teacher" ||
    isBootstrapTeacherEmail(user.email);
  const metadataRole = shouldBeTeacher ? "teacher" : "student";

  if (!role || (expectedRole && role !== expectedRole && metadataRole === expectedRole)) {
    return (await syncCurrentUserProfile(supabase)).role ?? role;
  }

  if (role !== "teacher" && shouldBeTeacher) {
    return (await syncCurrentUserProfile(supabase)).role ?? role;
  }

  return role;
}

function isMissingProfileSyncFunction(errorMessage?: string) {
  return errorMessage?.includes("sync_current_user_profile") ?? false;
}

function redirectForRole(role: string | null): never {
  redirect(role === "teacher" ? "/panel" : "/profil");
}

function getSiteOrigin() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3000";
}

async function resolveRedirectOrigin(formOrigin: string) {
  const trimmed = formOrigin.trim().replace(/\/$/, "");
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  if (host) {
    const proto = headerList.get("x-forwarded-proto") ?? "http";
    return `${proto}://${host}`.replace(/\/$/, "");
  }

  return getSiteOrigin().replace(/\/$/, "");
}

function mapResetPasswordError(message: string) {
  const lower = message.toLowerCase();

  if (lower.includes("redirect") || lower.includes("url")) {
    return (
      "Yönlendirme adresi Supabase ayarlarında tanımlı değil. " +
      "Authentication → URL Configuration bölümüne site adresinizi ekleyin " +
      "(ör. http://127.0.0.1:3000/**)."
    );
  }

  if (lower.includes("rate") || lower.includes("limit")) {
    return (
      "Çok fazla deneme yapıldı. Supabase güvenlik limiti nedeniyle birkaç " +
      "dakika sonra tekrar deneyin; bu sırada gelen kutunuzu ve spam klasörünü kontrol edin."
    );
  }

  return `Sıfırlama e-postası gönderilemedi: ${message}`;
}

/** E-posta/şifre ile giriş. */
export async function signIn(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "E-posta ve şifre gerekli." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "Giriş başarısız: e-posta veya şifre hatalı." };
  }

  revalidatePath("/", "layout");
  redirectForRole(await resolveRoleForSignedInUser(supabase, data.user));
}

/** E-posta/şifre ile kayıt. Herkes 'student' olarak başlar (trigger). */
export async function signUp(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!fullName || !email || !password) {
    return { error: "Ad, e-posta ve şifre gerekli." };
  }
  if (password.length < 6) {
    return { error: "Şifre en az 6 karakter olmalı." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role: "student" },
    },
  });

  if (error) {
    return { error: `Kayıt başarısız: ${error.message}` };
  }

  // E-posta onayı kapalıysa oturum hemen açılır.
  if (data.session) {
    await syncCurrentUserProfile(supabase);
    revalidatePath("/", "layout");
    redirect("/profil");
  }

  return {
    message:
      "Kayıt alındı. E-posta onayı açıksa gelen kutunuzu kontrol edin, sonra giriş yapın.",
  };
}

/** Öğretmen giriş ekranı: yalnız teacher rolündeki hesapları panele alır. */
export async function teacherSignIn(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "E-posta ve şifre gerekli." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "Giriş başarısız: e-posta veya şifre hatalı." };
  }

  const role = await resolveRoleForSignedInUser(
    supabase,
    data.user,
    "teacher",
  );
  if (role !== "teacher") {
    const syncResult = isBootstrapTeacherEmail(data.user?.email)
      ? await syncCurrentUserProfile(supabase)
      : { role: null };

    await supabase.auth.signOut();
    if (isMissingProfileSyncFunction(syncResult.errorMessage)) {
      return {
        error:
          "Öğretmen rolü doğrulanamadı: Supabase şeması güncel değil. Lütfen supabase/schema.sql dosyasını Supabase SQL Editor’da çalıştırın.",
      };
    }

    return {
      error:
        "Bu ekran öğretmen hesapları içindir. Öğrenci hesabınızla normal giriş ekranını kullanın.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/panel");
}

/** Öğretmen kayıt ekranı: öğrenci verilerine yalnız izinle erişen teacher rolü oluşturur. */
export async function teacherSignUp(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!fullName || !email || !password) {
    return { error: "Ad, e-posta ve şifre gerekli." };
  }
  if (password.length < 6) {
    return { error: "Şifre en az 6 karakter olmalı." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role: "teacher" },
    },
  });

  if (error) {
    return { error: `Kayıt başarısız: ${error.message}` };
  }

  if (data.session) {
    await syncCurrentUserProfile(supabase);
    revalidatePath("/", "layout");
    redirect("/panel");
  }

  return {
    message:
      "Öğretmen kaydı alındı. E-posta onayı açıksa gelen kutunuzu kontrol edin, sonra öğretmen girişi yapın.",
  };
}

/** Oturum açıkken şifreyi güncelle. */
export async function updatePassword(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");
  const language = formData.get("language") === "ar" ? "ar" : "tr";
  const messages = {
    tr: {
      required: "Yeni şifre ve tekrar alanı gerekli.",
      short: "Şifre en az 6 karakter olmalı.",
      mismatch: "Şifreler eşleşmiyor.",
      unauthenticated: "Şifre değiştirmek için giriş yapmalısınız.",
      failure: "Şifre güncellenemedi.",
      success: "Şifreniz güncellendi.",
    },
    ar: {
      required: "كلمة المرور الجديدة وتأكيدها مطلوبان.",
      short: "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.",
      mismatch: "كلمتا المرور غير متطابقتين.",
      unauthenticated: "يجب تسجيل الدخول لتغيير كلمة المرور.",
      failure: "تعذر تحديث كلمة المرور.",
      success: "تم تحديث كلمة المرور.",
    },
  }[language];

  if (!password || !confirmPassword) {
    return { error: messages.required };
  }
  if (password.length < 6) {
    return { error: messages.short };
  }
  if (password !== confirmPassword) {
    return { error: messages.mismatch };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: messages.unauthenticated };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: `${messages.failure} ${error.message}` };
  }

  revalidatePath("/ayarlar");
  return { message: messages.success };
}

/** Şifre sıfırlama e-postası gönder. */
export async function requestPasswordReset(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const audience = formData.get("audience") === "teacher" ? "teacher" : "student";
  const redirectOrigin = await resolveRedirectOrigin(
    String(formData.get("redirect_origin") ?? ""),
  );

  if (!email) {
    return { error: "E-posta adresi gerekli." };
  }

  const redirectTo =
    audience === "teacher"
      ? `${redirectOrigin}/sifre-yenile?audience=teacher`
      : `${redirectOrigin}/sifre-yenile`;

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    return { error: mapResetPasswordError(error.message) };
  }

  return {
    message:
      "Şifre sıfırlama bağlantısı e-postanıza gönderildi. Gelen kutunuzu ve spam klasörünü kontrol edin.",
  };
}

/** E-posta bağlantısından sonra yeni şifreyi kaydet. */
export async function completePasswordReset(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");
  const audience = formData.get("audience") === "teacher" ? "teacher" : "student";

  if (!password || !confirmPassword) {
    return { error: "Yeni şifre ve tekrar alanı gerekli." };
  }
  if (password.length < 6) {
    return { error: "Şifre en az 6 karakter olmalı." };
  }
  if (password !== confirmPassword) {
    return { error: "Şifreler eşleşmiyor." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error:
        "Oturum bulunamadı. Sıfırlama bağlantısının süresi dolmuş olabilir; yeniden deneyin.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: `Şifre güncellenemedi: ${error.message}` };
  }

  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect(audience === "teacher" ? "/ogretmen/giris" : "/giris");
}

/** Oturumu kapat. */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
