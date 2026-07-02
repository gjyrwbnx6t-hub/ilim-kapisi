export type DepartmentId = "usul-al-fiqh" | "usul-al-din";

export interface Department {
  id: DepartmentId;
  slug: string;
  titleAr: string;
  titleTr: string;
  description: string;
}

export const departments: Department[] = [
  {
    id: "usul-al-fiqh",
    slug: "usul-al-fiqh",
    titleAr: "أصول الفقه",
    titleTr: "Fıkıh Usûlü",
    description:
      "Fıkıh Usûlü bölümünün resmî müfredatı: üniversite, fakülte ve uzmanlık dersleri.",
  },
  {
    id: "usul-al-din",
    slug: "usul-al-din",
    titleAr: "أصول الدين",
    titleTr: "Din Usûlü",
    description:
      "Din Usûlü bölümünün resmî müfredatı: üniversite, fakülte ve uzmanlık dersleri.",
  },
];

export function getDepartmentBySlug(slug: string): Department | undefined {
  return departments.find((department) => department.slug === slug);
}

export function getDepartmentById(id: DepartmentId): Department | undefined {
  return departments.find((department) => department.id === id);
}

export function departmentTitleAr(id: DepartmentId): string {
  return getDepartmentById(id)?.titleAr ?? id;
}
