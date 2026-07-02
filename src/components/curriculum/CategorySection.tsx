import type { CurriculumCategory } from "@/data/curricula";
import { getCourseById } from "@/data/courses";
import CourseCard from "@/components/ui/CourseCard";

function CourseGrid({ courseIds }: { courseIds: string[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {courseIds.map((id) => {
        const course = getCourseById(id);
        if (!course) return null;
        return <CourseCard key={id} course={course} />;
      })}
    </div>
  );
}

export default function CategorySection({
  category,
}: {
  category: CurriculumCategory;
}) {
  return (
    <section className="mb-14">
      <h2
        dir="rtl"
        className="mb-6 border-r-4 border-primary pr-3 text-right font-arabic text-2xl font-bold text-primary"
      >
        {category.titleAr}
      </h2>

      {category.groups ? (
        <div className="space-y-8">
          {category.groups.map((group) => (
            <div key={group.titleAr}>
              <h3
                dir="rtl"
                className="mb-3 text-right font-arabic text-lg font-semibold text-surface-muted"
              >
                {group.titleAr}
              </h3>
              <CourseGrid courseIds={group.courseIds} />
            </div>
          ))}
        </div>
      ) : (
        <CourseGrid courseIds={category.courseIds ?? []} />
      )}
    </section>
  );
}
