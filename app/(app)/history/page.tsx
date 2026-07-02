"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTarotStore } from "@/store/tarotStore";

export default function HistoryPage() {
  const router = useRouter();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const history = useTarotStore((state) => state.history);
  const setCurrentReading = useTarotStore((state) => state.setCurrentReading);
  const removeHistory = useTarotStore((state) => state.removeHistory);

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-6 text-2xl font-bold">Reading History</h1>

      {history.length === 0 ? (
        <p className="text-sm text-gray-500">No readings yet.</p>
      ) : (
        <div className="space-y-4">
          {history.map((reading) => (
            <div
              key={reading.id}
              role="button"
              tabIndex={0}
              onClick={() => {
                setCurrentReading(reading);
                router.push("/reading");
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
                      ? "shrink-0 rounded-full bg-red-50 px-3 py-2 text-xs font-medium text-red-500"
                      : "shrink-0 rounded-full p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                  }
                  aria-label="Delete reading"
                >
                  {confirmDeleteId === reading.id ? "Delete?" : "🗑️"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}