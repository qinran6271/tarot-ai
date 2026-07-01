"use client";
import Link from "next/link";
import TarotCard from "@/components/TarotCard";
import { useEffect, useState } from "react";
import { useTarotStore } from "@/store/tarotStore";
import type { Reading } from "@/types/reading";
import { useRouter } from "next/navigation";
import tarotKnowledge from "@/data/tarotKnowledge.json";



export default function ReadingPage() {
  const router = useRouter();
  const question = useTarotStore((state) => state.question);
  const cards = useTarotStore((state) => state.cards);
  const selectedSpread = useTarotStore(
  (state) => state.selectedSpread
  );

  // Ai 返回结果
  const [reading, setReading] = useState<Reading | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  // Redirect to question page if question or cards are missing
  useEffect(() => {
    if (!question.trim() || cards.length !== selectedSpread.cardCount) {
      router.replace("/question");
    }
  }, [question, cards.length, router]);


  // Fetch reading from API when question and cards are available
  useEffect(() => {
    if (!question.trim() || cards.length !== selectedSpread.cardCount) {
      return;
    }

    async function getReading() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/reading", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question,
            spread: selectedSpread,
            cards,
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to generate reading.");
        }

        const data = await res.json();

        console.log("API returned:", data);

        setReading(data);
      } catch (err) {
        console.error(err);
        setError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    getReading();
  }, [question, cards, selectedSpread]);



  return (
    <main className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-[520px] min-h-screen bg-white px-6 py-10">
        <div className="flex justify-end">
          <div className="max-w-[220px] rounded-full bg-black px-6 py-2 text-sm text-white">
            {question || "No question yet."}
          </div>
        </div>

        <section className="mt-10">
          <p className="text-sm font-medium text-gray-900">🔮 Tarot AI</p>
          <h1 className="mt-3 text-2xl font-medium text-gray-900">
            Your Reading
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Here is what your cards suggest.
          </p>
        </section>

        <section className="mt-8">
          <div className="flex justify-between gap-3">
            {cards.map((card, index) => (
              <div key={card.id} className="flex flex-col items-center gap-2">
                {/* <p className="text-xs text-gray-400">
                  {["Past", "Present", "Future"][index]}
                </p> */}

                <TarotCard
                  card={card}
                  revealed={true}
                  onClick={() => {}}
                />

                <p className="text-center text-xs font-medium text-gray-800">
                  {card.name}
                </p>
              </div>
            ))}
          </div>
        </section>

          {loading ? (
            <div className="mt-8 text-center text-gray-500">
              ✨ Interpreting the cards...
            </div>
          ) : error ? (
            <div className="mt-8 text-center text-red-500">
              {error}
            </div>
          ) : reading ? (
            <>
              <section className="mt-8 rounded-[32px] bg-gray-100 px-6 py-6">
                <h2 className="text-sm font-medium text-gray-900">✨ Key Insight</h2>
                <p className="mt-3 text-sm leading-relaxed text-gray-700">
                  {reading.keyInsight}
                </p>
              </section>

              <section className="mt-5 rounded-[32px] bg-gray-100 px-6 py-6">
                <h2 className="text-sm font-medium text-gray-900">
                  📖 Interpretation
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-gray-700">
                  {reading.interpretation}
                </p>
              </section>

              <section className="mt-5 rounded-[32px] bg-gray-100 px-6 py-6">
                <h2 className="text-sm font-medium text-gray-900">💡 Advice</h2>
                <p className="mt-3 text-sm leading-relaxed text-gray-700">
                  {reading.advice}
                </p>
              </section>

              <section className="mt-5 rounded-[32px] bg-gray-100 px-6 py-6">
                <h2 className="text-sm font-medium text-gray-900">
                  🔮 Continue Exploring
                </h2>

                <div className="mt-4 flex flex-col gap-3">
                  {(reading.followUps ?? []).map((question) => (
                    <Link
                      key={question}
                      href="/question"
                      className="rounded-full bg-white px-5 py-3 text-left text-sm text-gray-700 transition hover:bg-gray-50"
                    >
                      {question}
                    </Link>
                  ))}

                </div>
              </section>
            </>
          ) : null}

        <div className="mt-8 flex flex-col gap-3 pb-8">
          <button className="h-12 rounded-full bg-black text-sm text-white">
            Save Reading
          </button>

          <Link
            href="/question"
            className="flex h-12 items-center justify-center rounded-full border border-black text-sm text-black"
          >
            Start New Reading
          </Link>
        </div>
      </div>
    </main>
  );
}