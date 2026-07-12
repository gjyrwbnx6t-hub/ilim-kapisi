import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { ActivityInput } from "@/lib/supabase/types";

/**
 * Aktivite olayı kaydı. Giriş yoksa veya Supabase kurulu değilse sessizce
 * 204 döner (site akışını bozmamak için). RLS zaten user_id = auth.uid()
 * zorunlu kıldığı için kullanıcı yalnızca kendi verisini yazabilir.
 */
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return new NextResponse(null, { status: 204 });
  }

  let body: ActivityInput;
  try {
    body = (await request.json()) as ActivityInput;
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }

  if (!body?.type) {
    return NextResponse.json({ error: "type gerekli" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Giriş yoksa sessizce yok say.
  if (!user) {
    return new NextResponse(null, { status: 204 });
  }

  const { error: eventError } = await supabase.from("activity_events").insert({
    user_id: user.id,
    type: body.type,
    course_slug: body.courseSlug ?? null,
    unit_id: body.unitId ?? null,
    score: typeof body.score === "number" ? body.score : null,
    metadata: body.metadata ?? null,
  });

  // İlerleme bilgisi varsa upsert et.
  if (body.progress && body.courseSlug) {
    await supabase.from("study_progress").upsert(
      {
        user_id: user.id,
        course_slug: body.courseSlug,
        module: body.progress.module,
        last_week: body.progress.lastWeek ?? null,
        percent: body.progress.percent ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,course_slug,module" },
    );
  }

  if (eventError) {
    return NextResponse.json({ error: eventError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
