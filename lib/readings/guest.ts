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
