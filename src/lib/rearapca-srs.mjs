export const SPACED_REPETITION_INTERVALS = [
  { label: "30 dakika", milliseconds: 30 * 60 * 1000 },
  { label: "1 gün", milliseconds: 1 * 24 * 60 * 60 * 1000 },
  { label: "3 gün", milliseconds: 3 * 24 * 60 * 60 * 1000 },
  { label: "7 gün", milliseconds: 7 * 24 * 60 * 60 * 1000 },
  { label: "21 gün", milliseconds: 21 * 24 * 60 * 60 * 1000 },
  { label: "60 gün", milliseconds: 60 * 24 * 60 * 60 * 1000 },
];

export const DEFAULT_REARAPCA_DAILY_GOAL = 15;
export const MASTERED_STAGE = 6;

const ARABIC_RE = /[\u0600-\u06FF\u0750-\u077F]/g;

function iso(date) {
  return date.toISOString();
}

export function addInterval(date, intervalIndex) {
  const interval = SPACED_REPETITION_INTERVALS[intervalIndex];
  if (!interval) return null;
  return new Date(date.getTime() + interval.milliseconds);
}

export function normalizeAnswer(text) {
  return text
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/[.,?!;:،؛؟()[\]{}"“”'’`´]/g, "")
    .replace(/\s+/g, " ");
}

export function getAcceptableAnswers(back) {
  const answers = new Set();

  const add = (raw) => {
    const cleaned = raw.replace(ARABIC_RE, "").trim();
    if (!cleaned) return;
    const normalized = normalizeAnswer(cleaned);
    if (normalized.length >= 1) answers.add(normalized);
  };

  for (const match of back.matchAll(/\(([^)]+)\)/g)) {
    match[1].split(/[\/,،]/g).forEach((part) => add(part));
  }

  back
    .replace(/\([^)]*\)/g, "")
    .split(/[\/,،]/g)
    .forEach((segment) => add(segment));

  if (answers.size === 0) add(back.replace(ARABIC_RE, ""));

  return [...answers];
}

export function formatAnswer(back) {
  return getAcceptableAnswers(back).join(", ");
}

export function isAnswerCorrect(input, back) {
  const normalized = normalizeAnswer(input);
  if (!normalized) return false;
  return getAcceptableAnswers(back).some((answer) => answer === normalized);
}

export function createInitialProgress(now) {
  const nextReview = addInterval(now, 0);
  return {
    status: "learning",
    review_stage: 0,
    next_review_at: nextReview ? iso(nextReview) : null,
    first_learned_at: iso(now),
    last_reviewed_at: iso(now),
    correct_count_delta: 1,
    incorrect_count_delta: 0,
    mastered: false,
    firstLearned: true,
    reviewCompleted: false,
  };
}

/** Tanıtımı görüldü, öğrenme moduna alındı; henüz ilk “Öğrendim” yok. */
export function createDeferredLearningProgress(now) {
  return {
    status: "learning",
    review_stage: 0,
    next_review_at: null,
    first_learned_at: null,
    last_reviewed_at: iso(now),
    correct_count_delta: 0,
    incorrect_count_delta: 0,
    mastered: false,
    firstLearned: false,
    reviewCompleted: false,
  };
}

/** İlk tanıtımda zaten bilinen kelime: tekrar kuyruğuna girmez. */
export function createAlreadyKnownProgress(now) {
  return {
    status: "mastered",
    review_stage: MASTERED_STAGE,
    next_review_at: null,
    first_learned_at: null,
    last_reviewed_at: iso(now),
    correct_count_delta: 0,
    incorrect_count_delta: 0,
    mastered: true,
    firstLearned: false,
    reviewCompleted: false,
    skipped: true,
  };
}

export function advanceSuccessfulReview(progress, now) {
  if (progress.status === "mastered" || progress.review_stage >= MASTERED_STAGE) {
    return {
      status: "mastered",
      review_stage: MASTERED_STAGE,
      next_review_at: null,
      first_learned_at: progress.first_learned_at ?? null,
      last_reviewed_at: iso(now),
      correct_count_delta: 1,
      incorrect_count_delta: 0,
      mastered: true,
      firstLearned: false,
      reviewCompleted: false,
    };
  }

  const nextStage = Math.min(progress.review_stage + 1, MASTERED_STAGE);
  const mastered = nextStage >= MASTERED_STAGE;
  const nextReview = mastered ? null : addInterval(now, nextStage);

  return {
    status: mastered ? "mastered" : "learning",
    review_stage: nextStage,
    next_review_at: nextReview ? iso(nextReview) : null,
    first_learned_at: progress.first_learned_at ?? null,
    last_reviewed_at: iso(now),
    correct_count_delta: 1,
    incorrect_count_delta: 0,
    mastered,
    firstLearned: false,
    reviewCompleted: true,
  };
}

export function recordIncorrectReview(progress, now) {
  return {
    status: progress?.status ?? "learning",
    review_stage: progress?.review_stage ?? 0,
    next_review_at: progress?.next_review_at ?? null,
    first_learned_at: progress?.first_learned_at ?? null,
    last_reviewed_at: iso(now),
    correct_count_delta: 0,
    incorrect_count_delta: 1,
    mastered: false,
    firstLearned: false,
    reviewCompleted: false,
  };
}

export function isProgressDue(progress, now) {
  if (!progress || progress.status === "mastered" || !progress.next_review_at) {
    return false;
  }
  return new Date(progress.next_review_at).getTime() <= now.getTime();
}

export function isNewWord(progress) {
  return !progress || !["learning", "mastered"].includes(progress.status);
}

export function isContinuingIntro(progress) {
  return (
    progress?.status === "learning" && progress.first_learned_at === null
  );
}

export function buildSessionQueue({
  pool,
  progresses,
  mode,
  now,
  dailyGoal = DEFAULT_REARAPCA_DAILY_GOAL,
}) {
  const progressMap = new Map(progresses.map((progress) => [progress.word_id, progress]));
  const due = [];
  const continuing = [];
  const fresh = [];

  for (const word of pool) {
    const progress = progressMap.get(word.key);
    if (isProgressDue(progress, now)) {
      due.push({ ...word, sessionKind: "review", progress });
      continue;
    }
    if (isContinuingIntro(progress)) {
      continuing.push({ ...word, sessionKind: "new", progress });
      continue;
    }
    if (isNewWord(progress)) {
      fresh.push({ ...word, sessionKind: "new", progress: null });
    }
  }

  const newWords = [...continuing, ...fresh];

  if (mode === "review") return due;
  if (mode === "new") return newWords.slice(0, dailyGoal);

  const selectedFresh = newWords.slice(0, dailyGoal);
  return interleaveQueues(due, selectedFresh);
}

export function interleaveQueues(reviewWords, newWords) {
  const result = [];
  let reviewIndex = 0;
  let newIndex = 0;

  while (reviewIndex < reviewWords.length || newIndex < newWords.length) {
    for (let i = 0; i < 2 && reviewIndex < reviewWords.length; i += 1) {
      result.push(reviewWords[reviewIndex]);
      reviewIndex += 1;
    }
    if (newIndex < newWords.length) {
      result.push(newWords[newIndex]);
      newIndex += 1;
    }
  }

  return result;
}

export function requeueWord(queue, word, gap = 3) {
  const targetId = word.key ?? word.id;
  const rest = queue.filter((entry) => (entry.key ?? entry.id) !== targetId);
  const position = Math.min(Math.max(gap, 1), rest.length);
  return [...rest.slice(0, position), word, ...rest.slice(position)];
}

export function wordProgressKey(userId, wordId) {
  return `${userId}:${wordId}`;
}
