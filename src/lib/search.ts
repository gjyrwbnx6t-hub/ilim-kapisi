import type { Course } from "@/data/courses";
import { DOMAIN_META } from "@/data/domains";
import { getDepartmentById } from "@/data/departments";

/**
 * Arapça normalizasyon:
 * - harekeleri ve tatweel (ـ) karakterini yok say
 * - أ / إ / آ / ٱ → ا
 * - ى → ي, ؤ → و, ئ → ي
 * - ة → ه (ة/ه farkını tolere et)
 */
export function normalizeArabic(input: string): string {
  return input
    .replace(/[\u064B-\u0652\u0670\u0653-\u0655]/g, "")
    .replace(/\u0640/g, "")
    .replace(/[\u0623\u0625\u0622\u0671]/g, "\u0627")
    .replace(/\u0649/g, "\u064A")
    .replace(/\u0624/g, "\u0648")
    .replace(/\u0626/g, "\u064A")
    .replace(/\u0629/g, "\u0647");
}

/** Latin için küçük harf (Türkçe farkını yok say) + Arapça normalizasyon + boşluk sadeleştirme. */
export function normalizeText(input: string): string {
  return normalizeArabic(input.toLocaleLowerCase("tr"))
    .replace(/\s+/g, " ")
    .trim();
}

/** Bir ders için aranabilir metin havuzu (normalize edilmiş, tek string). */
export function buildCourseHaystack(course: Course): string {
  const domain = DOMAIN_META[course.domain];
  const departmentTitles = course.departments.flatMap((id) => {
    const department = getDepartmentById(id);
    return department ? [department.titleAr, department.titleTr] : [];
  });

  const parts = [
    course.titleAr,
    ...course.aliases,
    ...(course.keywords ?? []),
    domain.labelTr,
    domain.labelAr,
    ...domain.searchTerms,
    ...departmentTitles,
  ];

  return parts.map(normalizeText).join(" | ");
}

/** Çok kelimeli sorguda tüm kelimelerin havuzda geçmesi (AND) beklenir. */
export function textMatches(haystack: string, query: string): boolean {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return true;

  return normalizedQuery
    .split(" ")
    .filter(Boolean)
    .every((token) => haystack.includes(token));
}
