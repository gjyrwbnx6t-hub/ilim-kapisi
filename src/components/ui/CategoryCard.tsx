import Link from "next/link";
import type { Category } from "@/lib/types";

interface CategoryCardProps {
  category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  const isComingSoon = category.status === "coming-soon";
  const href = isComingSoon ? "#" : `/kategori/${category.slug}`;

  return (
    <Link
      href={href}
      aria-disabled={isComingSoon}
      className={`group block h-full ${isComingSoon ? "pointer-events-none" : ""}`}
    >
      <article className="flex h-full cursor-pointer flex-col rounded-xl border-t-4 border-primary bg-white p-8 text-center shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:border-accent group-hover:shadow-lg">
        {isComingSoon && (
          <span className="mb-3 inline-block self-center rounded bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-surface-muted">
            Yakında
          </span>
        )}

        <h3 className="mb-2 text-xl font-semibold text-slate-900">{category.title}</h3>
        <p className="text-[0.95rem] text-surface-muted">{category.description}</p>
      </article>
    </Link>
  );
}
