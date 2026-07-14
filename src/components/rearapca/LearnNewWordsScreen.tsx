"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  Grid2x2,
  Keyboard,
  MoreHorizontal,
  RotateCcw,
} from "lucide-react";
import { SpeakButton } from "@/components/course/VocabularySpeak";
import { requeueWord } from "@/lib/rearapca-srs.mjs";
import {
  buildMultipleChoiceOptions,
  isTurkishAnswerCorrect,
} from "@/lib/rearapca-learn";

export type LearnMode = "new" | "review" | "mixed";

type CardStep = "intake" | "choose" | "type" | "reveal" | "multiple";

interface SessionWord {
  id: string;
  courseSlug: string;
  courseTitleAr: string;
  lessonTitleTr: string;
  front: string;
  back: string;
  answerText: string;
  frontDir: "ltr" | "rtl";
  sessionKind: "new" | "review";
  reviewStage: number | null;
  nextReviewAt: string | null;
}

interface SessionStats {
  learnedToday: number;
  reviewedToday: number;
  dueCount: number;
  masteredCount: number;
  totalProgress: number;
}

interface SessionResponse {
  dailyGoal: number;
  stats: SessionStats;
  words: SessionWord[];
  distractorAnswers?: string[];
  error?: string;
}

interface ReviewResponse {
  correct: boolean;
  firstLearned?: boolean;
  mastered?: boolean;
  skipped?: boolean;
  started?: boolean;
  answerText: string;
  requeue?: boolean;
  error?: string;
}

interface LearnNewWordsScreenProps {
  initialMode?: LearnMode;
  reviewCount?: number;
  dailyGoal: number;
  selectedCourseSlugs?: string[];
  initialStats?: SessionStats;
  onBack: () => void;
  onStatsChange?: (stats: SessionStats) => void;
}

const EMPTY_STATS: SessionStats = {
  learnedToday: 0,
  reviewedToday: 0,
  dueCount: 0,
  masteredCount: 0,
  totalProgress: 0,
};

const PROGRESS_SEGMENTS = 10;
const LEARN_DEFER_GAP = 3;
const SWIPE_THRESHOLD_PX = 72;
const SWIPE_EXIT_OFFSET_PX = 520;
const SWIPE_ANIM_MS = 360;

function localDayBounds() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return {
    dayStartUtc: start.toISOString(),
    dayEndUtc: end.toISOString(),
  };
}

function ProgressSegments({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  const filled = total > 0 ? Math.ceil((current / total) * PROGRESS_SEGMENTS) : 0;

  return (
    <div className="flex gap-1">
      {Array.from({ length: PROGRESS_SEGMENTS }, (_, index) => (
        <span
          key={index}
          className={`h-1.5 flex-1 rounded-full transition-colors ${
            index < filled ? "bg-primary" : "bg-slate-200"
          }`}
        />
      ))}
    </div>
  );
}

function ModeChoiceButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Keyboard;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex aspect-square flex-1 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 transition-colors hover:bg-slate-200 hover:text-primary"
    >
      <Icon className="h-7 w-7" strokeWidth={1.8} />
    </button>
  );
}

function stageLabel(word: SessionWord, cardStep: CardStep) {
  if (word.sessionKind === "review" && word.reviewStage !== null) {
    return `${Math.min(word.reviewStage + 1, 6)}. tekrar`;
  }
  if (word.sessionKind === "new" && word.reviewStage !== null) {
    return "Öğreniliyor";
  }
  if (cardStep !== "intake") {
    return "Öğreniliyor";
  }
  return "Yeni kelime";
}

function isWordInLearningPhase(
  word: SessionWord,
  pendingLearningIds: Set<string>,
): boolean {
  return (
    word.sessionKind === "new" &&
    (pendingLearningIds.has(word.id) || word.reviewStage !== null)
  );
}

function modeLabel(mode: LearnMode) {
  if (mode === "review") return "Tekrar et";
  if (mode === "mixed") return "Karışık mod";
  return "Yeni kelime öğren";
}

function getHintTarget(answerText: string): string {
  const firstMeaning = answerText.split(",")[0]?.trim();
  return firstMeaning || answerText.trim();
}

export default function LearnNewWordsScreen({
  initialMode = "new",
  reviewCount = 0,
  dailyGoal,
  selectedCourseSlugs = [],
  initialStats,
  onBack,
  onStatsChange,
}: LearnNewWordsScreenProps) {
  const [mode, setMode] = useState<LearnMode>(initialMode);
  const [queue, setQueue] = useState<SessionWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cardStep, setCardStep] = useState<CardStep>("choose");
  const [answer, setAnswer] = useState("");
  const [dayStats, setDayStats] = useState<SessionStats>(
    initialStats ?? EMPTY_STATS,
  );
  const [reviewedThisSession, setReviewedThisSession] = useState(0);
  const [history, setHistory] = useState<SessionWord[]>([]);
  const [pendingLearningIds, setPendingLearningIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [distractorAnswers, setDistractorAnswers] = useState<string[]>([]);
  const [hintLettersRevealed, setHintLettersRevealed] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const dragStartXRef = useRef(0);
  const activePointerRef = useRef<number | null>(null);
  const processingWordIdsRef = useRef<Set<string>>(new Set());

  const current = queue[0] ?? null;
  const hintTarget = current ? getHintTarget(current.answerText) : "";
  const isInLearningPhase = current
    ? isWordInLearningPhase(current, pendingLearningIds)
    : false;

  const loadSession = useCallback(
    async (nextMode = mode) => {
      setLoading(true);
      setError(null);
      setCardStep("choose");
      setAnswer("");
      setHistory([]);
      setReviewedThisSession(0);
      setPendingLearningIds(new Set());
      setDistractorAnswers([]);
      setHintLettersRevealed(0);

      const response = await fetch("/api/rearapca/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: nextMode,
          dailyGoal,
          courseSlugs: selectedCourseSlugs,
          ...localDayBounds(),
        }),
      });

      const payload = (await response.json()) as SessionResponse;

      if (!response.ok) {
        setError(payload.error ?? "Oturum yüklenemedi.");
        setQueue([]);
        setLoading(false);
        return;
      }

      setQueue(payload.words);
      setDistractorAnswers(payload.distractorAnswers ?? []);
      setDayStats(payload.stats);
      onStatsChange?.(payload.stats);
      setLoading(false);
    },
    [dailyGoal, mode, onStatsChange, selectedCourseSlugs],
  );

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    void loadSession(mode);
  }, [loadSession, mode]);

  useEffect(() => {
    if (!current) return;
    if (current.sessionKind === "review") {
      setCardStep("choose");
    } else if (isWordInLearningPhase(current, pendingLearningIds)) {
      setCardStep("choose");
    } else {
      setCardStep("intake");
    }
    setAnswer("");
    setHintLettersRevealed(0);
    setDragX(0);
    setDragging(false);
    setIsExiting(false);
  }, [current, pendingLearningIds]);

  const revealNextHintLetter = useCallback(() => {
    if (!hintTarget) return;
    setHintLettersRevealed((count) => {
      const next = Math.min(count + 1, hintTarget.length);
      setAnswer(hintTarget.slice(0, next));
      return next;
    });
  }, [hintTarget]);

  const deferLearning = useCallback(async (word: SessionWord) => {
    setPendingLearningIds((ids) => new Set(ids).add(word.id));
    setQueue((items) => requeueWord(items, word, LEARN_DEFER_GAP));
    setAnswer("");
    setCardStep("choose");

    try {
      const response = await fetch("/api/rearapca/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wordId: word.id,
          action: "start_learning",
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as ReviewResponse;
        setError(payload.error ?? "Öğrenme başlatılamadı.");
      }
    } catch {
      // Giriş yoksa yalnızca bu oturumda pendingLearningIds ile sürer.
    }
  }, []);

  const choiceOptions = useMemo(() => {
    if (!current || cardStep !== "multiple") return [];
    return buildMultipleChoiceOptions({
      correctAnswer: current.answerText,
      sessionAnswers: queue
        .filter((word) => word.id !== current.id)
        .map((word) => word.answerText),
      distractorPool: distractorAnswers,
    });
  }, [cardStep, current, queue, distractorAnswers]);

  const removeCurrent = useCallback(
    (word: SessionWord) => {
      setQueue((items) => items.filter((item) => item.id !== word.id));
      setHistory((items) => [...items, word]);
      setPendingLearningIds((ids) => {
        const next = new Set(ids);
        next.delete(word.id);
        return next;
      });
      setCardStep("intake");
      setAnswer("");
    },
    [],
  );

  const requeueCurrent = useCallback((word: SessionWord) => {
    setQueue((items) => requeueWord(items, word, 3));
    setCardStep(
      word.sessionKind === "review" ||
      isWordInLearningPhase(word, pendingLearningIds)
        ? "choose"
        : "intake",
    );
    setAnswer("");
  }, [pendingLearningIds]);

  const bumpDayStats = useCallback(
    (kind: "learned" | "reviewed") => {
      setDayStats((prev) => {
        const next =
          kind === "learned"
            ? { ...prev, learnedToday: prev.learnedToday + 1 }
            : { ...prev, reviewedToday: prev.reviewedToday + 1 };
        onStatsChange?.(next);
        return next;
      });
    },
    [onStatsChange],
  );

  const rollbackDayStats = useCallback(
    (kind: "learned" | "reviewed") => {
      setDayStats((prev) => {
        const next =
          kind === "learned"
            ? { ...prev, learnedToday: Math.max(0, prev.learnedToday - 1) }
            : { ...prev, reviewedToday: Math.max(0, prev.reviewedToday - 1) };
        onStatsChange?.(next);
        return next;
      });
      if (kind === "reviewed") {
        setReviewedThisSession((count) => Math.max(0, count - 1));
      }
    },
    [onStatsChange],
  );

  const restoreOptimisticRemoval = useCallback(
    (word: SessionWord, wasPendingLearning: boolean) => {
      setQueue((items) =>
        items.some((item) => item.id === word.id) ? items : [word, ...items],
      );
      setHistory((items) => items.filter((item) => item.id !== word.id));
      setPendingLearningIds((ids) => {
        const next = new Set(ids);
        if (wasPendingLearning) next.add(word.id);
        return next;
      });
    },
    [],
  );

  const optimisticResultFor = useCallback(
    (
      action: "answer" | "know" | "unknown" | "already_known",
      word: SessionWord,
      value: string,
    ): { correct: boolean; statKind: "learned" | "reviewed" | null } => {
      const correct =
        action === "unknown"
          ? false
          : action === "answer"
            ? isTurkishAnswerCorrect(value, word.answerText)
            : true;

      if (!correct || action === "already_known") {
        return { correct, statKind: null };
      }

      return {
        correct: true,
        statKind: word.sessionKind === "review" ? "reviewed" : "learned",
      };
    },
    [],
  );

  const submitAction = useCallback(
    async (
      action: "answer" | "know" | "unknown" | "already_known",
      word: SessionWord,
      value = "",
    ) => {
      if (processingWordIdsRef.current.has(word.id)) return;
      processingWordIdsRef.current.add(word.id);

      setError(null);
      const wasPendingLearning = pendingLearningIds.has(word.id);
      const optimistic = optimisticResultFor(action, word, value);

      if (optimistic.correct) {
        removeCurrent(word);
        if (optimistic.statKind) {
          bumpDayStats(optimistic.statKind);
          if (optimistic.statKind === "reviewed") {
            setReviewedThisSession((count) => count + 1);
          }
        }
      } else {
        requeueCurrent(word);
      }

      let payload: ReviewResponse | null = null;

      try {
        const response = await fetch("/api/rearapca/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            wordId: word.id,
            action,
            answer: value,
          }),
        });

        payload = (await response.json()) as ReviewResponse;

        if (!response.ok) {
          if (optimistic.correct) {
            restoreOptimisticRemoval(word, wasPendingLearning);
            if (optimistic.statKind) rollbackDayStats(optimistic.statKind);
          }
          setError(payload.error ?? "İlerleme kaydedilemedi.");
          return;
        }
      } catch {
        if (optimistic.correct) {
          restoreOptimisticRemoval(word, wasPendingLearning);
          if (optimistic.statKind) rollbackDayStats(optimistic.statKind);
        }
        setError("İlerleme kaydedilemedi. Bağlantıyı kontrol edip tekrar deneyin.");
        return;
      } finally {
        processingWordIdsRef.current.delete(word.id);
      }

      if (!payload) {
        return;
      }

      if (payload.correct && !optimistic.correct) {
        removeCurrent(word);
        if (payload.skipped) {
          return;
        }
        if (payload.firstLearned) {
          bumpDayStats("learned");
        } else {
          bumpDayStats("reviewed");
          setReviewedThisSession((count) => count + 1);
        }
        return;
      }

      if (!payload.correct && optimistic.correct) {
        restoreOptimisticRemoval(word, wasPendingLearning);
        if (optimistic.statKind) rollbackDayStats(optimistic.statKind);
        requeueCurrent(word);
      }
    },
    [
      bumpDayStats,
      optimisticResultFor,
      pendingLearningIds,
      removeCurrent,
      requeueCurrent,
      restoreOptimisticRemoval,
      rollbackDayStats,
    ],
  );

  const getSwipeOutcome = useCallback(
    (direction: "left" | "right") => {
      if (!current || isExiting) return null;

      if (current.sessionKind === "review") {
        return {
          kind: "submit" as const,
          action: direction === "left" ? ("know" as const) : ("unknown" as const),
        };
      }

      if (isInLearningPhase) {
        return {
          kind: "submit" as const,
          action: direction === "left" ? ("know" as const) : ("unknown" as const),
        };
      }

      if (current.sessionKind === "new" && cardStep === "intake") {
        return direction === "left"
          ? { kind: "submit" as const, action: "already_known" as const }
          : { kind: "defer" as const };
      }

      return null;
    },
    [cardStep, current, isInLearningPhase, isExiting],
  );

  const executeSwipeOutcome = useCallback(
    (
      outcome: NonNullable<ReturnType<typeof getSwipeOutcome>>,
      word: SessionWord,
    ) => {
      if (outcome.kind === "defer") {
        void deferLearning(word);
        return;
      }
      void submitAction(outcome.action, word);
    },
    [deferLearning, submitAction],
  );

  const completeSwipe = useCallback(
    (direction: "left" | "right") => {
      const outcome = getSwipeOutcome(direction);
      if (!outcome || !current) {
        setDragX(0);
        return;
      }

      const word = current;
      setDragging(false);
      setIsExiting(true);
      setDragX(direction === "left" ? -SWIPE_EXIT_OFFSET_PX : SWIPE_EXIT_OFFSET_PX);

      window.setTimeout(() => {
        executeSwipeOutcome(outcome, word);
        setDragX(0);
        setIsExiting(false);
      }, SWIPE_ANIM_MS);
    },
    [current, executeSwipeOutcome, getSwipeOutcome],
  );

  const handleCardPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (isExiting) return;
      if ((event.target as HTMLElement).closest("input, button, a, textarea")) {
        return;
      }
      activePointerRef.current = event.pointerId;
      dragStartXRef.current = event.clientX;
      setDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [isExiting],
  );

  const handleCardPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!dragging || activePointerRef.current !== event.pointerId || isExiting) {
        return;
      }
      setDragX(event.clientX - dragStartXRef.current);
    },
    [dragging, isExiting],
  );

  const handleCardPointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (activePointerRef.current !== event.pointerId) return;
      activePointerRef.current = null;
      setDragging(false);

      if (dragX <= -SWIPE_THRESHOLD_PX) {
        completeSwipe("left");
        return;
      }
      if (dragX >= SWIPE_THRESHOLD_PX) {
        completeSwipe("right");
        return;
      }
      setDragX(0);
    },
    [completeSwipe, dragX],
  );

  const handleCardPointerCancel = useCallback(() => {
    activePointerRef.current = null;
    setDragging(false);
    if (!isExiting) setDragX(0);
  }, [isExiting]);

  const greenSwipeOpacity = dragX < 0 ? Math.min(0.55, -dragX / 140) : 0;
  const redSwipeOpacity = dragX > 0 ? Math.min(0.55, dragX / 140) : 0;

  const undo = useCallback(() => {
    const last = history[history.length - 1];
    if (!last) return;
    setHistory((items) => items.slice(0, -1));
    setQueue((items) => [last, ...items]);
    if (last.sessionKind === "new") {
      setDayStats((prev) => {
        const next = {
          ...prev,
          learnedToday: Math.max(0, prev.learnedToday - 1),
        };
        onStatsChange?.(next);
        return next;
      });
    } else {
      setReviewedThisSession((count) => Math.max(0, count - 1));
      setDayStats((prev) => {
        const next = {
          ...prev,
          reviewedToday: Math.max(0, prev.reviewedToday - 1),
        };
        onStatsChange?.(next);
        return next;
      });
    }
  }, [history, onStatsChange]);

  const totalForProgress =
    mode === "review" ? Math.max(queue.length + reviewedThisSession, 1) : dailyGoal;
  const currentProgress =
    mode === "review" ? reviewedThisSession : dayStats.learnedToday;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-full text-slate-700 hover:bg-white/70"
          aria-label="Geri"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="flex flex-1 justify-center">
          <div className="flex gap-1 rounded-full bg-[#d8d8de] p-1">
            {(["new", "review", "mixed"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setMode(item)}
                className={`relative rounded-full px-3 py-2 text-xs font-semibold transition-colors sm:px-4 sm:text-sm ${
                  mode === item
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600"
                }`}
              >
                {modeLabel(item)}
                {item === "review" && reviewCount > 0 && (
                  <span className="absolute -right-1 -top-1 rounded-full bg-gold px-1.5 py-0.5 text-[10px] font-bold text-ink">
                    {reviewCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={undo}
          disabled={history.length === 0}
          className="flex h-10 w-10 items-center justify-center rounded-full text-slate-700 hover:bg-white/70 disabled:opacity-30"
          aria-label="Geri al"
        >
          <RotateCcw className="h-5 w-5" />
        </button>
      </div>

      <div className="px-1">
        <p className="text-sm font-medium text-slate-500">
          {mode === "review"
            ? `${dayStats.reviewedToday} kelime tekrar edildi`
            : `${dayStats.learnedToday} yeni kelime öğrenildi`}
        </p>
        <div className="mt-2">
          <ProgressSegments current={currentProgress} total={totalForProgress} />
        </div>
      </div>

      {loading && (
        <div className="rounded-2xl bg-white px-5 py-12 text-center text-sm font-semibold text-slate-500 shadow-sm">
          Kelimeler hazırlanıyor...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl bg-white px-5 py-10 text-center shadow-sm">
          <p className="text-sm font-semibold text-red-500">{error}</p>
          <button
            type="button"
            onClick={() => void loadSession(mode)}
            className="mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white"
          >
            Tekrar dene
          </button>
        </div>
      )}

      {!loading && !error && !current && (
        <div className="rounded-2xl bg-white px-5 py-12 text-center shadow-sm">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
          <p className="mt-4 text-lg font-bold text-slate-900">
            {mode === "review"
              ? "Şu an tekrar bekleyen kelime yok"
              : "Oturum tamamlandı"}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Yeni kelime arşivleri veya zamanı gelen tekrarlar burada görünecek.
          </p>
        </div>
      )}

      {!loading && !error && current && (
        <>
          <div className="overflow-hidden rounded-2xl shadow-sm [perspective:1200px]">
            <div
              className={`relative bg-white ${
                dragging || isExiting ? "cursor-grabbing" : "cursor-grab"
              }`}
              style={{
                transform: `translateX(${dragX}px) rotate(${dragX * 0.05}deg)`,
                transition: dragging ? "none" : "transform 0.35s ease, opacity 0.35s ease",
                opacity: isExiting ? 0.35 : 1,
              }}
              onPointerDown={handleCardPointerDown}
              onPointerMove={handleCardPointerMove}
              onPointerUp={handleCardPointerUp}
              onPointerCancel={handleCardPointerCancel}
            >
              <div
                className="pointer-events-none absolute inset-0 z-10 bg-emerald-500"
                style={{ opacity: greenSwipeOpacity }}
                aria-hidden
              />
              <div
                className="pointer-events-none absolute inset-0 z-10 bg-red-500"
                style={{ opacity: redSwipeOpacity }}
                aria-hidden
              />

            <div className="relative z-20 flex items-center justify-between border-b border-slate-100 px-5 py-3">
              <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <span
                  className={`h-2.5 w-2.5 rounded-sm ${
                    current.sessionKind === "review" ? "bg-gold" : "bg-primary"
                  }`}
                />
                {stageLabel(current, cardStep)}
              </span>
              <button type="button" className="text-slate-400" aria-label="Seçenekler">
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </div>

            <div className="relative z-20 min-h-[560px] touch-none px-5 py-8 select-none">
              <p className="line-clamp-2 text-sm font-medium text-slate-400">
                {current.lessonTitleTr}
              </p>
              <div
                className={`mt-3 flex items-start gap-3 ${
                  current.frontDir === "rtl" ? "justify-end" : ""
                }`}
              >
                {current.frontDir === "rtl" && (
                  <div className="pointer-events-auto shrink-0 pt-1">
                    <SpeakButton
                      text={current.front}
                      frontDir={current.frontDir}
                      stopPropagation
                    />
                  </div>
                )}
                <h2
                  dir={current.frontDir}
                  className={`min-w-0 text-3xl font-bold leading-snug text-slate-900 ${
                    current.frontDir === "rtl" ? "text-right font-arabic" : ""
                  }`}
                >
                  {current.front}
                </h2>
                {current.frontDir === "ltr" && (
                  <div className="pointer-events-auto shrink-0 pt-1">
                    <SpeakButton
                      text={current.front}
                      frontDir={current.frontDir}
                      stopPropagation
                    />
                  </div>
                )}
              </div>

              {cardStep === "intake" && current.sessionKind === "new" && (
                <div className="mt-14 flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => setCardStep("reveal")}
                    className="flex aspect-square w-full max-w-56 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 transition-colors hover:bg-slate-200 hover:text-primary"
                    aria-label="Anlamı göster"
                  >
                    <Eye className="h-7 w-7" strokeWidth={1.8} />
                  </button>
                </div>
              )}

              {cardStep === "choose" && (
                <div className="mt-14 grid grid-cols-3 gap-3">
                  <ModeChoiceButton
                    icon={Keyboard}
                    label="Cevabı yaz"
                    onClick={() => setCardStep("type")}
                  />
                  <ModeChoiceButton
                    icon={Eye}
                    label="Cevabı gör"
                    onClick={() => setCardStep("reveal")}
                  />
                  <ModeChoiceButton
                    icon={Grid2x2}
                    label="Çoktan seçmeli"
                    onClick={() => setCardStep("multiple")}
                  />
                </div>
              )}

              {cardStep === "type" && (
                <div className="mt-12">
                  <input
                    type="text"
                    value={answer}
                    onChange={(event) => setAnswer(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && current && answer.trim()) {
                        void submitAction("answer", current, answer);
                      }
                    }}
                    placeholder="Cevabı yazın"
                    className="w-full border-b-2 border-slate-200 bg-transparent py-3 text-lg outline-none transition-colors placeholder:text-slate-300 focus:border-primary"
                    autoFocus
                  />
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setHintLettersRevealed(0);
                        setAnswer("");
                        setCardStep("choose");
                      }}
                      className="font-semibold text-slate-500"
                    >
                      Geri
                    </button>
                    <button
                      type="button"
                      onClick={revealNextHintLetter}
                      disabled={hintLettersRevealed >= hintTarget.length}
                      className="font-semibold text-primary disabled:opacity-40"
                    >
                      İpucu
                    </button>
                  </div>
                </div>
              )}

              {cardStep === "reveal" && (
                <div className="mt-12">
                  <p className="text-4xl font-bold text-slate-900">
                    {current.answerText}
                  </p>
                  <button
                    type="button"
                    onClick={() => setCardStep("choose")}
                    className="mt-4 text-sm font-semibold text-slate-500"
                  >
                    Geri
                  </button>
                </div>
              )}

              {cardStep === "multiple" && (
                <div className="mt-12 space-y-3">
                  {choiceOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() =>
                        void submitAction("answer", current, option)
                      }
                      disabled={isExiting}
                      className="block w-full rounded-xl bg-slate-100 px-4 py-3 text-left font-semibold text-slate-700 transition-colors hover:bg-primary-light hover:text-primary disabled:opacity-60"
                    >
                      {option}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCardStep("choose")}
                    className="mt-2 w-full py-2 text-sm font-semibold text-slate-500"
                  >
                    Geri
                  </button>
                </div>
              )}
            </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 px-1 text-center text-sm font-medium">
            {current.sessionKind === "new" ? (
              <>
                <button
                  type="button"
                  onClick={() =>
                    void submitAction(
                      isInLearningPhase ? "know" : "already_known",
                      current,
                    )
                  }
                  disabled={isExiting}
                  className="rounded-xl py-2 text-slate-700 transition-colors hover:text-primary disabled:opacity-60"
                >
                  {isInLearningPhase ? "Öğrendim" : "Önceden biliyordum"}
                </button>
                {isInLearningPhase ? (
                  <button
                    type="button"
                    onClick={() => void submitAction("unknown", current)}
                    disabled={isExiting}
                    className="rounded-xl bg-red-50 px-3 py-2 font-bold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-60"
                  >
                    Bilmiyorum · Tekrar göster
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => deferLearning(current)}
                    disabled={isExiting}
                    className="rounded-xl py-2 text-slate-700 transition-colors hover:text-primary disabled:opacity-60"
                  >
                    Bu kelimeyi öğrenmeye başla
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => void submitAction("know", current)}
                  disabled={isExiting}
                  className="rounded-xl py-2 text-slate-700 transition-colors hover:text-primary disabled:opacity-60"
                >
                  Bildim
                </button>
                <button
                  type="button"
                  onClick={() => void submitAction("unknown", current)}
                  disabled={isExiting}
                  className="rounded-xl bg-red-50 px-3 py-2 font-bold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-60"
                >
                  Bilemedim
                </button>
              </>
            )}
          </div>

          {cardStep === "type" && answer.trim() && (
            <button
              type="button"
              onClick={() => void submitAction("answer", current, answer)}
              className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
            >
              Cevabı kontrol et
            </button>
          )}
        </>
      )}
    </div>
  );
}
