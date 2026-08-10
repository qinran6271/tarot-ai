"use client";

import { Check, Heart, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTarotStore } from "@/store/tarotStore";
import GuestReadingImport from "@/components/reading/GuestReadingImport";
import ReadingTimeFilter from "@/components/ReadingTimeFilter";
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
  const [isEditing, setIsEditing] = useState(false);
  const [selectedReadingIds, setSelectedReadingIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [confirmBatchDelete, setConfirmBatchDelete] = useState(false);

  const history = useTarotStore((state) => state.history);
  const storageReady = useTarotStore((state) => state.storageReady);
  const setCurrentReading = useTarotStore((state) => state.setCurrentReading);
  const updateReading = useTarotStore((state) => state.updateReading);
  const removeHistory = useTarotStore((state) => state.removeHistory);

  useEffect(() => {
    if (!confirmDeleteId) return;

    function cancelDeleteConfirmation(event: PointerEvent) {
      if (
        event.target instanceof Element &&
        event.target.closest("[data-delete-confirm]")
      ) {
        return;
      }

      setConfirmDeleteId(null);
    }

    document.addEventListener("pointerdown", cancelDeleteConfirmation);
    return () =>
      document.removeEventListener("pointerdown", cancelDeleteConfirmation);
  }, [confirmDeleteId]);

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
    if (selectedRange.startsWith("month-")) {
      const [, year, month] = selectedRange.split("-");
      return (
        groupDate.getFullYear() === Number(year) &&
        groupDate.getMonth() === Number(month) - 1
      );
    }

    return true;
  });
  const visibleReadingIds = visibleReadingGroups.flatMap((group) =>
    group.readings.map((reading) => reading.id),
  );
  const selectedReadings = regularReadings.filter((reading) =>
    selectedReadingIds.has(reading.id),
  );
  const allSelectedReadingsFavorited =
    selectedReadings.length > 0 &&
    selectedReadings.every((reading) => reading.favoritedAt);
  const allVisibleReadingsSelected =
    visibleReadingIds.length > 0 &&
    visibleReadingIds.every((id) => selectedReadingIds.has(id));

  function leaveEditMode() {
    setIsEditing(false);
    setSelectedReadingIds(new Set());
    setConfirmBatchDelete(false);
  }

  function toggleReadingSelection(readingId: string) {
    setSelectedReadingIds((current) => {
      const next = new Set(current);
      if (next.has(readingId)) next.delete(readingId);
      else next.add(readingId);
      return next;
    });
    setConfirmBatchDelete(false);
  }

  return (
    <main className={`mx-auto max-w-md p-6 ${isEditing ? "pb-32" : ""}`}>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">📜 Readings</h1>
        {storageReady && regularReadings.length > 0 ? (
          <button
            type="button"
            onClick={() => {
              if (isEditing) leaveEditMode();
              else setIsEditing(true);
            }}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              isEditing
                ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                : "text-yellow-700 hover:bg-yellow-50"
            }`}
          >
            {isEditing ? "Done" : "Edit"}
          </button>
        ) : null}
      </div>

      <GuestReadingImport />

      {!storageReady ? (
        <p className="text-sm text-gray-500">Loading readings…</p>
      ) : regularReadings.length === 0 ? (
        <p className="text-sm text-gray-500">No readings yet.</p>
      ) : (
        <div>
          <div className="mb-8">
            {isEditing ? (
              <div className="mb-3 flex items-center justify-between px-1">
                <p className="text-sm font-medium text-gray-700">
                  {selectedReadingIds.size === 0
                    ? "Select readings"
                    : `${selectedReadingIds.size} selected`}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedReadingIds((current) => {
                      const next = new Set(current);
                      if (allVisibleReadingsSelected) {
                        visibleReadingIds.forEach((id) => next.delete(id));
                      } else {
                        visibleReadingIds.forEach((id) => next.add(id));
                      }
                      return next;
                    });
                    setConfirmBatchDelete(false);
                  }}
                  className="rounded-full px-3 py-1.5 text-xs font-semibold text-yellow-700 hover:bg-yellow-50"
                >
                  {allVisibleReadingsSelected ? "Deselect all" : "Select all"}
                </button>
              </div>
            ) : null}
            <ReadingTimeFilter
              availableYears={availableYears}
              selectedRange={selectedRange}
              onRangeChange={setSelectedRange}
            />
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
                          if (isEditing) {
                            toggleReadingSelection(reading.id);
                            return;
                          }
                          setCurrentReading(reading);
                          router.push(`/reading/${reading.id}`);
                        }}
                        onKeyDown={(event) => {
                          if (event.key !== "Enter" && event.key !== " ") return;
                          event.preventDefault();
                          if (isEditing) {
                            toggleReadingSelection(reading.id);
                          } else {
                            setCurrentReading(reading);
                            router.push(`/reading/${reading.id}`);
                          }
                        }}
                        aria-pressed={
                          isEditing
                            ? selectedReadingIds.has(reading.id)
                            : undefined
                        }
                        className={`group w-full cursor-pointer rounded-2xl border bg-white p-5 text-left transition-all duration-200 active:scale-[0.99] ${
                          isEditing && selectedReadingIds.has(reading.id)
                            ? "border-yellow-400 bg-yellow-50/40 shadow-sm"
                            : "border-gray-200 hover:-translate-y-0.5 hover:border-gray-300 hover:bg-gray-50 hover:shadow-md"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          {isEditing ? (
                            <span
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                                selectedReadingIds.has(reading.id)
                                  ? "border-yellow-500 bg-yellow-500 text-white"
                                  : "border-gray-300 bg-white"
                              }`}
                              aria-hidden="true"
                            >
                              {selectedReadingIds.has(reading.id) ? (
                                <Check size={13} strokeWidth={3} />
                              ) : null}
                            </span>
                          ) : null}
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

                          {!isEditing ? (
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
                                    reading.favoritedAt
                                      ? "currentColor"
                                      : "none"
                                  }
                                />
                              </button>

                              <button
                                type="button"
                                data-delete-confirm
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
                          ) : null}
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

      {isEditing ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="mx-auto flex max-w-md items-center gap-3">
            <button
              type="button"
              onClick={() => {
                const favoritedAt = allSelectedReadingsFavorited
                  ? undefined
                  : new Date().toISOString();
                selectedReadings.forEach((reading) =>
                  updateReading(reading.id, { favoritedAt }),
                );
              }}
              disabled={selectedReadings.length === 0}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-yellow-50 text-sm font-semibold text-yellow-800 transition-colors hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {allSelectedReadingsFavorited ? (
                <X size={17} />
              ) : (
                <Heart size={17} fill="currentColor" />
              )}
              {allSelectedReadingsFavorited ? "Unfavorite" : "Favorite"}
            </button>
            <button
              type="button"
              onClick={() => {
                if (!confirmBatchDelete) {
                  setConfirmBatchDelete(true);
                  return;
                }

                selectedReadings.forEach((reading) =>
                  removeHistory(reading.id),
                );
                leaveEditMode();
              }}
              disabled={selectedReadings.length === 0}
              className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                confirmBatchDelete
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-red-50 text-red-600 hover:bg-red-100"
              }`}
            >
              <Trash2 size={17} />
              {confirmBatchDelete ? "Confirm delete" : "Delete"}
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
