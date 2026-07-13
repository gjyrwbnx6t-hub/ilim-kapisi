import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  REARAPCA_DAILY_GOAL_COURSE,
  REARAPCA_DAILY_GOAL_MODULE,
  clampDailyGoal,
} from "@/lib/rearapca-daily-goal";
import { DEFAULT_REARAPCA_DAILY_GOAL } from "@/lib/rearapca-srs.mjs";

interface DailyGoalBody {
  dailyGoal?: number;
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ dailyGoal: DEFAULT_REARAPCA_DAILY_GOAL });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Günlük hedef kaydı için giriş yapmanız gerekiyor." },
      { status: 401 },
    );
  }

  const { data, error } = await supabase
    .from("study_progress")
    .select("percent")
    .eq("user_id", user.id)
    .eq("course_slug", REARAPCA_DAILY_GOAL_COURSE)
    .eq("module", REARAPCA_DAILY_GOAL_MODULE)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const dailyGoal =
    typeof data?.percent === "number"
      ? clampDailyGoal(data.percent)
      : DEFAULT_REARAPCA_DAILY_GOAL;

  return NextResponse.json({ dailyGoal });
}

export async function PUT(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase yapılandırması gerekli." },
      { status: 503 },
    );
  }

  let body: DailyGoalBody;
  try {
    body = (await request.json()) as DailyGoalBody;
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }

  const dailyGoal = clampDailyGoal(body.dailyGoal);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Günlük hedef kaydı için giriş yapmanız gerekiyor." },
      { status: 401 },
    );
  }

  const { error } = await supabase.from("study_progress").upsert(
    {
      user_id: user.id,
      course_slug: REARAPCA_DAILY_GOAL_COURSE,
      module: REARAPCA_DAILY_GOAL_MODULE,
      percent: dailyGoal,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,course_slug,module" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ dailyGoal });
}
