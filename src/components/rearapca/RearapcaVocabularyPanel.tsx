"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, RotateCcw, Search, Sparkles, X } from "lucide-react";
import { DOMAIN_META, DOMAIN_ORDER } from "@/data/domains";
import { DOMAIN_ICONS } from "@/data/domainIcons";
import type {
  RearapcaCourseItem,
  RearapcaDomainFilter,
  RearapcaDomainGroup,
} from "@/lib/rearapca-types";

interface RearapcaVocabularyPanelProps {
  domainGroups: RearapcaDomainGroup[];
  readyCount: number;
  selectedSlugs: Set<string>;
  progressBySlug: Record<string, number>;
  onToggleCourse: (slug: string) => void;
  onResetCourseProgress: (
    slug: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
}

interface ResetTarget {
  slug: string;
  titleAr: string;
}

function ResetProgressButton({
  disabled,
  onClick,
}: {
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-500 transition-colors hover:bg-red-100 hover:text-red-600 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-transparent disabled:text-slate-300 disabled:opacity-100"
      aria-label="Ders ilerlemesini sıfırla"
    >
      <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.2} />
    </button>
  );
}

function ResetProgressConfirmDialog({
  target,
  resetting,
  error,
  onCancel,
  onConfirm,
}: {
  target: ResetTarget;
  resetting: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-progress-title"
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl"
      >
        <h2 id="reset-progress-title" className="text-lg font-bold text-slate-900">
          İlerlemeyi sıfırla
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          <span dir="rtl" className="font-arabic font-semibold text-slate-900">
            {target.titleAr}
          </span>{" "}
          dersindeki tüm kelime ilerlemesi silinecek. Öğrenilen, tekrar edilen ve
          ezberlenen kelimeler yeniden baştan sayılacak.
        </p>
        <p className="mt-2 text-sm font-medium text-slate-700">
          Bu işlem geri alınamaz. Devam etmek istiyor musunuz?
        </p>
        {error && (
          <p className="mt-3 text-sm font-medium text-red-500">{error}</p>
        )}
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={resetting}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={resetting}
            className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
          >
            {resetting ? "Sıfırlanıyor…" : "Sıfırla"}
          </button>
        </div>
      </div>
    </div>
  );
}

const DOMAIN_FILTER_OPTIONS: { value: RearapcaDomainFilter; label: string }[] = [
  { value: "all", label: "Tüm Alanlar" },
  ...DOMAIN_ORDER.map((domainId) => ({
    value: domainId as RearapcaDomainFilter,
    label: DOMAIN_META[domainId].labelTr,
  })),
];

function domainKey(domainId: string) {
  return `domain:${domainId}`;
}

function matchesCourseSearch(item: RearapcaCourseItem, query: string): boolean {
  const q = query.trim();
  if (!q) return true;

  const lower = q.toLowerCase();
  const { course } = item;

  if (course.titleAr.includes(q)) return true;
  if (course.slug.includes(lower)) return true;
  if (course.aliases.some((alias) => alias.includes(q))) return true;
  if (course.keywords?.some((keyword) => keyword.toLowerCase().includes(lower))) {
    return true;
  }

  return false;
}

function CourseSearchBox({
  items,
  query,
  onQueryChange,
  selectedSlugs,
  progressBySlug,
  onToggleCourse,
  onRequestReset,
}: {
  items: RearapcaCourseItem[];
  query: string;
  onQueryChange: (value: string) => void;
  selectedSlugs: Set<string>;
  progressBySlug: Record<string, number>;
  onToggleCourse: (slug: string) => void;
  onRequestReset: (target: ResetTarget) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);

  const results = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return [];
    return items.filter((item) => matchesCourseSearch(item, trimmed)).slice(0, 8);
  }, [items, query]);

  const showResults = focused && query.trim().length > 0;

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={rootRef} className="border-b border-slate-100 px-5 pb-3">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          strokeWidth={2}
        />
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="Ders ara…"
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-sm text-slate-900 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-primary"
          aria-label="Ders ara"
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              onQueryChange("");
              setFocused(false);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Aramayı temizle"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        )}
      </div>

      {showResults && (
        <ul className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          {results.length === 0 ? (
            <li className="px-4 py-3 text-sm text-slate-500">Eşleşen ders bulunamadı.</li>
          ) : (
            results.map((item) => {
              const { course, summary } = item;
              const selectable = summary.hasVocabulary;
              const selected = selectedSlugs.has(course.slug);
              const percent = progressBySlug[course.slug] ?? 0;
              const domainLabel = DOMAIN_META[course.domain].labelTr;

              return (
                <li key={course.id}>
                  <div className="flex items-center gap-2 px-3 py-2.5">
                    <ResetProgressButton
                      disabled={!selectable || percent === 0}
                      onClick={() =>
                        onRequestReset({ slug: course.slug, titleAr: course.titleAr })
                      }
                    />
                    <span
                      className={`w-10 shrink-0 text-right text-xs font-bold tabular-nums ${
                        percent > 0 ? "text-emerald-600" : "text-slate-400"
                      }`}
                    >
                      {selectable ? `${percent}%` : "—"}
                    </span>

                    <div className="min-w-0 flex-1">
                      <span
                        dir="rtl"
                        className="block truncate text-right font-arabic text-sm font-bold text-slate-900"
                      >
                        {course.titleAr}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-slate-500">
                        {domainLabel}
                        {selectable
                          ? ` · ${summary.wordCount} kelime`
                          : " · Arşiv bekleniyor"}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={!selectable}
                      onClick={() => onToggleCourse(course.slug)}
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                        !selectable
                          ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-40"
                          : selected
                            ? "border-primary bg-primary"
                            : "border-slate-300 bg-white hover:border-slate-400"
                      }`}
                      aria-label={
                        selectable
                          ? selected
                            ? "Ders seçimini kaldır"
                            : "Dersi öğrenme listesine ekle"
                          : "Arşiv hazır değil"
                      }
                      aria-pressed={selected}
                    >
                      {selected && selectable && (
                        <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                      )}
                    </button>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}

function DomainFilterDropdown({
  value,
  onChange,
}: {
  value: RearapcaDomainFilter;
  onChange: (value: RearapcaDomainFilter) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selectedLabel =
    DOMAIN_FILTER_OPTIONS.find((option) => option.value === value)?.label ??
    "Tüm Alanlar";

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={rootRef} className="relative px-5 py-3">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-900 shadow-sm"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selectedLabel}
        <ChevronDown
          className={`h-4 w-4 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-5 right-5 z-20 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          {DOMAIN_FILTER_OPTIONS.map((option) => {
            const selected = option.value === value;
            return (
              <li key={option.value} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-slate-50 ${
                    selected ? "font-semibold text-slate-900" : "text-slate-800"
                  }`}
                >
                  <span className="flex h-4 w-4 items-center justify-center">
                    {selected && <Check className="h-4 w-4" strokeWidth={2.5} />}
                  </span>
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function CourseRow({
  item,
  active,
  selected,
  percent,
  onSelect,
  onToggleSelected,
  onRequestReset,
}: {
  item: RearapcaCourseItem;
  active: boolean;
  selected: boolean;
  percent: number;
  onSelect: (slug: string) => void;
  onToggleSelected: (slug: string) => void;
  onRequestReset: (target: ResetTarget) => void;
}) {
  const { course, summary } = item;
  const selectable = summary.hasVocabulary;

  return (
    <div
      className={`flex w-full items-center gap-2 border-b border-slate-100 py-3 pl-6 pr-5 ${
        active ? "bg-primary/10" : ""
      }`}
    >
      <ResetProgressButton
        disabled={!selectable || percent === 0}
        onClick={() =>
          onRequestReset({ slug: course.slug, titleAr: course.titleAr })
        }
      />
      <span
        className={`w-10 shrink-0 text-right text-xs font-bold tabular-nums ${
          percent > 0 ? "text-emerald-600" : "text-slate-400"
        }`}
      >
        {selectable ? `${percent}%` : "—"}
      </span>

      <button
        type="button"
        onClick={() => onSelect(course.slug)}
        className="min-w-0 flex-1 text-left transition-colors hover:opacity-80"
      >
        <span
          dir="rtl"
          className="block truncate text-right font-arabic text-[15px] font-bold leading-snug text-slate-900"
        >
          {course.titleAr}
        </span>
        <span className="mt-0.5 block text-xs text-slate-500">
          {summary.hasVocabulary
            ? `${summary.wordCount} kelime · ${summary.unitCount} ünite`
            : "Arşiv bekleniyor"}
        </span>
      </button>

      <button
        type="button"
        disabled={!selectable}
        onClick={() => onToggleSelected(course.slug)}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
          !selectable
            ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-40"
            : selected
              ? "border-primary bg-primary"
              : "border-slate-300 bg-white hover:border-slate-400"
        }`}
        aria-label={
          selectable
            ? selected
              ? "Ders seçimini kaldır"
              : "Dersi öğrenme listesine ekle"
            : "Arşiv hazır değil"
        }
        aria-pressed={selected}
      >
        {selected && selectable && (
          <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
        )}
      </button>
    </div>
  );
}

function DomainBlock({
  group,
  activeSlug,
  open,
  selectedSlugs,
  progressBySlug,
  onToggle,
  onSelect,
  onToggleSelected,
  onRequestReset,
}: {
  group: RearapcaDomainGroup;
  activeSlug: string;
  open: boolean;
  selectedSlugs: Set<string>;
  progressBySlug: Record<string, number>;
  onToggle: () => void;
  onSelect: (slug: string) => void;
  onToggleSelected: (slug: string) => void;
  onRequestReset: (target: ResetTarget) => void;
}) {
  const domain = DOMAIN_META[group.domainId];
  const DomainIcon = DOMAIN_ICONS[group.domainId];
  const readyInGroup = group.items.filter((item) => item.summary.hasVocabulary).length;

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 border-b border-slate-100 px-5 py-3.5 text-left hover:bg-slate-50"
      >
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
            open ? "" : "-rotate-90"
          }`}
          aria-hidden
        />
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${domain.iconBgClass}`}
        >
          <DomainIcon className={`h-4 w-4 ${domain.iconClass}`} strokeWidth={2} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-slate-900">{group.labelTr}</span>
          <span
            dir="rtl"
            className="mt-0.5 block truncate text-right font-arabic text-xs text-slate-500"
          >
            {group.labelAr}
          </span>
        </span>
        <span className="shrink-0 text-xs text-slate-400">
          {readyInGroup}/{group.items.length}
        </span>
      </button>

      {open &&
        group.items.map((item) => (
          <CourseRow
            key={item.course.id}
            item={item}
            active={item.course.slug === activeSlug}
            selected={selectedSlugs.has(item.course.slug)}
            percent={progressBySlug[item.course.slug] ?? 0}
            onSelect={onSelect}
            onToggleSelected={onToggleSelected}
            onRequestReset={onRequestReset}
          />
        ))}
    </div>
  );
}

export default function RearapcaVocabularyPanel({
  domainGroups,
  readyCount,
  selectedSlugs,
  progressBySlug,
  onToggleCourse,
  onResetCourseProgress,
}: RearapcaVocabularyPanelProps) {
  const [activeSlug, setActiveSlug] = useState("");
  const [readyOnly, setReadyOnly] = useState(false);
  const [domainFilter, setDomainFilter] = useState<RearapcaDomainFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [openDomains, setOpenDomains] = useState<Set<string>>(new Set());
  const [resetTarget, setResetTarget] = useState<ResetTarget | null>(null);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const filterItem = useCallback(
    (item: RearapcaCourseItem) => !readyOnly || item.summary.hasVocabulary,
    [readyOnly],
  );

  const searchableItems = useMemo(
    () => domainGroups.flatMap((group) => group.items).filter(filterItem),
    [domainGroups, filterItem],
  );

  const normalizedSearch = searchQuery.trim();

  const visibleGroups = useMemo(() => {
    return domainGroups
      .filter((group) => domainFilter === "all" || group.domainId === domainFilter)
      .map((group) => ({
        ...group,
        items: group.items
          .filter(filterItem)
          .filter((item) => matchesCourseSearch(item, normalizedSearch)),
      }))
      .filter((group) => group.items.length > 0);
  }, [domainGroups, domainFilter, filterItem, normalizedSearch]);

  const toggleDomain = (key: string) => {
    setOpenDomains((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  useEffect(() => {
    if (!normalizedSearch) return;
    setOpenDomains(
      new Set(visibleGroups.map((group) => domainKey(group.domainId))),
    );
  }, [normalizedSearch, visibleGroups]);

  useEffect(() => {
    if (domainFilter === "all") return;
    setOpenDomains(new Set([domainKey(domainFilter)]));
  }, [domainFilter]);

  useEffect(() => {
    if (!activeSlug) return;
    const group = domainGroups.find((entry) =>
      entry.items.some((item) => item.course.slug === activeSlug),
    );
    if (group) {
      setOpenDomains((prev) => new Set(prev).add(domainKey(group.domainId)));
    }
  }, [activeSlug, domainGroups]);

  const selectedItem = domainGroups
    .flatMap((group) => group.items)
    .find((item) => item.course.slug === activeSlug);

  const handleRequestReset = useCallback((target: ResetTarget) => {
    setResetError(null);
    setResetTarget(target);
  }, []);

  const handleCancelReset = useCallback(() => {
    if (resetting) return;
    setResetTarget(null);
    setResetError(null);
  }, [resetting]);

  const handleConfirmReset = useCallback(async () => {
    if (!resetTarget || resetting) return;

    setResetting(true);
    setResetError(null);

    const result = await onResetCourseProgress(resetTarget.slug);
    setResetting(false);

    if (result.ok) {
      setResetTarget(null);
      return;
    }

    setResetError(result.error);
  }, [onResetCourseProgress, resetTarget, resetting]);

  return (
    <div className="space-y-4">
      {resetTarget && (
        <ResetProgressConfirmDialog
          target={resetTarget}
          resetting={resetting}
          error={resetError}
          onCancel={handleCancelReset}
          onConfirm={() => void handleConfirmReset()}
        />
      )}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Kelime arşivi
          </p>
        </div>

        <DomainFilterDropdown value={domainFilter} onChange={setDomainFilter} />

        <CourseSearchBox
          items={searchableItems}
          query={searchQuery}
          onQueryChange={setSearchQuery}
          selectedSlugs={selectedSlugs}
          progressBySlug={progressBySlug}
          onToggleCourse={onToggleCourse}
          onRequestReset={handleRequestReset}
        />

        <div className="flex items-center gap-3 border-b border-t border-slate-100 px-5 py-3.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-gold">
            <Sparkles className="h-4 w-4" strokeWidth={2} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-slate-900">Hazır arşivler</span>
            <span className="mt-0.5 block text-xs text-slate-500">
              {readyCount} ders kelime listesi yüklü
            </span>
          </span>
          <button
            type="button"
            onClick={() => setReadyOnly((value) => !value)}
            className={`h-5 w-5 shrink-0 rounded border transition-colors ${
              readyOnly
                ? "border-gold bg-gold"
                : "border-slate-300 bg-transparent hover:border-slate-400"
            }`}
            aria-label="Sadece hazır dersleri göster"
            aria-pressed={readyOnly}
          />
        </div>

        <div className="max-h-[min(60vh,560px)] overflow-y-auto">
          {visibleGroups.map((group) => {
            const key = domainKey(group.domainId);
            return (
              <DomainBlock
                key={key}
                group={group}
                activeSlug={activeSlug}
                open={openDomains.has(key)}
                selectedSlugs={selectedSlugs}
                progressBySlug={progressBySlug}
                onToggle={() => toggleDomain(key)}
                onSelect={setActiveSlug}
                onToggleSelected={onToggleCourse}
                onRequestReset={handleRequestReset}
              />
            );
          })}

          {visibleGroups.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-slate-500">
              {normalizedSearch
                ? "Aramanıza uygun ders bulunamadı."
                : "Filtreye uygun ders bulunamadı."}
            </p>
          )}
        </div>
      </div>

      {selectedItem && (
        <div className="rounded-2xl bg-white px-5 py-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Seçili ders · {DOMAIN_META[selectedItem.course.domain].labelTr}
          </p>
          <h3
            dir="rtl"
            className="mt-2 text-right font-arabic text-xl font-bold text-slate-900"
          >
            {selectedItem.course.titleAr}
          </h3>
          <p className="mt-3 text-sm text-slate-500">
            Kelime tekrar sistemi yeniden tasarlanıyor. Bu ders için çalışma
            modu yakında burada açılacak.
          </p>
        </div>
      )}
    </div>
  );
}
