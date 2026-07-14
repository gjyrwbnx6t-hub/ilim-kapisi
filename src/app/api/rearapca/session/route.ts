import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { ActivityEvent } from "@/lib/supabase/types";
import { getRearapcaWordPool } from "@/lib/rearapca-data";
import { formatTurkishMeanings } from "@/lib/rearapca-learn";
import {
  buildProgressSnapshots,
  summarizeRearapcaEvents,
} from "@/lib/rearapca-progress-events";
import { buildSessionQueue } from "@/lib/rearapca-srs.mjs";
import { clampDailyGoal } from "@/lib/rearapca-daily-goal";

type SessionMode = "new" | "review" | "mixed";

interface SessionRequestBody {
  mode?: SessionMode;
  dailyGoal?: number;
  courseSlugs?: string[];
  dayStartUtc?: string;
  dayEndUtc?: string;
}

function modeOrDefault(value: unknown): SessionMode {
  return value === "review" || value === "mixed" ? value : "new";
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase yapılandırması gerekli." },
      { status: 503 },
    );
  }

  let body: SessionRequestBody;
  try {
    body = (await request.json()) as SessionRequestBody;
  } catch {
    body = {};
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Rearapça tekrarları için giriş yapmanız gerekiyor." },
      { status: 401 },
    );
  }

  const now = new Date();
  const dailyGoal = clampDailyGoal(body.dailyGoal);
  const pool = getRearapcaWordPool(body.courseSlugs);
  const wordIds = pool.map((word) => word.key);

  if (wordIds.length === 0) {
    return NextResponse.json({
      now: now.toISOString(),
      dailyGoal,
      stats: {
        learnedToday: 0,
        reviewedToday: 0,
        dueCount: 0,
        masteredCount: 0,
        totalProgress: 0,
      },
      distractorAnswers: [],
      words: [],
    });
  }

  const { data, error } = await supabase
    .from("activity_events")
    .select("*")
    .eq("user_id", user.id)
    .eq("type", "vocab")
    .order("created_at", { ascending: true })
    .limit(5000);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const events = (data ?? []) as ActivityEvent[];
  const progresses = buildProgressSnapshots(events).filter((progress) =>
    wordIds.includes(progress.word_id),
  );
  const mode = modeOrDefault(body.mode);
  const queue = buildSessionQueue({
    pool,
    progresses,
    mode,
    now,
    dailyGoal,
  });

  const dayStart = body.dayStartUtc ? new Date(body.dayStartUtc) : null;
  const dayEnd = body.dayEndUtc ? new Date(body.dayEndUtc) : null;
  const stats = summarizeRearapcaEvents({ events, now, dayStart, dayEnd });

  return NextResponse.json({
    now: now.toISOString(),
    dailyGoal,
    stats,
    distractorAnswers: [
      ...new Set(pool.map((word) => formatTurkishMeanings(word.back))),
    ],
    words: queue.map((word) => ({
      id: word.key,
      courseSlug: word.courseSlug,
      courseTitleAr: word.courseTitleAr,
      lessonTitleTr: word.lessonTitleTr,
      front: word.front,
      back: word.back,
      answerText: formatTurkishMeanings(word.back),
      frontDir: word.frontDir,
      sessionKind: word.sessionKind,
      reviewStage: word.progress?.review_stage ?? null,
      nextReviewAt: word.progress?.next_review_at ?? null,
    })),
  });
}
