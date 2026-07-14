"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Eye, MoreHorizontal } from "lucide-react";
import { SpeakButton, speakFrontText } from "@/components/course/VocabularySpeak";
import {
  BROWSE_STATUS_META,
  type BrowseFlashcardWord,
} from "@/lib/rearapca-browse-flashcards";

type FirstSide = "foreign" | "turkish";

interface BrowseFlashcardsSessionProps {
  courseSlugs: string[];
  statusFilters: string[];
  firstSide: FirstSide;
  showTranslationAtOnce: boolean;
  autoPronounce: boolean;
  onBack: () => void;
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  if (total <= 0) return null;

  return (
    <div className="flex gap-0.5">
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={`h-1.5 min-w-0 flex-1 rounded-full transition-colors ${
            index < current ? "bg-sky-500" : "bg-slate-200"
          }`}
        />
      ))}
    </div>
  );
}

export default function BrowseFlashcardsSession({
  courseSlugs,
  statusFilters,
  firstSide,
  showTranslationAtOnce,
  autoPronounce,
  onBack,
}: BrowseFlashcardsSessionProps) {
  const [words, setWords] = useState<BrowseFlashcardWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(showTranslationAtOnce);

  const loadWords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/rearapca/browse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseSlugs,
          statusFilters,
        }),
      });
      const payload = (await response.json()) as {
        words?: BrowseFlashcardWord[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Kartlar yüklenemedi.");
      }
      setWords(payload.words ?? []);
      setIndex(0);
      setRevealed(showTranslationAtOnce);
    } catch (err: unknown) {
      setWords([]);
      setError(err instanceof Error ? err.message : "Kartlar yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [courseSlugs, statusFilters, showTranslationAtOnce]);

  useEffect(() => {
    void loadWords();
  }, [loadWords]);

  const current = words[index] ?? null;
  const total = words.length;
  const statusMeta = current ? BROWSE_STATUS_META[current.browseStatus] : null;

  const showSecondary = showTranslationAtOnce || revealed;

  const primaryText = useMemo(() => {
    if (!current) return "";
    return firstSide === "foreign" ? current.front : current.answerText;
  }, [current, firstSide]);

  const secondaryText = useMemo(() => {
    if (!current) return "";
    return firstSide === "foreign" ? current.answerText : current.front;
  }, [current, firstSide]);

  const primaryDir =
    firstSide === "foreign" ? (current?.frontDir ?? "rtl") : "ltr";
  const secondaryDir =
    firstSide === "foreign" ? "ltr" : (current?.frontDir ?? "rtl");

  const foreignVisible =
    firstSide === "foreign" || (firstSide === "turkish" && showSecondary);

  const goBack = () => {
    if (index <= 0) return;
    setIndex((value) => value - 1);
    setRevealed(showTranslationAtOnce);
  };

  const goForward = () => {
    if (index >= total - 1) return;
    setIndex((value) => value + 1);
    setRevealed(showTranslationAtOnce);
  };

  useEffect(() => {
    setRevealed(showTranslationAtOnce);
  }, [index, showTranslationAtOnce]);

  useEffect(() => {
    if (loading || !autoPronounce || firstSide !== "foreign" || !current?.front.trim()) {
      return;
    }

    speakFrontText(current.front, current.frontDir);
  }, [loading, autoPronounce, firstSide, current, index]);

  if (loading) {
    return (
      <div className="rounded-2xl bg-white px-5 py-12 text-center text-sm font-semibold text-slate-500 shadow-sm">
        Kartlar hazırlanıyor...
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="relative flex items-center justify-center">
          <button
            type="button"
            onClick={onBack}
            className="absolute left-0 flex h-10 w-10 items-center justify-center rounded-full text-slate-700 hover:bg-white/70"
            aria-label="Geri"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-bold text-slate-900">Kartları gözat</h2>
        </div>
        <div className="rounded-2xl bg-white px-5 py-10 text-center shadow-sm">
          <p className="text-sm font-semibold text-red-500">{error}</p>
          <button
            type="button"
            onClick={() => void loadWords()}
            className="mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white"
          >
            Tekrar dene
          </button>
        </div>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="space-y-4">
        <div className="relative flex items-center justify-center">
          <button
            type="button"
            onClick={onBack}
            className="absolute left-0 flex h-10 w-10 items-center justify-center rounded-full text-slate-700 hover:bg-white/70"
            aria-label="Geri"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-bold text-slate-900">Kartları gözat</h2>
        </div>
        <div className="rounded-2xl bg-white px-5 py-12 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-500">
            Seçilen filtrelere uygun kelime yok.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col">
      <div className="mb-3 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-700 hover:bg-white/70"
          aria-label="Geri"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-600">
            Kelime {index + 1} / {total}
          </p>
          <div className="mt-2">
            <ProgressBar current={index + 1} total={total} />
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col rounded-2xl bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: statusMeta?.color }}
            />
            {statusMeta?.label}
          </span>
          <button
            type="button"
            className="text-slate-400"
            aria-label="Seçenekler"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-1 flex-col px-5 py-6">
          <p className="text-sm text-slate-400">{current.lessonTitleTr}</p>

          <div className="mt-4 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p
                dir={primaryDir}
                className={`text-3xl font-bold leading-tight text-slate-900 ${
                  primaryDir === "rtl" ? "text-right font-arabic" : ""
                }`}
              >
                {primaryText}
              </p>
              {showSecondary && (
                <p
                  dir={secondaryDir}
                  className={`mt-4 text-lg text-slate-600 ${
                    secondaryDir === "rtl" ? "text-right font-arabic" : ""
                  }`}
                >
                  {secondaryText}
                </p>
              )}
            </div>
            {foreignVisible && current.front.trim() && (
              <SpeakButton text={current.front} frontDir={current.frontDir} />
            )}
          </div>

          {!showTranslationAtOnce && (
            <div className="mt-auto flex justify-center pt-10">
              <button
                type="button"
                onClick={() => setRevealed((value) => !value)}
                className="flex h-24 w-24 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600"
                aria-label={
                  revealed
                    ? firstSide === "turkish"
                      ? "Yabancı karşılığı gizle"
                      : "Türkçe anlamı gizle"
                    : firstSide === "turkish"
                      ? "Yabancı karşılığı göster"
                      : "Türkçe anlamı göster"
                }
              >
                <Eye className="h-8 w-8" strokeWidth={1.8} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={goBack}
          disabled={index === 0}
          className="rounded-2xl bg-white py-4 text-base font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Geri
        </button>
        <button
          type="button"
          onClick={goForward}
          disabled={index >= total - 1}
          className="rounded-2xl bg-white py-4 text-base font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          İleri
        </button>
      </div>
    </div>
  );
}
