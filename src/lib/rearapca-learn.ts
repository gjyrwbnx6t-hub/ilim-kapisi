import type { VocabularySet } from "@/lib/types";
import {
  formatAnswer,
  getAcceptableAnswers as getSrsAcceptableAnswers,
  isAnswerCorrect,
} from "@/lib/rearapca-srs.mjs";

/** Arka yüzdeki kabul edilebilir Türkçe cevapları çıkarır. */
export function getAcceptableAnswers(back: string): string[] {
  return getSrsAcceptableAnswers(back);
}

export function formatTurkishMeanings(back: string): string {
  return formatAnswer(back);
}

export interface RearapcaReadySet {
  courseSlug: string;
  courseTitleAr: string;
  titleTr: string;
  frontDir: "ltr" | "rtl";
  units: VocabularySet["units"];
}

export interface LearnWordEntry {
  key: string;
  courseSlug: string;
  courseTitleAr: string;
  lessonTitleTr: string;
  front: string;
  back: string;
  frontDir: "ltr" | "rtl";
}

export function buildLearnWordPool(sets: RearapcaReadySet[]): LearnWordEntry[] {
  const pool: LearnWordEntry[] = [];

  for (const set of sets) {
    for (const unit of set.units) {
      for (const word of unit.words) {
        pool.push({
          key: `${set.courseSlug}:${unit.id}:${word.front}`,
          courseSlug: set.courseSlug,
          courseTitleAr: set.courseTitleAr,
          lessonTitleTr: set.titleTr,
          front: word.front,
          back: word.back,
          frontDir: set.frontDir,
        });
      }
    }
  }

  return pool;
}

export function isTurkishAnswerCorrect(input: string, back: string): boolean {
  return isAnswerCorrect(input, back);
}

export const MULTIPLE_CHOICE_OPTION_COUNT = 4;

export function buildMultipleChoiceOptions({
  correctAnswer,
  sessionAnswers = [],
  distractorPool = [],
  count = MULTIPLE_CHOICE_OPTION_COUNT,
}: {
  correctAnswer: string;
  sessionAnswers?: string[];
  distractorPool?: string[];
  count?: number;
}): string[] {
  const options = new Set<string>();
  if (correctAnswer.trim()) options.add(correctAnswer);

  const candidates = [
    ...sessionAnswers.filter((answer) => answer && answer !== correctAnswer),
    ...distractorPool.filter((answer) => answer && answer !== correctAnswer),
  ];

  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  for (const answer of shuffled) {
    options.add(answer);
    if (options.size >= count) break;
  }

  return [...options].sort(() => Math.random() - 0.5);
}
