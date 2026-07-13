"use client";

import CourseCard from "@/components/ui/CourseCard";
import { getCourseBySlug } from "@/data/courses";
import { useFavorites } from "@/hooks/useFavorites";

export default function FavoriteCoursesSection() {
  const { favorites } = useFavorites();
  const favoriteCourses = favorites
    .map((slug) => getCourseBySlug(slug))
    .filter((course): course is NonNullable<typeof course> => Boolean(course));

  if (favoriteCourses.length === 0) return null;

  return (
    <section className="border-b border-slate-200 bg-amber-50/40 px-[5%] py-12">
      <h2 className="mb-2 text-center text-2xl font-bold text-slate-900">
        Favori Dersler
      </h2>
      <p className="mb-8 text-center text-sm text-surface-muted">
        Hızlı erişim için işaretlediğin dersler
      </p>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {favoriteCourses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </section>
  );
}
