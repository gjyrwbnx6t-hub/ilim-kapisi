"use client";

import { useCallback, useEffect, useRef } from "react";
import { logActivity } from "@/lib/activity";

export type StudyModuleId = "vocab" | "mindmap" | "rearapca";

const MIN_LOG_SECONDS = 10;

interface StudyTimeTrackerOptions {
  courseSlug: string;
  module: StudyModuleId;
  moduleLabel: string;
  enabled?: boolean;
}

export function useStudyTimeTracker({
  courseSlug,
  module,
  moduleLabel,
  enabled = true,
}: StudyTimeTrackerOptions) {
  const startedAtRef = useRef(Date.now());
  const flushedRef = useRef(false);

  const flush = useCallback(() => {
    if (!enabled || flushedRef.current) return;

    const durationSeconds = Math.floor((Date.now() - startedAtRef.current) / 1000);
    if (durationSeconds < MIN_LOG_SECONDS) return;

    flushedRef.current = true;
    logActivity({
      type: "visit",
      courseSlug,
      metadata: {
        action: "time_spent",
        durationSeconds,
        module,
        moduleLabel,
      },
    });
  }, [courseSlug, enabled, module, moduleLabel]);

  useEffect(() => {
    if (!enabled) return;

    startedAtRef.current = Date.now();
    flushedRef.current = false;

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") flush();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", flush);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [courseSlug, enabled, flush, module, moduleLabel]);
}
