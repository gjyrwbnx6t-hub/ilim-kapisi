import type { DepartmentId } from "./departments";

export interface CurriculumGroup {
  titleAr: string;
  courseIds: string[];
}

export interface CurriculumCategory {
  titleAr: string;
  /** Grup yoksa dersler doğrudan buraya yazılır. */
  courseIds?: string[];
  /** Alt gruplar (المجموعة الأولى ...) varsa buraya yazılır. */
  groups?: CurriculumGroup[];
}

export interface Curriculum {
  department: DepartmentId;
  categories: CurriculumCategory[];
}

/**
 * Müfredat sıralaması. Ders bilgisi TEKRAR YAZILMAZ; yalnızca course id ile
 * çağrılır. Ders detayları için bkz. `src/data/courses.ts`.
 */
export const curricula: Curriculum[] = [
  {
    department: "usul-al-fiqh",
    categories: [
      {
        titleAr: "متطلبات الجامعة الاجبارية",
        courseIds: [
          "military-sciences",
          "communication-soft-skills-ar",
          "english-level-3",
          "national-culture",
          "ethics-social-responsibility",
          "entrepreneurship-innovation-leadership",
        ],
      },
      {
        titleAr: "متطلبات الجامعة الاختيارية",
        groups: [
          {
            titleAr: "المجموعة الأولى",
            courseIds: [
              "health-culture",
              "environmental-culture-development",
              "islamic-culture",
              "legal-culture",
              "physical-culture",
              "philosophy-critical-thinking",
              "tourism-culture",
            ],
          },
          {
            titleAr: "المجموعة الثانية",
            courseIds: [
              "social-media",
              "arts-appreciation",
              "foreign-language",
              "arab-islamic-civilization",
              "jordan-history-civilization",
              "special-topic",
              "primary-sources-books",
              "jerusalem",
            ],
          },
          {
            titleAr: "المجموعة الثالثة",
            courseIds: ["special-topic-digital-skills"],
          },
        ],
      },
      {
        titleAr: "متطلبات الكلية الاجبارية",
        courseIds: [
          "modern-digital-skills",
          "quran-sciences",
          "hadith-sciences",
          "fiqh-taharah-salah",
          "fiqh-zakat-sadaqat",
          "islamic-economics-finance-principles",
          "tajweed-1",
          "usul-al-iman",
        ],
      },
      {
        titleAr: "متطلبات التخصص الاجبارية",
        groups: [
          {
            titleAr: "المجموعة الأولى",
            courseIds: [
              "tafsir",
              "fiqh-siyam-hajj-umrah",
              "fiqh-schools",
              "fiqh-muawadat-musharakat",
              "fiqh-tawthiqat-tabaruat",
              "fiqh-ahwal-shakhsiyah-1",
              "research-methods-fiqh",
              "sources-ahkam-usul-fiqh",
              "hukm-shari-fiqh-muwazanat",
              "contemporary-financial-transactions",
              "fiqh-state-islam",
              "fiqh-jordanian-civil-law",
              "fiqh-ahwal-shakhsiyah-2",
              "fiqh-maxims",
              "dalalat-maqasid-shariah",
              "fiqh-ayman-nudhur",
              "fiqh-uqubat",
              "fiqh-qada-ithbat",
              "usul-muhakamat-tawthiqat",
              "career-qualification-program",
              "comparative-fiqh",
              "ijtihad-taqlid",
              "analytical-hadith",
              "tajweed-2",
              "aqidah-nubuwwat-samiyyat",
              "tajweed-teaching-skills",
              "functional-grammar",
            ],
          },
          {
            titleAr: "المجموعة الثانية",
            courseIds: [
              "mosques-waqf-islamic-discourse",
              "textual-studies-fiqh-books",
              "practical-training",
              "islamic-education-methods-shariah",
              "law-principles-shariah",
            ],
          },
        ],
      },
      {
        titleAr: "متطلبات التخصص الاختيارية",
        groups: [
          {
            titleAr: "المجموعة الأولى",
            courseIds: [
              "contemporary-worship-issues",
              "research-skills-electronic-sources",
              "international-relations-islam",
              "education-skills-islam",
              "siyasah-shariah-fiqh-waqi",
              "family-reform-skills",
              "fiqh-studies-english",
              "fatwa-ijtihad-modern",
              "shariah-audit-financial-institutions",
            ],
          },
          {
            titleAr: "المجموعة الثانية",
            courseIds: [
              "sirah-rashidun",
              "sirah-nabawiyyah",
              "hadi-nabawi-akhlaq",
              "quranic-stories",
              "contemporary-intellectual-schools",
              "dawah-dialogue-principles",
              "oratory-preaching-media-skills",
              "religions-sects",
              "hadith-takhrij-isnad-skills",
            ],
          },
        ],
      },
      {
        titleAr: "متطلبات اجبارية عامة",
        courseIds: [
          "computer-basics",
          "tilawah-proficiency-exam",
          "remedial-tilawah-99",
          "placement-computer-skills",
          "arabic-level-1",
          "arabic-level-2",
          "english-level-1",
          "english-level-2",
          "placement-arabic-foreigners",
          "arabic-foreigners-level-1",
          "arabic-foreigners-level-2",
          "initial-placement-arabic",
          "initial-placement-english",
        ],
      },
    ],
  },
  {
    department: "usul-al-din",
    categories: [
      {
        titleAr: "متطلبات الجامعة الاجبارية",
        courseIds: [
          "military-sciences",
          "national-culture",
          "philosophy-critical-thinking",
          "ethics-human-values",
          "entrepreneurship-innovation",
          "life-practical-skills",
        ],
      },
      {
        titleAr: "متطلبات الجامعة الاختيارية",
        groups: [
          {
            titleAr: "المجموعة الأولى",
            courseIds: [
              "islam-contemporary-issues",
              "arab-islamic-civilization",
              "jordan-history-civilization",
              "primary-sources-books",
              "jerusalem",
            ],
          },
          {
            titleAr: "المجموعة الثانية",
            courseIds: [
              "environmental-culture-development",
              "health-culture",
              "legal-culture",
              "physical-culture",
              "digital-culture",
            ],
          },
          {
            titleAr: "المجموعة الثالثة",
            courseIds: [
              "e-commerce",
              "social-media",
              "arts-appreciation",
              "foreign-language",
              "special-topic",
            ],
          },
        ],
      },
      {
        titleAr: "متطلبات الكلية الاجبارية",
        courseIds: [
          "quran-sciences",
          "tilawah-hifz-1",
          "hadith-sciences",
          "intro-islamic-fiqh",
          "hadith-takhrij-isnad",
          "sirah-nabawiyyah",
          "usul-al-iman",
          "tilawah-hifz-2",
          "tilawah-hifz-3",
          "fiqh-taharah-salah-siyam",
          "fiqh-zakat-hajj",
          "computer-skills-humanities",
        ],
      },
      {
        titleAr: "متطلبات التخصص الاجبارية",
        courseIds: [
          "research-methods-usul-din",
          "tafsir",
          "analytical-tafsir",
          "aqidah-asma-sifat",
          "islamic-studies-english",
          "quran-ijaz",
          "mufassirin-methods",
          "jarh-tadil",
          "career-qualification-1",
          "career-qualification-2",
          "hukm-shari-dalalat",
          "analytical-hadith",
          "dawah-oratory-principles",
          "quranic-stories",
          "comparative-religions",
          "islamic-sects",
          "fiqh-ayman-nudhur",
          "aqidah-nubuwwat-samiyyat",
          "bayan-methods-quran",
          "sahihayn-hadiths",
          "muhaddithin-methods",
          "fiqh-muawadat-musharakat",
          "fiqh-ahwal-shakhsiyah-1",
          "nahw-1",
        ],
      },
      {
        titleAr: "متطلبات التخصص الاختيارية",
        courseIds: [
          "sirah-rashidun",
          "thematic-tafsir",
          "intro-usul-fiqh",
          "contemporary-financial-transactions",
          "ijtihad-taqlid",
          "hadi-nabawi-akhlaq",
          "ayat-ahkam",
          "contemporary-intellectual-schools",
          "textual-study-tawhid-books",
          "ahadith-ahkam",
          "fiqh-ahwal-shakhsiyah-2",
          "educational-psychology",
          "communication-sociology",
        ],
      },
      {
        titleAr: "متطلبات اجبارية عامة",
        courseIds: [
          "community-service",
          "tilawah-proficiency-exam",
          "remedial-tilawah-99",
          "placement-computer-skills",
          "computer-basics",
          "arabic-placement",
          "arabic-basics",
          "arabic-skills",
          "english-placement",
          "english-basics",
          "english-skills",
          "placement-arabic-foreigners",
          "arabic-foreigners-level-1",
          "arabic-foreigners-level-2",
        ],
      },
    ],
  },
];

export function getCurriculum(departmentId: DepartmentId): Curriculum | undefined {
  return curricula.find((curriculum) => curriculum.department === departmentId);
}
