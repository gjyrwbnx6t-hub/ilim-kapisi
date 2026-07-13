import { courses } from "@/data/courses";
import { getVocabulary } from "@/lib/content";
import { buildLearnWordPool, type LearnWordEntry, type RearapcaReadySet } from "@/lib/rearapca-learn";

export function getRearapcaReadySets(courseSlugs?: string[]): RearapcaReadySet[] {
  const selected = courseSlugs?.length ? new Set(courseSlugs) : null;

  return courses
    .map((course) => {
      if (selected && !selected.has(course.slug)) return null;
      const set = getVocabulary(course.contentSlug);
      if (!set) return null;
      return {
        courseSlug: course.slug,
        courseTitleAr: course.titleAr,
        titleTr: set.titleTr,
        frontDir: set.frontDir ?? "rtl",
        units: set.units,
      };
    })
    .filter((set): set is RearapcaReadySet => Boolean(set));
}

export function getRearapcaWordPool(courseSlugs?: string[]): LearnWordEntry[] {
  return buildLearnWordPool(getRearapcaReadySets(courseSlugs));
}

export function getRearapcaWordById(wordId: string): LearnWordEntry | undefined {
  return getRearapcaWordPool().find((word) => word.key === wordId);
}
