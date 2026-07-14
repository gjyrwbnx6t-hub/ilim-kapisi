"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Maximize2, Minimize2 } from "lucide-react";
import type { MindMapNode } from "@/lib/types";
import { logActivity } from "@/lib/activity";
import { useStudyTimeTracker } from "@/hooks/useStudyTimeTracker";

/**
 * Zihin Şeması Gezgini.
 *
 * Her hafta ayrı bir XMind tarzı zoomlanabilir/sürüklenebilir canvas olarak
 * gösterilir. Aynı anda yalnızca seçili hafta render edilir; kullanıcı
 * Önceki/Sonraki veya hafta çubuğu ile haftalar arasında geçer.
 */

const WeekFlowCanvas = dynamic(() => import("./WeekFlowCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-surface-muted">
      Zihin şeması yükleniyor…
    </div>
  ),
});

interface MindMapViewerProps {
  root: MindMapNode;
  courseSlug: string;
  courseTitleAr: string;
  courseTitleTr?: string;
}

export default function MindMapViewer({
  root,
  courseSlug,
  courseTitleAr,
}: MindMapViewerProps) {
  const weeks = useMemo(() => root.children ?? [], [root]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useStudyTimeTracker({
    courseSlug,
    module: "mindmap",
    moduleLabel: "Zihin Şeması",
  });

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!isFullscreen) {
      setIsFullscreen(true);
      el?.requestFullscreen?.().catch(() => {});
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  // Tarayıcı fullscreen'inden ESC ile çıkışı state ile senkronla.
  useEffect(() => {
    const onChange = () => {
      if (!document.fullscreenElement) setIsFullscreen(false);
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const goPrev = useCallback(() => {
    setActiveIndex((i) => Math.max(0, i - 1));
  }, []);
  const goNext = useCallback(() => {
    setActiveIndex((i) => Math.min(weeks.length - 1, i + 1));
  }, [weeks.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && ["INPUT", "TEXTAREA"].includes(el.tagName)) return;
      if (e.key === "ArrowLeft") goNext(); // RTL: sol = ileri
      else if (e.key === "ArrowRight") goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goPrev, goNext]);

  // Seçili hafta üzerinde kısa süre kalınca ilerlemeyi kaydet (debounce ile
  // hızlı gezinmede gereksiz olay üretilmez).
  useEffect(() => {
    if (weeks.length === 0) return;
    const week = weeks[activeIndex];
    if (!week) return;
    const timer = window.setTimeout(() => {
      logActivity({
        type: "mindmap",
        courseSlug,
        unitId: week.id,
        metadata: { weekTitle: week.titleAr, weekIndex: activeIndex },
        progress: {
          module: "mindmap",
          lastWeek: activeIndex + 1,
          percent: Math.round(((activeIndex + 1) / weeks.length) * 100),
        },
      });
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [activeIndex, weeks, courseSlug]);

  if (weeks.length === 0) {
    return (
      <div className="m-auto rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-surface-muted shadow-sm">
        Bu ders için zihin şeması henüz eklenmedi.
      </div>
    );
  }

  const activeWeek = weeks[activeIndex];

  return (
    <div
      ref={containerRef}
      className={`flex flex-col bg-white ${
        isFullscreen
          ? "fixed inset-0 z-50 h-screen w-screen"
          : "h-full min-h-0 flex-1"
      }`}
    >
      {/* Koyu üst bar */}
      <div className="flex shrink-0 items-center justify-between gap-3 bg-ink px-5 py-3.5 text-white">
        <Link
          href={`/courses/${courseSlug}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-200 transition-colors hover:text-white"
        >
          <span aria-hidden="true">&larr;</span>
          Ders Sayfasına Dön
        </Link>
        <div className="flex items-center gap-4">
          <span
            dir="rtl"
            className="hidden max-w-[40vw] truncate font-arabic text-sm font-semibold text-slate-100 sm:block"
          >
            {courseTitleAr}
          </span>
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-pressed={isFullscreen}
            title={isFullscreen ? "Tam ekrandan çık" : "Tam ekran"}
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-1.5 text-sm font-medium text-slate-200 transition-colors hover:border-white/40 hover:text-white"
          >
            {isFullscreen ? (
              <>
                <Minimize2 size={16} aria-hidden="true" />
                <span className="hidden sm:inline">Çıkış</span>
              </>
            ) : (
              <>
                <Maximize2 size={16} aria-hidden="true" />
                <span className="hidden sm:inline">Tam Ekran</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Yatay hafta çubuğu */}
      <div className="mindmap-scroll flex shrink-0 gap-2 overflow-x-auto border-b border-slate-100 bg-slate-50 px-4 py-3">
        {weeks.map((week, i) => {
          const active = i === activeIndex;
          return (
            <button
              key={week.id}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-current={active ? "true" : undefined}
              dir="rtl"
              className={`shrink-0 rounded-lg border px-3 py-1.5 font-arabic text-sm font-semibold transition-colors ${
                active
                  ? "border-ink bg-ink text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
              }`}
            >
              {week.titleAr}
            </button>
          );
        })}
      </div>

      {/* Hafta canvas'ı — kalan alanı tamamen doldurur */}
      <div className="relative min-h-0 w-full flex-1" key={activeWeek.id}>
        <WeekFlowCanvas week={activeWeek} />
      </div>

      {/* Alt navigasyon */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-100 px-5 py-4">
        <button
          type="button"
          onClick={goPrev}
          disabled={activeIndex <= 0}
          className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-ink-light disabled:cursor-not-allowed disabled:opacity-30"
        >
          <span aria-hidden="true">&#9664;</span>
          Önceki Hafta
        </button>

        <span className="text-sm font-semibold text-surface-muted">
          {activeIndex + 1} / {weeks.length}
        </span>

        <button
          type="button"
          onClick={goNext}
          disabled={activeIndex >= weeks.length - 1}
          className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-ink-light disabled:cursor-not-allowed disabled:opacity-30"
        >
          Sonraki Hafta
          <span aria-hidden="true">&#9654;</span>
        </button>
      </div>
    </div>
  );
}
