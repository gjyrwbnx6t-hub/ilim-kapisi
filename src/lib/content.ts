import fs from "node:fs";
import path from "node:path";
import categoriesData from "../../content/categories.json";
import type { Category, MindMap } from "./types";

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
