export type CategoryStatus = "active" | "coming-soon";

export interface Category {
  slug: string;
  title: string;
  description: string;
  status: CategoryStatus;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/**
 * Zihin şeması ağaç düğümü. XMind gibi araçlardan dışa aktarılan
 * hiyerarşi, görsel (fotoğraf/SVG) olarak değil, bu hafif metin
 * yapısıyla siteye taşınır.
 */
export interface MindMapNode {
  id: string;
  titleAr: string;
  titleTr?: string;
  children?: MindMapNode[];
}

export interface MindMap {
  contentSlug: string;
  titleAr: string;
  titleTr?: string;
  root: MindMapNode;
}

/**
 * Kelime kartı sistemi (eski statik sitedeki 5 modlu kelime antrenörünün
 * veri karşılığı). Her kelime bir ön yüz (öğrenilecek terim) ve arka yüz
 * (Türkçe karşılık) çiftidir. Arapça dersler için ön yüz `rtl`, İngilizce
 * dersler için `ltr` gösterilir.
 */
export interface VocabularyWord {
  /** Ön yüz: öğrenilecek terim (Arapça veya İngilizce). */
  front: string;
  /** Arka yüz: Türkçe karşılık. */
  back: string;
}

export interface VocabularyUnit {
  id: string;
  titleTr: string;
  /** Ünite başlığının Arapça yazımı (varsa sidebar'da üstte gösterilir). */
  titleAr?: string;
  words: VocabularyWord[];
}

export interface VocabularySet {
  contentSlug: string;
  titleTr: string;
  titleAr?: string;
  /** Ön yüz metin yönü. Arapça = "rtl", İngilizce = "ltr" (varsayılan rtl). */
  frontDir?: "rtl" | "ltr";
  units: VocabularyUnit[];
}
