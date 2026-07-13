import { DEFAULT_REARAPCA_DAILY_GOAL } from "@/lib/rearapca-srs.mjs";

export const REARAPCA_DAILY_GOAL_STORAGE_KEY = "rearapca-daily-goal";
export const REARAPCA_DAILY_GOAL_COURSE = "rearapca";
export const REARAPCA_DAILY_GOAL_MODULE = "daily_goal";

export function clampDailyGoal(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_REARAPCA_DAILY_GOAL;
  }
  return Math.max(1, Math.min(100, Math.round(value)));
}

export function readDailyGoalFromStorage(): number {
  if (typeof window === "undefined") return DEFAULT_REARAPCA_DAILY_GOAL;
  try {
    const raw = window.localStorage.getItem(REARAPCA_DAILY_GOAL_STORAGE_KEY);
    if (!raw) return DEFAULT_REARAPCA_DAILY_GOAL;
    return clampDailyGoal(Number.parseInt(raw, 10));
  } catch {
    return DEFAULT_REARAPCA_DAILY_GOAL;
  }
}

export function writeDailyGoalToStorage(goal: number): number {
  const clamped = clampDailyGoal(goal);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(
        REARAPCA_DAILY_GOAL_STORAGE_KEY,
        String(clamped),
      );
    } catch {
      // localStorage kapalıysa sessizce devam et
    }
  }
  return clamped;
}
