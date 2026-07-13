"use client";

import { useFavorites } from "@/hooks/useFavorites";

interface FavoriteStarProps {
  slug: string;
  className?: string;
  size?: "sm" | "md";
}

export default function FavoriteStar({
  slug,
  className = "",
  size = "md",
}: FavoriteStarProps) {
  const { isFavorite, toggle } = useFavorites();
  const active = isFavorite(slug);
  const dim = size === "sm" ? "h-5 w-5" : "h-6 w-6";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(slug);
      }}
      aria-label={active ? "Favorilerden çıkar" : "Favorilere ekle"}
      aria-pressed={active}
      title={active ? "Favorilerden çıkar" : "Favorilere ekle"}
      className={`shrink-0 rounded-full p-1 transition-colors hover:bg-amber-50 ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className={`${dim} transition-colors ${
          active
            ? "fill-amber-400 text-amber-400"
            : "fill-none text-slate-400 hover:text-amber-500"
        }`}
        stroke="currentColor"
        strokeWidth={1.75}
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
        />
      </svg>
    </button>
  );
}
