import type { LearnWordEntry } from "@/lib/rearapca-learn";
import { formatTurkishMeanings } from "@/lib/rearapca-learn";
import type { RearapcaProgressSnapshot } from "@/lib/rearapca-progress-events";
import { isProgressDue } from "@/lib/rearapca-srs.mjs";

export type BrowseWordStatus =
  | "new"
  | "learning"
  | "due"
  | "mastered"
  | "already_known";

export const BROWSE_STATUS_META: Record<
  BrowseWordStatus,
  { label: string; color: string }
> = {
  new: { label: "Yeni", color: "#d1d5db" },
  learning: { label: "Öğreniliyor", color: "#f9a8d4" },
  due: { label: "Tekrar bekleyen", color: "#fdba74" },
  mastered: { label: "Ezberlenen", color: "#4ade80" },
  already_known: { label: "Önceden bilinen", color: "#9ca3af" },
};

export interface BrowseFlashcardWord {
  id: string;
  courseSlug: string;
  courseTitleAr: string;
  lessonTitleTr: string;
  front: string;
  back: string;
  answerText: string;
  frontDir: "ltr" | "rtl";
  browseStatus: BrowseWordStatus;
}

export function getWordBrowseStatuses(
  progress: RearapcaProgressSnapshot | null | undefined,
  now: Date,
): Set<BrowseWordStatus> {
  const statuses = new Set<BrowseWordStatus>();

  if (!progress) {
    statuses.add("new");
    return statuses;
  }

  if (progress.status === "mastered" && !progress.first_learned_at) {
    statuses.add("already_known");
    return statuses;
  }

  if (progress.status === "mastered") {
    statuses.add("mastered");
    return statuses;
  }

  if (progress.status === "learning") {
    statuses.add("learning");
    if (isProgressDue(progress, now)) {
      statuses.add("due");
    }
  }

  return statuses;
}

export function getPrimaryBrowseStatus(
  progress: RearapcaProgressSnapshot | null | undefined,
  now: Date,
): BrowseWordStatus {
  const priority: BrowseWordStatus[] = [
    "due",
    "learning",
    "new",
    "mastered",
    "already_known",
  ];
  const statuses = getWordBrowseStatuses(progress, now);
  for (const status of priority) {
    if (statuses.has(status)) return status;
  }
  return "new";
}

export function buildBrowseWordList({
  pool,
  progresses,
  filters,
  now,
}: {
  pool: LearnWordEntry[];
  progresses: RearapcaProgressSnapshot[];
  filters: Iterable<BrowseWordStatus>;
  now: Date;
}): BrowseFlashcardWord[] {
  const filterSet = new Set(filters);
  const progressMap = new Map(
    progresses.map((progress) => [progress.word_id, progress]),
  );

  return pool
    .filter((word) => {
      const progress = progressMap.get(word.key) ?? null;
      return [...getWordBrowseStatuses(progress, now)].some((status) =>
        filterSet.has(status),
      );
    })
    .map((word) => {
      const progress = progressMap.get(word.key) ?? null;
      return {
        id: word.key,
        courseSlug: word.courseSlug,
        courseTitleAr: word.courseTitleAr,
        lessonTitleTr: word.lessonTitleTr,
        front: word.front,
        back: word.back,
        answerText: formatTurkishMeanings(word.back),
        frontDir: word.frontDir,
        browseStatus: getPrimaryBrowseStatus(progress, now),
      };
    });
}
