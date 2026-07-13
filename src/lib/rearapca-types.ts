import type { Course } from "@/data/courses";
import type { DomainId } from "@/data/domains";
import type { VocabularySummary } from "@/lib/content";

export interface RearapcaCourseItem {
  course: Course;
  summary: VocabularySummary;
}

export interface RearapcaDomainGroup {
  domainId: DomainId;
  labelTr: string;
  labelAr: string;
  items: RearapcaCourseItem[];
}

export type RearapcaDomainFilter = "all" | DomainId;
