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
