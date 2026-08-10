"use client";

import type { Reading } from "@/types/reading";

const GUEST_STORAGE_KEY = "tarot-storage";

function isGuestReading(value: unknown): value is Reading {
  if (!value || typeof value !== "object") return false;

  const reading = value as Partial<Reading>;
  return (
    typeof reading.id === "string" &&
    typeof reading.focus === "string" &&
    typeof reading.createdAt === "string" &&
    typeof reading.updatedAt === "string" &&
    Boolean(reading.spread && typeof reading.spread.id === "string") &&
    Array.isArray(reading.cards) &&
    Boolean(reading.content && typeof reading.content.keyInsight === "string") &&
    Array.isArray(reading.conversation)
  );
}

export function readGuestReadings(): Reading[] {
  try {
    const rawValue = localStorage.getItem(GUEST_STORAGE_KEY);
    if (!rawValue) return [];

    const persisted = JSON.parse(rawValue) as {
      state?: { history?: unknown };
    };
    if (!Array.isArray(persisted.state?.history)) return [];

    return persisted.state.history.filter(isGuestReading);
  } catch (error) {
    console.error("Failed to read guest readings:", error);
    return [];
  }
}

export function deleteGuestReading(readingId: string): void {
  try {
    const rawValue = localStorage.getItem(GUEST_STORAGE_KEY);
    if (!rawValue) return;

    const persisted = JSON.parse(rawValue) as {
      state?: {
        history?: unknown;
        currentReading?: unknown;
        [key: string]: unknown;
      };
      [key: string]: unknown;
    };
    if (!persisted.state || !Array.isArray(persisted.state.history)) return;

    persisted.state.history = persisted.state.history.filter(
      (reading) =>
        !reading ||
        typeof reading !== "object" ||
        (reading as { id?: unknown }).id !== readingId,
    );

    if (
      persisted.state.currentReading &&
      typeof persisted.state.currentReading === "object" &&
      (persisted.state.currentReading as { id?: unknown }).id === readingId
    ) {
      persisted.state.currentReading = null;
    }

    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(persisted));
  } catch (error) {
    console.error("Failed to delete guest reading:", error);
  }
}
