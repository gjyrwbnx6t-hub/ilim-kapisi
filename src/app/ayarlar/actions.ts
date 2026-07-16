"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface TeacherPermissionActionState {
  error?: string;
  message?: string;
}

export type TeacherPermissionAction = (
  prev: TeacherPermissionActionState,
  formData: FormData,
) => Promise<TeacherPermissionActionState>;

function normalizeTeacherCode(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

function mapTeacherLookupError(message: string) {
  if (
    message.includes("get_teacher_by_code") ||
    message.includes("schema cache")
  ) {
    return (
      "Öğretmen kodu kontrol edilemedi: Supabase şeması güncel değil. " +
      "Lütfen supabase/schema.sql dosyasındaki öğretmen izinleri ve RPC bölümlerini SQL Editor’da çalıştırın."
    );
  }

  return `Öğretmen kodu kontrol edilemedi: ${message}`;
}

async function getAuthedStudentId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: "Öğretmen izni vermek için giriş yapmalısınız.",
      supabase,
      userId: null,
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if ((profile as { role?: string } | null)?.role !== "student") {
    return {
      error: "Öğretmen izinleri yalnız öğrenci hesaplarından yönetilebilir.",
      supabase,
      userId: null,
    };
  }

  return { error: null, supabase, userId: user.id };
}

export async function saveTeacherPermission(
  _prev: TeacherPermissionActionState,
  formData: FormData,
): Promise<TeacherPermissionActionState> {
  const { error: authError, supabase, userId } = await getAuthedStudentId();
  if (authError || !userId) return { error: authError ?? "Oturum bulunamadı." };

  const allowRearapca = formData.get("allow_rearapca") === "on";
  const allowCareer = formData.get("allow_career") === "on";

  if (!allowRearapca && !allowCareer) {
    return { error: "En az bir veri alanı seçmelisiniz." };
  }

  let teacherId = String(formData.get("teacher_id") ?? "").trim();

  if (!teacherId) {
    const teacherCode = normalizeTeacherCode(formData.get("teacher_code"));
    if (!teacherCode) {
      return { error: "Öğretmen kodu gerekli." };
    }

    const { data, error } = await supabase.rpc("get_teacher_by_code", {
      lookup_code: teacherCode,
    });

    if (error) {
      return { error: mapTeacherLookupError(error.message) };
    }

    const teacher = Array.isArray(data) ? data[0] : null;
    if (!teacher?.id) {
      return { error: "Bu kodla eşleşen öğretmen bulunamadı." };
    }

    teacherId = String(teacher.id);
  }

  if (teacherId === userId) {
    return { error: "Kendi hesabınıza öğretmen izni veremezsiniz." };
  }

  const { error } = await supabase.from("teacher_permissions").upsert(
    {
      student_id: userId,
      teacher_id: teacherId,
      allow_rearapca: allowRearapca,
      allow_career: allowCareer,
    },
    { onConflict: "student_id,teacher_id" },
  );

  if (error) {
    return { error: `İzin kaydedilemedi: ${error.message}` };
  }

  revalidatePath("/ayarlar");
  revalidatePath("/panel");
  return { message: "Öğretmen izni güncellendi." };
}

export async function revokeTeacherPermission(
  _prev: TeacherPermissionActionState,
  formData: FormData,
): Promise<TeacherPermissionActionState> {
  const { error: authError, supabase, userId } = await getAuthedStudentId();
  if (authError || !userId) return { error: authError ?? "Oturum bulunamadı." };

  const permissionId = String(formData.get("permission_id") ?? "").trim();
  if (!permissionId) {
    return { error: "Kaldırılacak izin bulunamadı." };
  }

  const { error } = await supabase
    .from("teacher_permissions")
    .delete()
    .eq("id", permissionId)
    .eq("student_id", userId);

  if (error) {
    return { error: `İzin kaldırılamadı: ${error.message}` };
  }

  revalidatePath("/ayarlar");
  revalidatePath("/panel");
  return { message: "Öğretmen izni kaldırıldı." };
}
