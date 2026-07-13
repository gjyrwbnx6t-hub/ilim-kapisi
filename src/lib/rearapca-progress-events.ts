import type { ActivityEvent } from "@/lib/supabase/types";

export interface RearapcaProgressSnapshot {
  word_id: string;
  status: "learning" | "mastered";
  review_stage: number;
  next_review_at: string | null;
  first_learned_at: string | null;
  last_reviewed_at: string | null;
  correct_count: number;
  incorrect_count: number;
}

export interface RearapcaStats {
  learnedToday: number;
  reviewedToday: number;
  dueCount: number;
  masteredCount: number;
  totalProgress: number;
}

type RearapcaEventAction =
  | "first_learned"
  | "learning_started"
  | "review_success"
  | "mastered"
  | "incorrect"
  | "already_known";

interface RearapcaEventMetadata {
  source?: unknown;
  action?: unknown;
  wordId?: unknown;
  status?: unknown;
  reviewStage?: unknown;
  nextReviewAt?: unknown;
  firstLearnedAt?: unknown;
  lastReviewedAt?: unknown;
  correctDelta?: unknown;
  incorrectDelta?: unknown;
}

export function isRearapcaEvent(event: ActivityEvent): boolean {
  return (
    event.type === "vocab" &&
    event.metadata?.source === "rearapca" &&
    typeof event.metadata.wordId === "string"
  );
}

function metadata(event: ActivityEvent): RearapcaEventMetadata {
  return (event.metadata ?? {}) as RearapcaEventMetadata;
}

function actionOf(event: ActivityEvent): RearapcaEventAction | null {
  const action = metadata(event).action;
  if (
    action === "first_learned" ||
    action === "learning_started" ||
    action === "review_success" ||
    action === "mastered" ||
    action === "incorrect" ||
    action === "already_known"
  ) {
    return action;
  }
  return null;
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function statusOr(value: unknown, fallback: "learning" | "mastered") {
  return value === "mastered" || value === "learning" ? value : fallback;
}

/** Öğrenme kuyruğuna girmiş veya bilinen (already_known) her kelime. */
export function getProgressedWordIds(events: ActivityEvent[]): Set<string> {
  return new Set(
    buildProgressSnapshots(events).map((progress) => progress.word_id),
  );
}

export function buildProgressSnapshots(
  events: ActivityEvent[],
): RearapcaProgressSnapshot[] {
  const byWord = new Map<string, RearapcaProgressSnapshot>();

  for (const event of events) {
    if (!isRearapcaEvent(event)) continue;

    const meta = metadata(event);
    const action = actionOf(event);
    const wordId = meta.wordId as string;
    const previous = byWord.get(wordId);

    if (!previous && action === "incorrect") continue;

    const base: RearapcaProgressSnapshot =
      previous ?? {
        word_id: wordId,
        status: "learning",
        review_stage: 0,
        next_review_at: null,
        first_learned_at: null,
        last_reviewed_at: null,
        correct_count: 0,
        incorrect_count: 0,
      };

    byWord.set(wordId, {
      word_id: wordId,
      status: statusOr(meta.status, base.status),
      review_stage: numberOr(meta.reviewStage, base.review_stage),
      next_review_at:
        meta.nextReviewAt === null ? null : stringOrNull(meta.nextReviewAt) ?? base.next_review_at,
      first_learned_at:
        stringOrNull(meta.firstLearnedAt) ?? base.first_learned_at,
      last_reviewed_at:
        stringOrNull(meta.lastReviewedAt) ?? event.created_at ?? base.last_reviewed_at,
      correct_count: base.correct_count + numberOr(meta.correctDelta, 0),
      incorrect_count: base.incorrect_count + numberOr(meta.incorrectDelta, 0),
    });
  }

  return [...byWord.values()];
}

export function findProgressSnapshot(
  events: ActivityEvent[],
  wordId: string,
): RearapcaProgressSnapshot | null {
  return (
    buildProgressSnapshots(events).find((progress) => progress.word_id === wordId) ??
    null
  );
}

export function summarizeRearapcaEvents({
  events,
  now,
  dayStart,
  dayEnd,
}: {
  events: ActivityEvent[];
  now: Date;
  dayStart: Date | null;
  dayEnd: Date | null;
}): RearapcaStats {
  const snapshots = buildProgressSnapshots(events);
  const inToday = (iso: string | null) => {
    if (!iso || !dayStart || !dayEnd) return false;
    const time = new Date(iso).getTime();
    return time >= dayStart.getTime() && time < dayEnd.getTime();
  };

  const dueCount = snapshots.filter((progress) => {
    if (progress.status === "mastered" || !progress.next_review_at) return false;
    return new Date(progress.next_review_at).getTime() <= now.getTime();
  }).length;

  return {
    learnedToday: snapshots.filter((progress) =>
      inToday(progress.first_learned_at),
    ).length,
    reviewedToday: events.filter((event) => {
      const action = actionOf(event);
      return (
        isRearapcaEvent(event) &&
        (action === "review_success" || action === "mastered") &&
        inToday(event.created_at)
      );
    }).length,
    dueCount,
    masteredCount: snapshots.filter((progress) => progress.status === "mastered")
      .length,
    totalProgress: snapshots.length,
  };
}

export function toProgressEventMetadata({
  action,
  wordId,
  status,
  reviewStage,
  nextReviewAt,
  firstLearnedAt,
  lastReviewedAt,
  correctDelta,
  incorrectDelta,
}: {
  action: RearapcaEventAction;
  wordId: string;
  status: "learning" | "mastered";
  reviewStage: number;
  nextReviewAt: string | null;
  firstLearnedAt: string | null;
  lastReviewedAt: string | null;
  correctDelta: number;
  incorrectDelta: number;
}) {
  return {
    source: "rearapca",
    action,
    wordId,
    status,
    reviewStage,
    nextReviewAt,
    firstLearnedAt,
    lastReviewedAt,
    correctDelta,
    incorrectDelta,
  };
}
