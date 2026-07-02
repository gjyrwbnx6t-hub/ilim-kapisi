import Link from "next/link";
import type { BreadcrumbItem } from "@/lib/types";

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="bg-slate-100 px-[5%] py-6 text-sm text-surface-muted"
    >
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {index > 0 && <span aria-hidden="true">&gt;</span>}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="font-semibold text-primary transition-colors hover:text-primary-dark"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? "text-surface-muted" : "font-semibold text-primary"}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
