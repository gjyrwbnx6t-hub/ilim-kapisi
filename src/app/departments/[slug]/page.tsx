import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/layout/Breadcrumb";
import CurriculumBrowser, {
  type ResolvedCategory,
} from "@/components/curriculum/CurriculumBrowser";
import { departments, getDepartmentBySlug } from "@/data/departments";
import { getCurriculum } from "@/data/curricula";
import { getCourseById, type Course } from "@/data/courses";

interface DepartmentPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return departments.map((department) => ({ slug: department.slug }));
}

export async function generateMetadata({
  params,
}: DepartmentPageProps): Promise<Metadata> {
  const { slug } = await params;
  const department = getDepartmentBySlug(slug);

  if (!department) {
    return { title: "Bölüm bulunamadı" };
  }

  return {
    title: `${department.titleTr} (${department.titleAr})`,
    description: department.description,
  };
}

export default async function DepartmentPage({ params }: DepartmentPageProps) {
  const { slug } = await params;
  const department = getDepartmentBySlug(slug);

  if (!department) {
    notFound();
  }

  const curriculum = getCurriculum(department.id);

  const categories: ResolvedCategory[] = (curriculum?.categories ?? []).map(
    (category) => {
      if (category.groups) {
        return {
          titleAr: category.titleAr,
          groups: category.groups.map((group) => ({
            titleAr: group.titleAr,
            courses: group.courseIds
              .map(getCourseById)
              .filter((course): course is Course => Boolean(course)),
          })),
        };
      }
      return {
        titleAr: category.titleAr,
        courses: (category.courseIds ?? [])
          .map(getCourseById)
          .filter((course): course is Course => Boolean(course)),
      };
    }
  );

  const uniqueIds = new Set<string>();
  const uniqueDomains = new Set<string>();
  for (const category of categories) {
    const list = category.groups
      ? category.groups.flatMap((group) => group.courses)
      : category.courses ?? [];
    for (const course of list) {
      uniqueIds.add(course.id);
      uniqueDomains.add(course.domain);
    }
  }

  const stats = [
    { value: uniqueIds.size, label: "ders" },
    { value: uniqueDomains.size, label: "alan" },
  ];

  return (
    <>
      <Breadcrumb
        items={[{ label: "Ana Sayfa", href: "/" }, { label: department.titleTr }]}
      />

      {/* Hero */}
      <section className="border-b border-slate-200 bg-white px-[5%] py-10 text-center">
        <p dir="rtl" className="font-arabic text-3xl font-bold text-primary">
          {department.titleAr}
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          {department.titleTr}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-surface-muted">
          {department.description}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {stats.map((stat) => (
            <span
              key={stat.label}
              className="rounded-full bg-slate-100 px-4 py-1 text-sm font-medium text-slate-700"
            >
              {stat.value} {stat.label}
            </span>
          ))}
          <span className="rounded-full bg-primary-light px-4 py-1 text-sm font-medium text-primary">
            Ortak dersler dahil
          </span>
        </div>
      </section>

      {/* Arama / filtre + müfredat */}
      <div className="mx-auto max-w-6xl px-[5%] py-12">
        <CurriculumBrowser categories={categories} />
      </div>
    </>
  );
}
