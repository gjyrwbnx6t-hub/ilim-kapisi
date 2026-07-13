import { courses } from "@/data/courses";
import type { ActivityEvent } from "@/lib/supabase/types";
import { getVocabulary } from "@/lib/content";
import { getProgressedWordIds } from "@/lib/rearapca-progress-events";
import { getRearapcaWordPool } from "@/lib/rearapca-data";

export interface CourseProgressStat {
  courseSlug: string;
  totalWords: number;
  /** Bilinen + öğrenme aşamasındaki (1. aşama dahil) kelimeler */
  knownWords: number;
  percent: number;
}

export function buildCourseProgressStats(
  events: ActivityEvent[],
): CourseProgressStat[] {
  const progressedIds = getProgressedWordIds(events);

  const stats: CourseProgressStat[] = [];

  for (const course of courses) {
    const set = getVocabulary(course.contentSlug);
    if (!set) continue;

    const pool = getRearapcaWordPool([course.slug]);
    const totalWords = pool.length;
    if (totalWords === 0) continue;

    const knownWords = pool.filter((word) => progressedIds.has(word.key)).length;
    const percent = Math.round((knownWords / totalWords) * 100);

    stats.push({
      courseSlug: course.slug,
      totalWords,
      knownWords,
      percent,
    });
  }

  return stats;
}
