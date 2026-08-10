"use client";

import { Heart } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTarotStore } from "@/store/tarotStore";
import GuestReadingImport from "@/components/reading/GuestReadingImport";
import { dailyCardSpread } from "@/lib/spreads";

export default function HistoryPage() {
  const router = useRouter();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const history = useTarotStore((state) => state.history);
  const storageReady = useTarotStore((state) => state.storageReady);
  const setCurrentReading = useTarotStore((state) => state.setCurrentReading);
  const updateReading = useTarotStore((state) => state.updateReading);
  const removeHistory = useTarotStore((state) => state.removeHistory);
  const regularReadings = history.filter(
    (reading) => reading.spread.id !== dailyCardSpread.id,
  );

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-6 text-2xl font-bold">Reading History</h1>

      <GuestReadingImport />

      {!storageReady ? (
        <p className="text-sm text-gray-500">Loading readings…</p>
      ) : regularReadings.length === 0 ? (
        <p className="text-sm text-gray-500">No readings yet.</p>
      ) : (
        <div className="space-y-4">
          {regularReadings.map((reading) => (
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
                    {new Date(reading.createdAt).toLocaleString()}
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
                      fill={reading.favoritedAt ? "currentColor" : "none"}
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
                    {confirmDeleteId === reading.id ? "Delete?" : "🗑️"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
