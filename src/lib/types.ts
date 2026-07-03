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
