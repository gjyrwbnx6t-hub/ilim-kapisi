import fs from "node:fs";
import path from "node:path";
import categoriesData from "../../content/categories.json";
import type { Category, MindMap, VocabularySet } from "./types";

export function getCategories(): Category[] {
  return categoriesData as Category[];
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return getCategories().find((category) => category.slug === slug);
}

const MINDMAPS_DIR = path.join(process.cwd(), "content", "mindmaps");

/**
 * Bir dersin zihin şeması verisini okur. Şema dosyası yoksa `undefined`
 * döner (henüz eklenmemiş demektir, "Yakında" davranışı korunur).
 * Şemalar XMind gibi araçlardan dönüştürülen hafif JSON metin
 * yapılarıdır; görsel (fotoğraf/SVG) değildir.
 */
export function getMindMap(contentSlug: string): MindMap | undefined {
  const filePath = path.join(MINDMAPS_DIR, `${contentSlug}.json`);

  if (!fs.existsSync(filePath)) {
    return undefined;
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as MindMap;
}

const VOCABULARY_DIR = path.join(process.cwd(), "content", "vocabulary");

export interface VocabularySummary {
  hasVocabulary: boolean;
  unitCount: number;
  wordCount: number;
  frontDir: "rtl" | "ltr";
  titleTr?: string;
  titleAr?: string;
}

/**
 * Bir dersin kelime kartı setini okur. Dosya yoksa `undefined` döner
 * ("Yakında" davranışı korunur). Set, üniteler halinde gruplanmış
 * Arapça/İngilizce ↔ Türkçe kelime çiftlerinden oluşur.
 */
export function getVocabulary(contentSlug: string): VocabularySet | undefined {
  const filePath = path.join(VOCABULARY_DIR, `${contentSlug}.json`);

  if (!fs.existsSync(filePath)) {
    return undefined;
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as VocabularySet;
}

/**
 * Kelime arşivini kopyalamadan ders listeleri için hafif özet üretir.
 * Dosya yoksa "bekliyor" durumunu temsil eden boş değerler döner.
 */
export function getVocabularySummary(contentSlug: string): VocabularySummary {
  const set = getVocabulary(contentSlug);

  if (!set) {
    return {
      hasVocabulary: false,
      unitCount: 0,
      wordCount: 0,
      frontDir: "rtl",
    };
  }

  return {
    hasVocabulary: true,
    unitCount: set.units.length,
    wordCount: set.units.reduce((sum, unit) => sum + unit.words.length, 0),
    frontDir: set.frontDir ?? "rtl",
    titleTr: set.titleTr,
    titleAr: set.titleAr,
  };
}
