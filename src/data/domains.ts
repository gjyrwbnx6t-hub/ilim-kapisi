export type DomainId =
  | "fiqh"
  | "usul"
  | "hadith"
  | "quran-tafsir"
  | "aqida"
  | "dawah-sira"
  | "law-politics"
  | "language-skills"
  | "university-culture"
  | "digital"
  | "training";

export interface DomainMeta {
  labelTr: string;
  labelAr: string;
  /** Kart border tonu + sol kenar vurgu border rengi. */
  borderClass: string;
  /** Yarı şeffaf alan rozeti (arka plan + metin). */
  badgeClass: string;
  /** Yumuşak ikon arka planı (dairesel ikon alanı). */
  iconBgClass: string;
  /** İkonun renk sınıfı. */
  iconClass: string;
  /** Kart arka planına uygulanan çok hafif renk tonu. */
  cardTintClass: string;
  /** Aramada eşleşecek ek terimler (Latin + Arapça eş anlamlılar). */
  searchTerms: string[];
}

/**
 * Tek merkezi domain tablosu. Renkler component içine hard-code edilmez;
 * kartlar ve filtreler bu tablodan okur. Tailwind sınıfları literal string
 * olduğu için JIT tarafından üretilir.
 */
export const DOMAIN_META: Record<DomainId, DomainMeta> = {
  fiqh: {
    labelTr: "Fıkıh",
    labelAr: "الفقه",
    borderClass: "border-green-200 border-l-green-700",
    badgeClass: "bg-green-100 text-green-800",
    iconBgClass: "bg-green-100",
    iconClass: "text-green-700",
    cardTintClass: "bg-green-50/70",
    searchTerms: ["fiqh", "fikih", "fıkıh", "fıkh", "فقه", "الفقه"],
  },
  usul: {
    labelTr: "Usûl / Makâsıd",
    labelAr: "الأصول والمقاصد",
    borderClass: "border-lime-200 border-l-lime-700",
    badgeClass: "bg-lime-100 text-lime-800",
    iconBgClass: "bg-lime-100",
    iconClass: "text-lime-700",
    cardTintClass: "bg-lime-50/70",
    searchTerms: [
      "usul",
      "usûl",
      "makasid",
      "maqasid",
      "mekasıd",
      "اصول",
      "الأصول",
      "مقاصد",
      "المقاصد",
    ],
  },
  hadith: {
    labelTr: "Hadis",
    labelAr: "الحديث",
    borderClass: "border-teal-200 border-l-teal-700",
    badgeClass: "bg-teal-100 text-teal-800",
    iconBgClass: "bg-teal-100",
    iconClass: "text-teal-700",
    cardTintClass: "bg-teal-50/70",
    searchTerms: ["hadith", "hadis", "حديث", "الحديث", "isnad", "sened"],
  },
  "quran-tafsir": {
    labelTr: "Kur'ân / Tefsir",
    labelAr: "القرآن والتفسير",
    borderClass: "border-emerald-200 border-l-emerald-700",
    badgeClass: "bg-emerald-100 text-emerald-800",
    iconBgClass: "bg-emerald-100",
    iconClass: "text-emerald-700",
    cardTintClass: "bg-emerald-50/70",
    searchTerms: [
      "quran",
      "qur'an",
      "kuran",
      "kur'an",
      "tafsir",
      "tefsir",
      "قران",
      "قرآن",
      "القرآن",
      "تفسير",
      "التلاوة",
      "tilawet",
      "tecvid",
      "tajweed",
    ],
  },
  aqida: {
    labelTr: "Akide",
    labelAr: "العقيدة",
    borderClass: "border-violet-200 border-l-violet-700",
    badgeClass: "bg-violet-100 text-violet-800",
    iconBgClass: "bg-violet-100",
    iconClass: "text-violet-700",
    cardTintClass: "bg-violet-50/70",
    searchTerms: ["aqida", "akaid", "akide", "aqeedah", "عقيدة", "العقيدة", "kelam"],
  },
  "dawah-sira": {
    labelTr: "Siyer / Davet",
    labelAr: "السيرة والدعوة",
    borderClass: "border-rose-200 border-l-rose-700",
    badgeClass: "bg-rose-100 text-rose-800",
    iconBgClass: "bg-rose-100",
    iconClass: "text-rose-700",
    cardTintClass: "bg-rose-50/70",
    searchTerms: [
      "dawah",
      "davet",
      "sira",
      "siyer",
      "سيرة",
      "السيرة",
      "الدعوة",
      "hitabet",
    ],
  },
  "law-politics": {
    labelTr: "Hukuk / Siyaset",
    labelAr: "القانون والسياسة",
    borderClass: "border-red-200 border-l-red-900",
    badgeClass: "bg-red-100 text-red-900",
    iconBgClass: "bg-red-100",
    iconClass: "text-red-800",
    cardTintClass: "bg-red-50/70",
    searchTerms: [
      "hukuk",
      "law",
      "siyaset",
      "politics",
      "قانون",
      "القانون",
      "سياسة",
      "السياسة",
    ],
  },
  "language-skills": {
    labelTr: "Dil / Beceriler",
    labelAr: "اللغة والمهارات",
    borderClass: "border-amber-200 border-l-amber-700",
    badgeClass: "bg-amber-100 text-amber-800",
    iconBgClass: "bg-amber-100",
    iconClass: "text-amber-700",
    cardTintClass: "bg-amber-50/70",
    searchTerms: [
      "dil",
      "language",
      "arapça",
      "arabic",
      "ingilizce",
      "english",
      "beceri",
      "skills",
      "nahiv",
      "gramer",
      "لغة",
      "اللغة",
      "مهارات",
      "النحو",
    ],
  },
  "university-culture": {
    labelTr: "Kültür",
    labelAr: "الثقافة",
    borderClass: "border-slate-300 border-l-slate-700",
    badgeClass: "bg-slate-200 text-slate-800",
    iconBgClass: "bg-slate-200",
    iconClass: "text-slate-700",
    cardTintClass: "bg-slate-100/70",
    searchTerms: [
      "kültür",
      "culture",
      "sekafe",
      "ثقافة",
      "الثقافة",
      "حضارة",
      "medeniyet",
    ],
  },
  digital: {
    labelTr: "Dijital",
    labelAr: "الرقمي",
    borderClass: "border-blue-200 border-l-blue-700",
    badgeClass: "bg-blue-100 text-blue-800",
    iconBgClass: "bg-blue-100",
    iconClass: "text-blue-700",
    cardTintClass: "bg-blue-50/70",
    searchTerms: [
      "dijital",
      "digital",
      "bilgisayar",
      "computer",
      "رقمي",
      "الرقمي",
      "حاسوب",
      "الحاسوب",
    ],
  },
  training: {
    labelTr: "Uygulama / Staj",
    labelAr: "التدريب",
    borderClass: "border-gray-300 border-l-gray-600",
    badgeClass: "bg-gray-200 text-gray-700",
    iconBgClass: "bg-gray-200",
    iconClass: "text-gray-600",
    cardTintClass: "bg-gray-100/70",
    searchTerms: ["staj", "training", "uygulama", "tatbik", "تدريب", "التدريب", "تأهيل"],
  },
};

/** Filtre menülerinde sabit sıralama için. */
export const DOMAIN_ORDER: DomainId[] = [
  "fiqh",
  "usul",
  "hadith",
  "quran-tafsir",
  "aqida",
  "dawah-sira",
  "law-politics",
  "language-skills",
  "university-culture",
  "digital",
  "training",
];
