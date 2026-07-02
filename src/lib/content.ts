import categoriesData from "../../content/categories.json";
import type { Category } from "./types";

export function getCategories(): Category[] {
  return categoriesData as Category[];
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return getCategories().find((category) => category.slug === slug);
}
