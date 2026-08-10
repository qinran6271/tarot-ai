"use client";

import { Check, ChevronDown, Heart } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTarotStore } from "@/store/tarotStore";
import GuestReadingImport from "@/components/reading/GuestReadingImport";
import { dailyCardSpread } from "@/lib/spreads";
import type { Reading } from "@/types/reading";

function localDateKey(value: string | Date) {
  const date = new Date(value);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function dateHeading(value: string) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (localDateKey(date) === localDateKey(today)) return "Today";
  if (localDateKey(date) === localDateKey(yesterday)) return "Yesterday";

  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
  });
}

export default function HistoryPage() {
  const router = useRouter();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState("all");
  const [rangeMenuOpen, setRangeMenuOpen] = useState(false);

  const history = useTarotStore((state) => state.history);
  const storageReady = useTarotStore((state) => state.storageReady);
  const setCurrentReading = useTarotStore((state) => state.setCurrentReading);
  const updateReading = useTarotStore((state) => state.updateReading);
  const removeHistory = useTarotStore((state) => state.removeHistory);
  const regularReadings = history.filter(
    (reading) => reading.spread.id !== dailyCardSpread.id,
  );
  const readingsByDate = regularReadings.reduce<
    Array<{ key: string; date: string; readings: Reading[] }>
  >((groups, reading) => {
    const key = localDateKey(reading.createdAt);
    const currentGroup = groups.at(-1);

    if (currentGroup?.key === key) {
      currentGroup.readings.push(reading);
    } else {
      groups.push({ key, date: reading.createdAt, readings: [reading] });
    }

    return groups;
  }, []);
  const availableYears = Array.from(
    new Set(
      regularReadings.map((reading) =>
        new Date(reading.createdAt).getFullYear(),
      ),
    ),
  ).sort((a, b) => b - a);
  const rangeOptions = [
    { value: "all", label: "All time" },
    { value: "today", label: "Today" },
    { value: "week", label: "This week" },
    { value: "30-days", label: "Last 30 days" },
    ...availableYears.map((year) => ({
      value: `year-${year}`,
      label: String(year),
    })),
  ];
  const selectedRangeLabel =
    rangeOptions.find((option) => option.value === selectedRange)?.label ??
    "All time";
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfWeek = new Date(startOfToday);
  const weekday = startOfWeek.getDay();
  startOfWeek.setDate(
    startOfWeek.getDate() - (weekday === 0 ? 6 : weekday - 1),
  );
  const startOfLast30Days = new Date(startOfToday);
  startOfLast30Days.setDate(startOfLast30Days.getDate() - 29);
  const visibleReadingGroups = readingsByDate.filter((group) => {
    const groupDate = new Date(group.date);

    if (selectedRange === "all") return true;
    if (selectedRange === "today") return groupDate >= startOfToday;
    if (selectedRange === "week") return groupDate >= startOfWeek;
    if (selectedRange === "30-days") return groupDate >= startOfLast30Days;
    if (selectedRange.startsWith("year-")) {
      return groupDate.getFullYear() === Number(selectedRange.slice(5));
    }

    return true;
  });

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-6 text-2xl font-bold">📜 Readings</h1>

      <GuestReadingImport />

      {!storageReady ? (
        <p className="text-sm text-gray-500">Loading readings…</p>
      ) : regularReadings.length === 0 ? (
        <p className="text-sm text-gray-500">No readings yet.</p>
      ) : (
        <div>
          <div
            className="relative mb-8"
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setRangeMenuOpen(false);
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") setRangeMenuOpen(false);
            }}
          >
            <button
              type="button"
              onClick={() => setRangeMenuOpen((open) => !open)}
              className="flex h-12 w-full items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 outline-none transition-colors hover:border-gray-300 focus-visible:border-yellow-300 focus-visible:ring-2 focus-visible:ring-yellow-100"
              aria-haspopup="listbox"
              aria-expanded={rangeMenuOpen}
              aria-controls="reading-range-menu"
            >
              <span>{selectedRangeLabel}</span>
              <ChevronDown
                size={17}
                className={`text-gray-400 transition-transform ${
                  rangeMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {rangeMenuOpen ? (
              <div
                id="reading-range-menu"
                role="listbox"
                aria-label="Filter readings by time range"
                className="absolute left-0 right-0 top-14 z-30 overflow-hidden rounded-2xl border border-gray-100 bg-white p-1.5 shadow-[0_12px_35px_rgba(15,23,42,0.10)]"
              >
                {rangeOptions.map((option) => {
                  const selected = option.value === selectedRange;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        setSelectedRange(option.value);
                        setRangeMenuOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                        selected
                          ? "bg-yellow-50 font-medium text-gray-900"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <span>{option.label}</span>
                      {selected ? (
                        <Check size={15} className="text-yellow-600" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          {visibleReadingGroups.length === 0 ? (
            <p className="text-sm text-gray-500">
              No readings in this time range.
            </p>
          ) : (
            <div className="space-y-8">
              {visibleReadingGroups.map((group) => (
                <section key={group.key}>
                  <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                    {dateHeading(group.date)}
                  </h2>

                  <div className="space-y-4">
                    {group.readings.map((reading) => (
                      <div
                        key={reading.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          setCurrentReading(reading);
                          router.push(`/reading/${reading.id}`);
                        }}
                        className="group w-full cursor-pointer rounded-2xl border border-gray-200 bg-white p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:bg-gray-50 hover:shadow-md active:scale-[0.99]"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-1 font-medium text-gray-900">
                              {reading.focus}
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                              {new Date(reading.createdAt).toLocaleTimeString(
                                undefined,
                                {
                                  hour: "numeric",
                                  minute: "2-digit",
                                },
                              )}
                            </p>

                            <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-gray-600">
                              {reading.content.keyInsight}
                            </p>
                          </div>

                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                updateReading(reading.id, {
                                  favoritedAt: reading.favoritedAt
                                    ? undefined
                                    : new Date().toISOString(),
                                });
                              }}
                              className={`rounded-full p-2 transition-colors ${
                                reading.favoritedAt
                                  ? "text-red-500"
                                  : "text-gray-400 hover:bg-red-50 hover:text-red-500"
                              }`}
                              aria-label={
                                reading.favoritedAt
                                  ? "Remove from favorites"
                                  : "Add to favorites"
                              }
                              aria-pressed={Boolean(reading.favoritedAt)}
                            >
                              <Heart
                                size={18}
                                strokeWidth={1.8}
                                fill={
                                  reading.favoritedAt ? "currentColor" : "none"
                                }
                              />
                            </button>

                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();

                                if (confirmDeleteId === reading.id) {
                                  removeHistory(reading.id);
                                  setConfirmDeleteId(null);
                                } else {
                                  setConfirmDeleteId(reading.id);
                                }
                              }}
                              className={
                                confirmDeleteId === reading.id
                                  ? "rounded-full bg-red-50 px-3 py-2 text-xs font-medium text-red-500"
                                  : "rounded-full p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                              }
                              aria-label="Delete reading"
                            >
                              {confirmDeleteId === reading.id
                                ? "Delete?"
                                : "🗑️"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
