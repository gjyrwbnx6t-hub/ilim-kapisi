"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface AuthActionState {
  error?: string;
  message?: string;
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
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Giriş başarısız: e-posta veya şifre hatalı." };
  }

  revalidatePath("/", "layout");
  redirect("/profil");
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
      data: { full_name: fullName },
    },
  });

  if (error) {
    return { error: `Kayıt başarısız: ${error.message}` };
  }

  // E-posta onayı kapalıysa oturum hemen açılır.
  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/profil");
  }

  return {
    message:
      "Kayıt alındı. E-posta onayı açıksa gelen kutunuzu kontrol edin, sonra giriş yapın.",
  };
}

/** Oturumu kapat. */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
