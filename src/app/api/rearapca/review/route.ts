import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { ActivityEvent } from "@/lib/supabase/types";
import { getRearapcaWordById } from "@/lib/rearapca-data";
import { formatTurkishMeanings, isTurkishAnswerCorrect } from "@/lib/rearapca-learn";
import {
  findProgressSnapshot,
  toProgressEventMetadata,
  type RearapcaProgressSnapshot,
} from "@/lib/rearapca-progress-events";
import {
  advanceSuccessfulReview,
  createAlreadyKnownProgress,
  createDeferredLearningProgress,
  createInitialProgress,
  isContinuingIntro,
  isProgressDue,
  recordIncorrectReview,
} from "@/lib/rearapca-srs.mjs";

type ReviewAction = "answer" | "know" | "unknown" | "already_known" | "start_learning";

interface ReviewRequestBody {
  wordId?: string;
  action?: ReviewAction;
  answer?: string;
}

function isReviewAction(value: unknown): value is ReviewAction {
  return (
    value === "answer" ||
    value === "know" ||
    value === "unknown" ||
    value === "already_known" ||
    value === "start_learning"
  );
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase yapılandırması gerekli." },
      { status: 503 },
    );
  }

  let body: ReviewRequestBody;
  try {
    body = (await request.json()) as ReviewRequestBody;
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }

  if (!body.wordId || !isReviewAction(body.action)) {
    return NextResponse.json(
      { error: "wordId ve action gerekli." },
      { status: 400 },
    );
  }

  const word = getRearapcaWordById(body.wordId);
  if (!word) {
    return NextResponse.json({ error: "Kelime bulunamadı." }, { status: 404 });
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
  const { data: existingEvents, error: fetchError } = await supabase
    .from("activity_events")
    .select("*")
    .eq("user_id", user.id)
    .eq("type", "vocab")
    .order("created_at", { ascending: true })
    .limit(5000);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const progress = findProgressSnapshot(
    (existingEvents ?? []) as ActivityEvent[],
    body.wordId,
  );

  const insertProgressEvent = async ({
    action,
    transition,
    baseProgress,
  }: {
    action: "first_learned" | "learning_started" | "review_success" | "mastered" | "incorrect" | "already_known";
    transition: ReturnType<
      | typeof createInitialProgress
      | typeof createAlreadyKnownProgress
      | typeof advanceSuccessfulReview
      | typeof recordIncorrectReview
    >;
    baseProgress?: RearapcaProgressSnapshot | null;
  }) => {
    const { data, error } = await supabase
      .from("activity_events")
      .insert({
        user_id: user.id,
        type: "vocab",
        course_slug: word.courseSlug,
        unit_id: null,
        score: null,
        metadata: toProgressEventMetadata({
          action,
          wordId: body.wordId!,
          status: transition.status,
          reviewStage: transition.review_stage,
          nextReviewAt: transition.next_review_at,
          firstLearnedAt:
            transition.first_learned_at ??
            baseProgress?.first_learned_at ??
            null,
          lastReviewedAt: transition.last_reviewed_at,
          correctDelta: transition.correct_count_delta,
          incorrectDelta: transition.incorrect_count_delta,
        }),
      })
      .select("*")
      .single();

    return { data, error };
  };

  if (body.action === "start_learning") {
    if (progress && !isContinuingIntro(progress)) {
      return NextResponse.json({
        correct: true,
        skipped: true,
        firstLearned: false,
        answerText: formatTurkishMeanings(word.back),
      });
    }

    const transition = createDeferredLearningProgress(now);
    const { error: insertError } = await insertProgressEvent({
      action: "learning_started",
      transition,
      baseProgress: progress,
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      correct: true,
      started: true,
      firstLearned: false,
      answerText: formatTurkishMeanings(word.back),
    });
  }

  if (body.action === "already_known") {
    if (progress?.status === "mastered") {
      return NextResponse.json({
        correct: true,
        skipped: true,
        firstLearned: false,
        answerText: formatTurkishMeanings(word.back),
      });
    }

    const transition = createAlreadyKnownProgress(now);
    const { error: insertError } = await insertProgressEvent({
      action: "already_known",
      transition,
      baseProgress: progress,
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      correct: true,
      skipped: true,
      firstLearned: false,
      answerText: formatTurkishMeanings(word.back),
    });
  }

  const answeredCorrectly =
    body.action === "know" ||
    (body.action === "answer" &&
      isTurkishAnswerCorrect(body.answer ?? "", word.back));

  if (!answeredCorrectly) {
    const transition = recordIncorrectReview(progress, now);
    const { error: insertError } = await insertProgressEvent({
      action: "incorrect",
      transition,
      baseProgress: progress,
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      correct: false,
      answerText: formatTurkishMeanings(word.back),
      requeue: true,
    });
  }

  if (!progress || isContinuingIntro(progress)) {
    const transition = createInitialProgress(now);
    const { data: inserted, error: insertError } = await insertProgressEvent({
      action: "first_learned",
      transition,
      baseProgress: progress,
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      correct: true,
      firstLearned: true,
      progress: inserted,
      answerText: formatTurkishMeanings(word.back),
    });
  }

  if (!isProgressDue(progress, now)) {
    return NextResponse.json(
      {
        error: "Bu kelimenin tekrar zamanı henüz gelmedi.",
        nextReviewAt: progress.next_review_at,
      },
      { status: 409 },
    );
  }

  const transition = advanceSuccessfulReview(progress, now);
  const { data: updated, error: updateError } = await insertProgressEvent({
    action: transition.mastered ? "mastered" : "review_success",
    transition,
    baseProgress: progress,
  });

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    correct: true,
    firstLearned: false,
    mastered: transition.mastered,
    progress: updated,
    answerText: formatTurkishMeanings(word.back),
  });
}
