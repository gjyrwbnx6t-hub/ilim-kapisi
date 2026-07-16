"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function sendTeacherFeedback(formData: FormData) {
  const studentId = String(formData.get("student_id") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!studentId || !message) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if ((profile as { role?: string } | null)?.role !== "teacher") return;

  await supabase.from("teacher_feedback").insert({
    teacher_id: user.id,
    student_id: studentId,
    message: message.slice(0, 1000),
  });

  revalidatePath("/panel");
  revalidatePath("/ayarlar");
}
