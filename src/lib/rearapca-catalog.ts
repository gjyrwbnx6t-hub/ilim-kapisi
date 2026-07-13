import { courses } from "@/data/courses";
import { DOMAIN_META, DOMAIN_ORDER, type DomainId } from "@/data/domains";
import type { VocabularySummary } from "@/lib/content";
import type { RearapcaCourseItem, RearapcaDomainGroup } from "@/lib/rearapca-types";

export type {
  RearapcaCourseItem,
  RearapcaDomainFilter,
  RearapcaDomainGroup,
} from "@/lib/rearapca-types";

function toItem(
  course: (typeof courses)[number],
  summaryBySlug: Map<string, VocabularySummary>,
): RearapcaCourseItem | null {
  const summary = summaryBySlug.get(course.contentSlug);
  if (!summary) return null;
  return { course, summary };
}

/** Kelime arşivini alan (domain) kategorilerine göre gruplar. */
export function buildRearapcaDomainCatalog(
  summaryBySlug: Map<string, VocabularySummary>,
): RearapcaDomainGroup[] {
  const byDomain = new Map<DomainId, RearapcaCourseItem[]>();

  for (const course of courses) {
    const item = toItem(course, summaryBySlug);
    if (!item) continue;

    const list = byDomain.get(course.domain) ?? [];
    list.push(item);
    byDomain.set(course.domain, list);
  }

  return DOMAIN_ORDER.filter((domainId) => byDomain.has(domainId)).map(
    (domainId) => ({
      domainId,
      labelTr: DOMAIN_META[domainId].labelTr,
      labelAr: DOMAIN_META[domainId].labelAr,
      items: byDomain.get(domainId) ?? [],
    }),
  );
}

export function countDomainCatalogCourses(groups: RearapcaDomainGroup[]): number {
  return groups.reduce((sum, group) => sum + group.items.length, 0);
}
