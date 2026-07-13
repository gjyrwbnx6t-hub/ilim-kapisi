export const FAVORITES_STORAGE_KEY = "ilim-kapisi:favorites";
export const FAVORITES_CHANGED_EVENT = "ilim-kapisi:favorites-changed";

export function readFavoriteSlugs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((s): s is string => typeof s === "string")
      : [];
  } catch {
    return [];
  }
}

export function writeFavoriteSlugs(slugs: string[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(slugs));
  window.dispatchEvent(new Event(FAVORITES_CHANGED_EVENT));
}
