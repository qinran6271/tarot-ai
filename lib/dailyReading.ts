/**
 * This file is used to save and retrieve the daily tarot reading from localStorage,
 * allowing users to see the same reading throughout the day.
 */

import { DrawnCard } from "@/types/tarot";

const STORAGE_KEY = "daily-reading";

export type DailyReading = {
  date: string;
  card: DrawnCard;
  keyInsight: string;
  interpretation: string;
  advice: string;
};

function getToday() {
  return new Date().toDateString();
}

export function saveDailyReading(
  reading: Omit<DailyReading, "date">
) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...reading,
      date: getToday(),
    })
  );
}

export function getDailyReading(): DailyReading | null {
  const data = localStorage.getItem(STORAGE_KEY);

  if (!data) return null;

  return JSON.parse(data);
}

export function isTodayReading(reading: DailyReading) {
  return reading.date === getToday();
}

export function clearDailyReading() {
  localStorage.removeItem(STORAGE_KEY);
}

