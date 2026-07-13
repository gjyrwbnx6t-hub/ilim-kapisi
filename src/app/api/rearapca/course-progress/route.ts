import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { ActivityEvent } from "@/lib/supabase/types";
import { buildCourseProgressStats } from "@/lib/rearapca-course-progress";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ courses: [] });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Ders ilerlemesi için giriş yapmanız gerekiyor." },
      { status: 401 },
    );
  }

  const { data, error } = await supabase
    .from("activity_events")
    .select("*")
    .eq("user_id", user.id)
    .eq("type", "vocab")
    .order("created_at", { ascending: true })
    .limit(10000);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const courses = buildCourseProgressStats((data ?? []) as ActivityEvent[]);
  return NextResponse.json({ courses });
}
