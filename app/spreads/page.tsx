"use client";

import { useRouter } from "next/navigation";
import { tarotSpreads } from "@/lib/spreads";
import { useTarotStore } from "@/store/tarotStore";

export default function SpreadsPage() {
  const router = useRouter();

  const question = useTarotStore((state) => state.question);
  const setSelectedSpread = useTarotStore(
    (state) => state.setSelectedSpread
  );

  function handleSelectSpread(spread: (typeof tarotSpreads)[number]) {
    setSelectedSpread(spread);
    router.push("/cards");
  }

  return (
    <main className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-[390px] min-h-screen bg-white px-6 py-10">
        <section className="mt-10">
          <p className="text-sm font-medium text-gray-500">Your question</p>
          <h1 className="mt-2 text-xl font-semibold text-gray-900">
            {question || "No question yet."}
          </h1>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold text-gray-900">
            Choose a spread
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Select how you want the cards to guide your reading.
          </p>

          <div className="mt-6 flex flex-col gap-4">
            {tarotSpreads.map((spread) => (
              <button
                key={spread.id}
                onClick={() => handleSelectSpread(spread)}
                className="rounded-2xl border border-gray-200 p-5 text-left transition hover:border-purple-500 hover:bg-purple-50"
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-semibold text-gray-900">
                    {spread.name}
                  </h3>
                  <span className="text-sm text-gray-500">
                    {spread.cardCount} cards
                  </span>
                </div>

                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  {spread.description}
                </p>
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}