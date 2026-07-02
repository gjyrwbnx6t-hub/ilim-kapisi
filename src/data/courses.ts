import type { DepartmentId } from "./departments";
import type { DomainId } from "./domains";

export type CourseStatus = "empty" | "in-progress" | "ready";

export interface Course {
  id: string;
  titleAr: string;
  slug: string;
  departments: DepartmentId[];
  domain: DomainId;
  aliases: string[];
  keywords?: string[];
  status: CourseStatus;
  contentSlug: string;
}

const FIQH: DepartmentId = "usul-al-fiqh";
const DIN: DepartmentId = "usul-al-din";

/**
 * Ortak ders kataloğu. Her ders yalnızca BİR kez tanımlanır.
 * İki bölümde de bulunan dersler `departments` alanında ikisini birden içerir.
 * Aynı dersin farklı Arapça yazımları `aliases` alanına eklenir.
 * `slug` ve `contentSlug` = `id` (tek ders detay sayfası: /courses/[slug]).
 */
export const courses: Course[] = [
  // ---- Ortak / üniversite zorunlu ----
  { id: "military-sciences", titleAr: "العلوم العسكرية", slug: "military-sciences", departments: [FIQH, DIN], domain: "university-culture", aliases: [], status: "empty", contentSlug: "military-sciences" },
  { id: "communication-soft-skills-ar", titleAr: "مهارات التواصل والمهارات الناعمة باللغة العربية", slug: "communication-soft-skills-ar", departments: [FIQH], domain: "language-skills", aliases: [], status: "empty", contentSlug: "communication-soft-skills-ar" },
  { id: "english-level-3", titleAr: "اللغة الإنجليزية (المستوى الثالث)", slug: "english-level-3", departments: [FIQH], domain: "language-skills", aliases: [], status: "empty", contentSlug: "english-level-3" },
  { id: "national-culture", titleAr: "الثقافة الوطنية", slug: "national-culture", departments: [FIQH, DIN], domain: "university-culture", aliases: [], status: "empty", contentSlug: "national-culture" },
  { id: "ethics-social-responsibility", titleAr: "الاخلاق والمسؤولية المجتمعية", slug: "ethics-social-responsibility", departments: [FIQH], domain: "university-culture", aliases: [], status: "empty", contentSlug: "ethics-social-responsibility" },
  { id: "entrepreneurship-innovation-leadership", titleAr: "الريادة والابتكار والقيادة", slug: "entrepreneurship-innovation-leadership", departments: [FIQH], domain: "university-culture", aliases: [], status: "empty", contentSlug: "entrepreneurship-innovation-leadership" },
  { id: "ethics-human-values", titleAr: "الأخلاق والقيم الإنسانية", slug: "ethics-human-values", departments: [DIN], domain: "university-culture", aliases: [], status: "empty", contentSlug: "ethics-human-values" },
  { id: "entrepreneurship-innovation", titleAr: "الريادة والإبتكار", slug: "entrepreneurship-innovation", departments: [DIN], domain: "university-culture", aliases: [], status: "empty", contentSlug: "entrepreneurship-innovation" },
  { id: "life-practical-skills", titleAr: "المهارات الحياتية والعملية", slug: "life-practical-skills", departments: [DIN], domain: "university-culture", aliases: [], status: "empty", contentSlug: "life-practical-skills" },

  // ---- Üniversite seçmeli ----
  { id: "health-culture", titleAr: "الثقافة الصحية", slug: "health-culture", departments: [FIQH, DIN], domain: "university-culture", aliases: [], status: "empty", contentSlug: "health-culture" },
  { id: "environmental-culture-development", titleAr: "الثقافة البيئية والتنمية", slug: "environmental-culture-development", departments: [FIQH, DIN], domain: "university-culture", aliases: [], status: "empty", contentSlug: "environmental-culture-development" },
  { id: "islamic-culture", titleAr: "الثقافة الإسلامية", slug: "islamic-culture", departments: [FIQH], domain: "university-culture", aliases: [], status: "empty", contentSlug: "islamic-culture" },
  { id: "legal-culture", titleAr: "الثقافة القانونية", slug: "legal-culture", departments: [FIQH, DIN], domain: "university-culture", aliases: [], status: "empty", contentSlug: "legal-culture" },
  { id: "physical-culture", titleAr: "الثقافة البدنية", slug: "physical-culture", departments: [FIQH, DIN], domain: "university-culture", aliases: [], status: "empty", contentSlug: "physical-culture" },
  { id: "philosophy-critical-thinking", titleAr: "مقدمة في الفلسفة والتفكير الناقد", slug: "philosophy-critical-thinking", departments: [FIQH, DIN], domain: "university-culture", aliases: [], status: "empty", contentSlug: "philosophy-critical-thinking" },
  { id: "tourism-culture", titleAr: "الثقافة السياحية", slug: "tourism-culture", departments: [FIQH], domain: "university-culture", aliases: [], status: "empty", contentSlug: "tourism-culture" },
  { id: "digital-culture", titleAr: "الثقافة الرقمية", slug: "digital-culture", departments: [DIN], domain: "digital", aliases: [], status: "empty", contentSlug: "digital-culture" },
  { id: "social-media", titleAr: "وسائل التواصل الاجتماعي", slug: "social-media", departments: [FIQH, DIN], domain: "digital", aliases: [], status: "empty", contentSlug: "social-media" },
  { id: "arts-appreciation", titleAr: "تذوق الفنون", slug: "arts-appreciation", departments: [FIQH, DIN], domain: "university-culture", aliases: [], status: "empty", contentSlug: "arts-appreciation" },
  { id: "foreign-language", titleAr: "اللغة الأجنبية", slug: "foreign-language", departments: [FIQH, DIN], domain: "language-skills", aliases: [], status: "empty", contentSlug: "foreign-language" },
  { id: "arab-islamic-civilization", titleAr: "الحضارة العربية الاسلامية", slug: "arab-islamic-civilization", departments: [FIQH, DIN], domain: "university-culture", aliases: [], status: "empty", contentSlug: "arab-islamic-civilization" },
  { id: "jordan-history-civilization", titleAr: "الاردن تاريخ وحضارة", slug: "jordan-history-civilization", departments: [FIQH, DIN], domain: "university-culture", aliases: [], status: "empty", contentSlug: "jordan-history-civilization" },
  { id: "special-topic", titleAr: "موضوع خاص", slug: "special-topic", departments: [FIQH, DIN], domain: "university-culture", aliases: [], status: "empty", contentSlug: "special-topic" },
  { id: "primary-sources-books", titleAr: "أمهات الكتب", slug: "primary-sources-books", departments: [FIQH, DIN], domain: "university-culture", aliases: [], status: "empty", contentSlug: "primary-sources-books" },
  { id: "jerusalem", titleAr: "القدس", slug: "jerusalem", departments: [FIQH, DIN], domain: "university-culture", aliases: [], status: "empty", contentSlug: "jerusalem" },
  { id: "special-topic-digital-skills", titleAr: "موضوع خاص في المهارات الرقمية", slug: "special-topic-digital-skills", departments: [FIQH], domain: "digital", aliases: [], status: "empty", contentSlug: "special-topic-digital-skills" },
  { id: "islam-contemporary-issues", titleAr: "الإسلام وقضايا العصر", slug: "islam-contemporary-issues", departments: [DIN], domain: "university-culture", aliases: [], status: "empty", contentSlug: "islam-contemporary-issues" },
  { id: "e-commerce", titleAr: "التجارة الإلكترونية", slug: "e-commerce", departments: [DIN], domain: "digital", aliases: [], status: "empty", contentSlug: "e-commerce" },

  // ---- Fakülte zorunlu ----
  { id: "modern-digital-skills", titleAr: "المهارات الرقمية الحديثة", slug: "modern-digital-skills", departments: [FIQH], domain: "digital", aliases: [], status: "empty", contentSlug: "modern-digital-skills" },
  { id: "computer-skills-humanities", titleAr: "المهارات الحاسوبية للكليات الانسانية", slug: "computer-skills-humanities", departments: [DIN], domain: "digital", aliases: [], status: "empty", contentSlug: "computer-skills-humanities" },
  { id: "quran-sciences", titleAr: "علوم القران", slug: "quran-sciences", departments: [FIQH, DIN], domain: "quran-tafsir", aliases: [], status: "empty", contentSlug: "quran-sciences" },
  { id: "hadith-sciences", titleAr: "علوم الحديث", slug: "hadith-sciences", departments: [FIQH, DIN], domain: "hadith", aliases: [], status: "empty", contentSlug: "hadith-sciences" },
  { id: "usul-al-iman", titleAr: "اصول الايمان", slug: "usul-al-iman", departments: [FIQH, DIN], domain: "aqida", aliases: [], status: "empty", contentSlug: "usul-al-iman" },
  { id: "fiqh-taharah-salah", titleAr: "فقه الطهارة والصلاة", slug: "fiqh-taharah-salah", departments: [FIQH], domain: "fiqh", aliases: [], status: "empty", contentSlug: "fiqh-taharah-salah" },
  { id: "fiqh-zakat-sadaqat", titleAr: "فقه الزكاة والصدقات", slug: "fiqh-zakat-sadaqat", departments: [FIQH], domain: "fiqh", aliases: ["فقة الزكاة والصدقات"], status: "empty", contentSlug: "fiqh-zakat-sadaqat" },
  { id: "islamic-economics-finance-principles", titleAr: "مبادئ الاقتصاد والتمويل الاسلامي", slug: "islamic-economics-finance-principles", departments: [FIQH], domain: "fiqh", aliases: [], status: "empty", contentSlug: "islamic-economics-finance-principles" },
  { id: "tajweed-1", titleAr: "إحكام تجويد القرآن الكريم (1)", slug: "tajweed-1", departments: [FIQH], domain: "quran-tafsir", aliases: [], status: "empty", contentSlug: "tajweed-1" },
  { id: "tilawah-hifz-1", titleAr: "التلاوة والحفظ (1)", slug: "tilawah-hifz-1", departments: [DIN], domain: "quran-tafsir", aliases: ["التلاوه والحفظ (1)"], status: "empty", contentSlug: "tilawah-hifz-1" },
  { id: "tilawah-hifz-2", titleAr: "التلاوة والحفظ (2)", slug: "tilawah-hifz-2", departments: [DIN], domain: "quran-tafsir", aliases: ["التلاوه والحفظ (2)"], status: "empty", contentSlug: "tilawah-hifz-2" },
  { id: "tilawah-hifz-3", titleAr: "التلاوة والحفظ (3)", slug: "tilawah-hifz-3", departments: [DIN], domain: "quran-tafsir", aliases: ["التلاوه والحفظ (3)"], status: "empty", contentSlug: "tilawah-hifz-3" },
  { id: "intro-islamic-fiqh", titleAr: "المدخل الى الفقه الاسلامي", slug: "intro-islamic-fiqh", departments: [DIN], domain: "fiqh", aliases: [], status: "empty", contentSlug: "intro-islamic-fiqh" },
  { id: "hadith-takhrij-isnad", titleAr: "تخريج الاحاديث ودراسة الاسانيد", slug: "hadith-takhrij-isnad", departments: [DIN], domain: "hadith", aliases: [], status: "empty", contentSlug: "hadith-takhrij-isnad" },
  { id: "fiqh-taharah-salah-siyam", titleAr: "فقه الطهارة والصلاة والصيام", slug: "fiqh-taharah-salah-siyam", departments: [DIN], domain: "fiqh", aliases: [], status: "empty", contentSlug: "fiqh-taharah-salah-siyam" },
  { id: "fiqh-zakat-hajj", titleAr: "فقه الزكاة والحج", slug: "fiqh-zakat-hajj", departments: [DIN], domain: "fiqh", aliases: [], status: "empty", contentSlug: "fiqh-zakat-hajj" },

  // ---- Uzmanlık zorunlu ----
  { id: "tafsir", titleAr: "التفسير", slug: "tafsir", departments: [FIQH, DIN], domain: "quran-tafsir", aliases: [], status: "empty", contentSlug: "tafsir" },
  { id: "fiqh-siyam-hajj-umrah", titleAr: "فقه الصيام والحج والعمرة", slug: "fiqh-siyam-hajj-umrah", departments: [FIQH], domain: "fiqh", aliases: [], status: "empty", contentSlug: "fiqh-siyam-hajj-umrah" },
  { id: "fiqh-schools", titleAr: "المذاهب الفقهية", slug: "fiqh-schools", departments: [FIQH], domain: "fiqh", aliases: [], status: "empty", contentSlug: "fiqh-schools" },
  { id: "fiqh-muawadat-musharakat", titleAr: "فقه المعاوضات والمشاركات", slug: "fiqh-muawadat-musharakat", departments: [FIQH, DIN], domain: "fiqh", aliases: [], status: "empty", contentSlug: "fiqh-muawadat-musharakat" },
  { id: "fiqh-tawthiqat-tabaruat", titleAr: "فقه التوثيقات والتبرعات", slug: "fiqh-tawthiqat-tabaruat", departments: [FIQH], domain: "fiqh", aliases: [], status: "empty", contentSlug: "fiqh-tawthiqat-tabaruat" },
  { id: "fiqh-ahwal-shakhsiyah-1", titleAr: "فقه الاحوال الشخصية (1)", slug: "fiqh-ahwal-shakhsiyah-1", departments: [FIQH, DIN], domain: "fiqh", aliases: [], status: "empty", contentSlug: "fiqh-ahwal-shakhsiyah-1" },
  { id: "fiqh-ahwal-shakhsiyah-2", titleAr: "فقه الاحوال الشخصية (2)", slug: "fiqh-ahwal-shakhsiyah-2", departments: [FIQH, DIN], domain: "fiqh", aliases: [], status: "empty", contentSlug: "fiqh-ahwal-shakhsiyah-2" },
  { id: "research-methods-fiqh", titleAr: "مناهج البحث في الفقه واصوله", slug: "research-methods-fiqh", departments: [FIQH], domain: "usul", aliases: [], status: "empty", contentSlug: "research-methods-fiqh" },
  { id: "sources-ahkam-usul-fiqh", titleAr: "مصادر الاحكام في اصول الفقه", slug: "sources-ahkam-usul-fiqh", departments: [FIQH], domain: "usul", aliases: [], status: "empty", contentSlug: "sources-ahkam-usul-fiqh" },
  { id: "hukm-shari-fiqh-muwazanat", titleAr: "الحكم الشرعي وفقه الموازنات", slug: "hukm-shari-fiqh-muwazanat", departments: [FIQH], domain: "usul", aliases: [], status: "empty", contentSlug: "hukm-shari-fiqh-muwazanat" },
  { id: "contemporary-financial-transactions", titleAr: "معاملات مالية معاصرة", slug: "contemporary-financial-transactions", departments: [FIQH, DIN], domain: "fiqh", aliases: ["معاملات ماليه معاصره"], status: "empty", contentSlug: "contemporary-financial-transactions" },
  { id: "fiqh-state-islam", titleAr: "فقه الدولة في الاسلام", slug: "fiqh-state-islam", departments: [FIQH], domain: "law-politics", aliases: [], status: "empty", contentSlug: "fiqh-state-islam" },
  { id: "fiqh-jordanian-civil-law", titleAr: "فقه القانون المدني الاردني", slug: "fiqh-jordanian-civil-law", departments: [FIQH], domain: "law-politics", aliases: [], status: "empty", contentSlug: "fiqh-jordanian-civil-law" },
  { id: "fiqh-maxims", titleAr: "القواعد الفقهية", slug: "fiqh-maxims", departments: [FIQH], domain: "usul", aliases: [], status: "empty", contentSlug: "fiqh-maxims" },
  { id: "dalalat-maqasid-shariah", titleAr: "الدلالات ومقاصد الشريعة", slug: "dalalat-maqasid-shariah", departments: [FIQH], domain: "usul", aliases: [], status: "empty", contentSlug: "dalalat-maqasid-shariah" },
  { id: "fiqh-ayman-nudhur", titleAr: "فقه الأيمان والنذور والحظر والإباحة", slug: "fiqh-ayman-nudhur", departments: [FIQH, DIN], domain: "fiqh", aliases: ["فقه الايمان والنذور والحظر والاباحه"], status: "empty", contentSlug: "fiqh-ayman-nudhur" },
  { id: "fiqh-uqubat", titleAr: "فقه العقوبات", slug: "fiqh-uqubat", departments: [FIQH], domain: "fiqh", aliases: [], status: "empty", contentSlug: "fiqh-uqubat" },
  { id: "fiqh-qada-ithbat", titleAr: "فقه القضاء وطرق الاثبات", slug: "fiqh-qada-ithbat", departments: [FIQH], domain: "law-politics", aliases: [], status: "empty", contentSlug: "fiqh-qada-ithbat" },
  { id: "usul-muhakamat-tawthiqat", titleAr: "اصول المحاكمات والتوثيقات", slug: "usul-muhakamat-tawthiqat", departments: [FIQH], domain: "law-politics", aliases: [], status: "empty", contentSlug: "usul-muhakamat-tawthiqat" },
  { id: "career-qualification-program", titleAr: "برنامج التأهيل الوظيفي", slug: "career-qualification-program", departments: [FIQH], domain: "training", aliases: [], status: "empty", contentSlug: "career-qualification-program" },
  { id: "comparative-fiqh", titleAr: "الفقه المقارن", slug: "comparative-fiqh", departments: [FIQH], domain: "fiqh", aliases: [], status: "empty", contentSlug: "comparative-fiqh" },
  { id: "ijtihad-taqlid", titleAr: "الاجتهاد والتقليد والتعارض والترجيح", slug: "ijtihad-taqlid", departments: [FIQH, DIN], domain: "usul", aliases: [], status: "empty", contentSlug: "ijtihad-taqlid" },
  { id: "analytical-hadith", titleAr: "الحديث التحليلي", slug: "analytical-hadith", departments: [FIQH, DIN], domain: "hadith", aliases: [], status: "empty", contentSlug: "analytical-hadith" },
  { id: "tajweed-2", titleAr: "إحكام تجويد القرآن الكريم (2)", slug: "tajweed-2", departments: [FIQH], domain: "quran-tafsir", aliases: [], status: "empty", contentSlug: "tajweed-2" },
  { id: "aqidah-nubuwwat-samiyyat", titleAr: "عقيدة النبوات والسمعيات", slug: "aqidah-nubuwwat-samiyyat", departments: [FIQH, DIN], domain: "aqida", aliases: [], status: "empty", contentSlug: "aqidah-nubuwwat-samiyyat" },
  { id: "tajweed-teaching-skills", titleAr: "مهارات تجويد القرآن الكريم وتدريسه", slug: "tajweed-teaching-skills", departments: [FIQH], domain: "quran-tafsir", aliases: [], status: "empty", contentSlug: "tajweed-teaching-skills" },
  { id: "functional-grammar", titleAr: "النحو الوظيفي", slug: "functional-grammar", departments: [FIQH], domain: "language-skills", aliases: [], status: "empty", contentSlug: "functional-grammar" },
  { id: "mosques-waqf-islamic-discourse", titleAr: "احكام المساجد والوقف ومهارات الخطاب الاسلامي", slug: "mosques-waqf-islamic-discourse", departments: [FIQH], domain: "law-politics", aliases: [], status: "empty", contentSlug: "mosques-waqf-islamic-discourse" },
  { id: "textual-studies-fiqh-books", titleAr: "دراسات نصية في كتب الفقه", slug: "textual-studies-fiqh-books", departments: [FIQH], domain: "fiqh", aliases: [], status: "empty", contentSlug: "textual-studies-fiqh-books" },
  { id: "practical-training", titleAr: "التدريب العملي", slug: "practical-training", departments: [FIQH], domain: "training", aliases: [], status: "empty", contentSlug: "practical-training" },
  { id: "islamic-education-methods-shariah", titleAr: "مناهج التربية الاسلامية واساليب تدريسها (لطلبة الشريعة)", slug: "islamic-education-methods-shariah", departments: [FIQH], domain: "training", aliases: [], status: "empty", contentSlug: "islamic-education-methods-shariah" },
  { id: "law-principles-shariah", titleAr: "مبادئ القانون (لطلبة الشريعة)", slug: "law-principles-shariah", departments: [FIQH], domain: "law-politics", aliases: [], status: "empty", contentSlug: "law-principles-shariah" },

  // ---- Din Usûlü uzmanlık zorunlu (fiqh ile ortak olmayanlar) ----
  { id: "research-methods-usul-din", titleAr: "مناهج البحث في علوم اصول الدين", slug: "research-methods-usul-din", departments: [DIN], domain: "usul", aliases: [], status: "empty", contentSlug: "research-methods-usul-din" },
  { id: "analytical-tafsir", titleAr: "التفسير التحليلي", slug: "analytical-tafsir", departments: [DIN], domain: "quran-tafsir", aliases: [], status: "empty", contentSlug: "analytical-tafsir" },
  { id: "aqidah-asma-sifat", titleAr: "عقيدة الاسماء والصفات", slug: "aqidah-asma-sifat", departments: [DIN], domain: "aqida", aliases: [], status: "empty", contentSlug: "aqidah-asma-sifat" },
  { id: "islamic-studies-english", titleAr: "دراسات اسلامية باللغة الانجليزية", slug: "islamic-studies-english", departments: [DIN], domain: "language-skills", aliases: [], status: "empty", contentSlug: "islamic-studies-english" },
  { id: "quran-ijaz", titleAr: "اعجاز القران", slug: "quran-ijaz", departments: [DIN], domain: "quran-tafsir", aliases: [], status: "empty", contentSlug: "quran-ijaz" },
  { id: "mufassirin-methods", titleAr: "مناهج المفسرين", slug: "mufassirin-methods", departments: [DIN], domain: "quran-tafsir", aliases: [], status: "empty", contentSlug: "mufassirin-methods" },
  { id: "jarh-tadil", titleAr: "الجرح والتعديل", slug: "jarh-tadil", departments: [DIN], domain: "hadith", aliases: [], status: "empty", contentSlug: "jarh-tadil" },
  { id: "career-qualification-1", titleAr: "برنامج التاهيل الوظيفي (1)", slug: "career-qualification-1", departments: [DIN], domain: "training", aliases: [], status: "empty", contentSlug: "career-qualification-1" },
  { id: "career-qualification-2", titleAr: "برنامج التاهيل الوظيفي (2)", slug: "career-qualification-2", departments: [DIN], domain: "training", aliases: [], status: "empty", contentSlug: "career-qualification-2" },
  { id: "hukm-shari-dalalat", titleAr: "الحكم الشرعي والدلالات", slug: "hukm-shari-dalalat", departments: [DIN], domain: "usul", aliases: [], status: "empty", contentSlug: "hukm-shari-dalalat" },
  { id: "dawah-oratory-principles", titleAr: "أصول الدعوة والخطابة", slug: "dawah-oratory-principles", departments: [DIN], domain: "dawah-sira", aliases: [], status: "empty", contentSlug: "dawah-oratory-principles" },
  { id: "quranic-stories", titleAr: "القصص القراني", slug: "quranic-stories", departments: [FIQH, DIN], domain: "quran-tafsir", aliases: [], status: "empty", contentSlug: "quranic-stories" },
  { id: "comparative-religions", titleAr: "مقارنة الاديان", slug: "comparative-religions", departments: [DIN], domain: "aqida", aliases: [], status: "empty", contentSlug: "comparative-religions" },
  { id: "islamic-sects", titleAr: "الفرق الاسلامية", slug: "islamic-sects", departments: [DIN], domain: "aqida", aliases: [], status: "empty", contentSlug: "islamic-sects" },
  { id: "bayan-methods-quran", titleAr: "اساليب البيان في القران الكريم", slug: "bayan-methods-quran", departments: [DIN], domain: "quran-tafsir", aliases: [], status: "empty", contentSlug: "bayan-methods-quran" },
  { id: "sahihayn-hadiths", titleAr: "أحاديث الصحيحين", slug: "sahihayn-hadiths", departments: [DIN], domain: "hadith", aliases: [], status: "empty", contentSlug: "sahihayn-hadiths" },
  { id: "muhaddithin-methods", titleAr: "مناهج المحدثين", slug: "muhaddithin-methods", departments: [DIN], domain: "hadith", aliases: [], status: "empty", contentSlug: "muhaddithin-methods" },
  { id: "nahw-1", titleAr: "علم النحو (1)", slug: "nahw-1", departments: [DIN], domain: "language-skills", aliases: [], status: "empty", contentSlug: "nahw-1" },

  // ---- Uzmanlık seçmeli ----
  { id: "contemporary-worship-issues", titleAr: "قضايا مستجدة في العبادات", slug: "contemporary-worship-issues", departments: [FIQH], domain: "fiqh", aliases: [], status: "empty", contentSlug: "contemporary-worship-issues" },
  { id: "research-skills-electronic-sources", titleAr: "مهارات البحث العلمي في المصادر الالكترونية", slug: "research-skills-electronic-sources", departments: [FIQH], domain: "language-skills", aliases: [], status: "empty", contentSlug: "research-skills-electronic-sources" },
  { id: "international-relations-islam", titleAr: "العلاقات الدولية في الاسلام", slug: "international-relations-islam", departments: [FIQH], domain: "law-politics", aliases: [], status: "empty", contentSlug: "international-relations-islam" },
  { id: "education-skills-islam", titleAr: "مهارات التربية في الاسلام", slug: "education-skills-islam", departments: [FIQH], domain: "training", aliases: [], status: "empty", contentSlug: "education-skills-islam" },
  { id: "siyasah-shariah-fiqh-waqi", titleAr: "السياسة الشرعية وفقه الواقع", slug: "siyasah-shariah-fiqh-waqi", departments: [FIQH], domain: "law-politics", aliases: [], status: "empty", contentSlug: "siyasah-shariah-fiqh-waqi" },
  { id: "family-reform-skills", titleAr: "مهارات الاصلاح الاسري الشرعي", slug: "family-reform-skills", departments: [FIQH], domain: "training", aliases: [], status: "empty", contentSlug: "family-reform-skills" },
  { id: "fiqh-studies-english", titleAr: "دراسات فقهية باللغة الانجليزية", slug: "fiqh-studies-english", departments: [FIQH], domain: "language-skills", aliases: [], status: "empty", contentSlug: "fiqh-studies-english" },
  { id: "fatwa-ijtihad-modern", titleAr: "صناعة الفتوى والاجتهاد في العصر الحديث", slug: "fatwa-ijtihad-modern", departments: [FIQH], domain: "usul", aliases: [], status: "empty", contentSlug: "fatwa-ijtihad-modern" },
  { id: "shariah-audit-financial-institutions", titleAr: "الرقابة والتدقيق الشرعي في المؤسسات المالية الاسلامية", slug: "shariah-audit-financial-institutions", departments: [FIQH], domain: "fiqh", aliases: [], status: "empty", contentSlug: "shariah-audit-financial-institutions" },
  { id: "sirah-rashidun", titleAr: "سيرة الخلفاء الراشدين", slug: "sirah-rashidun", departments: [FIQH, DIN], domain: "dawah-sira", aliases: [], status: "empty", contentSlug: "sirah-rashidun" },
  { id: "sirah-nabawiyyah", titleAr: "السيرة النبوية", slug: "sirah-nabawiyyah", departments: [FIQH, DIN], domain: "dawah-sira", aliases: [], status: "empty", contentSlug: "sirah-nabawiyyah" },
  { id: "hadi-nabawi-akhlaq", titleAr: "الهدي النبوي في الاخلاق والادب والرقائق", slug: "hadi-nabawi-akhlaq", departments: [FIQH, DIN], domain: "dawah-sira", aliases: [], status: "empty", contentSlug: "hadi-nabawi-akhlaq" },
  { id: "contemporary-intellectual-schools", titleAr: "مذاهب فكرية معاصرة", slug: "contemporary-intellectual-schools", departments: [FIQH, DIN], domain: "aqida", aliases: [], status: "empty", contentSlug: "contemporary-intellectual-schools" },
  { id: "dawah-dialogue-principles", titleAr: "اصول الدعوة وآداب الحوار في الاسلام", slug: "dawah-dialogue-principles", departments: [FIQH], domain: "dawah-sira", aliases: [], status: "empty", contentSlug: "dawah-dialogue-principles" },
  { id: "oratory-preaching-media-skills", titleAr: "مهارات الخطابة والوعظ والتواصل الاعلامي", slug: "oratory-preaching-media-skills", departments: [FIQH], domain: "dawah-sira", aliases: [], status: "empty", contentSlug: "oratory-preaching-media-skills" },
  { id: "religions-sects", titleAr: "أديان وفرق", slug: "religions-sects", departments: [FIQH], domain: "aqida", aliases: [], status: "empty", contentSlug: "religions-sects" },
  { id: "hadith-takhrij-isnad-skills", titleAr: "مهارات تخريج الاحاديث ودراسة الاسانيد", slug: "hadith-takhrij-isnad-skills", departments: [FIQH], domain: "hadith", aliases: [], status: "empty", contentSlug: "hadith-takhrij-isnad-skills" },
  { id: "thematic-tafsir", titleAr: "التفسير الموضوعي", slug: "thematic-tafsir", departments: [DIN], domain: "quran-tafsir", aliases: [], status: "empty", contentSlug: "thematic-tafsir" },
  { id: "intro-usul-fiqh", titleAr: "المدخل الى اصول الفقه الاسلامي", slug: "intro-usul-fiqh", departments: [DIN], domain: "usul", aliases: [], status: "empty", contentSlug: "intro-usul-fiqh" },
  { id: "ayat-ahkam", titleAr: "ايات الاحكام", slug: "ayat-ahkam", departments: [DIN], domain: "quran-tafsir", aliases: [], status: "empty", contentSlug: "ayat-ahkam" },
  { id: "textual-study-tawhid-books", titleAr: "دراسة نصية في كتب التوحيد", slug: "textual-study-tawhid-books", departments: [DIN], domain: "aqida", aliases: [], status: "empty", contentSlug: "textual-study-tawhid-books" },
  { id: "ahadith-ahkam", titleAr: "أحاديث الاحكام", slug: "ahadith-ahkam", departments: [DIN], domain: "hadith", aliases: [], status: "empty", contentSlug: "ahadith-ahkam" },
  { id: "educational-psychology", titleAr: "علم النفس التربوي", slug: "educational-psychology", departments: [DIN], domain: "university-culture", aliases: [], status: "empty", contentSlug: "educational-psychology" },
  { id: "communication-sociology", titleAr: "علم اجتماع الاتصال", slug: "communication-sociology", departments: [DIN], domain: "university-culture", aliases: [], status: "empty", contentSlug: "communication-sociology" },

  // ---- Genel zorunlu (sınav / dil / seviye) ----
  { id: "computer-basics", titleAr: "أساسيات الحاسوب", slug: "computer-basics", departments: [FIQH, DIN], domain: "digital", aliases: [], status: "empty", contentSlug: "computer-basics" },
  { id: "tilawah-proficiency-exam", titleAr: "امتحان الكفاءة في التلاوة", slug: "tilawah-proficiency-exam", departments: [FIQH, DIN], domain: "quran-tafsir", aliases: [], status: "empty", contentSlug: "tilawah-proficiency-exam" },
  { id: "remedial-tilawah-99", titleAr: "التلاوة الاستدراكية (99)", slug: "remedial-tilawah-99", departments: [FIQH, DIN], domain: "quran-tafsir", aliases: [], status: "empty", contentSlug: "remedial-tilawah-99" },
  { id: "placement-computer-skills", titleAr: "الامتحان التصنيفي في مهارات الحاسوب", slug: "placement-computer-skills", departments: [FIQH, DIN], domain: "digital", aliases: [], status: "empty", contentSlug: "placement-computer-skills" },
  { id: "placement-arabic-foreigners", titleAr: "الامتحان التصنيفي في اللغة العربية (للأجانب في تخصصات تدرس بالعربية)", slug: "placement-arabic-foreigners", departments: [FIQH, DIN], domain: "language-skills", aliases: [], status: "empty", contentSlug: "placement-arabic-foreigners" },
  { id: "arabic-foreigners-level-1", titleAr: "المستوى (1) في اللغة العربية (للأجانب في تخصصات تدرس بالعربية)", slug: "arabic-foreigners-level-1", departments: [FIQH, DIN], domain: "language-skills", aliases: [], status: "empty", contentSlug: "arabic-foreigners-level-1" },
  { id: "arabic-foreigners-level-2", titleAr: "المستوى (2) في اللغة العربية (للأجانب في تخصصات تدرس بالعربية)", slug: "arabic-foreigners-level-2", departments: [FIQH, DIN], domain: "language-skills", aliases: [], status: "empty", contentSlug: "arabic-foreigners-level-2" },
  { id: "arabic-level-1", titleAr: "اللغة العربية (المستوى الاول)", slug: "arabic-level-1", departments: [FIQH], domain: "language-skills", aliases: [], status: "empty", contentSlug: "arabic-level-1" },
  { id: "arabic-level-2", titleAr: "اللغة العربية (المستوى الثاني)", slug: "arabic-level-2", departments: [FIQH], domain: "language-skills", aliases: [], status: "empty", contentSlug: "arabic-level-2" },
  { id: "english-level-1", titleAr: "اللغة الإنجليزية (المستوى الاول)", slug: "english-level-1", departments: [FIQH], domain: "language-skills", aliases: [], status: "empty", contentSlug: "english-level-1" },
  { id: "english-level-2", titleAr: "اللغة الإنجليزية (المستوى الثاني)", slug: "english-level-2", departments: [FIQH], domain: "language-skills", aliases: [], status: "empty", contentSlug: "english-level-2" },
  { id: "initial-placement-arabic", titleAr: "الامتحان التصنيفي الاولي في اللغة العربية", slug: "initial-placement-arabic", departments: [FIQH], domain: "language-skills", aliases: [], status: "empty", contentSlug: "initial-placement-arabic" },
  { id: "initial-placement-english", titleAr: "الامتحان التصنيفي الاولي في اللغة الإنجليزية", slug: "initial-placement-english", departments: [FIQH], domain: "language-skills", aliases: [], status: "empty", contentSlug: "initial-placement-english" },
  { id: "community-service", titleAr: "خدمة المجتمع", slug: "community-service", departments: [DIN], domain: "training", aliases: [], status: "empty", contentSlug: "community-service" },
  { id: "arabic-placement", titleAr: "الامتحان التصنيفي في اللغة العربية", slug: "arabic-placement", departments: [DIN], domain: "language-skills", aliases: [], status: "empty", contentSlug: "arabic-placement" },
  { id: "arabic-basics", titleAr: "أساسيات اللغة العربية", slug: "arabic-basics", departments: [DIN], domain: "language-skills", aliases: [], status: "empty", contentSlug: "arabic-basics" },
  { id: "arabic-skills", titleAr: "مهارات اللغة العربية", slug: "arabic-skills", departments: [DIN], domain: "language-skills", aliases: [], status: "empty", contentSlug: "arabic-skills" },
  { id: "english-placement", titleAr: "الامتحان التصنيفي في اللغة الإنجليزية", slug: "english-placement", departments: [DIN], domain: "language-skills", aliases: [], status: "empty", contentSlug: "english-placement" },
  { id: "english-basics", titleAr: "أساسيات اللغة الإنجليزية", slug: "english-basics", departments: [DIN], domain: "language-skills", aliases: [], status: "empty", contentSlug: "english-basics" },
  { id: "english-skills", titleAr: "مهارات اللغة الإنجليزية", slug: "english-skills", departments: [DIN], domain: "language-skills", aliases: [], status: "empty", contentSlug: "english-skills" },
];

const courseById = new Map(courses.map((course) => [course.id, course]));
const courseBySlug = new Map(courses.map((course) => [course.slug, course]));

export function getCourseById(id: string): Course | undefined {
  return courseById.get(id);
}

export function getCourseBySlug(slug: string): Course | undefined {
  return courseBySlug.get(slug);
}

export function countCoursesByDepartment(departmentId: DepartmentId): number {
  return courses.filter((course) => course.departments.includes(departmentId)).length;
}
