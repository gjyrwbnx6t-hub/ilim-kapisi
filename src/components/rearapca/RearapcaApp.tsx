"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Car,
  ChevronDown,
  Clock3,
  Layers3,
  Lightbulb,
  Pencil,
  Plus,
  RefreshCw,
} from "lucide-react";
import LearnNewWordsScreen from "@/components/rearapca/LearnNewWordsScreen";
import BrowseFlashcardsScreen from "@/components/rearapca/BrowseFlashcardsScreen";
import RearapcaAnalyticsPanel from "@/components/rearapca/RearapcaAnalyticsPanel";
import RearapcaVocabularyPanel from "@/components/rearapca/RearapcaVocabularyPanel";
import type { RearapcaDomainGroup } from "@/lib/rearapca-types";
import { DEFAULT_REARAPCA_DAILY_GOAL } from "@/lib/rearapca-srs.mjs";
import {
  clampDailyGoal,
  readDailyGoalFromStorage,
  writeDailyGoalToStorage,
} from "@/lib/rearapca-daily-goal";
import {
  readSelectedCourseSlugs,
  writeSelectedCourseSlugs,
} from "@/lib/rearapca-course-selection";
import { useStudyTimeTracker } from "@/hooks/useStudyTimeTracker";

type Tab = "learn" | "vocabulary" | "menu";
type LearnView = "home" | "new-words" | "review-words" | "mixed-words" | "browse-flashcards";

const WEEK_DAYS = ["Pz", "Pt", "Sa", "Ça", "Pe", "Cu", "Ct"] as const;

interface LearnStats {
  learnedToday: number;
  reviewedToday: number;
  dueCount: number;
  masteredCount: number;
  totalProgress: number;
}

function localDayBounds() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return {
    dayStartUtc: start.toISOString(),
    dayEndUtc: end.toISOString(),
  };
}

interface RearapcaAppProps {
  domainGroups: RearapcaDomainGroup[];
  readyCount: number;
}

function TabBar({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) {
  const tabs: { id: Tab; label: string; badge?: boolean }[] = [
    { id: "learn", label: "Öğren" },
    { id: "vocabulary", label: "Kelime Arşivi" },
    { id: "menu", label: "Menü", badge: true },
  ];

  return (
    <nav className="mx-auto flex w-fit gap-1 rounded-full bg-[#d8d8de] p-1">
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`relative rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
              isActive
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            {tab.label}
            {tab.badge && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                !
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </p>
  );
}

function ListCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">{children}</div>
  );
}

function ListRow({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 border-b border-slate-100 px-5 py-4 text-left transition-colors last:border-b-0 hover:bg-slate-50"
    >
      {icon}
      <span className="min-w-0 flex-1">
        <span className="block text-[17px] font-semibold text-slate-900">{title}</span>
        {subtitle && (
          <span className="mt-0.5 block text-sm text-slate-500">{subtitle}</span>
        )}
      </span>
    </button>
  );
}

function ProgressRing({ value, max }: { value: number; max: number }) {
  const ratio = max > 0 ? Math.min(value / max, 1) : 0;
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - ratio);

  return (
    <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden>
      <circle
        cx="32"
        cy="32"
        r={radius}
        fill="none"
        stroke="#e2e8f0"
        strokeWidth="5"
        strokeDasharray="3 5"
      />
      <circle
        cx="32"
        cy="32"
        r={radius}
        fill="none"
        stroke="#38bdf8"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 32 32)"
      />
    </svg>
  );
}

function LearnHome({
  readyCount,
  selectedCount,
  dailyGoal,
  stats,
  onOpenVocabulary,
  onLearnNewWords,
  onReviewWords,
  onMixedMode,
  onBrowseFlashcards,
  onDailyGoalChange,
}: {
  readyCount: number;
  selectedCount: number;
  dailyGoal: number;
  stats: LearnStats;
  onOpenVocabulary: () => void;
  onLearnNewWords: () => void;
  onReviewWords: () => void;
  onMixedMode: () => void;
  onBrowseFlashcards: () => void;
  onDailyGoalChange: (goal: number) => void;
}) {
  const todayIndex = new Date().getDay();
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalDraft, setGoalDraft] = useState(String(dailyGoal));

  useEffect(() => {
    if (!editingGoal) setGoalDraft(String(dailyGoal));
  }, [dailyGoal, editingGoal]);

  const saveGoal = () => {
    const next = clampDailyGoal(Number.parseInt(goalDraft, 10));
    onDailyGoalChange(next);
    setEditingGoal(false);
  };

  return (
    <div className="space-y-6">
      <SectionLabel>Aralıklı tekrar</SectionLabel>
      <ListCard>
        <ListRow
          icon={
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
              <Layers3 className="h-5 w-5" strokeWidth={2.2} />
            </span>
          }
          title={`${selectedCount > 0 ? selectedCount : readyCount} ders seçili`}
          subtitle="Kelime arşivi sekmesinden ders seçin"
          onClick={onOpenVocabulary}
        />
        <ListRow
          icon={
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light text-primary">
              <Plus className="h-6 w-6" strokeWidth={2.4} />
            </span>
          }
          title="Yeni kelime öğren"
          subtitle={`Bugün öğrenilen: ${stats.learnedToday} / ${dailyGoal}`}
          onClick={onLearnNewWords}
        />
        <ListRow
          icon={
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
              <Clock3 className="h-5 w-5" strokeWidth={2.2} />
            </span>
          }
          title="Kelimeleri tekrar et"
          subtitle={`Tekrar bekleyen: ${stats.dueCount} kelime`}
          onClick={onReviewWords}
        />
        <ListRow
          icon={
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 text-sky-500">
              <Lightbulb className="h-5 w-5" strokeWidth={2.2} />
            </span>
          }
          title="Karışık mod"
          subtitle="Önce tekrarlar, sonra yeni kelimeler"
          onClick={onMixedMode}
        />
      </ListCard>

      <SectionLabel>Ek modlar (istatistiği etkilemez)</SectionLabel>
      <ListCard>
        <ListRow
          icon={
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <RefreshCw className="h-5 w-5" strokeWidth={2.2} />
            </span>
          }
          title="Kartları gözat"
          onClick={onBrowseFlashcards}
        />
        <ListRow
          icon={
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-200 text-slate-600">
              <Car className="h-5 w-5" strokeWidth={2.2} />
            </span>
          }
          title="Eller serbest mod"
        />
      </ListCard>

      <SectionLabel>İstatistikler</SectionLabel>
      <ListCard>
        <div className="border-b border-slate-100 px-5 py-5">
          <div className="flex justify-between">
            {WEEK_DAYS.map((day, index) => {
              const isToday = index === todayIndex;
              return (
                <div key={`${day}-${index}`} className="flex flex-col items-center gap-1">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                      isToday
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {day}
                  </span>
                  {isToday && (
                    <span className="h-0 w-0 border-x-4 border-b-0 border-t-[6px] border-x-transparent border-t-sky-400" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">Güncel seri</p>
              <p className="mt-1 text-sm text-slate-500">0 gün</p>
            </div>
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">En iyi seri</p>
              <p className="mt-1 text-sm text-slate-500">
                {stats.masteredCount} ezberlenen kelime
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 px-5 py-5">
          <ProgressRing value={stats.learnedToday} max={dailyGoal} />
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-900">Bugün öğrenilen</p>
            {editingGoal ? (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-3xl font-bold text-slate-900">
                  {stats.learnedToday}/
                </span>
                <input
                  type="number"
                  min={1}
                  value={goalDraft}
                  onChange={(event) => setGoalDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") saveGoal();
                    if (event.key === "Escape") {
                      setGoalDraft(String(dailyGoal));
                      setEditingGoal(false);
                    }
                  }}
                  className="w-20 rounded-lg border-2 border-primary px-2 py-1 text-2xl font-bold text-slate-900 outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={saveGoal}
                  className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white"
                >
                  Kaydet
                </button>
              </div>
            ) : (
              <p className="mt-1 flex items-center gap-2 text-3xl font-bold text-slate-900">
                {stats.learnedToday}/{dailyGoal}
                <button
                  type="button"
                  onClick={() => setEditingGoal(true)}
                  className="rounded-md p-1 text-sky-500 transition-colors hover:bg-sky-50"
                  aria-label="Günlük hedefi düzenle"
                >
                  <Pencil className="h-4 w-4" strokeWidth={2.2} />
                </button>
              </p>
            )}
            <p className="mt-1 text-xs text-slate-500">Günlük kelime hedefi</p>
          </div>
        </div>
      </ListCard>
    </div>
  );
}

function MenuPanel({ dailyGoal }: { dailyGoal: number }) {
  return (
    <ListCard>
      <ListRow
        icon={
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <ChevronDown className="h-5 w-5 rotate-[-90deg]" strokeWidth={2.2} />
          </span>
        }
        title="Ayarlar"
        subtitle="Yakında"
      />
      <ListRow
        icon={
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <Pencil className="h-5 w-5" strokeWidth={2.2} />
          </span>
        }
        title="Günlük hedef"
        subtitle={`${dailyGoal} kelime`}
      />
    </ListCard>
  );
}

export default function RearapcaApp({
  domainGroups,
  readyCount,
}: RearapcaAppProps) {
  useStudyTimeTracker({
    courseSlug: "rearapca",
    module: "rearapca",
    moduleLabel: "Rearapça",
  });

  const [tab, setTab] = useState<Tab>("learn");
  const [learnView, setLearnView] = useState<LearnView>("home");
  const [dailyGoal, setDailyGoal] = useState(DEFAULT_REARAPCA_DAILY_GOAL);
  const [selectedCourseSlugs, setSelectedCourseSlugs] = useState<Set<string>>(
    new Set(),
  );
  const [courseProgress, setCourseProgress] = useState<Record<string, number>>(
    {},
  );
  const [stats, setStats] = useState<LearnStats>({
    learnedToday: 0,
    reviewedToday: 0,
    dueCount: 0,
    masteredCount: 0,
    totalProgress: 0,
  });

  const reviewQueueCount = stats.dueCount;
  const selectedCourseList = useMemo(
    () => [...selectedCourseSlugs],
    [selectedCourseSlugs],
  );

  const readyCourseSlugs = useMemo(
    () =>
      domainGroups
        .flatMap((group) => group.items)
        .filter((item) => item.summary.hasVocabulary)
        .map((item) => item.course.slug),
    [domainGroups],
  );

  const inLearnSession = tab === "learn" && learnView !== "home";

  useEffect(() => {
    setDailyGoal(readDailyGoalFromStorage());

    const stored = readSelectedCourseSlugs();
    if (stored.length > 0) {
      setSelectedCourseSlugs(new Set(stored));
    } else if (readyCourseSlugs.length > 0) {
      setSelectedCourseSlugs(new Set(readyCourseSlugs));
    }
  }, [readyCourseSlugs]);

  const refreshCourseProgress = useCallback(async () => {
    try {
      const response = await fetch("/api/rearapca/course-progress");
      if (!response.ok) return;
      const payload = (await response.json()) as {
        courses?: Array<{ courseSlug: string; percent: number }>;
      };
      if (!payload.courses) return;
      const next: Record<string, number> = {};
      for (const course of payload.courses) {
        next[course.courseSlug] = course.percent;
      }
      setCourseProgress(next);
    } catch {
      // Giriş yoksa yüzdeler 0 kalır.
    }
  }, []);

  useEffect(() => {
    void refreshCourseProgress();
  }, [refreshCourseProgress]);

  const selectedReadyCount = useMemo(
    () =>
      readyCourseSlugs.filter((slug) => selectedCourseSlugs.has(slug)).length,
    [readyCourseSlugs, selectedCourseSlugs],
  );

  const startLearnView = useCallback(
    (view: LearnView) => {
      if (selectedReadyCount === 0) {
        setTab("vocabulary");
        return;
      }
      setLearnView(view);
    },
    [selectedReadyCount],
  );

  const handleToggleCourse = useCallback((slug: string) => {
    setSelectedCourseSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      writeSelectedCourseSlugs([...next]);
      return next;
    });
  }, []);

  const handleResetCourseProgress = useCallback(
    async (courseSlug: string) => {
      try {
        const response = await fetch(
          `/api/rearapca/course-progress?courseSlug=${encodeURIComponent(courseSlug)}`,
          { method: "DELETE" },
        );
        const payload = (await response.json()) as { error?: string };
        if (!response.ok) {
          return {
            ok: false as const,
            error: payload.error ?? "İlerleme sıfırlanamadı.",
          };
        }

        await refreshCourseProgress();

        const statsResponse = await fetch("/api/rearapca/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "mixed",
            dailyGoal,
            courseSlugs: selectedCourseList,
            ...localDayBounds(),
          }),
        });
        if (statsResponse.ok) {
          const statsPayload = (await statsResponse.json()) as {
            stats?: LearnStats;
          };
          if (statsPayload.stats) setStats(statsPayload.stats);
        }

        return { ok: true as const };
      } catch {
        return {
          ok: false as const,
          error: "İlerleme sıfırlanamadı. Bağlantınızı kontrol edin.",
        };
      }
    },
    [dailyGoal, refreshCourseProgress, selectedCourseList],
  );

  useEffect(() => {
    let alive = true;

    async function loadDailyGoal() {
      try {
        const response = await fetch("/api/rearapca/daily-goal");
        if (!response.ok) return;
        const payload = (await response.json()) as { dailyGoal?: number };
        if (alive && typeof payload.dailyGoal === "number") {
          const goal = writeDailyGoalToStorage(payload.dailyGoal);
          setDailyGoal(goal);
        }
      } catch {
        // Giriş yoksa localStorage değeri kullanılır.
      }
    }

    void loadDailyGoal();
    return () => {
      alive = false;
    };
  }, []);

  const handleStatsChange = useCallback(
    (next: LearnStats) => {
      setStats(next);
      void refreshCourseProgress();
    },
    [refreshCourseProgress],
  );

  const handleDailyGoalChange = useCallback((goal: number) => {
    const clamped = writeDailyGoalToStorage(goal);
    setDailyGoal(clamped);
    void fetch("/api/rearapca/daily-goal", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dailyGoal: clamped }),
    }).catch(() => {
      // Giriş yoksa yalnızca localStorage'da kalır.
    });
  }, []);

  useEffect(() => {
    let alive = true;

    async function loadStats() {
      try {
        const response = await fetch("/api/rearapca/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "mixed",
            dailyGoal,
            courseSlugs: selectedCourseList,
            ...localDayBounds(),
          }),
        });
        if (!response.ok) return;
        const payload = (await response.json()) as { stats?: LearnStats };
        if (alive && payload.stats) setStats(payload.stats);
      } catch {
        // Giriş yoksa veya Supabase kapalıysa ana ekran sıfır istatistikle kalır.
      }
    }

    void loadStats();
    return () => {
      alive = false;
    };
  }, [dailyGoal, selectedCourseList]);

  const content = useMemo(() => {
    if (tab === "learn" && learnView === "new-words") {
      return (
        <LearnNewWordsScreen
          initialMode="new"
          reviewCount={reviewQueueCount}
          dailyGoal={dailyGoal}
          selectedCourseSlugs={selectedCourseList}
          initialStats={stats}
          onBack={() => setLearnView("home")}
          onStatsChange={handleStatsChange}
        />
      );
    }

    if (tab === "learn" && learnView === "review-words") {
      return (
        <LearnNewWordsScreen
          initialMode="review"
          reviewCount={reviewQueueCount}
          dailyGoal={dailyGoal}
          selectedCourseSlugs={selectedCourseList}
          initialStats={stats}
          onBack={() => setLearnView("home")}
          onStatsChange={handleStatsChange}
        />
      );
    }

    if (tab === "learn" && learnView === "mixed-words") {
      return (
        <LearnNewWordsScreen
          initialMode="mixed"
          reviewCount={reviewQueueCount}
          dailyGoal={dailyGoal}
          selectedCourseSlugs={selectedCourseList}
          initialStats={stats}
          onBack={() => setLearnView("home")}
          onStatsChange={handleStatsChange}
        />
      );
    }

    if (tab === "learn" && learnView === "browse-flashcards") {
      return (
        <BrowseFlashcardsScreen
          domainGroups={domainGroups}
          initialSelectedSlugs={selectedCourseList}
          onBack={() => setLearnView("home")}
        />
      );
    }

    switch (tab) {
      case "learn":
        return (
          <LearnHome
            readyCount={readyCount}
            selectedCount={selectedReadyCount}
            dailyGoal={dailyGoal}
            stats={stats}
            onOpenVocabulary={() => setTab("vocabulary")}
            onLearnNewWords={() => startLearnView("new-words")}
            onReviewWords={() => startLearnView("review-words")}
            onMixedMode={() => startLearnView("mixed-words")}
            onBrowseFlashcards={() => setLearnView("browse-flashcards")}
            onDailyGoalChange={handleDailyGoalChange}
          />
        );
      case "vocabulary":
        return (
          <RearapcaVocabularyPanel
            domainGroups={domainGroups}
            readyCount={readyCount}
            selectedSlugs={selectedCourseSlugs}
            progressBySlug={courseProgress}
            onToggleCourse={handleToggleCourse}
            onResetCourseProgress={handleResetCourseProgress}
          />
        );
      case "menu":
        return <MenuPanel dailyGoal={dailyGoal} />;
      default:
        return null;
    }
  }, [
    tab,
    learnView,
    domainGroups,
    readyCount,
    selectedReadyCount,
    selectedCourseList,
    selectedCourseSlugs,
    courseProgress,
    reviewQueueCount,
    dailyGoal,
    stats,
    handleDailyGoalChange,
    handleStatsChange,
    handleToggleCourse,
    handleResetCourseProgress,
    startLearnView,
  ]);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#e8e8ed] px-4 py-6 sm:px-6">
      <div className="mx-auto w-full max-w-lg">
        {!inLearnSession && (
          <>
            <TabBar
              active={tab}
              onChange={(next) => {
                setTab(next);
                setLearnView("home");
              }}
            />

            <h1 className="mt-8 text-center text-5xl font-bold tracking-tight">
              <span className="text-primary">Re</span>
              <span className="text-slate-900">arapça</span>
            </h1>
          </>
        )}

        <div className={inLearnSession ? "" : "mt-8"}>{content}</div>

        {!inLearnSession && tab !== "vocabulary" && (
          <div className="mt-8">
            <RearapcaAnalyticsPanel />
          </div>
        )}
      </div>
    </div>
  );
}
