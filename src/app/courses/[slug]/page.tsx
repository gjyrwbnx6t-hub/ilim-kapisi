import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/layout/Breadcrumb";
import StatusBadge from "@/components/ui/StatusBadge";
import ModuleCard from "@/components/course/ModuleCard";
import { courses, getCourseBySlug } from "@/data/courses";
import { departmentTitleAr, getDepartmentById } from "@/data/departments";
import { getMindMap } from "@/lib/content";

interface CoursePageProps {
  params: Promise<{ slug: string }>;
}

const STUDY_MODULES = [
  {
    id: "summaries",
    icon: "📝",
    title: "Ders Özetleri",
    description: "Haftalık okuma notları ve konu metinlerinin özetleri.",
  },
  {
    id: "mindmap",
    icon: "🧠",
    title: "Zihin Şemaları",
    description: "Kavramları ve ilişkileri gösteren görsel şemalar.",
  },
  {
    id: "keywords",
    icon: "🔤",
    title: "Anahtar Kelimeler",
    description: "İnteraktif Arapça-Türkçe kavram ve terim kartları.",
  },
  {
    id: "materials",
    icon: "📚",
    title: "Ders Materyalleri",
    description: "PDF dökümanlar ve harici akademik kaynaklar.",
  },
] as const;

const DEFAULT_DESCRIPTION =
  "Bu ders çalışma alanında ders özetleri, zihin şemaları, anahtar kavramlar ve materyaller zamanla eklenecektir.";

export function generateStaticParams() {
  return courses.map((course) => ({ slug: course.slug }));
}

export async function generateMetadata({
  params,
}: CoursePageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = getCourseBySlug(slug);

  if (!course) {
    return { title: "Ders bulunamadı" };
  }

  return { title: course.titleAr };
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { slug } = await params;
  const course = getCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  const isShared = course.departments.length > 1;
  const hasContent = course.status === "ready";
  const hasMindMap = Boolean(getMindMap(course.contentSlug));
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
          { label: course.titleAr },
        ]}
      />

      {/* Ders başlığı alanı */}
      <section className="border-b border-slate-200 bg-white px-[5%] py-12 text-center">
        <div className="mb-4 flex items-center justify-center gap-2">
          <StatusBadge status={course.status} />
          {isShared && (
            <span
              dir="rtl"
              className="rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-semibold text-primary"
              title="İki bölümde de ortak ders"
            >
              مشترك
            </span>
          )}
        </div>

        <h1
          dir="rtl"
          className="font-arabic text-4xl font-bold leading-relaxed text-primary max-md:text-3xl"
        >
          {course.titleAr}
        </h1>

        <div dir="rtl" className="mt-4 flex flex-wrap justify-center gap-2">
          {course.departments.map((departmentId) => (
            <span
              key={departmentId}
              className="rounded border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-surface-muted"
            >
              {departmentTitleAr(departmentId)}
            </span>
          ))}
        </div>

        <p className="mx-auto mt-5 max-w-2xl text-surface-muted">
          {DEFAULT_DESCRIPTION}
        </p>

        {/* İnce sarı ayırıcı */}
        <div className="mx-auto mt-8 h-1 w-24 rounded-full bg-accent" />
      </section>

      {/* Çalışma modülleri: 2x2 kart düzeni */}
      <section className="mx-auto max-w-5xl px-[5%] py-14">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {STUDY_MODULES.map((module) => {
            const isMindMap = module.id === "mindmap";
            return (
              <ModuleCard
                key={module.id}
                icon={module.icon}
                title={module.title}
                description={module.description}
                available={isMindMap ? hasMindMap : hasContent}
                href={isMindMap ? `/courses/${course.slug}/mindmaps` : undefined}
              />
            );
          })}
        </div>
      </section>
    </>
  );
}
