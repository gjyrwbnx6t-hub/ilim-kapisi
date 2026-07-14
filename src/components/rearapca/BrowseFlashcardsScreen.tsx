"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, BookOpen, Check } from "lucide-react";
import BrowseFlashcardsSession from "@/components/rearapca/BrowseFlashcardsSession";
import { primeSpeechSynthesis } from "@/components/course/VocabularySpeak";
import type { BrowseWordStatus } from "@/lib/rearapca-browse-flashcards";

import type { RearapcaDomainGroup } from "@/lib/rearapca-types";

type WordStatusFilter = BrowseWordStatus;

type FirstSide = "foreign" | "turkish";

const WORD_STATUS_OPTIONS: {
  id: WordStatusFilter;
  label: string;
  color: string;
}[] = [
  { id: "new", label: "Yeni", color: "#d1d5db" },
  { id: "learning", label: "Öğreniliyor", color: "#f9a8d4" },
  { id: "due", label: "Tekrar bekleyen", color: "#fdba74" },
  { id: "mastered", label: "Ezberlenen", color: "#4ade80" },
  { id: "already_known", label: "Önceden bilinen", color: "#9ca3af" },
];

const DEFAULT_WORD_STATUS_FILTERS = new Set<WordStatusFilter>(["due"]);

const FIRST_SIDE_LABELS: Record<FirstSide, string> = {
  foreign: "Yabancı dil",
  turkish: "Türkçe",
};

const FIRST_SIDE_ORDER: FirstSide[] = ["foreign", "turkish"];

function formatWordStatusSummary(filters: Set<WordStatusFilter>): string {
  if (filters.size === 0) return "Seçilmedi";
  const labels = WORD_STATUS_OPTIONS.filter((option) => filters.has(option.id)).map(
    (option) => option.label,
  );
  if (labels.length <= 2) return labels.join(", ");
  return `${labels[0]}, ${labels[1]} +${labels.length - 2}`;
}

interface BrowseFlashcardsScreenProps {
  domainGroups: RearapcaDomainGroup[];
  initialSelectedSlugs?: string[];
  onBack: () => void;
}

function SettingsRow({
  label,
  value,
  onClick,
}: {
  label: string;
  value: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className="flex w-full items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 text-left last:border-b-0 disabled:cursor-default"
    >
      <span className="text-[15px] text-slate-900">{label}</span>
      <span className="text-[15px] font-medium text-sky-500">{value}</span>
    </button>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 last:border-b-0 ${
        disabled ? "opacity-50" : ""
      }`}
    >
      <span className="text-[15px] text-slate-900">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full p-0.5 transition-colors duration-200 ease-in-out disabled:cursor-not-allowed ${
          checked ? "bg-sky-500" : "bg-slate-200"
        }`}
      >
        <span
          aria-hidden
          className={`block size-6 rounded-full bg-white shadow transition-transform duration-200 ease-in-out ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function Checkbox({
  checked,
  onChange,
  ariaLabel,
  variant = "default",
}: {
  checked: boolean;
  onChange: () => void;
  ariaLabel: string;
  variant?: "default" | "sheet";
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-label={ariaLabel}
      aria-pressed={checked}
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
        checked
          ? variant === "sheet"
            ? "border-sky-500 bg-sky-500"
            : "border-primary bg-primary"
          : "border-slate-300 bg-white hover:border-slate-400"
      }`}
    >
      {checked && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
    </button>
  );
}

function WordStatusFilterSheet({
  draft,
  onDraftChange,
  onCancel,
  onSave,
}: {
  draft: Set<WordStatusFilter>;
  onDraftChange: (next: Set<WordStatusFilter>) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const toggle = (id: WordStatusFilter) => {
    const next = new Set(draft);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onDraftChange(next);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Kapat"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="word-status-sheet-title"
        className="relative w-full max-w-lg rounded-t-3xl bg-white px-5 pb-6 pt-3 shadow-xl"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-200" />

        <h3
          id="word-status-sheet-title"
          className="text-xl font-bold text-slate-900"
        >
          Gösterilecek kelimeler
        </h3>

        <ul className="mt-4 divide-y divide-slate-100">
          {WORD_STATUS_OPTIONS.map((option) => {
            const checked = draft.has(option.id);
            return (
              <li key={option.id}>
                <div className="flex w-full items-center gap-3 py-4">
                  <button
                    type="button"
                    onClick={() => toggle(option.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <span
                      className="h-5 w-5 shrink-0 rounded-sm"
                      style={{ backgroundColor: option.color }}
                      aria-hidden
                    />
                    <span className="text-[17px] text-slate-900">{option.label}</span>
                  </button>
                  <Checkbox
                    checked={checked}
                    onChange={() => toggle(option.id)}
                    ariaLabel={`${option.label} ${checked ? "seçili" : "seçili değil"}`}
                    variant="sheet"
                  />
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-2 flex items-center gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-1 py-2 text-base font-medium text-sky-500"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={draft.size === 0}
            className="flex-1 rounded-2xl bg-sky-500 py-3.5 text-base font-bold text-white transition-colors hover:bg-sky-600 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BrowseFlashcardsScreen({
  domainGroups,
  initialSelectedSlugs = [],
  onBack,
}: BrowseFlashcardsScreenProps) {
  const readyCourses = useMemo(
    () =>
      domainGroups.flatMap((group) =>
        group.items.filter((item) => item.summary.hasVocabulary),
      ),
    [domainGroups],
  );

  const [wordStatusFilters, setWordStatusFilters] = useState<Set<WordStatusFilter>>(
    () => new Set(DEFAULT_WORD_STATUS_FILTERS),
  );
  const [wordStatusSheetOpen, setWordStatusSheetOpen] = useState(false);
  const [wordStatusDraft, setWordStatusDraft] = useState<Set<WordStatusFilter>>(
    () => new Set(DEFAULT_WORD_STATUS_FILTERS),
  );
  const [firstSide, setFirstSide] = useState<FirstSide>("foreign");
  const [showTranslationAtOnce, setShowTranslationAtOnce] = useState(false);
  const [autoPronounce, setAutoPronounce] = useState(false);
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(
    () => new Set(initialSelectedSlugs.filter((slug) => readyCourses.some((item) => item.course.slug === slug))),
  );
  const [started, setStarted] = useState(false);

  const allSelected =
    readyCourses.length > 0 &&
    readyCourses.every((item) => selectedSlugs.has(item.course.slug));

  const openWordStatusSheet = () => {
    setWordStatusDraft(new Set(wordStatusFilters));
    setWordStatusSheetOpen(true);
  };

  const cycleFirstSide = () => {
    const index = FIRST_SIDE_ORDER.indexOf(firstSide);
    setFirstSide(FIRST_SIDE_ORDER[(index + 1) % FIRST_SIDE_ORDER.length]);
  };

  const toggleCourse = (slug: string) => {
    setSelectedSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedSlugs(new Set());
      return;
    }
    setSelectedSlugs(new Set(readyCourses.map((item) => item.course.slug)));
  };

  if (started) {
    return (
      <BrowseFlashcardsSession
        courseSlugs={[...selectedSlugs]}
        statusFilters={[...wordStatusFilters]}
        firstSide={firstSide}
        showTranslationAtOnce={showTranslationAtOnce}
        autoPronounce={autoPronounce}
        onBack={() => setStarted(false)}
      />
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col">
      {wordStatusSheetOpen && (
        <WordStatusFilterSheet
          draft={wordStatusDraft}
          onDraftChange={setWordStatusDraft}
          onCancel={() => setWordStatusSheetOpen(false)}
          onSave={() => {
            setWordStatusFilters(new Set(wordStatusDraft));
            setWordStatusSheetOpen(false);
          }}
        />
      )}

      <div className="relative mb-4 flex items-center justify-center">
        <button
          type="button"
          onClick={onBack}
          className="absolute left-0 flex h-10 w-10 items-center justify-center rounded-full text-slate-700 hover:bg-white/70"
          aria-label="Geri"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-bold text-slate-900">Kartları gözat</h2>
      </div>

      <div className="space-y-4 pb-24">
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <SettingsRow
            label="Gösterilecek kelimeler"
            value={formatWordStatusSummary(wordStatusFilters)}
            onClick={openWordStatusSheet}
          />
          <SettingsRow
            label="İlk görünen yüz"
            value={FIRST_SIDE_LABELS[firstSide]}
            onClick={cycleFirstSide}
          />
          <ToggleRow
            label="Çeviriyi hemen göster"
            checked={showTranslationAtOnce}
            onChange={setShowTranslationAtOnce}
          />
          <ToggleRow
            label="Yabancı kelimeleri otomatik oku"
            checked={autoPronounce}
            onChange={setAutoPronounce}
            disabled={firstSide === "turkish"}
          />
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
            <BookOpen className="h-5 w-5 shrink-0 text-slate-400" strokeWidth={2} />
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold text-slate-900">Tümünü seç</p>
              <p className="text-sm text-slate-500">
                {readyCourses.reduce((sum, item) => sum + item.summary.wordCount, 0)}{" "}
                kelime
              </p>
            </div>
            <Checkbox
              checked={allSelected}
              onChange={toggleSelectAll}
              ariaLabel={allSelected ? "Tüm dersleri kaldır" : "Tüm dersleri seç"}
            />
          </div>

          {readyCourses.map((item) => {
            const selected = selectedSlugs.has(item.course.slug);
            return (
              <div
                key={item.course.id}
                className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 last:border-b-0"
              >
                <BookOpen className="h-5 w-5 shrink-0 text-slate-400" strokeWidth={2} />
                <div className="min-w-0 flex-1">
                  <p
                    dir="rtl"
                    className="truncate text-right font-arabic text-[15px] font-semibold text-slate-900"
                  >
                    {item.course.titleAr}
                  </p>
                  <p className="text-sm text-slate-500">
                    {item.summary.wordCount} kelime
                  </p>
                </div>
                <Checkbox
                  checked={selected}
                  onChange={() => toggleCourse(item.course.slug)}
                  ariaLabel={
                    selected ? "Ders seçimini kaldır" : "Dersi listeye ekle"
                  }
                />
              </div>
            );
          })}

          {readyCourses.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-slate-500">
              Henüz hazır kelime arşivi yok.
            </p>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-[#e8e8ed]/95 px-4 py-4 backdrop-blur sm:px-6">
        <div className="mx-auto w-full max-w-lg">
          <button
            type="button"
            disabled={selectedSlugs.size === 0}
            onClick={() => {
              if (autoPronounce && firstSide === "foreign") {
                primeSpeechSynthesis();
              }
              setStarted(true);
            }}
            className="w-full rounded-2xl bg-sky-500 py-4 text-base font-bold text-white transition-colors hover:bg-sky-600 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Başla
          </button>
        </div>
      </div>
    </div>
  );
}
