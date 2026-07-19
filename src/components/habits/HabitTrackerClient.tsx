"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  Activity,
  Apple,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Award,
  BarChart3,
  BookOpen,
  Bookmark,
  Brain,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Church,
  Clock,
  Coffee,
  Compass,
  Crown,
  Droplets,
  Dumbbell,
  Flag,
  Flame,
  Flower2,
  Footprints,
  Gem,
  Gift,
  Globe,
  GraduationCap,
  Hammer,
  Headphones,
  Heart,
  Home,
  Key,
  Landmark,
  Layers3,
  Leaf,
  Library,
  Lightbulb,
  Mail,
  Map as MapIcon,
  Medal,
  Menu,
  MessageCircle,
  Microscope,
  Moon,
  Music,
  Palette,
  PenLine,
  Pill,
  Plane,
  Plus,
  Quote,
  Rocket,
  Save,
  Scale,
  ScrollText,
  Search,
  Settings,
  Shield,
  Ship,
  SlidersHorizontal,
  Smile,
  Sparkles,
  Star,
  Sun,
  Sunrise,
  Target,
  Timer,
  Trash2,
  TreePine,
  TrendingUp,
  Trophy,
  Umbrella,
  Users,
  Utensils,
  Wallet,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useSitePreferences } from "@/components/settings/SitePreferencesProvider";

const STORAGE_KEY = "ilim-kapisi-rutin-defteri-v1";

type RangeKey = "7" | "30" | "180" | "custom" | "all";

interface CustomRange {
  start: string;
  end: string;
}

const STATS_RANGE_OPTIONS: Array<{ id: Exclude<RangeKey, "all">; label: string }> = [
  { id: "7", label: "1 hafta" },
  { id: "30", label: "1 ay" },
  { id: "180", label: "6 ay" },
  { id: "custom", label: "Özel" },
];
type HabitStyleKey = "sleep" | "book" | "quran" | "study" | "custom";

const HABIT_FIELD_ICON_OPTIONS = [
  { id: "book", Icon: BookOpen, label: "Kitap" },
  { id: "scroll", Icon: ScrollText, label: "Metin" },
  { id: "bookmark", Icon: Bookmark, label: "Ayraç" },
  { id: "library", Icon: Library, label: "Kütüphane" },
  { id: "quote", Icon: Quote, label: "Alıntı" },
  { id: "pen", Icon: PenLine, label: "Kalem" },
  { id: "star", Icon: Star, label: "Yıldız" },
  { id: "sparkles", Icon: Sparkles, label: "Işıltı" },
  { id: "heart", Icon: Heart, label: "Kalp" },
  { id: "smile", Icon: Smile, label: "Gülümseme" },
  { id: "layers", Icon: Layers3, label: "Katman" },
  { id: "target", Icon: Target, label: "Hedef" },
  { id: "flag", Icon: Flag, label: "Bayrak" },
  { id: "trophy", Icon: Trophy, label: "Kupa" },
  { id: "medal", Icon: Medal, label: "Madalya" },
  { id: "award", Icon: Award, label: "Ödül" },
  { id: "crown", Icon: Crown, label: "Taç" },
  { id: "gem", Icon: Gem, label: "Mücevher" },
  { id: "moon", Icon: Moon, label: "Gece" },
  { id: "sun", Icon: Sun, label: "Güneş" },
  { id: "sunrise", Icon: Sunrise, label: "Şafak" },
  { id: "flame", Icon: Flame, label: "Ateş" },
  { id: "zap", Icon: Zap, label: "Enerji" },
  { id: "leaf", Icon: Leaf, label: "Yaprak" },
  { id: "tree", Icon: TreePine, label: "Ağaç" },
  { id: "flower", Icon: Flower2, label: "Çiçek" },
  { id: "droplets", Icon: Droplets, label: "Su" },
  { id: "coffee", Icon: Coffee, label: "Kahve" },
  { id: "apple", Icon: Apple, label: "Elma" },
  { id: "utensils", Icon: Utensils, label: "Yemek" },
  { id: "brain", Icon: Brain, label: "Zihin" },
  { id: "lightbulb", Icon: Lightbulb, label: "Fikir" },
  { id: "graduation", Icon: GraduationCap, label: "Eğitim" },
  { id: "microscope", Icon: Microscope, label: "Bilim" },
  { id: "palette", Icon: Palette, label: "Sanat" },
  { id: "music", Icon: Music, label: "Müzik" },
  { id: "headphones", Icon: Headphones, label: "Dinleme" },
  { id: "message", Icon: MessageCircle, label: "Mesaj" },
  { id: "mail", Icon: Mail, label: "Posta" },
  { id: "home", Icon: Home, label: "Ev" },
  { id: "compass", Icon: Compass, label: "Pusula" },
  { id: "map", Icon: MapIcon, label: "Harita" },
  { id: "globe", Icon: Globe, label: "Dünya" },
  { id: "landmark", Icon: Landmark, label: "Anıt" },
  { id: "church", Icon: Church, label: "Mabet" },
  { id: "scale", Icon: Scale, label: "Adalet" },
  { id: "shield", Icon: Shield, label: "Kalkan" },
  { id: "key", Icon: Key, label: "Anahtar" },
  { id: "hammer", Icon: Hammer, label: "Çekiç" },
  { id: "dumbbell", Icon: Dumbbell, label: "Spor" },
  { id: "footprints", Icon: Footprints, label: "Yürüyüş" },
  { id: "activity", Icon: Activity, label: "Aktivite" },
  { id: "timer", Icon: Timer, label: "Süre" },
  { id: "clock", Icon: Clock, label: "Saat" },
  { id: "pill", Icon: Pill, label: "Sağlık" },
  { id: "rocket", Icon: Rocket, label: "Roket" },
  { id: "plane", Icon: Plane, label: "Uçak" },
  { id: "ship", Icon: Ship, label: "Gemi" },
  { id: "umbrella", Icon: Umbrella, label: "Şemsiye" },
  { id: "wallet", Icon: Wallet, label: "Cüzdan" },
  { id: "gift", Icon: Gift, label: "Hediye" },
  { id: "users", Icon: Users, label: "Topluluk" },
] as const;

type HabitFieldIconKey = (typeof HABIT_FIELD_ICON_OPTIONS)[number]["id"];

const HABIT_FIELD_COLOR_OPTIONS = [
  { id: "emerald", label: "Zümrüt", value: "#047857", soft: "#ecfdf5" },
  { id: "forest", label: "Orman", value: "#065f46", soft: "#d1fae5" },
  { id: "teal", label: "Turkuaz", value: "#0f766e", soft: "#ccfbf1" },
  { id: "cyan", label: "Camgöbeği", value: "#0e7490", soft: "#ecfeff" },
  { id: "sky", label: "Gök", value: "#0369a1", soft: "#e0f2fe" },
  { id: "indigo", label: "İndigo", value: "#4338ca", soft: "#eef2ff" },
  { id: "violet", label: "Menekşe", value: "#6d28d9", soft: "#f5f3ff" },
  { id: "rose", label: "Gül", value: "#be123c", soft: "#fff1f2" },
  { id: "amber", label: "Kehribar", value: "#b45309", soft: "#fffbeb" },
  { id: "orange", label: "Turuncu", value: "#c2410c", soft: "#ffedd5" },
  { id: "gold", label: "Altın", value: "#92680c", soft: "#fef9c3" },
  { id: "slate", label: "Arduvaz", value: "#475569", soft: "#f1f5f9" },
  { id: "stone", label: "Taş", value: "#57534e", soft: "#f5f5f4" },
  { id: "navy", label: "Lacivert", value: "#1e3a8a", soft: "#eff6ff" },
  { id: "wine", label: "Bordo", value: "#881337", soft: "#ffe4e6" },
  { id: "olive", label: "Zeytin", value: "#4d7c0f", soft: "#ecfccb" },
] as const;

type HabitFieldColorKey = (typeof HABIT_FIELD_COLOR_OPTIONS)[number]["id"];

function isHabitFieldColorKey(value: unknown): value is HabitFieldColorKey {
  return HABIT_FIELD_COLOR_OPTIONS.some((option) => option.id === value);
}

function getHabitFieldColorOption(color: HabitFieldColorKey) {
  return HABIT_FIELD_COLOR_OPTIONS.find((option) => option.id === color) ?? HABIT_FIELD_COLOR_OPTIONS[0];
}

function isHabitFieldIconKey(value: unknown): value is HabitFieldIconKey {
  return HABIT_FIELD_ICON_OPTIONS.some((option) => option.id === value);
}

function getHabitFieldIconOption(icon: HabitFieldIconKey) {
  return HABIT_FIELD_ICON_OPTIONS.find((option) => option.id === icon) ?? HABIT_FIELD_ICON_OPTIONS[0];
}

function getHabitFieldByName(habit: Habit, fieldName: string) {
  return habit.fields.find((field) => field.name === fieldName);
}

function HabitFieldIcon({
  icon,
  color,
  className,
}: {
  icon: HabitFieldIconKey;
  color?: HabitFieldColorKey;
  className?: string;
}) {
  const { Icon } = getHabitFieldIconOption(icon);
  const tone = color ? getHabitFieldColorOption(color) : null;
  return (
    <Icon
      className={className}
      style={tone ? { color: tone.value } : undefined}
      aria-hidden="true"
    />
  );
}

function HabitFieldIconBadge({
  icon,
  color,
  size = "md",
}: {
  icon: HabitFieldIconKey;
  color: HabitFieldColorKey;
  size?: "sm" | "md" | "lg";
}) {
  const tone = getHabitFieldColorOption(color);
  const sizeClass =
    size === "lg" ? "h-8 w-8" : size === "sm" ? "h-6 w-6" : "h-7 w-7";
  const iconClass = size === "lg" ? "h-4 w-4" : size === "sm" ? "h-3.5 w-3.5" : "h-3.5 w-3.5";

  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center justify-center rounded-lg border",
        sizeClass,
      )}
      style={{
        backgroundColor: tone.soft,
        borderColor: `${tone.value}22`,
        color: tone.value,
      }}
    >
      <HabitFieldIcon icon={icon} color={color} className={iconClass} />
    </span>
  );
}

interface HabitPageField {
  id: string;
  name: string;
  icon: HabitFieldIconKey;
  color: HabitFieldColorKey;
}

interface Habit {
  id: string;
  name: string;
  unit: string;
  target: number | null;
  styleKey: HabitStyleKey;
  fields: HabitPageField[];
}

interface HabitEntry {
  id: string;
  habitId: string;
  date: string;
  value: number;
  note: string;
  field: string;
  createdAt: string;
}

interface HabitStore {
  habits: Habit[];
  entries: HabitEntry[];
}

interface HabitStyle {
  label: string;
  Icon: LucideIcon;
  color: string;
  chipClass: string;
  activeClass: string;
  barClass: string;
}

const DEFAULT_HABITS: Habit[] = [
  {
    id: "sleep",
    name: "Uyku",
    unit: "saat",
    target: 8,
    styleKey: "sleep",
    fields: [],
  },
  {
    id: "reading",
    name: "Kitap Okuma",
    unit: "sayfa",
    target: 30,
    styleKey: "book",
    fields: [],
  },
  {
    id: "quran",
    name: "Kur'an-ı Kerim",
    unit: "sayfa",
    target: 10,
    styleKey: "quran",
    fields: [],
  },
  {
    id: "study",
    name: "Ders Çalışma",
    unit: "dakika",
    target: 90,
    styleKey: "study",
    fields: [],
  },
];

const HABIT_STYLES: Record<HabitStyleKey, HabitStyle> = {
  sleep: {
    label: "Gece",
    Icon: Moon,
    color: "#0284c7",
    chipClass: "bg-sky-100 text-sky-700 border-sky-200",
    activeClass: "border-sky-300 bg-sky-50",
    barClass: "bg-sky-500",
  },
  book: {
    label: "Kitap",
    Icon: BookOpen,
    color: "#b45309",
    chipClass: "bg-amber-100 text-amber-800 border-amber-200",
    activeClass: "border-amber-300 bg-amber-50",
    barClass: "bg-amber-500",
  },
  quran: {
    label: "Kur'an",
    Icon: Sparkles,
    color: "#047857",
    chipClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
    activeClass: "border-emerald-300 bg-emerald-50",
    barClass: "bg-emerald-600",
  },
  study: {
    label: "Ders",
    Icon: Layers3,
    color: "#4f46e5",
    chipClass: "bg-indigo-100 text-indigo-800 border-indigo-200",
    activeClass: "border-indigo-300 bg-indigo-50",
    barClass: "bg-indigo-500",
  },
  custom: {
    label: "Özel",
    Icon: Target,
    color: "#475569",
    chipClass: "bg-slate-100 text-slate-700 border-slate-200",
    activeClass: "border-slate-300 bg-slate-50",
    barClass: "bg-slate-500",
  },
};

type TrackerView = "home" | "detail";

type HabitUnitKey =
  | "saat"
  | "dakika"
  | "sayfa"
  | "adet"
  | "bardak"
  | "km"
  | "tekrar"
  | "gram";

const HABIT_UNIT_OPTIONS: Array<{
  id: HabitUnitKey;
  label: string;
  step: string;
  duration: boolean;
}> = [
  { id: "saat", label: "Saat", step: "0.25", duration: true },
  { id: "dakika", label: "Dakika", step: "5", duration: false },
  { id: "sayfa", label: "Sayfa", step: "1", duration: false },
  { id: "adet", label: "Adet", step: "1", duration: false },
  { id: "bardak", label: "Bardak", step: "1", duration: false },
  { id: "km", label: "Kilometre", step: "0.1", duration: false },
  { id: "tekrar", label: "Tekrar", step: "1", duration: false },
  { id: "gram", label: "Gram", step: "10", duration: false },
];

function getUnitOption(unit: string) {
  const normalized = unit.toLocaleLowerCase("tr-TR");
  return HABIT_UNIT_OPTIONS.find((option) => option.id === normalized);
}

function resolveUnitKey(unit: string): HabitUnitKey {
  return getUnitOption(unit)?.id ?? "adet";
}

function usesDurationFormat(habit: Habit) {
  return habit.styleKey === "sleep" || Boolean(getUnitOption(habit.unit)?.duration);
}

function usesPageFields(habit: Habit) {
  return resolveUnitKey(habit.unit) === "sayfa";
}

function hasConfiguredPageFields(habit: Habit) {
  return usesPageFields(habit) && habit.fields.length > 0;
}

function normalizeFieldList(raw: unknown): HabitPageField[] {
  if (!Array.isArray(raw)) return [];

  const result: HabitPageField[] = [];
  const seen = new Set<string>();

  raw.forEach((item) => {
    if (typeof item === "string") {
      const name = item.trim();
      if (!name || seen.has(name)) return;
      seen.add(name);
      result.push({
        id: createId("field"),
        name,
        icon: "book",
        color: "emerald",
      });
      return;
    }

    if (!item || typeof item !== "object") return;
    const field = item as Partial<HabitPageField>;
    const name = String(field.name ?? "").trim();
    if (!name || seen.has(name)) return;
    seen.add(name);
    result.push({
      id: field.id ? String(field.id) : createId("field"),
      name,
      icon: isHabitFieldIconKey(field.icon) ? field.icon : "book",
      color: isHabitFieldColorKey(field.color) ? field.color : "emerald",
    });
  });

  return result;
}

function sumEntriesByDate(entries: HabitEntry[]) {
  const totals = new Map<string, number>();
  entries.forEach((entry) => {
    totals.set(entry.date, (totals.get(entry.date) ?? 0) + entry.value);
  });
  return totals;
}

function findEntryForLog(
  entries: HabitEntry[],
  habitId: string,
  date: string,
  field: string,
) {
  return entries.find(
    (entry) =>
      entry.habitId === habitId &&
      entry.date === date &&
      (field ? entry.field === field : !entry.field),
  );
}

type DistributionPeriod = "day" | "week" | "month" | "year";

const DISTRIBUTION_PERIOD_OPTIONS: Array<{ id: DistributionPeriod; label: string }> = [
  { id: "day", label: "Günlük" },
  { id: "week", label: "Haftalık" },
  { id: "month", label: "Aylık" },
  { id: "year", label: "Yıllık" },
];

function monthStart(value: string) {
  const date = dateFromInput(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

function yearStart(value: string) {
  return `${dateFromInput(value).getFullYear()}-01-01`;
}

function startOfWeek(value: string) {
  const weekday = dateFromInput(value).getDay();
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  return shiftDate(value, mondayOffset);
}

function endOfMonth(value: string) {
  const date = dateFromInput(value);
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;
}

function getDistributionBounds(period: DistributionPeriod, anchor: string) {
  const base = anchor || getTodayDateString();

  if (period === "day") {
    return { start: base, end: base };
  }

  if (period === "week") {
    const start = startOfWeek(base);
    return { start, end: shiftDate(start, 6) };
  }

  if (period === "month") {
    const start = monthStart(base);
    return { start, end: endOfMonth(base) };
  }

  const year = dateFromInput(base).getFullYear();
  return { start: `${year}-01-01`, end: `${year}-12-31` };
}

function shiftDistributionAnchor(period: DistributionPeriod, anchor: string, delta: number) {
  const base = anchor || getTodayDateString();

  if (period === "day") {
    return shiftDate(base, delta);
  }

  if (period === "week") {
    return shiftDate(startOfWeek(base), delta * 7);
  }

  if (period === "month") {
    const date = dateFromInput(monthStart(base));
    date.setMonth(date.getMonth() + delta);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
  }

  const date = dateFromInput(yearStart(base));
  date.setFullYear(date.getFullYear() + delta);
  return `${date.getFullYear()}-01-01`;
}

function formatDistributionPeriodLabel(period: DistributionPeriod, anchor: string) {
  if (!anchor) return "—";

  if (period === "day") {
    return formatShortInputDate(anchor);
  }

  if (period === "week") {
    const { start, end } = getDistributionBounds("week", anchor);
    return `${formatShortDate(start)} – ${formatShortDate(end)}`;
  }

  if (period === "month") {
    const formatted = new Intl.DateTimeFormat("tr-TR", {
      month: "long",
      year: "numeric",
    }).format(dateFromInput(monthStart(anchor)));
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }

  return String(dateFromInput(anchor).getFullYear());
}

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}

function describeDonutSegment(
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number,
) {
  const sweep = Math.min(endAngle - startAngle, 359.999);
  const end = startAngle + sweep;
  const outerStart = polarToCartesian(cx, cy, outerRadius, startAngle);
  const outerEnd = polarToCartesian(cx, cy, outerRadius, end);
  const innerStart = polarToCartesian(cx, cy, innerRadius, end);
  const innerEnd = polarToCartesian(cx, cy, innerRadius, startAngle);
  const largeArc = sweep > 180 ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerEnd.x} ${innerEnd.y}`,
    "Z",
  ].join(" ");
}

function buildFieldDistributionSlices(habit: Habit, entries: HabitEntry[]) {
  const slices = habit.fields.map((field) => ({
    id: field.id,
    name: field.name,
    icon: field.icon,
    color: field.color,
    value: entries
      .filter((entry) => entry.field === field.name)
      .reduce((sum, entry) => sum + entry.value, 0),
  }));

  const unassigned = entries
    .filter(
      (entry) => !entry.field || !habit.fields.some((field) => field.name === entry.field),
    )
    .reduce((sum, entry) => sum + entry.value, 0);

  if (unassigned > 0) {
    slices.push({
      id: "unassigned",
      name: "Atanmamış",
      icon: "book" as HabitFieldIconKey,
      color: "slate" as HabitFieldColorKey,
      value: unassigned,
    });
  }

  return slices;
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

function getTodayDateString() {
  const today = new Date();
  const local = new Date(today.getTime() - today.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function dateFromInput(value: string) {
  return new Date(`${value}T12:00:00`);
}

function shiftDate(value: string, offset: number) {
  const date = dateFromInput(value);
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function formatDate(value: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    weekday: "short",
    year: "numeric",
  }).format(dateFromInput(value));
}

function formatShortDate(value: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
  }).format(dateFromInput(value));
}

function formatNumber(value: number, digits = 1) {
  return value.toLocaleString("tr-TR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  });
}

function formatDurationHours(value: number) {
  const totalMinutes = Math.max(0, Math.round(value * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}:${String(minutes).padStart(2, "0")}`;
}

function parseDurationParts(value: string) {
  const parsed = Number(value);
  const totalMinutes =
    Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 60) : 0;
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
  };
}

function durationToDecimalHours(hours: number, minutes: number) {
  return String(hours + minutes / 60);
}

const DURATION_HOURS = Array.from({ length: 24 }, (_, index) => index);
const DURATION_MINUTES = Array.from({ length: 60 }, (_, index) => index);
const WHEEL_ITEM_HEIGHT = 40;

function DurationScrollWheel({
  label,
  items,
  value,
  onChange,
}: {
  label: string;
  items: number[];
  value: number;
  onChange: (value: number) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const scrollTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const element = listRef.current;
    if (!element) return;
    const index = items.indexOf(value);
    if (index >= 0) {
      element.scrollTop = index * WHEEL_ITEM_HEIGHT;
    }
  }, [items, value]);

  const syncSelection = () => {
    const element = listRef.current;
    if (!element) return;
    const index = Math.round(element.scrollTop / WHEEL_ITEM_HEIGHT);
    const next = items[Math.min(Math.max(index, 0), items.length - 1)];
    if (next !== value) onChange(next);
  };

  const handleScroll = () => {
    if (scrollTimerRef.current !== null) {
      window.clearTimeout(scrollTimerRef.current);
    }
    scrollTimerRef.current = window.setTimeout(syncSelection, 80);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative h-[120px] w-14 overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-1/2 z-0 h-10 -translate-y-1/2 rounded-full border border-primary/15 bg-primary-light/35" />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-8 bg-gradient-to-b from-white to-white/0" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-8 bg-gradient-to-t from-white to-white/0" />
        <div
          ref={listRef}
          onScroll={handleScroll}
          className="relative z-10 h-full snap-y snap-mandatory overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{
            scrollPaddingTop: WHEEL_ITEM_HEIGHT,
            scrollPaddingBottom: WHEEL_ITEM_HEIGHT,
          }}
        >
          <div style={{ height: WHEEL_ITEM_HEIGHT }} />
          {items.map((item) => (
            <div
              key={item}
              className={cx(
                "flex snap-center items-center justify-center text-lg font-semibold",
                item === value ? "text-primary" : "text-slate-800",
              )}
              style={{ height: WHEEL_ITEM_HEIGHT }}
            >
              {item}
            </div>
          ))}
          <div style={{ height: WHEEL_ITEM_HEIGHT }} />
        </div>
      </div>
      <span className="text-sm font-medium text-slate-500">{label}</span>
    </div>
  );
}

function DurationPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const { hours, minutes } = parseDurationParts(value);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <span className="text-sm font-semibold text-slate-700">Değer</span>
        <span className="text-sm font-semibold text-primary">
          {formatDurationHours(hours + minutes / 60)}
        </span>
      </div>
      <div className="flex items-center justify-center gap-8 px-4 py-3">
        <DurationScrollWheel
          label="saat"
          items={DURATION_HOURS}
          value={hours}
          onChange={(nextHours) => onChange(durationToDecimalHours(nextHours, minutes))}
        />
        <DurationScrollWheel
          label="dk"
          items={DURATION_MINUTES}
          value={minutes}
          onChange={(nextMinutes) => onChange(durationToDecimalHours(hours, nextMinutes))}
        />
      </div>
    </div>
  );
}

function formatHabitValue(habit: Habit, value: number) {
  if (usesDurationFormat(habit)) {
    return formatDurationHours(value);
  }
  return `${formatNumber(value)} ${habit.unit}`;
}

function getStep(habit: Habit) {
  return getUnitOption(habit.unit)?.step ?? "1";
}

function getTargetStep(unit: string) {
  return getUnitOption(unit)?.step ?? "1";
}

function parseOptionalTarget(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const target = Number(trimmed);
  if (!Number.isFinite(target) || target <= 0) return null;
  return target;
}

function formatHabitTarget(habit: Habit) {
  if (habit.target === null) return "Hedef yok";
  return formatHabitValue(habit, habit.target);
}

function hasHabitTarget(habit: Habit): habit is Habit & { target: number } {
  return typeof habit.target === "number" && habit.target > 0;
}

function normalizeHabit(raw: unknown): Habit | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Partial<Habit>;
  if (!item.id || !item.name || !item.unit) return null;
  const target = Number(item.target);
  const styleKey = item.styleKey && item.styleKey in HABIT_STYLES ? item.styleKey : "custom";
  return {
    id: String(item.id),
    name: String(item.name),
    unit: String(item.unit),
    target: Number.isFinite(target) && target > 0 ? target : null,
    styleKey,
    fields: normalizeFieldList(item.fields),
  };
}

function normalizeEntry(raw: unknown): HabitEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Partial<HabitEntry>;
  const value = Number(item.value);
  if (!item.id || !item.habitId || !item.date || !Number.isFinite(value)) return null;
  return {
    id: String(item.id),
    habitId: String(item.habitId),
    date: String(item.date),
    value: Math.max(0, value),
    note: item.note ? String(item.note) : "",
    field: item.field ? String(item.field).trim() : "",
    createdAt: item.createdAt ? String(item.createdAt) : new Date().toISOString(),
  };
}

function parseStoredStore(raw: string | null): HabitStore {
  if (!raw) return { habits: DEFAULT_HABITS, entries: [] };
  try {
    const parsed = JSON.parse(raw) as Partial<HabitStore>;
    const habits = Array.isArray(parsed.habits)
      ? parsed.habits.map(normalizeHabit).filter(Boolean)
      : [];
    const entries = Array.isArray(parsed.entries)
      ? parsed.entries.map(normalizeEntry).filter(Boolean)
      : [];
    return {
      habits: habits.length > 0 ? (habits as Habit[]) : DEFAULT_HABITS,
      entries: entries as HabitEntry[],
    };
  } catch {
    return { habits: DEFAULT_HABITS, entries: [] };
  }
}

function getHabitEntries(entries: HabitEntry[], habitId: string) {
  return entries
    .filter((entry) => entry.habitId === habitId)
    .sort((first, second) => second.date.localeCompare(first.date));
}

function filterEntriesByRange(
  entries: HabitEntry[],
  range: RangeKey,
  today: string,
  customRange?: CustomRange,
) {
  if (range === "all") return entries;

  if (range === "custom") {
    if (!customRange?.start || !customRange?.end) return entries;
    const start =
      customRange.start <= customRange.end ? customRange.start : customRange.end;
    const end =
      customRange.start <= customRange.end ? customRange.end : customRange.start;
    return entries.filter((entry) => entry.date >= start && entry.date <= end);
  }

  if (!today) return entries;

  const dayCount = Number(range);
  const startDate = shiftDate(today, dayCount * -1 + 1);
  return entries.filter((entry) => entry.date >= startDate && entry.date <= today);
}

function listDaysBetween(start: string, end: string) {
  const rangeStart = start <= end ? start : end;
  const rangeEnd = start <= end ? end : start;
  const days: string[] = [];
  let cursor = rangeStart;

  while (cursor <= rangeEnd) {
    days.push(cursor);
    cursor = shiftDate(cursor, 1);
    if (days.length > 366) break;
  }

  return days;
}

function calculateStats(entries: HabitEntry[], habit: Habit) {
  const values = Array.from(sumEntriesByDate(entries).values()).filter((value) =>
    Number.isFinite(value),
  );
  if (values.length === 0) {
    return {
      average: 0,
      minimum: 0,
      maximum: 0,
      median: 0,
      total: 0,
      reached: 0,
    };
  }

  const sorted = [...values].sort((first, second) => first - second);
  const middle = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0
      ? (sorted[middle - 1] + sorted[middle]) / 2
      : sorted[middle];

  return {
    average: values.reduce((sum, value) => sum + value, 0) / values.length,
    minimum: sorted[0],
    maximum: sorted[sorted.length - 1],
    median,
    total: values.reduce((sum, value) => sum + value, 0),
    reached: hasHabitTarget(habit)
      ? values.filter((value) => value >= habit.target).length
      : 0,
  };
}

function getCurrentStreak(entries: HabitEntry[], habit: Habit, today: string) {
  if (!today || !hasHabitTarget(habit)) return 0;
  const valuesByDate = sumEntriesByDate(entries);
  let cursor = today;
  let streak = 0;

  while ((valuesByDate.get(cursor) ?? 0) >= habit.target) {
    streak += 1;
    cursor = shiftDate(cursor, -1);
  }

  return streak;
}

function getChartDays(
  entries: HabitEntry[],
  range: RangeKey,
  today: string,
  customRange?: CustomRange,
) {
  const entryDays = Array.from(new Set(entries.map((entry) => entry.date))).sort();

  if (range === "custom" && customRange?.start && customRange?.end) {
    const calendarDays = listDaysBetween(customRange.start, customRange.end);
    if (entryDays.length === 0) return calendarDays.slice(-31);
    return Array.from(new Set([...calendarDays, ...entryDays])).sort();
  }

  if (range === "all") {
    return entryDays.slice(-16);
  }

  if (!today) {
    return entryDays.slice(-30);
  }

  const count = range === "7" ? 7 : range === "30" ? 30 : range === "180" ? 180 : 30;
  const calendarDays = Array.from(
    { length: count },
    (_, index) => shiftDate(today, index - count + 1),
  );

  if (entryDays.length === 0) return calendarDays;

  return Array.from(new Set([...calendarDays, ...entryDays])).sort();
}

function getRangeLabel(range: RangeKey, customRange: CustomRange) {
  if (range === "custom" && customRange.start && customRange.end) {
    return `${formatShortInputDate(customRange.start)} – ${formatShortInputDate(customRange.end)}`;
  }
  return STATS_RANGE_OPTIONS.find((option) => option.id === range)?.label ?? "1 ay";
}

const CHART_LINE_COLOR = "#0f172a";
const CHART_LINE_PROPS = {
  fill: "none",
  stroke: CHART_LINE_COLOR,
  strokeWidth: 2.25,
  strokeLinecap: "butt" as const,
  strokeLinejoin: "miter" as const,
  strokeMiterlimit: 4,
  vectorEffect: "non-scaling-stroke" as const,
};

function snapChartCoord(value: number) {
  return Math.round(value * 2) / 2;
}

function buildSharpLinePaths(
  days: string[],
  valuesByDate: Map<string, number>,
  getX: (index: number) => number,
  getY: (value: number) => number,
) {
  const segments: string[] = [];
  let current: string[] = [];

  days.forEach((date, index) => {
    const value = valuesByDate.get(date);
    if (value === undefined) {
      if (current.length > 0) {
        segments.push(current.join(" "));
        current = [];
      }
      return;
    }

    const x = snapChartCoord(getX(index));
    const y = snapChartCoord(getY(value));
    current.push(`${current.length === 0 ? "M" : "L"} ${x} ${y}`);
  });

  if (current.length > 0) segments.push(current.join(" "));
  return segments;
}

function HabitLineChart({
  entries,
  habit,
  range,
  today,
  customRange,
}: {
  entries: HabitEntry[];
  habit: Habit;
  range: RangeKey;
  today: string;
  customRange?: CustomRange;
}) {
  const days = getChartDays(entries, range, today, customRange);
  const valuesByDate = sumEntriesByDate(entries);
  const values = days
    .map((date) => valuesByDate.get(date))
    .filter((value): value is number => typeof value === "number");

  const width = 760;
  const height = 300;
  const padding = { top: 24, right: 54, bottom: 52, left: 28 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(habit.target ?? 0, ...values, 1);
  const chartMax = maxValue * 1.2;
  const pointStep = days.length > 1 ? chartWidth / (days.length - 1) : chartWidth;
  const getX = (index: number) => padding.left + index * pointStep;
  const getY = (value: number) =>
    padding.top + chartHeight - (value / chartMax) * chartHeight;

  const linePaths = buildSharpLinePaths(days, valuesByDate, getX, getY);
  const targetY =
    habit.target !== null
      ? padding.top + chartHeight - (habit.target / chartMax) * chartHeight
      : null;
  const gridLines = Array.from({ length: 5 }, (_, index) => {
    const ratio = index / 4;
    const y = padding.top + chartHeight - ratio * chartHeight;
    const value = chartMax * ratio;
    return { y, value };
  });
  const labelEvery = Math.max(1, Math.ceil(days.length / 5));

  return (
    <div className="overflow-hidden rounded-2xl bg-white/70">
      {entries.length === 0 ? (
        <div className="flex h-[240px] flex-col items-center justify-center px-6 text-center">
          <BarChart3 className="mb-3 h-9 w-9 text-slate-300" aria-hidden="true" />
          <p className="text-sm font-semibold text-slate-700">Henüz kayıt yok</p>
          <p className="mt-1 max-w-sm text-sm text-surface-muted">
            İlk değeri kaydettiğinde çizgi burada oluşacak.
          </p>
        </div>
      ) : (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-[240px] w-full"
          role="img"
          aria-label={`${habit.name} grafiği`}
          shapeRendering="geometricPrecision"
        >
          <rect width={width} height={height} fill="transparent" />
          {gridLines.map((line) => (
            <g key={line.y}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={snapChartCoord(line.y)}
                y2={snapChartCoord(line.y)}
                stroke="#cbd5e1"
                strokeWidth="1"
                strokeDasharray="3 5"
              />
              <text
                x={width - padding.right + 10}
                y={line.y + 4}
                fill="#64748b"
                fontSize="12"
              >
                {usesDurationFormat(habit)
                  ? formatDurationHours(line.value)
                  : formatNumber(line.value, 0)}
              </text>
            </g>
          ))}
          {days.map((date, index) =>
            index % labelEvery === 0 || index === days.length - 1 ? (
              <text
                key={date}
                x={padding.left + index * pointStep}
                y={height - 16}
                fill="#475569"
                fontSize="13"
                textAnchor="middle"
              >
                {formatShortDate(date)}
              </text>
            ) : null,
          )}
          {targetY !== null && (
            <line
              x1={padding.left}
              x2={width - padding.right}
              y1={snapChartCoord(targetY)}
              y2={snapChartCoord(targetY)}
              stroke="#065f46"
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity="0.45"
            />
          )}
          {linePaths.map((segment, index) => (
            <path key={index} d={segment} {...CHART_LINE_PROPS} />
          ))}
        </svg>
      )}
    </div>
  );
}

function StatRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-4 last:border-b-0">
      <div className="flex min-w-0 items-center gap-3">
        <Icon className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
        <span className="truncate text-base text-slate-700">{label}</span>
      </div>
      <strong className="shrink-0 text-lg font-bold text-slate-900">{value}</strong>
    </div>
  );
}

function HabitFieldColorPicker({
  value,
  open,
  onToggle,
  onChange,
}: {
  value: HabitFieldColorKey;
  open: boolean;
  onToggle: () => void;
  onChange: (color: HabitFieldColorKey) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = getHabitFieldColorOption(value);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        onToggle();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open, onToggle]);

  return (
    <div
      ref={rootRef}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <span
            className="inline-flex h-4 w-4 rounded-full border border-white shadow-sm ring-1 ring-slate-200"
            style={{ backgroundColor: selected.value }}
            aria-hidden="true"
          />
          Renk
        </span>
        <span className="text-sm font-semibold" style={{ color: selected.value }}>
          {selected.label}
        </span>
      </button>

      <div
        className={cx(
          "overflow-hidden border-t border-slate-100 transition-all duration-300 ease-out",
          open ? "max-h-56 opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <div className="px-3 pb-4 pt-3">
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
            {HABIT_FIELD_COLOR_OPTIONS.map((option) => {
              const isSelected = value === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    onChange(option.id);
                    if (open) onToggle();
                  }}
                  className={cx(
                    "flex flex-col items-center gap-1 rounded-xl border px-1 py-2 transition-colors",
                    isSelected
                      ? "border-slate-900 bg-slate-50"
                      : "border-slate-200 bg-white hover:border-slate-300",
                  )}
                  aria-label={option.label}
                  title={option.label}
                >
                  <span
                    className={cx(
                      "h-6 w-6 rounded-full border-2",
                      isSelected ? "border-slate-900" : "border-white ring-1 ring-slate-200",
                    )}
                    style={{ backgroundColor: option.value }}
                  />
                  <span className="w-full truncate text-center text-[10px] font-semibold text-slate-500">
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function HabitFieldIconPicker({
  value,
  color,
  open,
  onToggle,
  onChange,
}: {
  value: HabitFieldIconKey;
  color?: HabitFieldColorKey;
  open: boolean;
  onToggle: () => void;
  onChange: (icon: HabitFieldIconKey) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = getHabitFieldIconOption(value);
  const tone = color ? getHabitFieldColorOption(color) : null;

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        onToggle();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open, onToggle]);

  return (
    <div
      ref={rootRef}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <HabitFieldIconBadge
            icon={value}
            color={color ?? "emerald"}
            size="sm"
          />
          İkon
        </span>
        <span
          className="text-sm font-semibold"
          style={tone ? { color: tone.value } : undefined}
        >
          {selected.label}
        </span>
      </button>

      <div
        className={cx(
          "overflow-hidden border-t border-slate-100 transition-all duration-300 ease-out",
          open ? "max-h-[min(62vh,520px)] opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <div className="max-h-[min(62vh,520px)] overflow-y-auto px-3 pb-4 pt-3">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {HABIT_FIELD_ICON_OPTIONS.length} ikon
          </p>
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
            {HABIT_FIELD_ICON_OPTIONS.map((option) => {
              const Icon = option.Icon;
              const isSelected = value === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    onChange(option.id);
                    if (open) onToggle();
                  }}
                  className={cx(
                    "inline-flex h-10 items-center justify-center rounded-xl border transition-colors",
                    isSelected
                      ? "border-primary bg-primary text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-primary/30 hover:bg-slate-50",
                  )}
                  aria-label={option.label}
                  title={option.label}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function HabitPageFieldsEditor({
  fields,
  onChange,
}: {
  fields: HabitPageField[];
  onChange: (fields: HabitPageField[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const [draftIcon, setDraftIcon] = useState<HabitFieldIconKey>("book");
  const [draftColor, setDraftColor] = useState<HabitFieldColorKey>("emerald");
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);

  const handleAdd = () => {
    const nextName = draft.trim();
    if (!nextName || fields.some((field) => field.name === nextName)) return;
    onChange([
      ...fields,
      {
        id: createId("field"),
        name: nextName,
        icon: draftIcon,
        color: draftColor,
      },
    ]);
    setDraft("");
    setIconPickerOpen(false);
    setColorPickerOpen(false);
  };

  return (
    <div>
      <span className="mb-1 block text-sm font-semibold text-slate-700">Alanlar</span>
      <p className="mb-2 text-xs text-surface-muted">
        Kayıt eklerken seçilecek alanları buradan ekleyin.
      </p>
      <div className="mb-3 space-y-2">
        <HabitFieldIconPicker
          value={draftIcon}
          color={draftColor}
          open={iconPickerOpen}
          onToggle={() => {
            setIconPickerOpen((current) => !current);
            setColorPickerOpen(false);
          }}
          onChange={setDraftIcon}
        />
        <HabitFieldColorPicker
          value={draftColor}
          open={colorPickerOpen}
          onToggle={() => {
            setColorPickerOpen((current) => !current);
            setIconPickerOpen(false);
          }}
          onChange={setDraftColor}
        />
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleAdd();
            }
          }}
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
          placeholder="Örn. Siyer, Fıkıh"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!draft.trim()}
          className="inline-flex shrink-0 items-center justify-center rounded-xl border border-primary bg-primary-light px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Ekle
        </button>
      </div>
      {fields.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {fields.map((field) => (
            <span
              key={field.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 py-1 pl-2 pr-1 text-sm font-semibold text-slate-700"
            >
              <HabitFieldIconBadge icon={field.icon} color={field.color} size="sm" />
              {field.name}
              <button
                type="button"
                onClick={() => onChange(fields.filter((item) => item.id !== field.id))}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                aria-label={`${field.name} alanını sil`}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-3 rounded-xl border border-dashed border-slate-200 px-3 py-2 text-xs text-surface-muted">
          Henüz alan eklenmedi.
        </p>
      )}
    </div>
  );
}

function HabitUnitSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (unit: HabitUnitKey) => void;
}) {
  const selected = resolveUnitKey(value);

  return (
    <div>
      <span className="mb-2 block text-sm font-semibold text-slate-700">Ölçü birimi</span>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {HABIT_UNIT_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={cx(
              "rounded-xl border px-3 py-2 text-sm font-semibold transition",
              selected === option.id
                ? "border-primary bg-primary text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-primary/30",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function formatShortInputDate(value: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(dateFromInput(value));
}

function toIsoDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function shiftMonth(year: number, month: number, delta: number) {
  const date = new Date(year, month + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() };
}

function buildMonthGrid(year: number, month: number) {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const cells: Array<{ label: number; iso: string; inMonth: boolean }> = [];

  for (let index = 0; index < firstWeekday; index += 1) {
    const day = daysInPrevMonth - firstWeekday + index + 1;
    const prev = shiftMonth(year, month, -1);
    cells.push({
      label: day,
      iso: toIsoDate(prev.year, prev.month, day),
      inMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      label: day,
      iso: toIsoDate(year, month, day),
      inMonth: true,
    });
  }

  let nextDay = 1;
  while (cells.length % 7 !== 0) {
    const next = shiftMonth(year, month, 1);
    cells.push({
      label: nextDay,
      iso: toIsoDate(next.year, next.month, nextDay),
      inMonth: false,
    });
    nextDay += 1;
  }

  return cells;
}

function formatMonthLabel(year: number, month: number) {
  const formatted = new Intl.DateTimeFormat("tr-TR", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month, 1));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

const CALENDAR_WEEKDAYS = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

function EntryDatePicker({
  value,
  open,
  onToggle,
  onChange,
  label = "Tarih",
  closeOnSelect = false,
}: {
  value: string;
  open: boolean;
  onToggle: () => void;
  onChange: (date: string) => void;
  label?: string;
  closeOnSelect?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const anchor = value ? dateFromInput(value) : dateFromInput(getTodayDateString());
  const [viewYear, setViewYear] = useState(anchor.getFullYear());
  const [viewMonth, setViewMonth] = useState(anchor.getMonth());

  useEffect(() => {
    if (!value) return;
    const date = dateFromInput(value);
    setViewYear(date.getFullYear());
    setViewMonth(date.getMonth());
  }, [value]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        onToggle();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open, onToggle]);

  const cells = buildMonthGrid(viewYear, viewMonth);

  return (
    <div
      ref={rootRef}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
          {label}
        </span>
        <span className="text-sm font-semibold text-primary">
          {formatShortInputDate(value)}
        </span>
      </button>

      <div
        className={cx(
          "overflow-hidden border-t border-slate-100 transition-all duration-300 ease-out",
          open ? "max-h-[360px] opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <div className="px-3 pb-4 pt-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-800">
              {formatMonthLabel(viewYear, viewMonth)}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  const prev = shiftMonth(viewYear, viewMonth, -1);
                  setViewYear(prev.year);
                  setViewMonth(prev.month);
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary-light"
                aria-label="Önceki ay"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = shiftMonth(viewYear, viewMonth, 1);
                  setViewYear(next.year);
                  setViewMonth(next.month);
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary-light"
                aria-label="Sonraki ay"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {CALENDAR_WEEKDAYS.map((weekday) => (
              <span key={weekday} className="py-1">
                {weekday}
              </span>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((cell) => {
              const selected = cell.iso === value;
              return (
                <button
                  key={`${cell.iso}-${cell.label}`}
                  type="button"
                  onClick={() => {
                    onChange(cell.iso);
                    if (closeOnSelect && open) onToggle();
                  }}
                  className={cx(
                    "inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                    selected
                      ? "bg-primary text-white"
                      : cell.inMonth
                        ? "text-slate-800 hover:bg-slate-100"
                        : "text-slate-300 hover:bg-slate-50",
                  )}
                >
                  {cell.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomRangeDateFields({
  value,
  onChange,
}: {
  value: CustomRange;
  onChange: (next: CustomRange) => void;
}) {
  const [openField, setOpenField] = useState<"start" | "end" | null>(null);

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <EntryDatePicker
        label="Başlangıç"
        value={value.start}
        open={openField === "start"}
        onToggle={() => setOpenField((current) => (current === "start" ? null : "start"))}
        onChange={(date) => onChange({ ...value, start: date })}
        closeOnSelect
      />
      <EntryDatePicker
        label="Bitiş"
        value={value.end}
        open={openField === "end"}
        onToggle={() => setOpenField((current) => (current === "end" ? null : "end"))}
        onChange={(date) => onChange({ ...value, end: date })}
        closeOnSelect
      />
    </div>
  );
}

function HabitFieldDistributionPanel({
  habit,
  entries,
  today,
  period,
  anchor,
  onPeriodChange,
  onAnchorChange,
}: {
  habit: Habit;
  entries: HabitEntry[];
  today: string;
  period: DistributionPeriod;
  anchor: string;
  onPeriodChange: (period: DistributionPeriod) => void;
  onAnchorChange: (anchor: string) => void;
}) {
  const bounds = getDistributionBounds(period, anchor || today);
  const focusDate = anchor || today;
  const todayInView = Boolean(today) && today >= bounds.start && today <= bounds.end;
  const periodEntries = entries.filter(
    (entry) => entry.date >= bounds.start && entry.date <= bounds.end,
  );
  const slices = buildFieldDistributionSlices(habit, periodEntries);
  const activeSlices = slices.filter((slice) => slice.value > 0);
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const periodLabel = formatDistributionPeriodLabel(period, anchor || today);

  const size = 240;
  const centerX = size / 2;
  const centerY = size / 2;
  const outerRadius = 92;
  const innerRadius = 58;
  let cursor = 0;

  const arcs =
    total > 0
      ? activeSlices.map((slice) => {
          const sweep = (slice.value / total) * 360;
          const path = describeDonutSegment(
            centerX,
            centerY,
            outerRadius,
            innerRadius,
            cursor,
            cursor + sweep,
          );
          const midAngle = cursor + sweep / 2;
          cursor += sweep;
          const labelPoint = polarToCartesian(
            centerX,
            centerY,
            (outerRadius + innerRadius) / 2,
            midAngle,
          );
          const percent = Math.round((slice.value / total) * 100);
          const tone = getHabitFieldColorOption(slice.color);
          return { ...slice, path, labelPoint, percent, tone };
        })
      : [];

  const handlePeriodChange = (nextPeriod: DistributionPeriod) => {
    onPeriodChange(nextPeriod);
    onAnchorChange(today || focusDate || getTodayDateString());
  };

  return (
    <div className="mt-5 rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">Alan Dağılımı</h2>

      <div className="mt-4 rounded-full bg-slate-100 p-1">
        <div className="grid grid-cols-4 gap-1">
          {DISTRIBUTION_PERIOD_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => handlePeriodChange(option.id)}
              className={cx(
                "rounded-full px-2 py-2 text-xs font-semibold transition-colors sm:text-sm",
                period === option.id
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onAnchorChange(shiftDistributionAnchor(period, anchor || today, -1))}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100"
          aria-label="Önceki dönem"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <p className="text-sm font-semibold text-slate-800">{periodLabel}</p>
          {!todayInView && today && (
            <button
              type="button"
              onClick={() => onAnchorChange(today)}
              className="mt-1 text-xs font-semibold text-primary transition-colors hover:text-primary-dark"
            >
              Bugün
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => onAnchorChange(shiftDistributionAnchor(period, anchor || today, 1))}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100"
          aria-label="Sonraki dönem"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="relative mx-auto mt-2 flex h-[240px] w-[240px] items-center justify-center">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="h-full w-full"
          role="img"
          aria-label="Alan dağılım grafiği"
        >
          {total === 0 ? (
            <circle
              cx={centerX}
              cy={centerY}
              r={(outerRadius + innerRadius) / 2}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth={outerRadius - innerRadius}
            />
          ) : (
            arcs.map((arc) => (
              <path key={arc.id} d={arc.path} fill={arc.tone.value} />
            ))
          )}
          {arcs
            .filter((arc) => arc.percent >= 8)
            .map((arc) => (
              <text
                key={`${arc.id}-label`}
                x={arc.labelPoint.x}
                y={arc.labelPoint.y + 4}
                textAnchor="middle"
                className="fill-white text-[11px] font-bold"
              >
                {arc.percent}%
              </text>
            ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <strong className="text-2xl font-bold text-slate-900">
            {formatNumber(total, 0)}
          </strong>
          <span className="text-sm font-semibold text-slate-500">sayfa</span>
        </div>
      </div>

      <div className="mt-2 space-y-3">
        {slices.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-center text-sm text-surface-muted">
            Dağılım için önce ayarlardan alan ekleyin.
          </p>
        ) : total === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-center text-sm text-surface-muted">
            Bu dönemde kayıt yok.
          </p>
        ) : (
          slices.map((slice) => {
            const percent = total > 0 ? Math.round((slice.value / total) * 100) : 0;
            const tone = getHabitFieldColorOption(slice.color);
            return (
              <div key={slice.id} className="flex items-center gap-3">
                <HabitFieldIconBadge icon={slice.icon} color={slice.color} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{slice.name}</p>
                  <p className="text-xs text-surface-muted">
                    {formatNumber(slice.value, 0)} sayfa · {percent}%
                  </p>
                </div>
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: tone.value }}
                  aria-hidden="true"
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function StatsRangeSelector({
  range,
  customRange,
  onRangeChange,
  onCustomRangeChange,
}: {
  range: RangeKey;
  customRange: CustomRange;
  onRangeChange: (range: RangeKey) => void;
  onCustomRangeChange: (next: CustomRange) => void;
}) {
  return (
    <div className="mt-6 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-slate-900">İstatistik</h2>
        <div className="flex flex-wrap gap-1">
          {STATS_RANGE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onRangeChange(option.id)}
              className={cx(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                range === option.id
                  ? "border-primary bg-primary text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-primary/30",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {range === "custom" && (
        <CustomRangeDateFields value={customRange} onChange={onCustomRangeChange} />
      )}
    </div>
  );
}

function HabitSparkline({
  entries,
  habit,
  today,
  color,
}: {
  entries: HabitEntry[];
  habit: Habit;
  today: string;
  color: string;
}) {
  const days = getChartDays(entries, "7", today).slice(-12);
  const valuesByDate = sumEntriesByDate(entries);
  const width = 120;
  const height = 64;
  const pointStep = days.length > 1 ? width / (days.length - 1) : width;
  const values = days
    .map((date) => valuesByDate.get(date))
    .filter((value): value is number => typeof value === "number");
  const chartMax = Math.max(habit.target ?? 0, ...values, 1) * 1.15;
  const getX = (index: number) => index * pointStep;
  const getY = (value: number) => height - 8 - (value / chartMax) * (height - 16);
  const linePaths = buildSharpLinePaths(days, valuesByDate, getX, getY);

  if (linePaths.length === 0) {
    return (
      <div className="flex h-16 w-28 items-center justify-center rounded-xl bg-slate-50 text-xs text-surface-muted">
        —
      </div>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-16 w-28 shrink-0"
      role="img"
      aria-hidden="true"
      shapeRendering="geometricPrecision"
    >
      {linePaths.map((segment, index) => (
        <path
          key={index}
          d={segment}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="butt"
          strokeLinejoin="miter"
          strokeMiterlimit={4}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}

function HabitTrackerCard({
  habit,
  entries,
  today,
  onOpen,
}: {
  habit: Habit;
  entries: HabitEntry[];
  today: string;
  onOpen: () => void;
}) {
  const style = HABIT_STYLES[habit.styleKey];
  const latestEntry = getHabitEntries(entries, habit.id)[0];
  const displayValue = latestEntry
    ? formatHabitValue(habit, latestEntry.value)
    : usesDurationFormat(habit)
      ? "0:00"
      : `0 ${habit.unit}`;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-[28px] bg-white p-5 text-left shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="mb-8 flex items-center justify-between gap-3">
        <span className="text-lg font-semibold text-slate-900">{habit.name}</span>
        <ChevronRight className="h-5 w-5 text-slate-300" aria-hidden="true" />
      </div>
      <div className="flex items-end justify-between gap-4">
        <strong className="text-4xl font-bold tracking-tight text-slate-900">
          {displayValue}
        </strong>
        <HabitSparkline
          entries={getHabitEntries(entries, habit.id)}
          habit={habit}
          today={today}
          color={style.color}
        />
      </div>
    </button>
  );
}

export default function HabitTrackerClient() {
  const { direction, language, copy } = useSitePreferences();
  const [store, setStore] = useState<HabitStore>({
    habits: DEFAULT_HABITS,
    entries: [],
  });
  const [hasLoaded, setHasLoaded] = useState(false);
  const [view, setView] = useState<TrackerView>("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [today, setToday] = useState("");
  const [selectedHabitId, setSelectedHabitId] = useState(DEFAULT_HABITS[0].id);
  const [range, setRange] = useState<RangeKey>("30");
  const [customRange, setCustomRange] = useState<CustomRange>({ start: "", end: "" });
  const [entryDate, setEntryDate] = useState("");
  const [entryValue, setEntryValue] = useState("");
  const [entryField, setEntryField] = useState("");
  const [entryNote, setEntryNote] = useState("");
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [showSettingsSheet, setShowSettingsSheet] = useState(false);
  const [showEntrySheet, setShowEntrySheet] = useState(false);
  const [entryCalendarOpen, setEntryCalendarOpen] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [habitName, setHabitName] = useState("");
  const [habitUnit, setHabitUnit] = useState<HabitUnitKey>("adet");
  const [habitTarget, setHabitTarget] = useState("");
  const [habitStyleKey, setHabitStyleKey] = useState<HabitStyleKey>("custom");
  const [editHabitUnit, setEditHabitUnit] = useState<HabitUnitKey>("adet");
  const [editHabitTarget, setEditHabitTarget] = useState("");
  const [editHabitFields, setEditHabitFields] = useState<HabitPageField[]>([]);
  const [distributionPeriod, setDistributionPeriod] = useState<DistributionPeriod>("month");
  const [distributionAnchor, setDistributionAnchor] = useState("");

  useEffect(() => {
    const nextToday = getTodayDateString();
    const savedStore = parseStoredStore(window.localStorage.getItem(STORAGE_KEY));
    setStore(savedStore);
    setToday(nextToday);
    setEntryDate(nextToday);
    setDistributionAnchor(nextToday);
    setSelectedHabitId(savedStore.habits[0]?.id ?? DEFAULT_HABITS[0].id);
    setHasLoaded(true);
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }, [hasLoaded, store]);

  const selectedHabit =
    store.habits.find((habit) => habit.id === selectedHabitId) ?? store.habits[0] ?? DEFAULT_HABITS[0];
  const selectedEntries = useMemo(
    () => getHabitEntries(store.entries, selectedHabit.id),
    [selectedHabit.id, store.entries],
  );
  const rangedEntries = useMemo(
    () => filterEntriesByRange(selectedEntries, range, today, customRange),
    [customRange, range, selectedEntries, today],
  );
  const stats = useMemo(
    () => calculateStats(rangedEntries, selectedHabit),
    [rangedEntries, selectedHabit],
  );
  const streak = useMemo(
    () => getCurrentStreak(selectedEntries, selectedHabit, today),
    [selectedEntries, selectedHabit, today],
  );
  const todaysTotal = useMemo(
    () =>
      selectedEntries
        .filter((entry) => entry.date === today)
        .reduce((sum, entry) => sum + entry.value, 0),
    [selectedEntries, today],
  );
  const completionPercent = hasHabitTarget(selectedHabit)
    ? Math.min(100, Math.round((todaysTotal / selectedHabit.target) * 100))
    : null;

  useEffect(() => {
    if (!showEntrySheet || editingEntryId || !entryDate) return;

    if (hasConfiguredPageFields(selectedHabit) && !entryField) {
      setEntryValue("");
      setEntryNote("");
      return;
    }

    setEntryValue(usesDurationFormat(selectedHabit) ? "0" : "");
    setEntryNote("");
  }, [entryDate, entryField, editingEntryId, showEntrySheet, selectedHabit]);

  useEffect(() => {
    if (!showSettingsSheet) return;
    setEditHabitUnit(resolveUnitKey(selectedHabit.unit));
    setEditHabitTarget(selectedHabit.target !== null ? String(selectedHabit.target) : "");
    setEditHabitFields(selectedHabit.fields);
  }, [showSettingsSheet, selectedHabit]);

  const handleSaveEntry = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = Number(entryValue);
    if (!entryDate || !Number.isFinite(value) || value < 0) return;
    if (hasConfiguredPageFields(selectedHabit) && !entryField) return;

    const entryFieldValue = hasConfiguredPageFields(selectedHabit) ? entryField : "";

    setStore((current) => {
      const existingEntry = editingEntryId
        ? current.entries.find((entry) => entry.id === editingEntryId)
        : findEntryForLog(current.entries, selectedHabit.id, entryDate, entryFieldValue);

      if (existingEntry) {
        const nextValue = editingEntryId ? value : existingEntry.value + value;
        const trimmedNote = entryNote.trim();
        const nextNote = editingEntryId
          ? trimmedNote
          : trimmedNote || existingEntry.note;

        return {
          ...current,
          entries: current.entries.map((entry) =>
            entry.id === existingEntry.id
              ? {
                  ...entry,
                  value: nextValue,
                  note: nextNote,
                  field: entryFieldValue,
                  createdAt: new Date().toISOString(),
                }
              : entry,
          ),
        };
      }

      return {
        ...current,
        entries: [
          {
            id: createId("entry"),
            habitId: selectedHabit.id,
            date: entryDate,
            value,
            note: entryNote.trim(),
            field: entryFieldValue,
            createdAt: new Date().toISOString(),
          },
          ...current.entries,
        ],
      };
    });

    setShowEntrySheet(false);
    setEditingEntryId(null);
  };

  const openNewEntrySheet = () => {
    setEditingEntryId(null);
    setEntryDate(today || getTodayDateString());
    setEntryField("");
    setEntryValue(usesDurationFormat(selectedHabit) ? "0" : "");
    setEntryNote("");
    setEntryCalendarOpen(false);
    setShowEntrySheet(true);
  };

  const openEditEntrySheet = (entry: HabitEntry) => {
    setEditingEntryId(entry.id);
    setEntryDate(entry.date);
    setEntryField(entry.field);
    setEntryValue(String(entry.value));
    setEntryNote(entry.note);
    setEntryCalendarOpen(false);
    setShowEntrySheet(true);
  };

  const handleAddHabit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = habitName.trim();
    if (!name) return;

    const newHabit: Habit = {
      id: createId("habit"),
      name,
      unit: habitUnit,
      target: parseOptionalTarget(habitTarget),
      styleKey: habitStyleKey,
      fields: [],
    };

    setStore((current) => ({
      ...current,
      habits: [...current.habits, newHabit],
    }));
    setSelectedHabitId(newHabit.id);
    setHabitName("");
    setHabitUnit("adet");
    setHabitTarget("");
    setHabitStyleKey("custom");
    setShowHabitForm(false);
  };

  const handleUpdateSelectedHabit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setStore((current) => ({
      ...current,
      habits: current.habits.map((habit) =>
        habit.id === selectedHabit.id
          ? {
              ...habit,
              unit: editHabitUnit,
              target: parseOptionalTarget(editHabitTarget),
              fields: resolveUnitKey(editHabitUnit) === "sayfa" ? editHabitFields : [],
            }
          : habit,
      ),
    }));
  };

  const handleDeleteHabit = (habitId: string) => {
    const habit = store.habits.find((item) => item.id === habitId);
    if (!habit || store.habits.length <= 1) return;
    const confirmed = window.confirm(`${habit.name} ve kayıtları silinsin mi?`);
    if (!confirmed) return;

    setStore((current) => {
      const nextHabits = current.habits.filter((item) => item.id !== habitId);
      return {
        habits: nextHabits,
        entries: current.entries.filter((entry) => entry.habitId !== habitId),
      };
    });

    if (selectedHabitId === habitId) {
      const nextHabit = store.habits.find((item) => item.id !== habitId);
      if (nextHabit) setSelectedHabitId(nextHabit.id);
    }
  };

  const handleDeleteEntry = (entryId: string) => {
    setStore((current) => ({
      ...current,
      entries: current.entries.filter((entry) => entry.id !== entryId),
    }));
  };

  const handleRangeChange = (nextRange: RangeKey) => {
    setRange(nextRange);
    if (nextRange === "custom") {
      setCustomRange((current) => {
        if (current.start && current.end) return current;
        const end = today || getTodayDateString();
        return { start: shiftDate(end, -29), end };
      });
    }
  };

  const rangeLabel = getRangeLabel(range, customRange);
  const visibleEntries = selectedEntries;
  const filteredHabits = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase(language === "ar" ? "ar" : "tr-TR");
    if (!query) return store.habits;
    return store.habits.filter((habit) =>
      habit.name.toLocaleLowerCase(language === "ar" ? "ar" : "tr-TR").includes(query),
    );
  }, [language, searchQuery, store.habits]);

  const openHabitDetail = (habitId: string) => {
    setSelectedHabitId(habitId);
    setDistributionAnchor(today || getTodayDateString());
    setDistributionPeriod("month");
    setView("detail");
  };

  const openSettings = () => {
    setShowSettingsSheet(true);
  };

  const openAddHabit = () => {
    setHabitName("");
    setHabitUnit("adet");
    setHabitTarget("");
    setHabitStyleKey("custom");
    setShowSettingsSheet(true);
    setShowHabitForm(true);
  };

  const entrySheet = showEntrySheet ? (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/40 px-4 pb-4 sm:items-center">
      <div className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900">
            {editingEntryId ? "Kaydı düzenle" : "Yeni kayıt"}
          </h2>
          <button
            type="button"
            onClick={() => {
              setShowEntrySheet(false);
              setEditingEntryId(null);
            }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSaveEntry} className="space-y-4">
          <EntryDatePicker
            value={entryDate}
            open={entryCalendarOpen}
            onToggle={() => setEntryCalendarOpen((current) => !current)}
            onChange={(date) => {
              setEntryDate(date);
              setEntryCalendarOpen(true);
            }}
          />
          {hasConfiguredPageFields(selectedHabit) && (
            <div>
              <span className="mb-2 block text-sm font-semibold text-slate-700">Alan</span>
              <div className="grid grid-cols-2 gap-2">
                {selectedHabit.fields.map((field) => {
                  const selected = entryField === field.name;
                  const tone = getHabitFieldColorOption(field.color);
                  return (
                    <button
                      key={field.id}
                      type="button"
                      onClick={() => setEntryField(field.name)}
                      className={cx(
                        "inline-flex items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm font-semibold transition-colors",
                        selected
                          ? "border-slate-300 bg-white text-slate-900 shadow-sm"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
                      )}
                      style={
                        selected
                          ? {
                              borderColor: `${tone.value}55`,
                              backgroundColor: tone.soft,
                            }
                          : undefined
                      }
                    >
                      <HabitFieldIconBadge icon={field.icon} color={field.color} size="lg" />
                      <span className="truncate">{field.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {usesDurationFormat(selectedHabit) ? (
            <DurationPicker value={entryValue} onChange={setEntryValue} />
          ) : (
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-700">
                Değer ({selectedHabit.unit})
              </span>
              <input
                type="number"
                min="0"
                step={getStep(selectedHabit)}
                value={entryValue}
                onChange={(event) => setEntryValue(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-base font-semibold text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                placeholder=""
              />
            </label>
          )}
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-700">Not</span>
            <input
              value={entryNote}
              onChange={(event) => setEntryNote(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              placeholder="Kısa not"
            />
          </label>

          <div className="flex flex-wrap gap-2 pt-2">
            {editingEntryId && (
              <button
                type="button"
                onClick={() => {
                  handleDeleteEntry(editingEntryId);
                  setShowEntrySheet(false);
                  setEditingEntryId(null);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Sil
              </button>
            )}
            <button
              type="submit"
              disabled={
                !entryDate ||
                !entryValue ||
                (hasConfiguredPageFields(selectedHabit) && !entryField)
              }
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gold px-5 py-3 text-sm font-bold text-ink transition-colors hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  ) : null;

  const settingsSheet = showSettingsSheet ? (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/40 px-4 pb-4 sm:items-center">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-5 shadow-xl">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900">Ayarlar</h2>
          <button
            type="button"
            onClick={() => {
              setShowSettingsSheet(false);
              setShowHabitForm(false);
            }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-6">
          {view === "detail" && (
            <div>
              <p className="mb-3 text-sm font-semibold text-slate-700">Zaman aralığı</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {STATS_RANGE_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleRangeChange(option.id)}
                    className={cx(
                      "rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors",
                      range === option.id
                        ? "border-primary bg-primary text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {range === "custom" && (
                <div className="mt-3">
                  <CustomRangeDateFields value={customRange} onChange={setCustomRange} />
                </div>
              )}
            </div>
          )}

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-700">Alışkanlıklar</p>
              <button
                type="button"
                onClick={() => setShowHabitForm((current) => !current)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary-dark"
                aria-label="Alışkanlık ekle"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-2">
              {store.habits.map((habit) => {
                const style = HABIT_STYLES[habit.styleKey];
                const Icon = style.Icon;
                const active = habit.id === selectedHabit.id;
                return (
                  <div
                    key={habit.id}
                    className={cx(
                      "flex items-center gap-2 rounded-xl border p-2",
                      active ? style.activeClass : "border-slate-200 bg-white",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedHabitId(habit.id);
                        if (view === "home") setView("detail");
                      }}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <span
                        className={cx(
                          "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
                          style.chipClass,
                        )}
                      >
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-slate-900">
                          {habit.name}
                        </span>
                        <span className="block text-xs text-surface-muted">
                          {formatHabitTarget(habit)}
                        </span>
                      </span>
                    </button>
                    {store.habits.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteHabit(habit.id)}
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                        aria-label={`${habit.name} sil`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {view === "detail" && (
            <form
              onSubmit={handleUpdateSelectedHabit}
              className="rounded-2xl border border-slate-200 p-4"
            >
              <h3 className="mb-4 text-base font-bold text-slate-900">
                {selectedHabit.name} ayarları
              </h3>
              <div className="space-y-4">
                <HabitUnitSelector value={editHabitUnit} onChange={setEditHabitUnit} />
                {resolveUnitKey(editHabitUnit) === "sayfa" && (
                  <HabitPageFieldsEditor
                    fields={editHabitFields}
                    onChange={setEditHabitFields}
                  />
                )}
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold text-slate-700">
                    Hedef <span className="font-normal text-surface-muted">(isteğe bağlı)</span>
                  </span>
                  <input
                    type="number"
                    min="0"
                    step={getTargetStep(editHabitUnit)}
                    value={editHabitTarget}
                    onChange={(event) => setEditHabitTarget(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                    placeholder=""
                  />
                </label>
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primary bg-primary-light px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
                >
                  <Save className="h-4 w-4" aria-hidden="true" />
                  Ayarları kaydet
                </button>
              </div>
            </form>
          )}

          {showHabitForm && (
            <form onSubmit={handleAddHabit} className="rounded-2xl border border-slate-200 p-4">
              <h3 className="mb-4 text-base font-bold text-slate-900">Yeni takip</h3>
              <div className="space-y-3">
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold text-slate-700">Ad</span>
                  <input
                    value={habitName}
                    onChange={(event) => setHabitName(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                    placeholder="Su içme"
                  />
                </label>
                <HabitUnitSelector value={habitUnit} onChange={setHabitUnit} />
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold text-slate-700">
                    Hedef <span className="font-normal text-surface-muted">(isteğe bağlı)</span>
                  </span>
                  <input
                    type="number"
                    min="0"
                    step={getTargetStep(habitUnit)}
                    value={habitTarget}
                    onChange={(event) => setHabitTarget(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                    placeholder=""
                  />
                </label>
                <div>
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Renk</span>
                  <div className="grid grid-cols-5 gap-2">
                    {(Object.keys(HABIT_STYLES) as HabitStyleKey[]).map((styleKey) => {
                      const style = HABIT_STYLES[styleKey];
                      const Icon = style.Icon;
                      return (
                        <button
                          key={styleKey}
                          type="button"
                          onClick={() => setHabitStyleKey(styleKey)}
                          className={cx(
                            "inline-flex h-10 items-center justify-center rounded-lg border transition",
                            style.chipClass,
                            habitStyleKey === styleKey && "ring-2 ring-primary/30",
                          )}
                          aria-label={style.label}
                        >
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </button>
                      );
                    })}
                  </div>
                </div>
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Ekle
                </button>
              </div>
            </form>
          )}

          {view === "detail" && (
            <div className="rounded-2xl bg-primary-light p-4">
              <p className="text-sm font-semibold text-primary-dark">Özet</p>
              <p className="mt-1 text-sm text-surface-muted">
                Seri: {streak} gün · Bugün:{" "}
                {todaysTotal > 0 ? formatHabitValue(selectedHabit, todaysTotal) : "—"}
                {completionPercent !== null ? ` · Hedef: %${completionPercent}` : ""}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  ) : null;

  if (view === "home") {
    return (
      <div dir={direction} className={cx(language === "ar" && "font-arabic", "min-h-screen bg-slate-100")}>
        <div className="mx-auto w-full max-w-lg px-4 pb-28 pt-4 sm:px-5">
          <div className="mb-8 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={openSettings}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:border-primary/30 hover:text-primary"
              aria-label="Ayarlar"
            >
              <Settings className="h-5 w-5" aria-hidden="true" />
            </button>

            <div className="flex items-center gap-2">
              <span className="relative flex h-8 w-8 items-center justify-center">
                <span className="absolute h-5 w-5 rounded-full bg-primary/25" />
                <span className="absolute h-5 w-5 translate-x-1 rounded-full bg-gold/35" />
                <span className="absolute h-5 w-5 -translate-x-1 rounded-full bg-emerald-200/70" />
              </span>
              <span className="text-2xl font-bold text-primary">{copy.nav.routine}</span>
            </div>

            <button
              type="button"
              onClick={openAddHabit}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-800 shadow-sm transition-colors hover:bg-primary-light hover:text-primary"
              aria-label="Takip ekle"
            >
              <Plus className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {showSearch && (
            <label className="mb-4 block">
              <span className="sr-only">Ara</span>
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                autoFocus
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                placeholder="Takip ara..."
              />
            </label>
          )}

          <div className="space-y-4">
            {filteredHabits.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-4 py-12 text-center">
                <p className="font-semibold text-slate-700">Sonuç bulunamadı</p>
              </div>
            ) : (
              filteredHabits.map((habit) => (
                <HabitTrackerCard
                  key={habit.id}
                  habit={habit}
                  entries={store.entries}
                  today={today}
                  onOpen={() => openHabitDetail(habit.id)}
                />
              ))
            )}
          </div>
        </div>

        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 mx-auto max-w-lg px-4 pb-6 sm:px-5">
          <div className="pointer-events-auto flex items-end justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setShowSearch(false);
                setSearchQuery("");
              }}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-lg"
            >
              <Menu className="h-4 w-4 text-primary" aria-hidden="true" />
              Tüm Takipler · {store.habits.length}
            </button>
            <button
              type="button"
              onClick={() => setShowSearch((current) => !current)}
              className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white text-slate-800 shadow-lg transition-colors hover:bg-primary-light hover:text-primary"
              aria-label="Ara"
            >
              <Search className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {entrySheet}
        {settingsSheet}
      </div>
    );
  }

  return (
    <div dir={direction} className={cx(language === "ar" && "font-arabic", "bg-slate-100")}>
      <div className="mx-auto w-full max-w-lg">
        <div className="px-4 pb-8 pt-4 sm:px-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setView("home")}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm transition-colors hover:bg-primary-light hover:text-primary"
              aria-label="Geri"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <h1 className="truncate px-2 text-center text-xl font-bold text-slate-900">
              {selectedHabit.name}
            </h1>
            <button
              type="button"
              onClick={openSettings}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm transition-colors hover:bg-primary-light hover:text-primary"
              aria-label="Ayarlar"
            >
              <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <HabitLineChart
            entries={selectedEntries}
            habit={selectedHabit}
            range={range}
            today={today}
            customRange={customRange}
          />

          {hasConfiguredPageFields(selectedHabit) && (
            <HabitFieldDistributionPanel
              habit={selectedHabit}
              entries={selectedEntries}
              today={today}
              period={distributionPeriod}
              anchor={distributionAnchor}
              onPeriodChange={setDistributionPeriod}
              onAnchorChange={setDistributionAnchor}
            />
          )}

          <StatsRangeSelector
            range={range}
            customRange={customRange}
            onRangeChange={handleRangeChange}
            onCustomRangeChange={setCustomRange}
          />
          <div className="mt-3 rounded-2xl bg-white px-4 shadow-sm">
            <StatRow
              icon={TrendingUp}
              label="Ortalama"
              value={formatHabitValue(selectedHabit, stats.average)}
            />
            <StatRow
              icon={ArrowDown}
              label="Minimum"
              value={formatHabitValue(selectedHabit, stats.minimum)}
            />
            <StatRow
              icon={ArrowUp}
              label="Maksimum"
              value={formatHabitValue(selectedHabit, stats.maximum)}
            />
            <StatRow
              icon={ArrowUpDown}
              label="Medyan"
              value={formatHabitValue(selectedHabit, stats.median)}
            />
          </div>
        </div>

        <div className="relative -mt-2 min-h-[52vh] rounded-t-[32px] bg-white shadow-[0_-16px_48px_rgba(15,23,42,0.08)]">
          <div className="px-4 pb-32 pt-6 sm:px-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-slate-500">Kayıtlar</h2>
              <span className="text-sm font-semibold text-slate-400">
                {visibleEntries.length}/{visibleEntries.length}
              </span>
            </div>

            {visibleEntries.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-12 text-center">
                <CalendarDays className="mx-auto mb-3 h-9 w-9 text-slate-300" aria-hidden="true" />
                <p className="font-semibold text-slate-700">Henüz kayıt yok</p>
                <p className="mt-1 text-sm text-surface-muted">
                  Sağ alttaki + ile ilk kaydı ekle.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {visibleEntries.map((entry) => (
                  <li key={entry.id}>
                    <button
                      type="button"
                      onClick={() => openEditEntrySheet(entry)}
                      className="flex w-full items-center justify-between gap-4 py-4 text-left transition-colors hover:bg-slate-50"
                    >
                      <span className="flex min-w-0 items-center gap-2 truncate text-base text-slate-800">
                        {entry.field ? (
                          <>
                            <HabitFieldIconBadge
                              icon={
                                getHabitFieldByName(selectedHabit, entry.field)?.icon ?? "book"
                              }
                              color={
                                getHabitFieldByName(selectedHabit, entry.field)?.color ??
                                "emerald"
                              }
                              size="md"
                            />
                            <span className="truncate">
                              {formatDate(entry.date)}
                              <span className="text-surface-muted"> · {entry.field}</span>
                            </span>
                          </>
                        ) : (
                          formatDate(entry.date)
                        )}
                      </span>
                      <strong className="shrink-0 text-lg font-bold text-slate-900">
                        {formatHabitValue(selectedHabit, entry.value)}
                      </strong>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 mx-auto max-w-lg px-4 pb-6 sm:px-5">
            <div className="pointer-events-auto flex items-end justify-between gap-3">
              <button
                type="button"
                onClick={openSettings}
                className="inline-flex max-w-[220px] items-center gap-2 truncate rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-lg"
              >
                <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
                {rangeLabel}
              </button>
              <button
                type="button"
                onClick={openNewEntrySheet}
                className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-colors hover:bg-primary-dark"
                aria-label="Kayıt ekle"
              >
                <Plus className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {entrySheet}
      {settingsSheet}
    </div>
  );
}
