"use client";

import { useMemo, useState } from "react";
import type { Course, CourseStatus } from "@/data/courses";
import type { DepartmentId } from "@/data/departments";
import { DOMAIN_META, DOMAIN_ORDER, type DomainId } from "@/data/domains";
import { buildCourseHaystack, textMatches } from "@/lib/search";
import CourseCard from "@/components/ui/CourseCard";

export interface ResolvedGroup {
  titleAr: string;
  courses: Course[];
}

export interface ResolvedCategory {
  titleAr: string;
  groups?: ResolvedGroup[];
  courses?: Course[];
}

interface CurriculumBrowserProps {
  categories: ResolvedCategory[];
}

type DomainFilter = "all" | DomainId;
type DepartmentFilter = "all" | DepartmentId;
type StatusFilter = "all" | CourseStatus;

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Tüm Durumlar" },
  { value: "empty", label: "Yakında" },
  { value: "in-progress", label: "Hazırlanıyor" },
  { value: "ready", label: "Hazır" },
];

const DEPARTMENT_OPTIONS: { value: DepartmentFilter; label: string }[] = [
  { value: "all", label: "Tüm Bölümler" },
  { value: "usul-al-fiqh", label: "Fıkıh Usûlü" },
  { value: "usul-al-din", label: "Din Usûlü" },
];

const selectClass =
  "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary";

export default function CurriculumBrowser({ categories }: CurriculumBrowserProps) {
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState<DomainFilter>("all");
  const [department, setDepartment] = useState<DepartmentFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sharedOnly, setSharedOnly] = useState(false);

  const haystacks = useMemo(() => {
    const map = new Map<string, string>();
    for (const category of categories) {
      const list = category.groups
        ? category.groups.flatMap((group) => group.courses)
        : category.courses ?? [];
      for (const course of list) {
        if (!map.has(course.id)) {
          map.set(course.id, buildCourseHaystack(course));
        }
      }
    }
    return map;
  }, [categories]);

  const matches = (course: Course): boolean => {
    if (domain !== "all" && course.domain !== domain) return false;
    if (department !== "all" && !course.departments.includes(department)) return false;
    if (status !== "all" && course.status !== status) return false;
    if (sharedOnly && course.departments.length < 2) return false;
    if (query.trim()) {
      return textMatches(haystacks.get(course.id) ?? "", query);
    }
    return true;
  };

  const filteredCategories = categories.map((category) => {
    if (category.groups) {
      const groups = category.groups
        .map((group) => ({
          titleAr: group.titleAr,
          courses: group.courses.filter(matches),
        }))
        .filter((group) => group.courses.length > 0);
      return { titleAr: category.titleAr, groups };
    }
    return {
      titleAr: category.titleAr,
      courses: (category.courses ?? []).filter(matches),
    };
  });

  const resultCount = filteredCategories.reduce((sum, category) => {
    if (category.groups) {
      return sum + category.groups.reduce((s, group) => s + group.courses.length, 0);
    }
    return sum + (category.courses?.length ?? 0);
  }, 0);

  const hasActiveFilter =
    query.trim() !== "" ||
    domain !== "all" ||
    department !== "all" ||
    status !== "all" ||
    sharedOnly;

  return (
    <div>
      {/* Arama / filtre paneli */}
      <div className="mb-8 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="flex-1">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ders ara..."
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <p className="mt-1.5 text-xs text-surface-muted">
              Arapça veya Türkçe yazabilirsiniz
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={domain}
              onChange={(event) => setDomain(event.target.value as DomainFilter)}
              className={selectClass}
              aria-label="Alan filtresi"
            >
              <option value="all">Tüm Alanlar</option>
              {DOMAIN_ORDER.map((id) => (
                <option key={id} value={id}>
                  {DOMAIN_META[id].labelTr}
                </option>
              ))}
            </select>

            <select
              value={department}
              onChange={(event) =>
                setDepartment(event.target.value as DepartmentFilter)
              }
              className={selectClass}
              aria-label="Bölüm filtresi"
            >
              {DEPARTMENT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as StatusFilter)}
              className={selectClass}
              aria-label="Durum filtresi"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={sharedOnly}
                onChange={(event) => setSharedOnly(event.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              Sadece ortak dersler
            </label>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="text-sm font-medium text-slate-600">
            {resultCount} ders bulundu
          </span>
          {hasActiveFilter && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setDomain("all");
                setDepartment("all");
                setStatus("all");
                setSharedOnly(false);
              }}
              className="text-sm font-medium text-primary hover:underline"
            >
              Filtreleri temizle
            </button>
          )}
        </div>
      </div>

      {/* Sonuçlar */}
      {resultCount === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-surface-muted">
          Aramanıza uygun ders bulunamadı.
        </div>
      ) : (
        filteredCategories.map((category) => {
          const categoryCount = category.groups
            ? category.groups.reduce((s, group) => s + group.courses.length, 0)
            : category.courses?.length ?? 0;

          if (categoryCount === 0) return null;

          return (
            <section key={category.titleAr} className="mb-14">
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
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {group.courses.map((course) => (
                          <CourseCard key={course.id} course={course} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {category.courses?.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}
