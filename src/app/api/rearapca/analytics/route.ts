import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { ActivityEvent } from "@/lib/supabase/types";
import {
  buildRearapcaAnalytics,
  isAnalyticsRange,
  type AnalyticsRange,
} from "@/lib/rearapca-analytics";

function emptyAnalytics(range: AnalyticsRange) {
  return buildRearapcaAnalytics({ events: [], range });
}

export async function GET(request: NextRequest) {
  const rawRange = request.nextUrl.searchParams.get("range") ?? "30";
  const range: AnalyticsRange = isAnalyticsRange(rawRange) ? rawRange : "30";

  if (!isSupabaseConfigured()) {
    return NextResponse.json(emptyAnalytics(range));
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "İstatistikler için giriş yapmanız gerekiyor." },
      { status: 401 },
    );
  }

  const studentId = request.nextUrl.searchParams.get("studentId");
  let targetUserId = user.id;

  if (studentId && studentId !== user.id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if ((profile as { role?: string } | null)?.role !== "teacher") {
      return NextResponse.json(
        { error: "Bu öğrencinin istatistiklerine erişim yetkiniz yok." },
        { status: 403 },
      );
    }

    targetUserId = studentId;
  }

  const { data, error } = await supabase
    .from("activity_events")
    .select("*")
    .eq("user_id", targetUserId)
    .eq("type", "vocab")
    .order("created_at", { ascending: true })
    .limit(10000);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const analytics = buildRearapcaAnalytics({
    events: (data ?? []) as ActivityEvent[],
    range,
  });

  return NextResponse.json(analytics);
}
