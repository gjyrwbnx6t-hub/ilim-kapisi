"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  AnalyticsRange,
  RearapcaAnalytics,
} from "@/lib/rearapca-analytics";

const RANGE_OPTIONS: { value: AnalyticsRange; label: string }[] = [
  { value: "7", label: "7 gün" },
  { value: "30", label: "30 gün" },
  { value: "90", label: "90 gün" },
  { value: "all", label: "Tüm zamanlar" },
];

const SERIES = [
  { key: "newWords" as const, label: "Yeni öğrenilen", color: "#f9a8d4" },
  { key: "reviewed" as const, label: "Tekrar edilen (benzersiz)", color: "#fdba74" },
  { key: "mastered" as const, label: "Ezberlenen", color: "#4ade80" },
  { key: "alreadyKnown" as const, label: "Önceden bilinen", color: "#d1d5db" },
];

function emptyAnalytics(range: AnalyticsRange): RearapcaAnalytics {
  return {
    range,
    rangeLabel:
      range === "7"
        ? "Son 7 gün"
        : range === "30"
          ? "Son 30 gün"
          : range === "90"
            ? "Son 90 gün"
            : "Tüm zamanlar",
    buckets: [],
    totals: { alreadyKnown: 0, newWords: 0, reviewed: 0, mastered: 0 },
    learningNow: 0,
  };
}

function bucketTotal(bucket: RearapcaAnalytics["buckets"][number]) {
  return (
    bucket.alreadyKnown +
    bucket.newWords +
    bucket.reviewed +
    bucket.mastered
  );
}

export default function RearapcaAnalyticsPanel() {
  const [range, setRange] = useState<AnalyticsRange>("30");
  const [data, setData] = useState<RearapcaAnalytics>(() =>
    emptyAnalytics("30"),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    void fetch(`/api/rearapca/analytics?range=${range}`)
      .then(async (response) => {
        const payload = (await response.json()) as RearapcaAnalytics & {
          error?: string;
        };
        if (!response.ok) {
          throw new Error(payload.error ?? "İstatistikler yüklenemedi.");
        }
        if (alive) setData(payload);
      })
      .catch((err: unknown) => {
        if (!alive) return;
        setData(emptyAnalytics(range));
        setError(err instanceof Error ? err.message : "İstatistikler yüklenemedi.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [range]);

  const maxTotal = useMemo(
    () => Math.max(1, ...data.buckets.map(bucketTotal)),
    [data.buckets],
  );

  const yTicks = useMemo(() => {
    const step =
      maxTotal <= 10 ? 2 : maxTotal <= 50 ? 10 : Math.ceil(maxTotal / 5 / 10) * 10;
    const top = Math.ceil(maxTotal / step) * step;
    const ticks: number[] = [];
    for (let value = 0; value <= top; value += step) ticks.push(value);
    return ticks.length > 1 ? ticks : [0, maxTotal];
  }, [maxTotal]);

  const yMax = yTicks[yTicks.length - 1] ?? maxTotal;

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-900">Kelime istatistikleri</p>
          <div className="flex gap-1 rounded-full bg-[#d8d8de] p-1">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setRange(option.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors sm:px-4 sm:text-sm ${
                  range === option.value
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <p className="px-5 py-10 text-center text-sm text-slate-500">
          İstatistikler yükleniyor...
        </p>
      )}

      {!loading && error && (
        <p className="px-5 py-10 text-center text-sm text-red-500">{error}</p>
      )}

      {!loading && !error && (
        <>
          <div className="px-4 py-5 sm:px-5">
            <div className="flex gap-3">
              <div className="flex h-56 w-10 flex-col justify-between text-right text-[10px] text-slate-400">
                {[...yTicks].reverse().map((tick) => (
                  <span key={tick}>{tick}</span>
                ))}
              </div>

              <div className="relative min-w-0 flex-1">
                <div className="flex h-56 items-end gap-1 overflow-x-auto pb-1 sm:gap-2">
                  {data.buckets.map((bucket) => {
                    const total = bucketTotal(bucket);
                    const barHeightPx =
                      total > 0 ? Math.max((total / yMax) * 224, 12) : 0;
                    const segments = [
                      { value: bucket.alreadyKnown, color: SERIES[3].color },
                      { value: bucket.newWords, color: SERIES[0].color },
                      { value: bucket.reviewed, color: SERIES[1].color },
                      { value: bucket.mastered, color: SERIES[2].color },
                    ].filter((segment) => segment.value > 0);

                    return (
                      <div
                        key={bucket.key}
                        className="flex min-w-[28px] flex-1 flex-col items-center justify-end sm:min-w-[36px]"
                      >
                        <div
                          className="flex w-full max-w-10 flex-col justify-end overflow-hidden rounded-t-md"
                          style={{ height: `${barHeightPx}px` }}
                          title={`${bucket.label}: ${total}`}
                        >
                          {segments.map((segment) => (
                            <div
                              key={`${bucket.key}-${segment.color}`}
                              className="flex w-full items-center justify-center text-[9px] font-bold text-white/90"
                              style={{
                                backgroundColor: segment.color,
                                height: `${(segment.value / total) * 100}%`,
                                minHeight: segment.value > 0 ? "12px" : 0,
                              }}
                            >
                              {segment.value > 0 && total >= 8 ? segment.value : ""}
                            </div>
                          ))}
                        </div>
                        <span className="mt-2 max-w-full truncate text-center text-[10px] text-slate-500">
                          {bucket.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 px-4 py-4 sm:px-5">
            <p className="text-sm text-slate-600">
              Şu an öğreniliyor:{" "}
              <span className="font-semibold text-slate-900">
                {data.learningNow} kelime
              </span>
            </p>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[320px] text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-slate-400">
                    <th className="pb-2 font-semibold">Toplam</th>
                    <th className="pb-2 font-semibold">{data.rangeLabel}</th>
                    <th className="pb-2 font-semibold">Kategori</th>
                  </tr>
                </thead>
                <tbody>
                  {SERIES.map((series) => (
                    <tr key={series.key} className="border-t border-slate-100">
                      <td className="py-2.5 font-bold text-slate-900">
                        {data.totals[series.key]}
                      </td>
                      <td className="py-2.5 font-bold text-slate-900">
                        {data.totals[series.key]}
                      </td>
                      <td className="py-2.5">
                        <span className="inline-flex items-center gap-2 text-slate-700">
                          <span
                            className="h-3 w-3 rounded-sm"
                            style={{ backgroundColor: series.color }}
                          />
                          {series.label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
