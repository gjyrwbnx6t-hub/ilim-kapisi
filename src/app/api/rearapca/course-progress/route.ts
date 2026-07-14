import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { ActivityEvent } from "@/lib/supabase/types";
import { buildCourseProgressStats } from "@/lib/rearapca-course-progress";
import { courses as courseCatalog } from "@/data/courses";
import { getVocabulary } from "@/lib/content";

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

  const courseStats = buildCourseProgressStats((data ?? []) as ActivityEvent[]);
  return NextResponse.json({ courses: courseStats });
}

function isValidCourseSlug(slug: string): boolean {
  const course = courseCatalog.find((entry) => entry.slug === slug);
  if (!course) return false;
  return Boolean(getVocabulary(course.contentSlug));
}

export async function DELETE(request: NextRequest) {
  const courseSlug = request.nextUrl.searchParams.get("courseSlug")?.trim() ?? "";

  if (!courseSlug || !isValidCourseSlug(courseSlug)) {
    return NextResponse.json({ error: "Geçersiz ders." }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "İlerleme sıfırlamak için sunucu yapılandırması gerekli." },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "İlerlemeyi sıfırlamak için giriş yapmanız gerekiyor." },
      { status: 401 },
    );
  }

  const { error } = await supabase
    .from("activity_events")
    .delete()
    .eq("user_id", user.id)
    .eq("type", "vocab")
    .eq("course_slug", courseSlug)
    .eq("metadata->>source", "rearapca");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, courseSlug });
}
