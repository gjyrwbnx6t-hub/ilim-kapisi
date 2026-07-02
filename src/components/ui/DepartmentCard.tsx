import Link from "next/link";
import type { Department } from "@/data/departments";
import { countCoursesByDepartment } from "@/data/courses";

export default function DepartmentCard({ department }: { department: Department }) {
  const courseCount = countCoursesByDepartment(department.id);

  return (
    <Link href={`/departments/${department.slug}`} className="group block">
      <article className="flex h-full flex-col items-center rounded-2xl border-2 border-slate-200 bg-white p-10 text-center transition-colors hover:border-primary">
        <span
          dir="rtl"
          className="font-arabic text-4xl font-bold text-primary max-md:text-3xl"
        >
          {department.titleAr}
        </span>
        <span className="mt-2 text-lg font-semibold text-slate-700">
          {department.titleTr}
        </span>
        <p className="mt-3 max-w-sm text-surface-muted">{department.description}</p>
        <span className="mt-6 rounded-full bg-primary-light px-4 py-1 text-sm font-medium text-primary">
          {courseCount} ders
        </span>
      </article>
    </Link>
  );
}
