"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { VocabularySet, VocabularyUnit } from "@/lib/types";
import { logActivity } from "@/lib/activity";

/**
 * Kelime Antrenörü — eski statik sitedeki 5 modlu kelime çalışma sisteminin
 * (script.js) React karşılığı. Sol sütunda üniteler, seçilince sekmelerle
 * 5 mod: Kartlar, Öğrenme, Çoktan Seçmeli, Doğru/Yanlış, Eşleştirme.
 */

type Mode =
  | "kartlar"
  | "ogrenme"
  | "coktan_secmeli"
  | "dogru_yanlis"
  | "eslestirme";

const MODES: { id: Mode; label: string }[] = [
  { id: "kartlar", label: "Kartlar" },
  { id: "ogrenme", label: "Öğrenme" },
  { id: "coktan_secmeli", label: "Çoktan Seçmeli" },
  { id: "dogru_yanlis", label: "Doğru/Yanlış" },
  { id: "eslestirme", label: "Eşleştirme" },
];

function normalize(text: string): string {
  return text
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/[.,?!]/g, "");
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

interface VocabularyTrainerProps {
  set: VocabularySet;
}

export default function VocabularyTrainer({ set }: VocabularyTrainerProps) {
  const [activeUnitId, setActiveUnitId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("kartlar");

  const frontDir = set.frontDir ?? "rtl";
  const activeUnit = set.units.find((unit) => unit.id === activeUnitId) ?? null;

  return (
    <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
      {/* Ünite listesi (sidebar) */}
      <aside className="w-full shrink-0 overflow-y-auto border-b border-slate-200 bg-white lg:w-80 lg:border-b-0 lg:border-r">
        <h2 className="border-b-2 border-slate-100 px-5 py-4 text-lg font-bold text-primary">
          Üniteler
        </h2>
        <ul>
          {set.units.map((unit) => {
            const active = unit.id === activeUnitId;
            return (
              <li key={unit.id}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveUnitId(unit.id);
                    setMode("kartlar");
                    logActivity({
                      type: "vocab",
                      courseSlug: set.contentSlug,
                      unitId: unit.id,
                      metadata: { action: "open", unitTitle: unit.titleTr },
                    });
                  }}
                  className={`flex w-full flex-col gap-1 border-b border-slate-200 border-l-4 px-5 py-4 text-left transition-colors ${
                    active
                      ? "border-l-primary bg-primary-light"
                      : "border-l-transparent bg-surface hover:border-l-slate-300 hover:bg-slate-100"
                  }`}
                >
                  {unit.titleAr && (
                    <span
                      dir="rtl"
                      className="font-arabic text-lg font-bold text-primary"
                    >
                      {unit.titleAr}
                    </span>
                  )}
                  <span className="text-sm font-medium text-surface-muted">
                    {unit.titleTr}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* İçerik alanı */}
      <div className="flex-1 overflow-y-auto p-5 sm:p-8">
        {!activeUnit ? (
          <WelcomeScreen />
        ) : (
          <div>
            <h2 className="mb-5 text-2xl font-bold text-primary">
              {activeUnit.titleTr} Ünitesi Kelimeleri
            </h2>

            <div className="rounded-xl bg-white p-5 shadow-sm">
              {/* Sekmeler */}
              <div className="mb-6 flex gap-2 overflow-x-auto border-b border-slate-200 pb-4">
                {MODES.map((item) => {
                  const active = item.id === mode;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setMode(item.id)}
                      className={`whitespace-nowrap rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors ${
                        active
                          ? "bg-primary text-white"
                          : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {/* Aktif mod (unit + mode değişince state sıfırlanır) */}
              <ModeRenderer
                key={`${activeUnit.id}-${mode}`}
                mode={mode}
                unit={activeUnit}
                frontDir={frontDir}
                courseSlug={set.contentSlug}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function WelcomeScreen() {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center text-center">
      <span className="mb-5 text-7xl">📚</span>
      <h2 className="mb-2 text-3xl font-bold text-primary">
        Çalışma Alanına Hoş Geldiniz!
      </h2>
      <p className="max-w-md text-lg text-surface-muted">
        Kelimelere çalışmak için soldaki menüden bir ünite seçin.
      </p>
    </div>
  );
}

interface ModeProps {
  unit: VocabularyUnit;
  frontDir: "rtl" | "ltr";
  onComplete?: (score: number) => void;
}

function ModeRenderer({
  mode,
  unit,
  frontDir,
  courseSlug,
}: ModeProps & { mode: Mode; courseSlug: string }) {
  const words = unit.words;

  const onComplete = useCallback(
    (score: number) => {
      logActivity({
        type: "vocab",
        courseSlug,
        unitId: unit.id,
        score,
        metadata: { mode, unitTitle: unit.titleTr },
      });
    },
    [courseSlug, unit.id, unit.titleTr, mode],
  );

  if (!words || words.length === 0) {
    return (
      <div className="rounded-lg bg-red-50 p-6 text-center text-red-600">
        Bu ünite için henüz kelime listesi eklenmedi.
      </div>
    );
  }

  switch (mode) {
    case "kartlar":
      return <FlashcardsMode unit={unit} frontDir={frontDir} />;
    case "ogrenme":
      return (
        <LearningMode unit={unit} frontDir={frontDir} onComplete={onComplete} />
      );
    case "coktan_secmeli":
      return (
        <MultipleChoiceMode
          unit={unit}
          frontDir={frontDir}
          onComplete={onComplete}
        />
      );
    case "dogru_yanlis":
      return (
        <TrueFalseMode unit={unit} frontDir={frontDir} onComplete={onComplete} />
      );
    case "eslestirme":
      return (
        <MatchingMode unit={unit} frontDir={frontDir} onComplete={onComplete} />
      );
    default:
      return null;
  }
}

/* ---------------- 1. KARTLAR ---------------- */

function FlashcardsMode({ unit, frontDir }: ModeProps) {
  const words = unit.words;
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const current = words[index];

  const goTo = (next: number) => {
    setIndex(next);
    setFlipped(false);
  };

  return (
    <div className="flex flex-col items-center [perspective:1000px]">
      <button
        type="button"
        onClick={() => setFlipped((value) => !value)}
        className="relative h-80 w-full max-w-xl cursor-pointer rounded-xl transition-transform duration-500 [transform-style:preserve-3d]"
        style={{ transform: flipped ? "rotateX(180deg)" : "rotateX(0deg)" }}
        aria-label="Kartı çevir"
      >
        <span className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-white shadow-md [backface-visibility:hidden]">
          <span className="absolute right-4 top-4 rounded-full border border-emerald-500 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
            Çevirmek İçin Tıkla
          </span>
          <span
            dir={frontDir}
            className={`px-6 text-4xl font-bold text-slate-900 ${
              frontDir === "rtl" ? "font-arabic" : ""
            }`}
          >
            {current.front}
          </span>
        </span>
        <span className="absolute inset-0 flex flex-col items-center justify-center rounded-xl border-2 border-primary bg-white px-6 text-center shadow-md [backface-visibility:hidden] [transform:rotateX(180deg)]">
          <span className="text-3xl font-bold text-primary">{current.back}</span>
        </span>
      </button>

      <div className="mt-9 flex w-full max-w-xl justify-center gap-4">
        <button
          type="button"
          onClick={() => index > 0 && goTo(index - 1)}
          disabled={index === 0}
          className="flex-1 rounded-lg border border-slate-300 bg-white py-3.5 font-semibold text-surface-muted transition-colors hover:bg-slate-50 disabled:opacity-40"
        >
          Önceki
        </button>
        <button
          type="button"
          onClick={() => index < words.length - 1 && goTo(index + 1)}
          className="flex-1 rounded-lg border border-slate-300 bg-white py-3.5 font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          Biliyorum
        </button>
        <button
          type="button"
          onClick={() => index < words.length - 1 && goTo(index + 1)}
          className="flex-1 rounded-lg bg-primary py-3.5 font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          Sonraki
        </button>
      </div>

      <div className="mt-10 w-full text-center">
        <h3 className="mb-5 text-xl font-bold text-primary">
          Kart {index + 1} / {words.length}
        </h3>
        <div className="flex flex-wrap justify-center gap-1.5">
          {words.map((_, i) => (
            <span
              key={i}
              className={`h-2.5 w-2.5 rounded-full ${
                i === index
                  ? "bg-primary"
                  : i < index
                    ? "bg-emerald-500"
                    : "bg-slate-200"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Ortak: tamamlanınca bitiş ekranı ---------------- */

function CompletionScreen({
  score,
  onRestart,
}: {
  score: number;
  onRestart: () => void;
}) {
  return (
    <div className="py-12 text-center">
      <h2 className="mb-4 text-3xl font-bold text-primary">Tebrikler! 🎉</h2>
      <h3 className="mb-6 text-2xl font-bold text-emerald-500">
        Toplam Skorunuz: {score}
      </h3>
      <button
        type="button"
        onClick={onRestart}
        className="rounded-lg bg-primary px-6 py-3 font-bold text-white transition-colors hover:bg-primary-dark"
      >
        Tekrar Çöz
      </button>
    </div>
  );
}

/* ---------------- 2. ÖĞRENME ---------------- */

function LearningMode({ unit, frontDir, onComplete }: ModeProps) {
  const words = unit.words;
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [value, setValue] = useState("");
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(false);
  const loggedRef = useRef(false);

  const restart = () => {
    setIndex(0);
    setScore(0);
    setValue("");
    setChecked(false);
    setCorrect(false);
    loggedRef.current = false;
  };

  useEffect(() => {
    if (index >= words.length && !loggedRef.current) {
      loggedRef.current = true;
      onComplete?.(score);
    }
  }, [index, words.length, score, onComplete]);

  if (index >= words.length) {
    return <CompletionScreen score={score} onRestart={restart} />;
  }

  const current = words[index];

  const check = () => {
    if (value === "" || checked) return;
    const isCorrect = normalize(value) === normalize(current.back);
    setCorrect(isCorrect);
    setChecked(true);
    if (isCorrect) setScore((s) => s + 10);
  };

  const next = () => {
    setIndex((i) => i + 1);
    setValue("");
    setChecked(false);
    setCorrect(false);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h3 className="mb-5 text-surface-muted">Doğru çeviriyi yazın:</h3>
        <h2
          dir={frontDir}
          className={`mb-7 text-4xl font-bold text-slate-900 ${
            frontDir === "rtl" ? "font-arabic" : ""
          }`}
        >
          {current.front}
        </h2>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            if (checked) {
              next();
            } else {
              check();
            }
          }}
          disabled={checked}
          placeholder="Türkçe çeviriyi yazın"
          autoFocus
          className="mb-5 w-4/5 rounded-lg border-2 border-primary px-4 py-3.5 text-center text-lg outline-none disabled:bg-slate-50"
        />
        {checked && (
          <div
            className={`mb-5 font-semibold ${
              correct ? "text-emerald-500" : "text-red-500"
            }`}
          >
            {correct ? "✅ Doğru!" : `❌ Yanlış! Doğru: ${current.back}`}
          </div>
        )}
        {!checked ? (
          <button
            type="button"
            onClick={check}
            className="rounded-lg bg-primary px-10 py-3 font-bold text-white transition-colors hover:bg-primary-dark"
          >
            Kontrol Et
          </button>
        ) : (
          <button
            type="button"
            onClick={next}
            className="rounded-lg bg-emerald-500 px-10 py-3 font-bold text-white transition-colors hover:bg-emerald-600"
          >
            Sonraki Soru
          </button>
        )}
      </div>
      <h3 className="mt-5 font-semibold text-primary">
        Skor: {score} | Soru: {index + 1}/{words.length}
      </h3>
    </div>
  );
}

/* ---------------- 3. ÇOKTAN SEÇMELİ ---------------- */

function MultipleChoiceMode({ unit, frontDir, onComplete }: ModeProps) {
  const words = unit.words;
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const loggedRef = useRef(false);

  const restart = () => {
    setIndex(0);
    setScore(0);
    setPicked(null);
    loggedRef.current = false;
  };

  const current = index < words.length ? words[index] : null;

  const options = useMemo(() => {
    if (!current) return [];
    const others = shuffle(words.filter((w) => w.back !== current.back))
      .slice(0, 3)
      .map((w) => w.back);
    return shuffle([current.back, ...others]);
  }, [current, words]);

  useEffect(() => {
    if (index >= words.length && !loggedRef.current) {
      loggedRef.current = true;
      onComplete?.(score);
    }
  }, [index, words.length, score, onComplete]);

  if (index >= words.length || !current) {
    return <CompletionScreen score={score} onRestart={restart} />;
  }

  const answered = picked !== null;

  const pick = (option: string) => {
    if (answered) return;
    setPicked(option);
    if (option === current.back) setScore((s) => s + 10);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h2
          dir={frontDir}
          className={`mb-7 text-4xl font-bold text-slate-900 ${
            frontDir === "rtl" ? "font-arabic" : ""
          }`}
        >
          {current.front}
        </h2>
        <div className="flex flex-wrap justify-center">
          {options.map((option) => {
            const isAnswer = option === current.back;
            const isPicked = option === picked;
            let cls =
              "border-slate-200 bg-white text-slate-700 hover:border-primary";
            if (answered) {
              if (isAnswer)
                cls = "border-emerald-500 bg-emerald-500 text-white";
              else if (isPicked)
                cls = "border-red-500 bg-red-500 text-white";
              else cls = "border-slate-200 bg-white text-slate-400";
            }
            return (
              <button
                key={option}
                type="button"
                onClick={() => pick(option)}
                disabled={answered}
                className={`m-[2%] w-[46%] rounded-lg border-2 px-4 py-4 font-semibold transition-colors ${cls}`}
              >
                {option}
              </button>
            );
          })}
        </div>
        {answered && (
          <button
            type="button"
            onClick={() => {
              setIndex((i) => i + 1);
              setPicked(null);
            }}
            className="mt-5 rounded-lg bg-accent px-10 py-3 font-bold text-slate-900 transition-colors hover:brightness-95"
          >
            Sonraki Soru
          </button>
        )}
      </div>
      <h3 className="mt-5 font-semibold text-primary">
        Skor: {score} | Soru: {index + 1}/{words.length}
      </h3>
    </div>
  );
}

/* ---------------- 4. DOĞRU / YANLIŞ ---------------- */

function TrueFalseMode({ unit, frontDir, onComplete }: ModeProps) {
  const words = unit.words;
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [wasRight, setWasRight] = useState(false);
  const loggedRef = useRef(false);

  const restart = () => {
    setIndex(0);
    setScore(0);
    setAnswered(false);
    setWasRight(false);
    loggedRef.current = false;
  };

  const current = index < words.length ? words[index] : null;

  useEffect(() => {
    if (index >= words.length && !loggedRef.current) {
      loggedRef.current = true;
      onComplete?.(score);
    }
  }, [index, words.length, score, onComplete]);

  // Gösterilen çeviri gerçekten doğru mu? (soru başına sabit)
  const shown = useMemo(() => {
    if (!current) return { text: "", isActuallyCorrect: true };
    const showCorrect = Math.random() > 0.5;
    if (showCorrect) {
      return { text: current.back, isActuallyCorrect: true };
    }
    const random = words[Math.floor(Math.random() * words.length)].back;
    return { text: random, isActuallyCorrect: random === current.back };
  }, [current, words]);

  if (index >= words.length || !current) {
    return <CompletionScreen score={score} onRestart={restart} />;
  }

  const answer = (choice: boolean) => {
    if (answered) return;
    setAnswered(true);
    const right = choice === shown.isActuallyCorrect;
    setWasRight(right);
    if (right) setScore((s) => s + 10);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h3 className="mb-5 text-surface-muted">Bu çeviri doğru mu?</h3>
        <h2
          dir={frontDir}
          className={`mb-2.5 text-4xl font-bold text-slate-900 ${
            frontDir === "rtl" ? "font-arabic" : ""
          }`}
        >
          {current.front}
        </h2>
        <h1 className="mb-7 text-xl font-bold text-primary">{shown.text}</h1>
        <div className="flex justify-center gap-5">
          <button
            type="button"
            onClick={() => answer(true)}
            disabled={answered}
            className="rounded-lg border-2 border-emerald-500 bg-white px-10 py-3.5 text-lg font-bold text-emerald-500 transition-colors hover:bg-emerald-50 disabled:opacity-60"
          >
            Doğru
          </button>
          <button
            type="button"
            onClick={() => answer(false)}
            disabled={answered}
            className="rounded-lg border-2 border-red-500 bg-white px-10 py-3.5 text-lg font-bold text-red-500 transition-colors hover:bg-red-50 disabled:opacity-60"
          >
            Yanlış
          </button>
        </div>
        {answered && (
          <>
            <div
              className={`mt-5 font-semibold ${
                wasRight ? "text-emerald-500" : "text-red-500"
              }`}
            >
              {wasRight
                ? "✅ Tebrikler, Doğru!"
                : `❌ Yanlış! Bu çeviri aslında ${
                    shown.isActuallyCorrect ? "doğruydu" : "yanlıştı"
                  }.`}
            </div>
            <button
              type="button"
              onClick={() => {
                setIndex((i) => i + 1);
                setAnswered(false);
                setWasRight(false);
              }}
              className="mt-5 rounded-lg bg-accent px-10 py-3 font-bold text-slate-900 transition-colors hover:brightness-95"
            >
              Sonraki Soru
            </button>
          </>
        )}
      </div>
      <h3 className="mt-5 font-semibold text-primary">
        Skor: {score} | Soru: {index + 1}/{words.length}
      </h3>
    </div>
  );
}

/* ---------------- 5. EŞLEŞTİRME ---------------- */

const PAIRS_PER_PAGE = 6;

interface MatchCard {
  text: string;
  pairId: number;
  side: "front" | "back";
  key: string;
}

function MatchingMode({ unit, frontDir, onComplete }: ModeProps) {
  const words = unit.words;
  const [page, setPage] = useState(0);
  const [score, setScore] = useState(0);
  const [firstPick, setFirstPick] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [wrong, setWrong] = useState<string[]>([]);
  const [locked, setLocked] = useState(false);
  const loggedRef = useRef(false);

  const start = page * PAIRS_PER_PAGE;
  const pageWords = words.slice(start, start + PAIRS_PER_PAGE);

  const cards = useMemo(() => {
    const list: MatchCard[] = [];
    pageWords.forEach((word, i) => {
      list.push({ text: word.front, pairId: i, side: "front", key: `f-${i}` });
      list.push({ text: word.back, pairId: i, side: "back", key: `b-${i}` });
    });
    return shuffle(list);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, unit.id]);

  const restart = () => {
    setPage(0);
    setScore(0);
    setFirstPick(null);
    setMatched(new Set());
    setWrong([]);
    setLocked(false);
    loggedRef.current = false;
  };

  useEffect(() => {
    if (pageWords.length === 0 && !loggedRef.current) {
      loggedRef.current = true;
      onComplete?.(score);
    }
  }, [pageWords.length, score, onComplete]);

  if (pageWords.length === 0) {
    return <CompletionScreen score={score} onRestart={restart} />;
  }

  const handleClick = (card: MatchCard) => {
    if (locked) return;
    if (matched.has(card.pairId)) return;
    if (card.key === firstPick) return;

    if (!firstPick) {
      setFirstPick(card.key);
      return;
    }

    const first = cards.find((c) => c.key === firstPick);
    if (!first) return;

    if (first.pairId === card.pairId) {
      const nextMatched = new Set(matched).add(card.pairId);
      setMatched(nextMatched);
      setScore((s) => s + 10);
      setFirstPick(null);

      if (nextMatched.size === pageWords.length) {
        setLocked(true);
        setTimeout(() => {
          setPage((p) => p + 1);
          setFirstPick(null);
          setMatched(new Set());
          setWrong([]);
          setLocked(false);
        }, 800);
      }
    } else {
      setLocked(true);
      setWrong([first.key, card.key]);
      setTimeout(() => {
        setWrong([]);
        setFirstPick(null);
        setLocked(false);
      }, 800);
    }
  };

  return (
    <div className="mt-2">
      <h3 className="mb-5 text-center text-surface-muted">
        Birbiriyle eşleşen kelimeleri bulun:
      </h3>
      <div className="mx-auto grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-3">
        {cards.map((card) => {
          const isMatched = matched.has(card.pairId);
          const isSelected = card.key === firstPick;
          const isWrong = wrong.includes(card.key);
          const isFront = card.side === "front";

          let cls =
            "border-slate-200 bg-white text-slate-900 hover:border-primary";
          if (isMatched)
            cls = "border-emerald-500 bg-emerald-100 text-emerald-800";
          else if (isWrong)
            cls = "border-red-500 bg-red-100 text-red-700";
          else if (isSelected) cls = "border-primary bg-primary-light";

          return (
            <button
              key={card.key}
              type="button"
              dir={isFront ? frontDir : "ltr"}
              onClick={() => handleClick(card)}
              disabled={isMatched}
              className={`flex min-h-20 items-center justify-center rounded-xl border-2 px-3 py-5 text-center font-semibold shadow-sm transition-all ${cls} ${
                isFront && frontDir === "rtl"
                  ? "font-arabic text-2xl"
                  : "text-base"
              } ${isWrong ? "translate-x-1" : ""}`}
            >
              {card.text}
            </button>
          );
        })}
      </div>
      <h3 className="mt-8 text-center font-semibold text-primary">
        Skor: {score}
      </h3>
    </div>
  );
}
