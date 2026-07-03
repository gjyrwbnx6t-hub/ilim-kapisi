import Link from "next/link";
import type { Course } from "@/data/courses";
import { DOMAIN_META } from "@/data/domains";
import { DOMAIN_ICONS } from "@/data/domainIcons";
import StatusBadge from "./StatusBadge";

export default function CourseCard({ course }: { course: Course }) {
  const isShared = course.departments.length > 1;
  const domain = DOMAIN_META[course.domain];
  const DomainIcon = DOMAIN_ICONS[course.domain];

  return (
    <Link href={`/courses/${course.slug}`} className="group block h-full">
      <article
        className={`flex h-full flex-col justify-between rounded-lg border border-slate-200 border-l-[6px] ${domain.borderClass} ${domain.cardTintClass} p-5 transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg`}
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <StatusBadge status={course.status} />
          {isShared && (
            <span
              dir="rtl"
              className="rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-semibold text-primary"
              title="İki bölümde de ortak ders"
            >
              مشترك
            </span>
          )}
        </div>

        <div
          className={`mb-3 flex h-10 w-10 items-center justify-center rounded-full ${domain.iconBgClass}`}
        >
          <DomainIcon className={`h-5 w-5 ${domain.iconClass}`} strokeWidth={2} />
        </div>

        <h3
          dir="rtl"
          className="text-right font-arabic text-lg font-extrabold leading-relaxed text-slate-900 transition-colors group-hover:text-primary"
        >
          {course.titleAr}
        </h3>

        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          <span
            className={`rounded px-2 py-0.5 text-xs font-semibold ${domain.badgeClass}`}
          >
            {domain.labelTr}
          </span>
        </div>
      </article>
    </Link>
  );
}
