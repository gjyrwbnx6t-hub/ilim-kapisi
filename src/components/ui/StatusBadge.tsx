import type { CourseStatus } from "@/data/courses";

const STATUS_MAP: Record<CourseStatus, { label: string; className: string }> = {
  empty: {
    label: "Yakında",
    className: "bg-slate-100 text-slate-600 border-slate-200",
  },
  "in-progress": {
    label: "Hazırlanıyor",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  ready: {
    label: "Hazır",
    className: "bg-primary-light text-primary border-primary/30",
  },
};

export default function StatusBadge({ status }: { status: CourseStatus }) {
  const { label, className } = STATUS_MAP[status];

  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${className}`}
    >
      {label}
    </span>
  );
}
