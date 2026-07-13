export const REARAPCA_SELECTED_COURSES_KEY = "rearapca-selected-course-slugs";

export function readSelectedCourseSlugs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(REARAPCA_SELECTED_COURSES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export function writeSelectedCourseSlugs(slugs: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      REARAPCA_SELECTED_COURSES_KEY,
      JSON.stringify(slugs),
    );
  } catch {
    // localStorage kapalıysa sessizce devam et
  }
}
