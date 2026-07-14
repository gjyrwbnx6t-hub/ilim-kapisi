import type { ActivityEvent } from "@/lib/supabase/types";

export interface ModuleStudyTime {
  moduleLabel: string;
  courseSlug: string;
  courseTitle: string;
  totalSeconds: number;
}

const SESSION_GAP_MS = 10 * 60 * 1000;
const MIN_SESSION_SECONDS = 30;
const MAX_SESSION_SECONDS = 2 * 60 * 60;

function clampSessionSeconds(seconds: number): number {
  return Math.min(MAX_SESSION_SECONDS, Math.max(MIN_SESSION_SECONDS, seconds));
}

function eventTimeMs(event: ActivityEvent): number {
  return new Date(event.created_at).getTime();
}

function estimateSecondsFromClusters(events: ActivityEvent[]): number {
  if (events.length === 0) return 0;

  const sorted = [...events].sort((a, b) => eventTimeMs(a) - eventTimeMs(b));
  let total = 0;
  let sessionStart = eventTimeMs(sorted[0]);
  let sessionEnd = sessionStart;

  for (let index = 1; index < sorted.length; index += 1) {
    const time = eventTimeMs(sorted[index]);
    if (time - sessionEnd > SESSION_GAP_MS) {
      total += clampSessionSeconds((sessionEnd - sessionStart) / 1000);
      sessionStart = time;
    }
    sessionEnd = time;
  }

  total += clampSessionSeconds((sessionEnd - sessionStart) / 1000);
  return total;
}

function isTimeSpentEvent(event: ActivityEvent): boolean {
  return (
    event.metadata?.action === "time_spent" &&
    typeof event.metadata.durationSeconds === "number"
  );
}

function moduleContext(event: ActivityEvent): {
  moduleLabel: string;
  courseSlug: string;
} | null {
  if (isTimeSpentEvent(event)) {
    const moduleLabel =
      typeof event.metadata?.moduleLabel === "string"
        ? event.metadata.moduleLabel
        : "Çalışma";
    return {
      moduleLabel,
      courseSlug: event.course_slug ?? "genel",
    };
  }

  if (event.metadata?.source === "rearapca") {
    return {
      moduleLabel: "Rearapça",
      courseSlug: event.course_slug ?? "rearapca",
    };
  }

  if (event.type === "mindmap") {
    return {
      moduleLabel: "Zihin Şeması",
      courseSlug: event.course_slug ?? "genel",
    };
  }

  if (event.type === "vocab") {
    return {
      moduleLabel: "Anahtar Kelimeler",
      courseSlug: event.course_slug ?? "genel",
    };
  }

  return null;
}

function groupKey(moduleLabel: string, courseSlug: string): string {
  return `${moduleLabel}::${courseSlug}`;
}

export function formatStudyDuration(totalSeconds: number): string {
  if (totalSeconds < 60) return "1 dk";

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0 && minutes > 0) return `${hours} sa ${minutes} dk`;
  if (hours > 0) return `${hours} sa`;
  return `${minutes} dk`;
}

export interface ModuleStudyTimeTotal {
  moduleLabel: string;
  totalSeconds: number;
}

export function aggregateStudyTimeTotalsByModuleLabel(
  events: ActivityEvent[],
  resolveCourseTitle: (slug: string) => string,
): ModuleStudyTimeTotal[] {
  const byCourse = aggregateStudyTimeByModule(events, resolveCourseTitle);
  const totals = new Map<string, number>();

  for (const entry of byCourse) {
    totals.set(
      entry.moduleLabel,
      (totals.get(entry.moduleLabel) ?? 0) + entry.totalSeconds,
    );
  }

  return [...totals.entries()]
    .map(([moduleLabel, totalSeconds]) => ({ moduleLabel, totalSeconds }))
    .sort((a, b) => b.totalSeconds - a.totalSeconds);
}

export function aggregateStudyTimeByModule(
  events: ActivityEvent[],
  resolveCourseTitle: (slug: string) => string,
): ModuleStudyTime[] {
  const measured = new Map<string, number>();
  const clusterEvents = new Map<string, ActivityEvent[]>();
  const hasMeasured = new Set<string>();

  for (const event of events) {
    const context = moduleContext(event);
    if (!context) continue;

    const key = groupKey(context.moduleLabel, context.courseSlug);

    if (isTimeSpentEvent(event)) {
      const seconds = event.metadata?.durationSeconds as number;
      measured.set(key, (measured.get(key) ?? 0) + seconds);
      hasMeasured.add(key);
      continue;
    }

    const bucket = clusterEvents.get(key) ?? [];
    bucket.push(event);
    clusterEvents.set(key, bucket);
  }

  const totals = new Map<string, ModuleStudyTime>();

  for (const [key, seconds] of measured) {
    const [moduleLabel, courseSlug] = key.split("::");
    totals.set(key, {
      moduleLabel,
      courseSlug,
      courseTitle: resolveCourseTitle(courseSlug),
      totalSeconds: seconds,
    });
  }

  for (const [key, bucket] of clusterEvents) {
    if (hasMeasured.has(key)) continue;
    const estimated = estimateSecondsFromClusters(bucket);
    if (estimated <= 0) continue;

    const [moduleLabel, courseSlug] = key.split("::");
    totals.set(key, {
      moduleLabel,
      courseSlug,
      courseTitle: resolveCourseTitle(courseSlug),
      totalSeconds: estimated,
    });
  }

  return [...totals.values()].sort((a, b) => b.totalSeconds - a.totalSeconds);
}
