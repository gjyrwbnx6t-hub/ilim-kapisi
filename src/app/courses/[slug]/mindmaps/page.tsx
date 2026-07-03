import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/layout/Breadcrumb";
import MindMapViewer from "@/components/course/MindMapViewer";
import { courses, getCourseBySlug } from "@/data/courses";
import { getDepartmentById } from "@/data/departments";
import { getMindMap } from "@/lib/content";

interface MindMapPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return courses.map((course) => ({ slug: course.slug }));
}

export async function generateMetadata({
  params,
}: MindMapPageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = getCourseBySlug(slug);

  if (!course) {
    return { title: "Ders bulunamadı" };
  }

  return { title: `${course.titleAr} — Zihin Şemaları` };
}

export default async function MindMapPage({ params }: MindMapPageProps) {
  const { slug } = await params;
  const course = getCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  const mindMap = getMindMap(course.contentSlug);
  const firstDepartment = getDepartmentById(course.departments[0]);

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Ana Sayfa", href: "/" },
          firstDepartment
            ? {
                label: firstDepartment.titleTr,
                href: `/departments/${firstDepartment.slug}`,
              }
            : { label: "Dersler" },
          { label: course.titleAr, href: `/courses/${course.slug}` },
          { label: "Zihin Şemaları" },
        ]}
      />

      <div className="flex flex-1 flex-col bg-surface min-h-0">
        {mindMap ? (
          <MindMapViewer
            root={mindMap.root}
            courseSlug={course.slug}
            courseTitleAr={mindMap.titleAr}
            courseTitleTr={mindMap.titleTr}
          />
        ) : (
          <div className="m-auto rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-surface-muted shadow-sm">
            <p>Bu ders için zihin şeması henüz eklenmedi.</p>
            <Link
              href={`/courses/${course.slug}`}
              className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
            >
              Derse geri dön
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
