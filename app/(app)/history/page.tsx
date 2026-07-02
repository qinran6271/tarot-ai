"use client";

import Link from "next/link";
import { useTarotStore } from "@/store/tarotStore";

export default function HistoryPage() {
  const history = useTarotStore((state) => state.history);

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-6 text-2xl font-bold">Reading History</h1>

      {history.length === 0 ? (
        <p>No readings yet.</p>
      ) : (
        <div className="space-y-4">
          {history.map((reading) => (
            <div
              key={reading.id}
              className="rounded-xl border p-4"
            >
              <p className="font-medium">{reading.question}</p>

              <p className="mt-1 text-sm text-gray-500">
                {new Date(reading.createdAt).toLocaleString()}
              </p>

              <p className="mt-3 text-sm">
                {reading.content.keyInsight}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}