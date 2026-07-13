import type { Metadata } from "next";
import RearapcaApp from "@/components/rearapca/RearapcaApp";
import { courses } from "@/data/courses";
import { buildRearapcaDomainCatalog } from "@/lib/rearapca-catalog";
import { getVocabularySummary, type VocabularySummary } from "@/lib/content";

export const metadata: Metadata = {
  title: "Rearapça",
  description: "Arapça kelime öğrenme ve tekrar uygulaması.",
};

export default function RearapcaPage() {
  const summaryBySlug = new Map<string, VocabularySummary>(
    courses.map((course) => [
      course.contentSlug,
      getVocabularySummary(course.contentSlug),
    ]),
  );

  const domainGroups = buildRearapcaDomainCatalog(summaryBySlug);
  const readyCount = courses.filter((course) =>
    summaryBySlug.get(course.contentSlug)?.hasVocabulary,
  ).length;

  return (
    <RearapcaApp
      domainGroups={domainGroups}
      readyCount={readyCount}
    />
  );
}
