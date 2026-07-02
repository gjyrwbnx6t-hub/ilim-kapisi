import Link from "next/link";
import type { Course } from "@/data/courses";
import { DOMAIN_META } from "@/data/domains";
import { DOMAIN_ICONS } from "@/data/domainIcons";
import StatusBadge from "./StatusBadge";

export default function CourseCard({ course }: { course: Course }) {
  const isShared = course.departments.length > 1;
  const domain = DOMAIN_META[course.domain];
  const DomainIcon = DOMAIN_ICONS[course.domain];

  // #region agent log
  void fetch('http://127.0.0.1:7352/ingest/3c34793a-6080-4c09-b4f5-c17bc4dbf25b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'e3b22a'},body:JSON.stringify({sessionId:'e3b22a',runId:'initial',hypothesisId:'H1,H2,H4',location:'src/components/ui/CourseCard.tsx:14',message:'course card render inputs',data:{courseId:course.id,slug:course.slug,domainId:course.domain,departments:course.departments,status:course.status,hasDomain:Boolean(domain),hasIcon:Boolean(DomainIcon),domainKeys:domain?Object.keys(domain):[]},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

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
