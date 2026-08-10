"use client";

import { Check, ChevronDown, X } from "lucide-react";
import { useEffect, useState } from "react";

type ReadingTimeFilterProps = {
  availableYears: number[];
  selectedRange: string;
  onRangeChange: (range: string) => void;
};

const quickOptions = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "30-days", label: "Last 30 days" },
];

const months = Array.from({ length: 12 }, (_, month) => ({
  value: month,
  label: new Date(2000, month, 1).toLocaleDateString(undefined, {
    month: "long",
  }),
}));

function rangeLabel(range: string) {
  const quickOption = quickOptions.find((option) => option.value === range);
  if (quickOption) return quickOption.label;

  if (range.startsWith("year-")) return range.slice(5);
  if (range.startsWith("month-")) {
    const [, year, month] = range.split("-");
    return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(
      undefined,
      { month: "long", year: "numeric" },
    );
  }

  return "All time";
}

export default function ReadingTimeFilter({
  availableYears,
  selectedRange,
  onRangeChange,
}: ReadingTimeFilterProps) {
  const currentYear = new Date().getFullYear();
  const [menuOpen, setMenuOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [draftYear, setDraftYear] = useState(currentYear);
  const [draftMonth, setDraftMonth] = useState<number | null>(null);
  const years = availableYears.length > 0 ? availableYears : [currentYear];

  useEffect(() => {
    if (!datePickerOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setDatePickerOpen(false);
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [datePickerOpen]);

  function openDatePicker() {
    if (selectedRange.startsWith("month-")) {
      const [, year, month] = selectedRange.split("-");
      setDraftYear(Number(year));
      setDraftMonth(Number(month) - 1);
    } else if (selectedRange.startsWith("year-")) {
      setDraftYear(Number(selectedRange.slice(5)));
      setDraftMonth(null);
    } else {
      setDraftYear(years[0]);
      setDraftMonth(null);
    }

    setMenuOpen(false);
    setDatePickerOpen(true);
  }

  return (
    <>
      <div
        className="relative"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setMenuOpen(false);
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") setMenuOpen(false);
        }}
      >
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="flex h-12 w-full items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 outline-none transition-colors hover:border-gray-300 focus-visible:border-yellow-300 focus-visible:ring-2 focus-visible:ring-yellow-100"
          aria-haspopup="listbox"
          aria-expanded={menuOpen}
        >
          <span>{rangeLabel(selectedRange)}</span>
          <ChevronDown
            size={17}
            className={`text-gray-400 transition-transform ${
              menuOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {menuOpen ? (
          <div
            role="listbox"
            aria-label="Filter readings by time range"
            className="absolute left-0 right-0 top-14 z-30 overflow-hidden rounded-2xl border border-gray-100 bg-white p-1.5 shadow-[0_12px_35px_rgba(15,23,42,0.10)]"
          >
            {quickOptions.map((option) => {
              const selected = option.value === selectedRange;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onRangeChange(option.value);
                    setMenuOpen(false);
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
            <button
              type="button"
              onClick={openDatePicker}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                selectedRange.startsWith("year-") ||
                selectedRange.startsWith("month-")
                  ? "bg-yellow-50 font-medium text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span>Choose date…</span>
              {selectedRange.startsWith("year-") ||
              selectedRange.startsWith("month-") ? (
                <Check size={15} className="text-yellow-600" />
              ) : null}
            </button>
          </div>
        ) : null}
      </div>

      {datePickerOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-gray-950/25 sm:items-center sm:p-6"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) setDatePickerOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="date-filter-title"
            className="w-full max-w-md rounded-t-3xl bg-white p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl"
          >
            <div className="flex items-center justify-between">
              <h2 id="date-filter-title" className="text-lg font-semibold">
                Choose date
              </h2>
              <button
                type="button"
                onClick={() => setDatePickerOpen(false)}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close date picker"
              >
                <X size={20} />
              </button>
            </div>

            <label className="mt-6 block text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
              Year
              <select
                value={draftYear}
                onChange={(event) => setDraftYear(Number(event.target.value))}
                className="mt-2 h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-base font-medium text-gray-800 outline-none focus:border-yellow-300 focus:ring-2 focus:ring-yellow-100"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>

            <fieldset className="mt-6">
              <legend className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
                Period
              </legend>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDraftMonth(null)}
                  className={`col-span-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    draftMonth === null
                      ? "bg-yellow-100 text-yellow-900"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Whole year
                </button>
                {months.map((month) => (
                  <button
                    key={month.value}
                    type="button"
                    onClick={() => setDraftMonth(month.value)}
                    className={`rounded-xl px-2 py-2.5 text-sm transition-colors ${
                      draftMonth === month.value
                        ? "bg-yellow-100 font-medium text-yellow-900"
                        : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {month.label.slice(0, 3)}
                  </button>
                ))}
              </div>
            </fieldset>

            <button
              type="button"
              onClick={() => {
                onRangeChange(
                  draftMonth === null
                    ? `year-${draftYear}`
                    : `month-${draftYear}-${String(draftMonth + 1).padStart(2, "0")}`,
                );
                setDatePickerOpen(false);
              }}
              className="mt-6 h-12 w-full rounded-2xl bg-gray-900 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
            >
              Apply
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
