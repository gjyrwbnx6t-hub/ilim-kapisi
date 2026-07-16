"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowLeft,
  BookOpen,
  Calculator,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  Landmark,
  ListChecks,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import {
  useSitePreferences,
  type SiteLanguage,
} from "@/components/settings/SitePreferencesProvider";
import type { CareerCopy } from "@/lib/career-copy";
import type {
  CareerCourseRisk,
  CareerSnapshotSummary,
} from "@/lib/supabase/types";

const STORAGE_KEY = "ilim-kapisi-career-tracker-v1";

interface CareerTrackerContextValue {
  labels: CareerCopy;
  direction: "ltr" | "rtl";
  language: SiteLanguage;
  locale: string;
}

const CareerTrackerContext = createContext<CareerTrackerContextValue | null>(
  null,
);

function useCareerTracker() {
  const context = useContext(CareerTrackerContext);
  if (!context) {
    throw new Error(
      "useCareerTracker must be used inside CareerTrackerClient",
    );
  }
  return context;
}

const AVAILABLE_UNIVERSITIES = [
  {
    id: "jordan-university",
  },
] as const;

const TERM_SEASONS = [
  { id: "first", shortLabel: "1" },
  { id: "second", shortLabel: "2" },
  { id: "summer", shortLabel: "Yaz" },
] as const;

const COURSE_MODES = [
  { id: "face" },
  { id: "hybrid" },
  { id: "online" },
] as const;

const CREDIT_OPTIONS = [0, 1, 3, 6] as const;

const LETTER_GRADES = [
  { letter: "أ", value: 4 },
  { letter: "أ-", value: 3.75 },
  { letter: "ب+", value: 3.5 },
  { letter: "ب", value: 3 },
  { letter: "ب-", value: 2.75 },
  { letter: "ج+", value: 2.5 },
  { letter: "ج", value: 2 },
  { letter: "ج-", value: 1.75 },
  { letter: "د+", value: 1.5 },
  { letter: "د", value: 1.25 },
  { letter: "د-", value: 1 },
  { letter: "هـ", value: 0.5 },
] as const;

const GPA_RATINGS = [
  { key: "excellent", labelAr: "ممتاز", min: 3.65, max: 4 },
  { key: "veryGood", labelAr: "جيد جدًا", min: 3, max: 3.64 },
  { key: "good", labelAr: "جيد", min: 2.5, max: 2.99 },
  { key: "acceptable", labelAr: "مقبول", min: 2, max: 2.49 },
  { key: "weak", labelAr: "ضعيف", min: 0, max: 1.99 },
] as const;

type UniversityId = (typeof AVAILABLE_UNIVERSITIES)[number]["id"];
type TermSeason = (typeof TERM_SEASONS)[number]["id"];
type CourseMode = (typeof COURSE_MODES)[number]["id"];
type CreditWeight = (typeof CREDIT_OPTIONS)[number];
type LetterGrade = (typeof LETTER_GRADES)[number]["letter"];
type PassFailGrade = "passed" | "failed";
type CourseLetter = LetterGrade | PassFailGrade | "";
type PassStatus = "unset" | "passed" | "failed";
type UniversityTab = "terms" | "pass" | "letters";

interface AssessmentPart {
  id: string;
  label: string;
  max: number;
  score: number;
}

interface CareerCourse {
  id: string;
  name: string;
  mode: CourseMode;
  credits: CreditWeight;
  targetScore: number;
  letterGrade: CourseLetter;
  passStatus: PassStatus;
  assessments: AssessmentPart[];
}

interface CareerTerm {
  id: string;
  academicYear: number;
  season: TermSeason;
  courses: CareerCourse[];
}

interface UniversityRecord {
  id: string;
  universityId: UniversityId;
  name: string;
  nameAr: string;
  grading: string;
  terms: CareerTerm[];
}

interface CareerStore {
  universities: UniversityRecord[];
}

interface GpaSummary {
  gpa: number | null;
  credits: number;
  gradedCourses: number;
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function createId(prefix: string) {
  const randomId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${randomId}`;
}

function safeNumber(value: string, fallback = 0) {
  const next = Number.parseFloat(value);
  return Number.isFinite(next) ? next : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function formatDecimal(value: number, locale: string, digits = 2) {
  return value.toLocaleString(locale, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

function formatPercent(value: number, locale: string) {
  return value.toLocaleString(locale, {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  });
}

function academicYearLabel(year: number) {
  return `${year}-${year + 1}`;
}

function getSeasonLabel(season: TermSeason, labels: CareerCopy) {
  return labels.seasons[season];
}

function getModeLabel(mode: CourseMode, labels: CareerCopy) {
  return labels.modes[mode];
}

function getUniversityMeta(
  universityId: UniversityId,
  labels: CareerCopy,
  language: SiteLanguage,
) {
  const catalog = labels.universitiesCatalog[universityId];
  return {
    name: language === "ar" ? catalog.nameAr : catalog.name,
    nameAr: catalog.nameAr,
    grading: labels.gradingSystem,
  };
}

function getDefaultAssessments(
  mode: CourseMode,
  labels: CareerCopy,
): AssessmentPart[] {
  const distribution =
    mode === "face"
      ? [
          { label: labels.assessments.midterm, max: 30 },
          { label: labels.assessments.participation, max: 20 },
          { label: labels.assessments.final, max: 50 },
        ]
      : [
          { label: labels.assessments.midterm, max: 30 },
          { label: labels.assessments.participation, max: 30 },
          { label: labels.assessments.final, max: 40 },
        ];

  return distribution.map((part) => ({
    id: createId("part"),
    label: part.label,
    max: part.max,
    score: 0,
  }));
}

function getScoreTotals(course: CareerCourse) {
  const max = course.assessments.reduce((sum, part) => sum + part.max, 0);
  const score = course.assessments.reduce(
    (sum, part) => sum + clamp(part.score, 0, part.max),
    0,
  );
  const percent = max > 0 ? (score / max) * 100 : 0;
  return { max, score, percent };
}

function getGradePoint(letter: CourseLetter) {
  if (letter === "passed" || letter === "failed") return null;
  return LETTER_GRADES.find((grade) => grade.letter === letter)?.value ?? null;
}

function isPassFailGrade(letter: CourseLetter): letter is PassFailGrade {
  return letter === "passed" || letter === "failed";
}

function getGradeSelectValue(course: CareerCourse): CourseLetter {
  if (isPassFailGrade(course.letterGrade)) return course.letterGrade;
  if (course.credits === 0 && course.passStatus !== "unset") {
    return course.passStatus;
  }
  return course.letterGrade;
}

function formatGradeLabel(letter: CourseLetter, labels: CareerCopy) {
  if (letter === "passed") return labels.passed;
  if (letter === "failed") return labels.failed;
  return letter || "—";
}

function applyGradeSelection(letterGrade: CourseLetter): Pick<CareerCourse, "letterGrade" | "passStatus"> {
  if (letterGrade === "passed" || letterGrade === "failed") {
    return { letterGrade, passStatus: letterGrade };
  }
  if (letterGrade === "") {
    return { letterGrade: "", passStatus: "unset" };
  }
  return { letterGrade, passStatus: "unset" };
}

function calculateGpa(courses: CareerCourse[]): GpaSummary {
  let weightedTotal = 0;
  let credits = 0;
  let gradedCourses = 0;

  for (const course of courses) {
    const point = getGradePoint(course.letterGrade);
    if (course.credits <= 0 || point === null) continue;
    weightedTotal += point * course.credits;
    credits += course.credits;
    gradedCourses += 1;
  }

  return {
    gpa: credits > 0 ? weightedTotal / credits : null,
    credits,
    gradedCourses,
  };
}

function getAllCourses(university: UniversityRecord) {
  return university.terms.flatMap((term) => term.courses);
}

function getTermGpa(term: CareerTerm) {
  return calculateGpa(term.courses);
}

function getGpaRating(gpa: number | null, labels: CareerCopy, language: SiteLanguage) {
  if (gpa === null) {
    return { label: "—", text: labels.noGradeYet };
  }
  const rating =
    GPA_RATINGS.find((item) => gpa >= item.min && gpa <= item.max) ??
    GPA_RATINGS[GPA_RATINGS.length - 1];
  return {
    label: rating.labelAr,
    text:
      language === "ar"
        ? rating.labelAr
        : labels.gpaRatings[rating.key],
  };
}

function createJordanUniversity(labels: CareerCopy): UniversityRecord {
  const university = AVAILABLE_UNIVERSITIES[0];
  const catalog = labels.universitiesCatalog[university.id];
  return {
    id: createId("university"),
    universityId: university.id,
    name: catalog.name,
    nameAr: catalog.nameAr,
    grading: labels.gradingSystem,
    terms: [],
  };
}

function makeCourse(
  name: string,
  mode: CourseMode,
  credits: CreditWeight,
  labels: CareerCopy,
): CareerCourse {
  return {
    id: createId("course"),
    name,
    mode,
    credits,
    targetScore: 50,
    letterGrade: "",
    passStatus: "unset",
    assessments: getDefaultAssessments(mode, labels),
  };
}

function parseStoredCareer(raw: string | null): CareerStore {
  if (!raw) return { universities: [] };

  try {
    const parsed = JSON.parse(raw) as Partial<CareerStore>;
    if (!Array.isArray(parsed.universities)) return { universities: [] };
    return {
      universities: parsed.universities.filter(
        (record): record is UniversityRecord =>
          typeof record?.id === "string" &&
          record.universityId === "jordan-university" &&
          Array.isArray(record.terms),
      ),
    };
  } catch {
    return { universities: [] };
  }
}

function sortTerms(terms: CareerTerm[]) {
  const order: Record<TermSeason, number> = {
    first: 1,
    second: 2,
    summer: 3,
  };

  return [...terms].sort((a, b) => {
    if (a.academicYear !== b.academicYear) return b.academicYear - a.academicYear;
    return order[a.season] - order[b.season];
  });
}

function termSortRank(season: TermSeason) {
  const order: Record<TermSeason, number> = {
    first: 1,
    second: 2,
    summer: 3,
  };
  return order[season];
}

function buildCareerSnapshotSummary(
  store: CareerStore,
  labels: CareerCopy,
): CareerSnapshotSummary {
  const terms = store.universities.flatMap((university) =>
    university.terms.map((term) => ({ term, university })),
  );
  const courses = terms.flatMap(({ term, university }) =>
    term.courses.map((course) => ({ course, term, university })),
  );
  const gpa = calculateGpa(courses.map(({ course }) => course));
  const sortedTerms = [...terms].sort((a, b) => {
    if (a.term.academicYear !== b.term.academicYear) {
      return b.term.academicYear - a.term.academicYear;
    }
    return termSortRank(b.term.season) - termSortRank(a.term.season);
  });

  const termSummaries = sortedTerms.slice(0, 8).map(({ term }) => {
    const termGpa = getTermGpa(term);
    return {
      label: `${academicYearLabel(term.academicYear)} · ${getSeasonLabel(term.season, labels)}`,
      courseCount: term.courses.length,
      credits: term.courses.reduce((sum, course) => sum + course.credits, 0),
      gpa: termGpa.gpa,
    };
  });

  const atRiskCourses: CareerCourseRisk[] = courses
    .map(({ course, term }) => {
      const gradeValue = getGradeSelectValue(course);
      const totals = getScoreTotals(course);
      const failed =
        gradeValue === "failed" ||
        (course.credits === 0 && course.passStatus === "failed");

      if (!failed && totals.percent >= course.targetScore) return null;

      return {
        name: course.name,
        termLabel: `${academicYearLabel(term.academicYear)} · ${getSeasonLabel(term.season, labels)}`,
        percent: totals.percent,
        targetScore: course.targetScore,
        status: failed ? "failed" : "at_risk",
      };
    })
    .filter((course): course is CareerCourseRisk => course !== null)
    .slice(0, 8);

  return {
    universityCount: store.universities.length,
    termCount: terms.length,
    courseCount: courses.length,
    gradedCourseCount: gpa.gradedCourses,
    creditCount: gpa.credits,
    gpa: gpa.gpa,
    latestTermLabel: termSummaries[0]?.label ?? null,
    atRiskCourses,
    terms: termSummaries,
  };
}

function StatusPill({ children, tone }: { children: ReactNode; tone: "good" | "warn" | "muted" }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold",
        tone === "good" && "bg-emerald-50 text-emerald-700",
        tone === "warn" && "bg-amber-50 text-amber-800",
        tone === "muted" && "bg-slate-100 text-slate-600",
      )}
    >
      {children}
    </span>
  );
}

function DeleteConfirmDialog({
  title,
  description,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { labels } = useCareerTracker();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-confirm-title"
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl"
      >
        <h2 id="delete-confirm-title" className="text-lg font-bold text-slate-900">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">{description}</p>
        <p className="mt-2 text-sm font-medium text-slate-700">
          {labels.deleteIrreversible}
        </p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            {labels.deleteCancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600"
          >
            {confirmLabel ?? labels.deleteConfirm}
          </button>
        </div>
      </div>
    </div>
  );
}

function IconButton({
  children,
  label,
  onClick,
  tone = "default",
  confirm,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  tone?: "default" | "danger";
  confirm?: {
    title: string;
    description: string;
    confirmLabel?: string;
  };
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleClick = () => {
    if (confirm) {
      setConfirmOpen(true);
      return;
    }
    onClick();
  };

  return (
    <>
      <button
        type="button"
        title={label}
        aria-label={label}
        onClick={handleClick}
        className={cx(
          "inline-flex h-10 w-10 items-center justify-center rounded-lg border transition-colors",
          tone === "default" &&
            "border-slate-200 text-slate-600 hover:border-primary hover:bg-primary-light hover:text-primary",
          tone === "danger" &&
            "border-red-100 text-red-600 hover:border-red-200 hover:bg-red-50",
        )}
      >
        {children}
      </button>
      {confirmOpen && confirm && (
        <DeleteConfirmDialog
          title={confirm.title}
          description={confirm.description}
          confirmLabel={confirm.confirmLabel}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => {
            setConfirmOpen(false);
            onClick();
          }}
        />
      )}
    </>
  );
}

function EmptyPanel({
  icon,
  title,
  action,
}: {
  icon: ReactNode;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white px-6 py-10 text-center shadow-sm">
      <span className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary-light text-primary">
        {icon}
      </span>
      <h3 className="mt-5 text-xl font-bold text-slate-900">{title}</h3>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

function AppButton({
  children,
  icon,
  onClick,
  type = "button",
  variant = "primary",
  disabled = false,
}: {
  children: ReactNode;
  icon?: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-primary text-white hover:bg-primary-dark",
        variant === "secondary" && "bg-gold text-ink hover:bg-gold-light",
        variant === "ghost" &&
          "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
      )}
    >
      {icon}
      {children}
    </button>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="block text-sm font-bold text-slate-800">{children}</label>
  );
}

function GpaGauge({ value }: { value: number | null }) {
  const { labels, locale, language } = useCareerTracker();
  const safeValue = value === null ? 0 : clamp(value, 0, 4);
  const ratio = safeValue / 4;
  const angle = 180 - ratio * 180;
  const needleLength = 74;
  const needleX = 120 + needleLength * Math.cos((angle * Math.PI) / 180);
  const needleY = 126 - needleLength * Math.sin((angle * Math.PI) / 180);

  const arcPoint = (gpa: number, radius = 94) => {
    const nextAngle = 180 - (gpa / 4) * 180;
    return {
      x: 120 + radius * Math.cos((nextAngle * Math.PI) / 180),
      y: 126 - radius * Math.sin((nextAngle * Math.PI) / 180),
    };
  };

  const arcPath = (start: number, end: number) => {
    const startPoint = arcPoint(start);
    const endPoint = arcPoint(end);
    const largeArc = end - start > 2 ? 1 : 0;
    return `M ${startPoint.x} ${startPoint.y} A 94 94 0 ${largeArc} 1 ${endPoint.x} ${endPoint.y}`;
  };

  const rating = getGpaRating(value, labels, language);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <svg
        viewBox="0 0 240 160"
        role="img"
        aria-label={labels.gpaGaugeLabel}
        className="mx-auto h-auto w-full max-w-[360px]"
      >
        <path d={arcPath(0, 2)} fill="none" stroke="#ef4444" strokeWidth="18" />
        <path d={arcPath(2, 2.5)} fill="none" stroke="#f59e0b" strokeWidth="18" />
        <path d={arcPath(2.5, 3)} fill="none" stroke="#84cc16" strokeWidth="18" />
        <path d={arcPath(3, 3.65)} fill="none" stroke="#22c55e" strokeWidth="18" />
        <path d={arcPath(3.65, 4)} fill="none" stroke="#16a34a" strokeWidth="18" />
        {[0, 1, 2, 3, 4].map((tick) => {
          const point = arcPoint(tick, 70);
          return (
            <text
              key={tick}
              x={point.x}
              y={point.y + 6}
              textAnchor="middle"
              className="fill-slate-800 text-[18px] font-bold"
            >
              {tick}
            </text>
          );
        })}
        <line
          x1="120"
          y1="126"
          x2={needleX}
          y2={needleY}
          stroke="#D4A017"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <circle cx="120" cy="126" r="7" fill="#111827" />
        <text
          x="120"
          y="104"
          textAnchor="middle"
          className="fill-slate-900 text-[24px] font-bold"
        >
          {value === null ? "—" : formatDecimal(value, locale)}
        </text>
        <text
          x="120"
          y="148"
          textAnchor="middle"
          className="fill-primary text-[15px] font-bold"
        >
          {rating.text}
        </text>
      </svg>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light text-primary">
          {icon}
        </span>
        <div>
          <p className="text-xs font-bold uppercase text-surface-muted">{label}</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ id: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-100 p-1 sm:grid-cols-3">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={cx(
            "rounded-md px-3 py-2 text-sm font-bold transition-colors",
            value === option.id
              ? "bg-white text-primary shadow-sm"
              : "text-slate-600 hover:text-slate-900",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function GradeSelect({
  value,
  onChange,
}: {
  value: CourseLetter;
  onChange: (letter: CourseLetter) => void;
}) {
  const { labels } = useCareerTracker();

  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as CourseLetter)}
      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 outline-none transition-colors focus:border-primary"
    >
      <option value="">{labels.selectGrade}</option>
      <optgroup label={labels.letterGrades}>
        {LETTER_GRADES.map((grade) => (
          <option key={grade.letter} value={grade.letter}>
            {grade.letter} · {grade.value}
          </option>
        ))}
      </optgroup>
      <optgroup label={labels.passFailOnly}>
        <option value="passed">{labels.passed}</option>
        <option value="failed">{labels.failed}</option>
      </optgroup>
    </select>
  );
}


export default function CareerTrackerClient() {
  const { copy, direction, language } = useSitePreferences();
  const labels = copy.career;
  const locale = language === "ar" ? "ar-JO" : "tr-TR";
  const contextValue = useMemo(
    () => ({ labels, direction, language, locale }),
    [labels, direction, language, locale],
  );

  useEffect(() => {
    document.title = labels.pageTitle;
  }, [labels.pageTitle]);

  return (
    <CareerTrackerContext.Provider value={contextValue}>
      <CareerTrackerApp />
    </CareerTrackerContext.Provider>
  );
}

function CareerTrackerApp() {
  const { labels, direction, language, locale } = useCareerTracker();
  const shellClass = language === "ar" ? "font-arabic" : "";

  const [store, setStore] = useState<CareerStore>({ universities: [] });
  const [hasLoaded, setHasLoaded] = useState(false);
  const [activeUniversityId, setActiveUniversityId] = useState<string | null>(null);
  const [activeTermId, setActiveTermId] = useState<string | null>(null);
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [universityTab, setUniversityTab] = useState<UniversityTab>("terms");
  const [showUniversityPicker, setShowUniversityPicker] = useState(false);
  const [showTermForm, setShowTermForm] = useState(false);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const currentYear = new Date().getFullYear();
  const [termYear, setTermYear] = useState(currentYear);
  const [termSeason, setTermSeason] = useState<TermSeason>("first");
  const [courseName, setCourseName] = useState("");
  const [courseMode, setCourseMode] = useState<CourseMode>("face");
  const [courseCredits, setCourseCredits] = useState<CreditWeight>(3);

  useEffect(() => {
    setStore(parseStoredCareer(window.localStorage.getItem(STORAGE_KEY)));
    setHasLoaded(true);
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }, [hasLoaded, store]);

  useEffect(() => {
    if (!hasLoaded) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      const summary = buildCareerSnapshotSummary(store, labels);
      void fetch("/api/career/snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary }),
        signal: controller.signal,
      }).catch(() => {
        // Kariyer takibi local çalışmaya devam eder; senkron sessiz kalır.
      });
    }, 800);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [hasLoaded, labels, store]);

  const activeUniversity = useMemo(
    () =>
      store.universities.find((university) => university.id === activeUniversityId) ??
      null,
    [activeUniversityId, store.universities],
  );

  const activeTerm = useMemo(() => {
    if (!activeUniversity) return null;
    return activeUniversity.terms.find((term) => term.id === activeTermId) ?? null;
  }, [activeTermId, activeUniversity]);

  const activeCourse = useMemo(() => {
    if (!activeTerm) return null;
    return activeTerm.courses.find((course) => course.id === activeCourseId) ?? null;
  }, [activeCourseId, activeTerm]);

  const allCourses = activeUniversity ? getAllCourses(activeUniversity) : [];
  const universityGpa = activeUniversity ? calculateGpa(allCourses) : null;

  const updateUniversity = (
    universityId: string,
    updater: (university: UniversityRecord) => UniversityRecord,
  ) => {
    setStore((current) => ({
      universities: current.universities.map((university) =>
        university.id === universityId ? updater(university) : university,
      ),
    }));
  };

  const updateTerm = (
    universityId: string,
    termId: string,
    updater: (term: CareerTerm) => CareerTerm,
  ) => {
    updateUniversity(universityId, (university) => ({
      ...university,
      terms: university.terms.map((term) => (term.id === termId ? updater(term) : term)),
    }));
  };

  const updateCourse = (
    universityId: string,
    termId: string,
    courseId: string,
    updater: (course: CareerCourse) => CareerCourse,
  ) => {
    updateTerm(universityId, termId, (term) => ({
      ...term,
      courses: term.courses.map((course) =>
        course.id === courseId ? updater(course) : course,
      ),
    }));
  };

  const addUniversity = () => {
    const existing = store.universities.find(
      (university) => university.universityId === "jordan-university",
    );
    if (existing) {
      setActiveUniversityId(existing.id);
      setShowUniversityPicker(false);
      return;
    }

    const next = createJordanUniversity(labels);
    setStore((current) => ({
      universities: [...current.universities, next],
    }));
    setActiveUniversityId(next.id);
    setShowUniversityPicker(false);
  };

  const addTerm = () => {
    if (!activeUniversity) return;
    const nextTerm: CareerTerm = {
      id: createId("term"),
      academicYear: termYear,
      season: termSeason,
      courses: [],
    };

    updateUniversity(activeUniversity.id, (university) => ({
      ...university,
      terms: [...university.terms, nextTerm],
    }));
    setActiveTermId(nextTerm.id);
    setShowTermForm(false);
  };

  const addCourse = () => {
    if (!activeUniversity || !activeTerm || !courseName.trim()) return;
    const nextCourse = makeCourse(courseName.trim(), courseMode, courseCredits, labels);

    updateTerm(activeUniversity.id, activeTerm.id, (term) => ({
      ...term,
      courses: [...term.courses, nextCourse],
    }));
    setCourseName("");
    setCourseMode("face");
    setCourseCredits(3);
    setActiveCourseId(nextCourse.id);
    setShowCourseForm(false);
  };

  const deleteTerm = (termId: string) => {
    if (!activeUniversity) return;
    updateUniversity(activeUniversity.id, (university) => ({
      ...university,
      terms: university.terms.filter((term) => term.id !== termId),
    }));
    if (activeTermId === termId) {
      setActiveTermId(null);
      setActiveCourseId(null);
    }
  };

  const deleteCourse = (courseId: string) => {
    if (!activeUniversity || !activeTerm) return;
    updateTerm(activeUniversity.id, activeTerm.id, (term) => ({
      ...term,
      courses: term.courses.filter((course) => course.id !== courseId),
    }));
    if (activeCourseId === courseId) setActiveCourseId(null);
  };

  const academicYearOptions = Array.from({ length: 9 }, (_, index) => currentYear - 3 + index);

  if (!hasLoaded) {
    return (
      <div dir={direction} className={shellClass}>
        <div className="mx-auto w-full max-w-6xl px-[5%] py-12">
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-surface-muted shadow-sm">
            {labels.loading}
          </div>
        </div>
      </div>
    );
  }

  if (activeUniversity && activeTerm && activeCourse) {
    return (
      <div dir={direction} className={shellClass}>
        <CourseDetailScreen
          course={activeCourse}
          term={activeTerm}
          university={activeUniversity}
          onBack={() => setActiveCourseId(null)}
          onDelete={() => deleteCourse(activeCourse.id)}
          onUpdateCourse={(updater) =>
            updateCourse(activeUniversity.id, activeTerm.id, activeCourse.id, updater)
          }
        />
      </div>
    );
  }

  if (activeUniversity && activeTerm) {
    return (
      <div dir={direction} className={shellClass}>
        <TermScreen
          courseCredits={courseCredits}
          courseMode={courseMode}
          courseName={courseName}
          onAddCourse={addCourse}
          onBack={() => setActiveTermId(null)}
          onCourseCreditsChange={setCourseCredits}
          onCourseModeChange={setCourseMode}
          onCourseNameChange={setCourseName}
          onDeleteCourse={deleteCourse}
          onOpenCourse={setActiveCourseId}
          onShowCourseFormChange={setShowCourseForm}
          showCourseForm={showCourseForm}
          term={activeTerm}
          university={activeUniversity}
        />
      </div>
    );
  }

  if (activeUniversity) {
    return (
      <div dir={direction} className={shellClass}>
        <UniversityScreen
          academicYearOptions={academicYearOptions}
          gpaSummary={universityGpa ?? { gpa: null, credits: 0, gradedCourses: 0 }}
          onAddTerm={addTerm}
          onBack={() => setActiveUniversityId(null)}
          onDeleteTerm={deleteTerm}
          onOpenTerm={setActiveTermId}
          onShowTermFormChange={setShowTermForm}
          onTermSeasonChange={setTermSeason}
          onTermYearChange={setTermYear}
          onUpdateCourse={(termId, courseId, updater) =>
            updateCourse(activeUniversity.id, termId, courseId, updater)
          }
          showTermForm={showTermForm}
          tab={universityTab}
          termSeason={termSeason}
          termYear={termYear}
          university={activeUniversity}
          onTabChange={setUniversityTab}
        />
      </div>
    );
  }

  const totalCourses = store.universities.reduce(
    (sum, university) => sum + getAllCourses(university).length,
    0,
  );
  const totalTerms = store.universities.reduce(
    (sum, university) => sum + university.terms.length,
    0,
  );

  const jordanCatalog = labels.universitiesCatalog["jordan-university"];

  return (
    <div dir={direction} className={shellClass}>
      <div className="mx-auto w-full max-w-6xl px-[5%] py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-gold">
            {labels.title}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-primary">
            {labels.subtitle}
          </h1>
        </div>
        <AppButton
          icon={<Plus className="h-4 w-4" aria-hidden="true" />}
          onClick={() => setShowUniversityPicker((value) => !value)}
          variant="secondary"
        >
          {labels.newUniversity}
        </AppButton>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <SummaryStat
          icon={<Landmark className="h-5 w-5" aria-hidden="true" />}
          label={labels.university}
          value={String(store.universities.length)}
        />
        <SummaryStat
          icon={<ListChecks className="h-5 w-5" aria-hidden="true" />}
          label={labels.term}
          value={String(totalTerms)}
        />
        <SummaryStat
          icon={<BookOpen className="h-5 w-5" aria-hidden="true" />}
          label={labels.course}
          value={String(totalCourses)}
        />
      </div>

      {showUniversityPicker && (
        <section className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">{labels.selectUniversity}</h2>
          <button
            type="button"
            onClick={addUniversity}
            className="mt-4 flex w-full items-center justify-between gap-4 rounded-lg border border-slate-200 p-4 text-left transition-colors hover:border-primary hover:bg-primary-light"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <Landmark className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-lg font-bold text-slate-900">
                  {language === "ar" ? jordanCatalog.nameAr : jordanCatalog.name}
                </span>
                <span className="mt-1 block text-sm text-surface-muted" dir="rtl">
                  {jordanCatalog.nameAr} · {labels.gradingSystem}
                </span>
              </span>
            </span>
            <ChevronRight className="h-5 w-5 text-primary" aria-hidden="true" />
          </button>
        </section>
      )}

      {store.universities.length === 0 ? (
        <EmptyPanel
          icon={<GraduationCap className="h-8 w-8" aria-hidden="true" />}
          title={labels.noUniversityYet}
          action={
            <AppButton
              icon={<Plus className="h-4 w-4" aria-hidden="true" />}
              onClick={() => setShowUniversityPicker(true)}
              variant="secondary"
            >
              {labels.newUniversity}
            </AppButton>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {store.universities.map((university) => {
            const courses = getAllCourses(university);
            const gpa = calculateGpa(courses);
            const meta = getUniversityMeta(
              university.universityId,
              labels,
              language,
            );
            return (
              <button
                key={university.id}
                type="button"
                onClick={() => setActiveUniversityId(university.id)}
                className="group rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm transition-colors hover:border-primary"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-light text-primary">
                      <Landmark className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block text-xl font-bold text-slate-900">
                        {meta.name}
                      </span>
                      <span className="mt-1 block text-sm text-surface-muted" dir="rtl">
                        {meta.nameAr}
                      </span>
                    </span>
                  </span>
                  <ChevronRight
                    className="h-5 w-5 text-slate-400 transition-colors group-hover:text-primary"
                    aria-hidden="true"
                  />
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <p className="text-xs font-bold text-surface-muted">{labels.term}</p>
                    <p className="mt-1 text-lg font-bold text-slate-900">
                      {university.terms.length}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <p className="text-xs font-bold text-surface-muted">{labels.course}</p>
                    <p className="mt-1 text-lg font-bold text-slate-900">
                      {courses.length}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <p className="text-xs font-bold text-surface-muted">{labels.gpa}</p>
                    <p className="mt-1 text-lg font-bold text-primary">
                      {gpa.gpa === null ? "—" : formatDecimal(gpa.gpa, locale)}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
}

function UniversityScreen({
  academicYearOptions,
  gpaSummary,
  onAddTerm,
  onBack,
  onDeleteTerm,
  onOpenTerm,
  onShowTermFormChange,
  onTabChange,
  onTermSeasonChange,
  onTermYearChange,
  onUpdateCourse,
  showTermForm,
  tab,
  termSeason,
  termYear,
  university,
}: {
  academicYearOptions: number[];
  gpaSummary: GpaSummary;
  onAddTerm: () => void;
  onBack: () => void;
  onDeleteTerm: (termId: string) => void;
  onOpenTerm: (termId: string) => void;
  onShowTermFormChange: (show: boolean) => void;
  onTabChange: (tab: UniversityTab) => void;
  onTermSeasonChange: (season: TermSeason) => void;
  onTermYearChange: (year: number) => void;
  onUpdateCourse: (
    termId: string,
    courseId: string,
    updater: (course: CareerCourse) => CareerCourse,
  ) => void;
  showTermForm: boolean;
  tab: UniversityTab;
  termSeason: TermSeason;
  termYear: number;
  university: UniversityRecord;
}) {
  const { labels, locale, language } = useCareerTracker();
  const courses = getAllCourses(university);
  const rating = getGpaRating(gpaSummary.gpa, labels, language);
  const meta = getUniversityMeta(university.universityId, labels, language);

  return (
    <div className="mx-auto w-full max-w-6xl px-[5%] py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {labels.universities}
        </button>
        <AppButton
          icon={<Plus className="h-4 w-4" aria-hidden="true" />}
          onClick={() => onShowTermFormChange(!showTermForm)}
          variant="secondary"
        >
          {labels.newTerm}
        </AppButton>
      </div>

      <section className="mb-6 rounded-lg bg-ink p-5 text-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-gold">
              {meta.grading}
            </p>
            <h1 className="mt-2 text-2xl font-bold">{meta.name}</h1>
            <p className="mt-1 font-arabic text-lg text-slate-200" dir="rtl">
              {meta.nameAr}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-white/10 px-4 py-3">
              <p className="text-xs font-bold text-slate-300">{labels.gpa}</p>
              <p className="mt-1 text-2xl font-bold text-gold">
                {gpaSummary.gpa === null ? "—" : formatDecimal(gpaSummary.gpa, locale)}
              </p>
            </div>
            <div className="rounded-lg bg-white/10 px-4 py-3">
              <p className="text-xs font-bold text-slate-300">{labels.weight}</p>
              <p className="mt-1 text-2xl font-bold">{gpaSummary.credits}</p>
            </div>
            <div className="rounded-lg bg-white/10 px-4 py-3">
              <p className="text-xs font-bold text-slate-300">{labels.degree}</p>
              <p className="mt-1 text-lg font-bold text-emerald-300">
                {rating.text}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mb-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-1 shadow-sm sm:grid-cols-3">
        {[
          { id: "terms", label: labels.myTerms, icon: <ListChecks className="h-4 w-4" /> },
          { id: "pass", label: labels.passFail, icon: <CheckCircle2 className="h-4 w-4" /> },
          { id: "letters", label: labels.letterGrades, icon: <Calculator className="h-4 w-4" /> },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onTabChange(item.id as UniversityTab)}
            className={cx(
              "inline-flex items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-bold transition-colors",
              tab === item.id
                ? "bg-primary text-white"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      {tab === "terms" && (
        <TermsTab
          academicYearOptions={academicYearOptions}
          onAddTerm={onAddTerm}
          onDeleteTerm={onDeleteTerm}
          onOpenTerm={onOpenTerm}
          onShowTermFormChange={onShowTermFormChange}
          onTermSeasonChange={onTermSeasonChange}
          onTermYearChange={onTermYearChange}
          showTermForm={showTermForm}
          termSeason={termSeason}
          termYear={termYear}
          university={university}
        />
      )}

      {tab === "pass" && <PassFailTab courses={courses} />}

      {tab === "letters" && (
        <LetterGradesTab
          gpaSummary={gpaSummary}
          onUpdateCourse={onUpdateCourse}
          university={university}
        />
      )}
    </div>
  );
}

function TermsTab({
  academicYearOptions,
  onAddTerm,
  onDeleteTerm,
  onOpenTerm,
  onShowTermFormChange,
  onTermSeasonChange,
  onTermYearChange,
  showTermForm,
  termSeason,
  termYear,
  university,
}: {
  academicYearOptions: number[];
  onAddTerm: () => void;
  onDeleteTerm: (termId: string) => void;
  onOpenTerm: (termId: string) => void;
  onShowTermFormChange: (show: boolean) => void;
  onTermSeasonChange: (season: TermSeason) => void;
  onTermYearChange: (year: number) => void;
  showTermForm: boolean;
  termSeason: TermSeason;
  termYear: number;
  university: UniversityRecord;
}) {
  const { labels, locale } = useCareerTracker();
  const sortedTerms = sortTerms(university.terms);

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-900">{labels.myTerms}</h2>
        <IconButton
          label={labels.newTermLabel}
          onClick={() => onShowTermFormChange(!showTermForm)}
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
        </IconButton>
      </div>

      {showTermForm && (
        <div className="mb-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <div>
              <FieldLabel>{labels.year}</FieldLabel>
              <select
                value={termYear}
                onChange={(event) => onTermYearChange(Number(event.target.value))}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-bold text-slate-900 outline-none transition-colors focus:border-primary"
              >
                {academicYearOptions.map((year) => (
                  <option key={year} value={year}>
                    {academicYearLabel(year)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel>{labels.term}</FieldLabel>
              <select
                value={termSeason}
                onChange={(event) => onTermSeasonChange(event.target.value as TermSeason)}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-bold text-slate-900 outline-none transition-colors focus:border-primary"
              >
                {TERM_SEASONS.map((season) => (
                  <option key={season.id} value={season.id}>
                    {labels.seasons[season.id]}
                  </option>
                ))}
              </select>
            </div>
            <AppButton
              icon={<Plus className="h-4 w-4" aria-hidden="true" />}
              onClick={onAddTerm}
            >
              {labels.addTerm}
            </AppButton>
          </div>
        </div>
      )}

      {sortedTerms.length === 0 ? (
        <EmptyPanel
          icon={<ListChecks className="h-8 w-8" aria-hidden="true" />}
          title={labels.noTermYet}
          action={
            <AppButton
              icon={<Plus className="h-4 w-4" aria-hidden="true" />}
              onClick={() => onShowTermFormChange(true)}
              variant="secondary"
            >
              {labels.newTerm}
            </AppButton>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {sortedTerms.map((term) => {
            const gpa = getTermGpa(term);
            const credits = term.courses.reduce((sum, course) => sum + course.credits, 0);
            const termLabel = `${academicYearLabel(term.academicYear)} · ${getSeasonLabel(term.season, labels)}`;
            return (
              <article
                key={term.id}
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => onOpenTerm(term.id)}
                    className="group flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-light text-primary">
                      <Landmark className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-xl font-bold text-slate-900 group-hover:text-primary">
                        {termLabel}
                      </span>
                      <span className="mt-1 block text-sm text-surface-muted">
                        {labels.coursesSummary(term.courses.length, credits)}
                      </span>
                    </span>
                    <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-primary" />
                  </button>
                  <IconButton
                    label={labels.deleteTerm}
                    onClick={() => onDeleteTerm(term.id)}
                    tone="danger"
                    confirm={{
                      title: labels.deleteTerm,
                      description: labels.deleteTermDescription(termLabel),
                      confirmLabel: labels.deleteTerm,
                    }}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </IconButton>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <p className="text-xs font-bold text-surface-muted">{labels.gpa}</p>
                    <p className="mt-1 text-lg font-bold text-primary">
                      {gpa.gpa === null ? "—" : formatDecimal(gpa.gpa, locale)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <p className="text-xs font-bold text-surface-muted">{labels.graded}</p>
                    <p className="mt-1 text-lg font-bold text-slate-900">
                      {gpa.gradedCourses}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <p className="text-xs font-bold text-surface-muted">{labels.weight}</p>
                    <p className="mt-1 text-lg font-bold text-slate-900">{gpa.credits}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function TermScreen({
  courseCredits,
  courseMode,
  courseName,
  onAddCourse,
  onBack,
  onCourseCreditsChange,
  onCourseModeChange,
  onCourseNameChange,
  onDeleteCourse,
  onOpenCourse,
  onShowCourseFormChange,
  showCourseForm,
  term,
  university,
}: {
  courseCredits: CreditWeight;
  courseMode: CourseMode;
  courseName: string;
  onAddCourse: () => void;
  onBack: () => void;
  onCourseCreditsChange: (credits: CreditWeight) => void;
  onCourseModeChange: (mode: CourseMode) => void;
  onCourseNameChange: (name: string) => void;
  onDeleteCourse: (courseId: string) => void;
  onOpenCourse: (courseId: string) => void;
  onShowCourseFormChange: (show: boolean) => void;
  showCourseForm: boolean;
  term: CareerTerm;
  university: UniversityRecord;
}) {
  const { labels, locale, language } = useCareerTracker();
  const gpa = getTermGpa(term);
  const credits = term.courses.reduce((sum, course) => sum + course.credits, 0);
  const meta = getUniversityMeta(university.universityId, labels, language);

  const getCourseStatus = (course: CareerCourse) => {
    const score = getScoreTotals(course);
    const gradeValue = getGradeSelectValue(course);
    if (isPassFailGrade(gradeValue)) {
      return gradeValue === "passed"
        ? { tone: "good" as const, label: labels.passed }
        : { tone: "warn" as const, label: labels.failed };
    }
    if (course.credits === 0) {
      if (course.passStatus === "passed") {
        return { tone: "good" as const, label: labels.passed };
      }
      if (course.passStatus === "failed") {
        return { tone: "warn" as const, label: labels.failed };
      }
      return { tone: "muted" as const, label: labels.waitingStatus };
    }
    return score.percent >= course.targetScore
      ? { tone: "good" as const, label: labels.passing }
      : { tone: "warn" as const, label: labels.atRisk };
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-[5%] py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {labels.myTerms}
        </button>
        <AppButton
          icon={<Plus className="h-4 w-4" aria-hidden="true" />}
          onClick={() => onShowCourseFormChange(!showCourseForm)}
          variant="secondary"
        >
          {labels.newCourse}
        </AppButton>
      </div>

      <section className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-gold">
              {meta.name}
            </p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">
              {academicYearLabel(term.academicYear)} · {getSeasonLabel(term.season, labels)}
            </h1>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-slate-50 px-4 py-3">
              <p className="text-xs font-bold text-surface-muted">{labels.course}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {term.courses.length}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 px-4 py-3">
              <p className="text-xs font-bold text-surface-muted">{labels.weight}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{credits}</p>
            </div>
            <div className="rounded-lg bg-slate-50 px-4 py-3">
              <p className="text-xs font-bold text-surface-muted">{labels.gpa}</p>
              <p className="mt-1 text-2xl font-bold text-primary">
                {gpa.gpa === null ? "—" : formatDecimal(gpa.gpa, locale)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-900">{labels.myCourses}</h2>
        <IconButton
          label={labels.newCourseLabel}
          onClick={() => onShowCourseFormChange(!showCourseForm)}
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
        </IconButton>
      </div>

      {showCourseForm && (
        <div className="mb-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4">
            <div>
              <FieldLabel>{labels.courseName}</FieldLabel>
              <input
                value={courseName}
                onChange={(event) => onCourseNameChange(event.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-bold text-slate-900 outline-none transition-colors focus:border-primary"
                placeholder={labels.courseNamePlaceholder}
              />
            </div>

            <div>
              <FieldLabel>{labels.courseMode}</FieldLabel>
              <div className="mt-2">
                <SegmentedControl
                  value={courseMode}
                  options={COURSE_MODES.map((mode) => ({
                    id: mode.id,
                    label: labels.modes[mode.id],
                  }))}
                  onChange={onCourseModeChange}
                />
              </div>
            </div>

            <div>
              <FieldLabel>{labels.weight}</FieldLabel>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {CREDIT_OPTIONS.map((credit) => (
                  <button
                    key={credit}
                    type="button"
                    onClick={() => onCourseCreditsChange(credit)}
                    className={cx(
                      "rounded-lg border px-3 py-2 text-sm font-bold transition-colors",
                      courseCredits === credit
                        ? "border-primary bg-primary text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-primary",
                    )}
                  >
                    {credit}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <AppButton
                icon={<Plus className="h-4 w-4" aria-hidden="true" />}
                onClick={onAddCourse}
                disabled={!courseName.trim()}
              >
                {labels.addCourse}
              </AppButton>
            </div>
          </div>
        </div>
      )}

      {term.courses.length === 0 ? (
        <EmptyPanel
          icon={<BookOpen className="h-8 w-8" aria-hidden="true" />}
          title={labels.noCourseYet}
          action={
            <AppButton
              icon={<Plus className="h-4 w-4" aria-hidden="true" />}
              onClick={() => onShowCourseFormChange(true)}
              variant="secondary"
            >
              {labels.newCourse}
            </AppButton>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {term.courses.map((course) => {
            const score = getScoreTotals(course);
            const point = getGradePoint(course.letterGrade);
            const { tone: statusTone, label: statusLabel } = getCourseStatus(course);

            return (
              <article
                key={course.id}
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => onOpenCourse(course.id)}
                    className="group flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-light text-primary">
                      <BookOpen className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-xl font-bold text-slate-900 group-hover:text-primary">
                        {course.name}
                      </span>
                      <span className="mt-1 block text-sm text-surface-muted">
                        {getModeLabel(course.mode, labels)} · {course.credits}{" "}
                        {labels.weightSuffix}
                      </span>
                    </span>
                    <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-primary" />
                  </button>
                  <IconButton
                    label={labels.deleteCourse}
                    onClick={() => onDeleteCourse(course.id)}
                    tone="danger"
                    confirm={{
                      title: labels.deleteCourse,
                      description: labels.deleteCourseDescription(course.name),
                      confirmLabel: labels.deleteCourse,
                    }}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </IconButton>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <p className="text-xs font-bold text-surface-muted">{labels.score}</p>
                    <p className="mt-1 text-lg font-bold text-slate-900">
                      {formatPercent(score.percent, locale)}%
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <p className="text-xs font-bold text-surface-muted">{labels.letter}</p>
                    <p className="mt-1 text-lg font-bold text-primary" dir="rtl">
                      {formatGradeLabel(course.letterGrade, labels)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <p className="text-xs font-bold text-surface-muted">{labels.coefficient}</p>
                    <p className="mt-1 text-lg font-bold text-slate-900">
                      {point === null ? "—" : point}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <StatusPill tone={statusTone}>{statusLabel}</StatusPill>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CourseDetailScreen({
  course,
  onBack,
  onDelete,
  onUpdateCourse,
  term,
  university,
}: {
  course: CareerCourse;
  onBack: () => void;
  onDelete: () => void;
  onUpdateCourse: (updater: (course: CareerCourse) => CareerCourse) => void;
  term: CareerTerm;
  university: UniversityRecord;
}) {
  const { labels, locale, language } = useCareerTracker();
  const score = getScoreTotals(course);
  const letterPoint = getGradePoint(course.letterGrade);
  const isOutsideGpa = course.credits === 0;
  const meta = getUniversityMeta(university.universityId, labels, language);

  const updateAssessment = (
    partId: string,
    updater: (part: AssessmentPart) => AssessmentPart,
  ) => {
    onUpdateCourse((current) => ({
      ...current,
      assessments: current.assessments.map((part) =>
        part.id === partId ? updater(part) : part,
      ),
    }));
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-[5%] py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {labels.myCourses}
        </button>
        <IconButton
          label={labels.deleteCourse}
          onClick={onDelete}
          tone="danger"
          confirm={{
            title: labels.deleteCourse,
            description: labels.deleteCourseDescription(course.name),
            confirmLabel: labels.deleteCourse,
          }}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </IconButton>
      </div>

      <section className="mb-6 rounded-lg bg-ink p-5 text-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-gold">
              {meta.name} · {academicYearLabel(term.academicYear)} ·{" "}
              {getSeasonLabel(term.season, labels)}
            </p>
            <h1 className="mt-2 text-2xl font-bold">{course.name}</h1>
            <p className="mt-1 text-sm text-slate-300">
              {getModeLabel(course.mode, labels)} · {course.credits}{" "}
              {labels.weightSuffix}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-lg bg-white/10 px-5 py-3">
              <p className="text-xs font-bold text-slate-300">{labels.currentScore}</p>
              <p className="mt-1 text-3xl font-bold text-gold">
                {formatPercent(score.percent, locale)}%
              </p>
            </div>
            <div className="rounded-lg bg-white/10 px-5 py-3">
              <p className="text-xs font-bold text-slate-300">{labels.target}</p>
              <p className="mt-1 text-3xl font-bold">{course.targetScore}%</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{labels.scoreTracking}</h2>
              <p className="mt-1 text-sm font-semibold text-surface-muted">
                {labels.pointsSummary(
                  formatDecimal(score.score, locale, 1),
                  formatDecimal(score.max, locale, 1),
                )}
              </p>
            </div>
            <AppButton
              icon={<RotateCcw className="h-4 w-4" aria-hidden="true" />}
              onClick={() =>
                onUpdateCourse((current) => ({
                  ...current,
                  assessments: getDefaultAssessments(current.mode, labels),
                }))
              }
              variant="ghost"
            >
              {labels.resetDefault}
            </AppButton>
          </div>

          <div className="divide-y divide-slate-100">
            {course.assessments.map((part) => (
              <div
                key={part.id}
                className="grid gap-3 py-4 md:grid-cols-[minmax(0,1fr)_110px_110px_40px] md:items-center"
              >
                <input
                  value={part.label}
                  onChange={(event) =>
                    updateAssessment(part.id, (current) => ({
                      ...current,
                      label: event.target.value,
                    }))
                  }
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 outline-none transition-colors focus:border-primary"
                />
                <label className="grid gap-1 text-xs font-bold text-surface-muted">
                  {labels.earned}
                  <input
                    type="number"
                    min={0}
                    max={part.max}
                    value={part.score}
                    onChange={(event) =>
                      updateAssessment(part.id, (current) => ({
                        ...current,
                        score: clamp(safeNumber(event.target.value), 0, current.max),
                      }))
                    }
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 outline-none transition-colors focus:border-primary"
                  />
                </label>
                <label className="grid gap-1 text-xs font-bold text-surface-muted">
                  {labels.outOf}
                  <input
                    type="number"
                    min={0}
                    value={part.max}
                    onChange={(event) =>
                      updateAssessment(part.id, (current) => {
                        const max = Math.max(0, safeNumber(event.target.value));
                        return {
                          ...current,
                          max,
                          score: clamp(current.score, 0, max),
                        };
                      })
                    }
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 outline-none transition-colors focus:border-primary"
                  />
                </label>
                <IconButton
                  label={labels.deleteAssessmentPart}
                  onClick={() =>
                    onUpdateCourse((current) => ({
                      ...current,
                      assessments:
                        current.assessments.length > 1
                          ? current.assessments.filter((item) => item.id !== part.id)
                          : current.assessments,
                    }))
                  }
                  tone="danger"
                  confirm={{
                    title: labels.deleteAssessmentPart,
                    description: labels.deleteAssessmentPartDescription(part.label),
                    confirmLabel: labels.deletePart,
                  }}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </IconButton>
              </div>
            ))}
          </div>

          <div className="mt-5 flex justify-end">
            <AppButton
              icon={<Plus className="h-4 w-4" aria-hidden="true" />}
              onClick={() =>
                onUpdateCourse((current) => ({
                  ...current,
                  assessments: [
                    ...current.assessments,
                    {
                      id: createId("part"),
                      label: labels.newAssessmentPart,
                      max: 0,
                      score: 0,
                    },
                  ],
                }))
              }
              variant="ghost"
            >
              {labels.addAssessmentPart}
            </AppButton>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">{labels.courseSettings}</h2>

            <div className="mt-5 space-y-4">
              <div>
                <FieldLabel>{labels.courseMode}</FieldLabel>
                <div className="mt-2">
                  <SegmentedControl
                    value={course.mode}
                    options={COURSE_MODES.map((mode) => ({
                      id: mode.id,
                      label: labels.modes[mode.id],
                    }))}
                    onChange={(mode) =>
                      onUpdateCourse((current) => ({
                        ...current,
                        mode,
                      }))
                    }
                  />
                </div>
              </div>

              <div>
                <FieldLabel>{labels.weight}</FieldLabel>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {CREDIT_OPTIONS.map((credit) => (
                    <button
                      key={credit}
                      type="button"
                      onClick={() =>
                        onUpdateCourse((current) => ({
                          ...current,
                          credits: credit,
                        }))
                      }
                      className={cx(
                        "rounded-lg border px-3 py-2 text-sm font-bold transition-colors",
                        course.credits === credit
                          ? "border-primary bg-primary text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-primary",
                      )}
                    >
                      {credit}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block">
                <FieldLabel>{labels.passTarget}</FieldLabel>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={course.targetScore}
                  onChange={(event) =>
                    onUpdateCourse((current) => ({
                      ...current,
                      targetScore: clamp(safeNumber(event.target.value), 0, 100),
                    }))
                  }
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-bold text-slate-900 outline-none transition-colors focus:border-primary"
                />
              </label>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">{labels.letterGradeTitle}</h2>
            <div className="mt-4">
              {isOutsideGpa ? (
                <>
                  <StatusPill tone="muted">{labels.outsideGpaCourse}</StatusPill>
                  <div className="mt-4">
                    <GradeSelect
                      value={getGradeSelectValue(course)}
                      onChange={(letterGrade) =>
                        onUpdateCourse((current) => ({
                          ...current,
                          ...applyGradeSelection(letterGrade),
                        }))
                      }
                    />
                  </div>
                </>
              ) : (
                <>
                  <GradeSelect
                    value={getGradeSelectValue(course)}
                    onChange={(letterGrade) =>
                      onUpdateCourse((current) => ({
                        ...current,
                        ...applyGradeSelection(letterGrade),
                      }))
                    }
                  />
                  {isPassFailGrade(course.letterGrade) ? (
                    <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">
                      {labels.outsideGpaShort}
                    </p>
                  ) : (
                    <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">
                      {labels.coefficientLabel(
                        letterPoint === null ? "—" : String(letterPoint),
                      )}
                    </p>
                  )}
                </>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">{labels.passStatusTitle}</h2>
            <div className="mt-4">
              {isOutsideGpa || isPassFailGrade(course.letterGrade) ? (
                getGradeSelectValue(course) === "passed" ? (
                  <StatusPill tone="good">{labels.passed}</StatusPill>
                ) : getGradeSelectValue(course) === "failed" ? (
                  <StatusPill tone="warn">{labels.failed}</StatusPill>
                ) : (
                  <StatusPill tone="muted">{labels.waitingStatus}</StatusPill>
                )
              ) : score.percent >= course.targetScore ? (
                <StatusPill tone="good">{labels.passing}</StatusPill>
              ) : (
                <StatusPill tone="warn">{labels.atRisk}</StatusPill>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function PassFailTab({ courses }: { courses: CareerCourse[] }) {
  const { labels, locale } = useCareerTracker();

  const getCourseStatus = (course: CareerCourse) => {
    const score = getScoreTotals(course);
    const gradeValue = getGradeSelectValue(course);
    if (isPassFailGrade(gradeValue)) {
      return gradeValue === "passed"
        ? { tone: "good" as const, label: labels.passed }
        : { tone: "warn" as const, label: labels.failed };
    }
    const isOutsideGpa = course.credits === 0;
    if (isOutsideGpa && course.passStatus === "unset") {
      return { tone: "muted" as const, label: labels.waitingStatus };
    }
    if (isOutsideGpa) {
      return course.passStatus === "passed"
        ? { tone: "good" as const, label: labels.passed }
        : { tone: "warn" as const, label: labels.failed };
    }
    return score.percent >= course.targetScore
      ? { tone: "good" as const, label: labels.passing }
      : { tone: "warn" as const, label: labels.atRisk };
  };

  if (courses.length === 0) {
    return (
      <EmptyPanel
        icon={<CheckCircle2 className="h-8 w-8" aria-hidden="true" />}
        title={labels.noCourseYet}
      />
    );
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="grid grid-cols-[minmax(0,1fr)_120px_120px_130px] border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-bold uppercase text-surface-muted max-md:hidden">
        <span>{labels.course}</span>
        <span>{labels.score}</span>
        <span>{labels.target}</span>
        <span>{labels.statusColumn}</span>
      </div>
      <div className="divide-y divide-slate-100">
        {courses.map((course) => {
          const score = getScoreTotals(course);
          const { tone, label } = getCourseStatus(course);

          return (
            <div
              key={course.id}
              className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1fr)_120px_120px_130px] md:items-center"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">
                  {course.name}
                </p>
                <p className="mt-1 text-xs font-semibold text-surface-muted">
                  {getModeLabel(course.mode, labels)} · {course.credits}{" "}
                  {labels.weightSuffix}
                </p>
              </div>
              <p className="text-sm font-bold text-slate-800">
                {formatPercent(score.percent, locale)}%
              </p>
              <p className="text-sm font-bold text-slate-800">
                {course.targetScore}%
              </p>
              <StatusPill tone={tone}>{label}</StatusPill>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function LetterGradesTab({
  gpaSummary,
  onUpdateCourse,
  university,
}: {
  gpaSummary: GpaSummary;
  onUpdateCourse: (
    termId: string,
    courseId: string,
    updater: (course: CareerCourse) => CareerCourse,
  ) => void;
  university: UniversityRecord;
}) {
  const { labels, locale } = useCareerTracker();
  const terms = sortTerms(university.terms).filter((term) => term.courses.length > 0);
  const [expandedTerms, setExpandedTerms] = useState<Record<string, boolean>>({});

  const toggleTerm = (termId: string) => {
    setExpandedTerms((current) => ({
      ...current,
      [termId]: !(current[termId] ?? false),
    }));
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
      <div className="space-y-5">
        <GpaGauge value={gpaSummary.gpa} />

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">{labels.gpaDegree}</h2>
          <div className="mt-4 divide-y divide-slate-100">
            {GPA_RATINGS.map((rating) => (
              <div
                key={rating.key}
                className="flex items-center justify-between gap-3 py-2 text-sm"
              >
                <span className="font-bold text-slate-900">
                  {rating.labelAr} · {labels.gpaRatings[rating.key]}
                </span>
                <span className="text-surface-muted">
                  {rating.min === 0
                    ? labels.belowTwo
                    : `${formatDecimal(rating.min, locale)} - ${formatDecimal(rating.max, locale)}`}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="space-y-5">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {labels.letterGradeTracking}
              </h2>
              <p className="mt-1 text-sm font-semibold text-surface-muted">
                {labels.gradedCoursesSummary(
                  gpaSummary.gradedCourses,
                  gpaSummary.credits,
                )}
              </p>
            </div>
            <StatusPill tone="muted">{labels.outOfFour}</StatusPill>
          </div>

          {terms.length === 0 ? (
            <div className="mt-5">
              <EmptyPanel
                icon={<Calculator className="h-8 w-8" aria-hidden="true" />}
                title={labels.noCourseYet}
              />
            </div>
          ) : (
            <div className="mt-5 divide-y divide-slate-100">
              {terms.map((term) => {
                const isExpanded = expandedTerms[term.id] ?? false;
                const termCredits = term.courses.reduce(
                  (sum, course) => sum + course.credits,
                  0,
                );

                return (
                  <div key={term.id}>
                    <button
                      type="button"
                      onClick={() => toggleTerm(term.id)}
                      aria-expanded={isExpanded}
                      className="flex w-full items-center justify-between gap-3 py-3 text-left transition-colors hover:text-primary"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900">
                          {academicYearLabel(term.academicYear)} ·{" "}
                          {getSeasonLabel(term.season, labels)}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-surface-muted">
                          {labels.coursesSummary(term.courses.length, termCredits)}
                        </p>
                      </div>
                      <ChevronRight
                        className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${
                          isExpanded ? "rotate-90" : ""
                        }`}
                        aria-hidden="true"
                      />
                    </button>

                    {isExpanded && (
                      <div className="divide-y divide-slate-100 border-t border-slate-100">
                        {term.courses.map((course) => (
                          <div
                            key={course.id}
                            className="grid gap-3 py-4 md:grid-cols-[minmax(0,1fr)_120px_180px] md:items-center"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-slate-900">
                                {course.name}
                              </p>
                              <p className="mt-1 text-xs font-semibold text-surface-muted">
                                {course.credits} {labels.weightSuffix}
                              </p>
                            </div>
                            {course.credits === 0 || isPassFailGrade(course.letterGrade) ? (
                              <StatusPill
                                tone={
                                  getGradeSelectValue(course) === "passed"
                                    ? "good"
                                    : getGradeSelectValue(course) === "failed"
                                      ? "warn"
                                      : "muted"
                                }
                              >
                                {formatGradeLabel(getGradeSelectValue(course), labels)}
                              </StatusPill>
                            ) : (
                              <p className="text-sm font-bold text-slate-800">
                                {labels.coefficientLabel(
                                  String(getGradePoint(course.letterGrade) ?? "—"),
                                )}
                              </p>
                            )}
                            <GradeSelect
                              value={getGradeSelectValue(course)}
                              onChange={(letterGrade) =>
                                onUpdateCourse(term.id, course.id, (current) => ({
                                  ...current,
                                  ...applyGradeSelection(letterGrade),
                                }))
                              }
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">{labels.symbolSystem}</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {LETTER_GRADES.map((grade) => (
              <div
                key={grade.letter}
                className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
              >
                <span className="font-arabic text-xl font-bold text-primary" dir="rtl">
                  {grade.letter}
                </span>
                <span className="text-sm font-bold text-slate-800">{grade.value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
