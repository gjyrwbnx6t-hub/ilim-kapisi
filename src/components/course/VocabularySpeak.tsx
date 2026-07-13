"use client";

import { useCallback, useState } from "react";
import { Volume2 } from "lucide-react";

/** Ön yüz metnini tarayıcı TTS ile seslendirir (ek bağımlılık yok). */
export function speakFrontText(
  text: string,
  frontDir: "rtl" | "ltr",
): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text.trim());
  utterance.lang = frontDir === "rtl" ? "ar-SA" : "en-US";
  utterance.rate = 0.92;
  window.speechSynthesis.speak(utterance);
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
      if (typeof window === "undefined" || !window.speechSynthesis) return;

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.trim());
      utterance.lang = frontDir === "rtl" ? "ar-SA" : "en-US";
      utterance.rate = 0.92;
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      setSpeaking(true);
      window.speechSynthesis.speak(utterance);
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
