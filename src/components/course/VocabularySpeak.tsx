"use client";

import { useCallback, useState } from "react";
import { Volume2 } from "lucide-react";

function pickVoice(frontDir: "rtl" | "ltr"): SpeechSynthesisVoice | undefined {
  if (typeof window === "undefined" || !window.speechSynthesis) return undefined;

  const voices = window.speechSynthesis.getVoices();
  const langPrefix = frontDir === "rtl" ? "ar" : "en";
  return (
    voices.find((voice) => voice.lang.startsWith(langPrefix) && voice.localService) ??
    voices.find((voice) => voice.lang.startsWith(langPrefix)) ??
    undefined
  );
}

function waitForVoices(timeoutMs = 800): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve();
      return;
    }

    const synth = window.speechSynthesis;
    if (synth.getVoices().length > 0) {
      resolve();
      return;
    }

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      synth.removeEventListener("voiceschanged", finish);
      resolve();
    };

    synth.addEventListener("voiceschanged", finish);
    window.setTimeout(finish, timeoutMs);
  });
}

/** Async yüklemeden önce kullanıcı tıklamasıyla TTS kilidini açar. */
export function primeSpeechSynthesis(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  const synth = window.speechSynthesis;
  synth.cancel();
  if (synth.paused) synth.resume();

  const utterance = new SpeechSynthesisUtterance("\u200b");
  utterance.volume = 0.01;
  utterance.rate = 10;
  synth.speak(utterance);
}

/** Ön yüz metnini tarayıcı TTS ile seslendirir (ek bağımlılık yok). */
export function speakFrontText(text: string, frontDir: "rtl" | "ltr"): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  const trimmed = text.trim();
  if (!trimmed) return;

  const synth = window.speechSynthesis;

  const doSpeak = () => {
    synth.cancel();
    if (synth.paused) synth.resume();

    window.setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(trimmed);
      utterance.lang = frontDir === "rtl" ? "ar-SA" : "en-US";
      utterance.rate = 0.92;
      const voice = pickVoice(frontDir);
      if (voice) utterance.voice = voice;
      synth.speak(utterance);
    }, 50);
  };

  if (synth.getVoices().length === 0) {
    void waitForVoices().then(doSpeak);
  } else {
    doSpeak();
  }
}

interface SpeakButtonProps {
  text: string;
  frontDir: "rtl" | "ltr";
  /** Kart köşesinde mutlak konum için. */
  className?: string;
  /** Üst öğe tıklanabilirse (kart çevirme) olayı yükseltme. */
  stopPropagation?: boolean;
  size?: "sm" | "md";
}

/**
 * Ön yüz (ezberlenecek terim) seslendirme butonu.
 * Web Speech API kullanır; İngilizce (ltr) ve Arapça (rtl) için uygun dil seçilir.
 */
export function SpeakButton({
  text,
  frontDir,
  className = "",
  stopPropagation = false,
  size = "md",
}: SpeakButtonProps) {
  const [speaking, setSpeaking] = useState(false);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (stopPropagation) e.stopPropagation();
      if (!text.trim()) return;

      primeSpeechSynthesis();
      speakFrontText(text, frontDir);
      setSpeaking(true);
      window.setTimeout(() => setSpeaking(false), 1200);
    },
    [text, frontDir, stopPropagation],
  );

  const dim = size === "sm" ? 32 : 40;
  const icon = size === "sm" ? 16 : 20;

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Ön yüzü seslendir"
      title="Seslendir"
      className={`inline-flex shrink-0 items-center justify-center rounded-full border-2 border-primary/30 bg-primary-light text-primary shadow-sm transition-all hover:border-primary hover:bg-primary hover:text-white active:scale-95 ${speaking ? "animate-pulse border-primary bg-primary text-white" : ""} ${className}`}
      style={{ width: dim, height: dim }}
    >
      <Volume2 size={icon} aria-hidden="true" />
    </button>
  );
}

interface FrontWordProps {
  text: string;
  frontDir: "rtl" | "ltr";
  /** h2 / büyük başlık stili */
  variant?: "title" | "card";
  className?: string;
}

/** Ön yüz metni + yanında/kenarda seslendirme butonu (eşleştirme modu hariç modlar). */
export function FrontWord({
  text,
  frontDir,
  variant = "title",
  className = "",
}: FrontWordProps) {
  const textCls =
    variant === "card"
      ? `px-6 text-4xl font-bold text-slate-900 ${frontDir === "rtl" ? "font-arabic" : ""}`
      : `text-4xl font-bold text-slate-900 ${frontDir === "rtl" ? "font-arabic" : ""}`;

  return (
    <div
      className={`flex items-center justify-center gap-4 ${className}`}
      dir={frontDir}
    >
      <span className={textCls}>{text}</span>
      <SpeakButton text={text} frontDir={frontDir} size="md" />
    </div>
  );
}
