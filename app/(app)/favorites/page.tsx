"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import ReadingTimeFilter from "@/components/ReadingTimeFilter";
import { useTarotStore } from "@/store/tarotStore";
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

export default function FavoritesPage() {
  const router = useRouter();
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState("all");
  const history = useTarotStore((state) => state.history);
  const storageReady = useTarotStore((state) => state.storageReady);
  const setCurrentReading = useTarotStore((state) => state.setCurrentReading);
  const updateReading = useTarotStore((state) => state.updateReading);
  const favoriteReadings = history.filter((reading) => reading.favoritedAt);
  const availableYears = Array.from(
    new Set(
      favoriteReadings.map((reading) =>
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
  const visibleFavoriteReadings = favoriteReadings.filter((reading) => {
    const readingDate = new Date(reading.createdAt);

    if (selectedRange === "all") return true;
    if (selectedRange === "today") return readingDate >= startOfToday;
    if (selectedRange === "week") return readingDate >= startOfWeek;
    if (selectedRange === "30-days") return readingDate >= startOfLast30Days;
    if (selectedRange.startsWith("year-")) {
      return readingDate.getFullYear() === Number(selectedRange.slice(5));
    }
    if (selectedRange.startsWith("month-")) {
      const [, year, month] = selectedRange.split("-");
      return (
        readingDate.getFullYear() === Number(year) &&
        readingDate.getMonth() === Number(month) - 1
      );
    }

    return true;
  });
  const favoriteReadingsByDate = visibleFavoriteReadings.reduce<
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

  return (
    <main className="mx-auto max-w-md p-6">
      <div className="flex items-center gap-3">
        <Heart size={22} fill="currentColor" className="text-red-500" />
        <h1 className="text-2xl font-bold">Favorites</h1>
      </div>
      <p className="mb-6 mt-2 text-sm text-gray-500">
        Readings you want to return to.
      </p>

      {!storageReady ? (
        <p className="text-sm text-gray-500">Loading favorites…</p>
      ) : favoriteReadings.length === 0 ? (
        <p className="text-sm text-gray-500">
          Tap the heart on a Reading to save it here.
        </p>
      ) : (
        <div>
          <div className="mb-8">
            <ReadingTimeFilter
              availableYears={availableYears}
              selectedRange={selectedRange}
              onRangeChange={setSelectedRange}
            />
          </div>

          {visibleFavoriteReadings.length === 0 ? (
            <p className="text-sm text-gray-500">
              No favorites in this time range.
            </p>
          ) : (
            <div className="space-y-8">
              {favoriteReadingsByDate.map((group) => (
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
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setCurrentReading(reading);
                      router.push(`/reading/${reading.id}`);
                    }
                  }}
                  className="w-full rounded-2xl border border-gray-200 bg-white p-5 text-left transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:bg-gray-50 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="line-clamp-1 font-medium text-gray-900">
                        {reading.focus}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {new Date(reading.createdAt).toLocaleString()}
                      </p>
                      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-gray-600">
                        {reading.content.keyInsight}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();

                        if (confirmRemoveId === reading.id) {
                          updateReading(reading.id, { favoritedAt: undefined });
                          setConfirmRemoveId(null);
                        } else {
                          setConfirmRemoveId(reading.id);
                        }
                      }}
                      className={
                        confirmRemoveId === reading.id
                          ? "shrink-0 rounded-full bg-red-50 px-3 py-2 text-xs font-medium text-red-500"
                          : "shrink-0 rounded-full p-2 text-red-500 transition-colors hover:bg-red-50"
                      }
                      aria-label="Remove from favorites"
                    >
                      {confirmRemoveId === reading.id ? (
                        "Remove?"
                      ) : (
                        <Heart size={18} fill="currentColor" />
                      )}
                    </button>
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
