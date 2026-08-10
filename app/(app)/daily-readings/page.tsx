"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";

import { dailyCardSpread } from "@/lib/spreads";
import { useTarotStore } from "@/store/tarotStore";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export default function DailyReadingsPage() {
  const history = useTarotStore((state) => state.history);
  const storageReady = useTarotStore((state) => state.storageReady);
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(
    () => dateKey(new Date()),
  );
  const [expandedReadingId, setExpandedReadingId] = useState<string | null>(
    null,
  );

  const dailyReadings = history.filter(
    (reading) => reading.spread.id === dailyCardSpread.id,
  );
  const readingsByDate = useMemo(
    () =>
      new Map(
        dailyReadings.map((reading) => [
          dateKey(new Date(reading.createdAt)),
          reading,
        ]),
      ),
    [dailyReadings],
  );

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const leadingDays = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calendarCells = [
    ...Array.from({ length: leadingDays }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  const todayKey = dateKey(new Date());
  const selectedReading = selectedDateKey
    ? readingsByDate.get(selectedDateKey)
    : undefined;
  const selectedCard = selectedReading?.cards[0];

  function changeMonth(offset: number) {
    setVisibleMonth(new Date(year, month + offset, 1));
    setSelectedDateKey(null);
    setExpandedReadingId(null);
  }

  function returnToToday() {
    const today = new Date();
    setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDateKey(dateKey(today));
    setExpandedReadingId(null);
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold">Daily Readings</h1>
      <p className="mt-2 text-sm text-gray-500">
        A record of the guidance you received each day.
      </p>

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={returnToToday}
          className="text-xs font-medium text-gray-500 transition-colors hover:text-gray-900"
        >
          Today
        </button>
      </div>

      <section className="mt-3 rounded-[28px] border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            aria-label="Previous month"
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <ChevronLeft size={18} />
          </button>
          <h2 className="text-sm font-semibold text-gray-900">
            {visibleMonth.toLocaleDateString(undefined, {
              month: "long",
              year: "numeric",
            })}
          </h2>
          <button
            type="button"
            onClick={() => changeMonth(1)}
            aria-label="Next month"
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((weekday) => (
            <div
              key={weekday}
              className="py-2 text-[10px] font-medium uppercase tracking-wide text-gray-400"
            >
              {weekday}
            </div>
          ))}

          {calendarCells.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const cellDate = new Date(year, month, day);
            const key = dateKey(cellDate);
            const reading = readingsByDate.get(key);
            const isToday = key === todayKey;
            const isSelected = key === selectedDateKey;

            return (
              <button
                key={key}
                type="button"
                disabled={!reading}
                title={reading?.cards[0]?.name}
                onClick={() => {
                  setSelectedDateKey(key);
                  setExpandedReadingId(null);
                }}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-2xl text-xs transition-all ${
                  reading
                    ? "cursor-pointer bg-[#fff8dc] font-semibold text-[#6f5d28] hover:bg-[#fff0b8]"
                    : "cursor-default text-gray-500"
                } ${isToday ? "ring-1 ring-gray-400 ring-offset-1" : ""} ${
                  isSelected && reading ? "outline outline-2 outline-[#e4c85e]" : ""
                }`}
              >
                {day}
                {reading ? (
                  <span className="mt-0.5 text-[10px]" aria-hidden="true">
                    {reading.cards[0]?.isReversed ? "🌙" : "☀️"}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      {selectedReading && selectedCard ? (
        <section className="mt-5 rounded-[24px] border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-gray-400">
            {new Date(selectedReading.createdAt).toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>

          <div className="mt-4 flex gap-4">
            <div className="h-24 w-16 shrink-0 overflow-hidden rounded-lg bg-yellow-100 shadow-sm">
              <Image
                src={selectedCard.img}
                alt={selectedCard.name}
                width={64}
                height={96}
                className={`h-full w-full object-cover ${
                  selectedCard.isReversed ? "rotate-180" : ""
                }`}
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-900">
                {selectedCard.name}
                <span className="ml-1 text-sm font-normal text-gray-400">
                  · {selectedCard.isReversed ? "Reversed" : "Upright"}
                </span>
              </p>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-600">
                {selectedReading.content.keyInsight}
              </p>
            </div>
          </div>

          {expandedReadingId === selectedReading.id ? (
            <div className="mt-5 space-y-4 border-t border-gray-100 pt-5 text-sm leading-relaxed text-gray-600">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Interpretation
                </p>
                <p className="mt-2">{selectedReading.content.interpretation}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Advice
                </p>
                <p className="mt-2">{selectedReading.content.advice}</p>
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() =>
              setExpandedReadingId((current) =>
                current === selectedReading.id ? null : selectedReading.id,
              )
            }
            className="mt-5 text-sm font-medium text-gray-700 transition-colors hover:text-black"
          >
            {expandedReadingId === selectedReading.id
              ? "Show less"
              : "Read more"}
          </button>
        </section>
      ) : null}

      {!storageReady ? (
        <p className="mt-5 text-sm text-gray-500">Loading daily readings…</p>
      ) : dailyReadings.length === 0 ? (
        <p className="mt-5 text-sm text-gray-500">
          Your Daily Card days will appear here.
        </p>
      ) : (
        <p className="mt-5 text-xs text-gray-400">
          Yellow dates have a saved reading. Tap one to preview it.
        </p>
      )}
    </main>
  );
}
