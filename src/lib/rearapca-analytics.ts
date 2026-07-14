import type { ActivityEvent } from "@/lib/supabase/types";
import { buildProgressSnapshots, isRearapcaEvent } from "@/lib/rearapca-progress-events";

export type AnalyticsRange = "7" | "30" | "90" | "all";

export interface AnalyticsBucket {
  key: string;
  label: string;
  alreadyKnown: number;
  newWords: number;
  reviewed: number;
  mastered: number;
}

export interface RearapcaAnalytics {
  range: AnalyticsRange;
  rangeLabel: string;
  buckets: AnalyticsBucket[];
  totals: {
    alreadyKnown: number;
    newWords: number;
    reviewed: number;
    mastered: number;
  };
  learningNow: number;
}

type RearapcaEventAction =
  | "first_learned"
  | "review_success"
  | "mastered"
  | "incorrect"
  | "already_known";

function actionOf(event: ActivityEvent): RearapcaEventAction | null {
  const action = event.metadata?.action;
  if (
    action === "first_learned" ||
    action === "review_success" ||
    action === "mastered" ||
    action === "incorrect" ||
    action === "already_known"
  ) {
    return action;
  }
  return null;
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date, locale = "tr-TR") {
  return date.toLocaleDateString(locale, { month: "short", year: "numeric" });
}

function dayKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dayLabel(date: Date, locale = "tr-TR") {
  return date.toLocaleDateString(locale, { day: "numeric", month: "short" });
}

function weekKey(date: Date) {
  const start = startOfDay(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  return dayKey(start);
}

function weekLabel(date: Date, locale = "tr-TR") {
  const start = startOfDay(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  return `Hf ${start.toLocaleDateString(locale, { day: "numeric", month: "short" })}`;
}

function rangeLabel(range: AnalyticsRange): string {
  if (range === "7") return "Son 7 gün";
  if (range === "30") return "Son 30 gün";
  if (range === "90") return "Son 90 gün";
  return "Tüm zamanlar";
}

function createEmptyBucket(key: string, label: string): AnalyticsBucket {
  return {
    key,
    label,
    alreadyKnown: 0,
    newWords: 0,
    reviewed: 0,
    mastered: 0,
  };
}

function buildDayBuckets(count: number, now: Date): AnalyticsBucket[] {
  const buckets: AnalyticsBucket[] = [];
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = startOfDay(now);
    date.setDate(date.getDate() - offset);
    buckets.push(createEmptyBucket(dayKey(date), dayLabel(date)));
  }
  return buckets;
}

function buildWeekBuckets(count: number, now: Date): AnalyticsBucket[] {
  const keys = new Set<string>();
  const buckets: AnalyticsBucket[] = [];
  for (let offset = (count - 1) * 7; offset >= 0; offset -= 7) {
    const date = startOfDay(now);
    date.setDate(date.getDate() - offset);
    const key = weekKey(date);
    if (keys.has(key)) continue;
    keys.add(key);
    buckets.push(createEmptyBucket(key, weekLabel(date)));
  }
  return buckets;
}

function buildMonthBuckets(events: ActivityEvent[], now: Date): AnalyticsBucket[] {
  const rearapcaEvents = events.filter(isRearapcaEvent);
  const firstEvent = rearapcaEvents[0];
  const start = firstEvent
    ? startOfMonth(new Date(firstEvent.created_at))
    : startOfMonth(now);

  const buckets: AnalyticsBucket[] = [];
  const cursor = new Date(start);
  const end = startOfMonth(now);

  while (cursor.getTime() <= end.getTime()) {
    buckets.push(createEmptyBucket(monthKey(cursor), monthLabel(cursor)));
    cursor.setMonth(cursor.getMonth() + 1);
  }

  if (buckets.length === 0) {
    buckets.push(createEmptyBucket(monthKey(now), monthLabel(now)));
  }

  return buckets;
}

function bucketIndexForEvent(
  buckets: AnalyticsBucket[],
  range: AnalyticsRange,
  createdAt: string,
): number {
  const date = new Date(createdAt);
  const key =
    range === "all"
      ? monthKey(date)
      : range === "90" || range === "30"
        ? weekKey(date)
        : dayKey(date);

  return buckets.findIndex((bucket) => bucket.key === key);
}

export function buildRearapcaAnalytics({
  events,
  range,
  now = new Date(),
}: {
  events: ActivityEvent[];
  range: AnalyticsRange;
  now?: Date;
}): RearapcaAnalytics {
  const rearapcaEvents = events
    .filter(isRearapcaEvent)
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );

  const buckets =
    range === "7"
      ? buildDayBuckets(7, now)
      : range === "30"
        ? buildWeekBuckets(5, now)
        : range === "90"
          ? buildWeekBuckets(13, now)
          : buildMonthBuckets(rearapcaEvents, now);

  const reviewedSets = buckets.map(() => new Set<string>());

  for (const event of rearapcaEvents) {
    const index = bucketIndexForEvent(buckets, range, event.created_at);
    if (index < 0) continue;

    const action = actionOf(event);
    const wordId =
      typeof event.metadata?.wordId === "string" ? event.metadata.wordId : null;
    if (!action || !wordId) continue;

    const bucket = buckets[index];

    if (action === "already_known") {
      bucket.alreadyKnown += 1;
    } else if (action === "first_learned") {
      bucket.newWords += 1;
    } else if (action === "review_success") {
      if (!reviewedSets[index].has(wordId)) {
        reviewedSets[index].add(wordId);
        bucket.reviewed += 1;
      }
    } else if (action === "mastered") {
      bucket.mastered += 1;
    }
  }

  const totals = buckets.reduce(
    (acc, bucket) => ({
      alreadyKnown: acc.alreadyKnown + bucket.alreadyKnown,
      newWords: acc.newWords + bucket.newWords,
      reviewed: acc.reviewed + bucket.reviewed,
      mastered: acc.mastered + bucket.mastered,
    }),
    { alreadyKnown: 0, newWords: 0, reviewed: 0, mastered: 0 },
  );

  const snapshots = buildProgressSnapshots(events);
  const learningNow = snapshots.filter(
    (progress) =>
      progress.status === "learning" &&
      progress.first_learned_at !== null &&
      progress.review_stage < 6,
  ).length;

  return {
    range,
    rangeLabel: rangeLabel(range),
    buckets,
    totals,
    learningNow,
  };
}

export function isAnalyticsRange(value: string): value is AnalyticsRange {
  return value === "7" || value === "30" || value === "90" || value === "all";
}
