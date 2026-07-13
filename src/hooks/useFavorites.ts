"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FAVORITES_CHANGED_EVENT,
  FAVORITES_STORAGE_KEY,
  readFavoriteSlugs,
  writeFavoriteSlugs,
} from "@/lib/favorites";

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const sync = () => setFavorites(readFavoriteSlugs());
    sync();

    const onStorage = (e: StorageEvent) => {
      if (e.key === FAVORITES_STORAGE_KEY) sync();
    };

    window.addEventListener(FAVORITES_CHANGED_EVENT, sync);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(FAVORITES_CHANGED_EVENT, sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const isFavorite = useCallback(
    (slug: string) => favorites.includes(slug),
    [favorites],
  );

  const toggle = useCallback((slug: string) => {
    setFavorites((prev) => {
      const next = prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : [...prev, slug];
      writeFavoriteSlugs(next);
      return next;
    });
  }, []);

  return { favorites, isFavorite, toggle };
}
