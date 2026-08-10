"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useTarotStore } from "@/store/tarotStore";

export default function FavoritesPage() {
  const router = useRouter();
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const history = useTarotStore((state) => state.history);
  const storageReady = useTarotStore((state) => state.storageReady);
  const setCurrentReading = useTarotStore((state) => state.setCurrentReading);
  const updateReading = useTarotStore((state) => state.updateReading);
  const favoriteReadings = history.filter((reading) => reading.favoritedAt);

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
        <div className="space-y-4">
          {favoriteReadings.map((reading) => (
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
      )}
    </main>
  );
}
