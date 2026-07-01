"use client";

import { useRouter } from "next/navigation";
import { drawThreeCards } from "@/lib/tarot";
import Link from "next/link";
import TarotCard from "@/components/TarotCard";


const spreadCards = [
  {
    id: 1,
    position: "Past",
  },
  {
    id: 2,
    position: "Present",
  },
  {
    id: 3,
    position: "Future",
  },
];

export default function CardsPage() {
  return (
    <main className="min-h-screen bg-gray-100 flex justify-center">
      <div className="relative w-full max-w-[390px] min-h-screen bg-white px-6 py-10">
        <div className="mt-10 flex justify-end">
          <div className="max-w-[220px] rounded-full bg-black px-6 py-2 text-sm text-white">
            我的工作
          </div>
        </div>

        <section className="mt-16 text-center">
          <p className="text-sm font-medium text-gray-900">🔮 Tarot AI</p>

          <h1 className="mt-4 text-xl font-medium text-gray-900">
            Choose three cards
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-gray-500">
            Keep your question in mind.
            <br />
            Tap the cards when you are ready.
          </p>
        </section>

        <section className="mt-14 flex flex-col items-center gap-6">
          <TarotCard position={spreadCards[0].position} />

          <div className="flex gap-10">
            {spreadCards.slice(1).map((card) => (
              <TarotCard key={card.id} position={card.position} />
            ))}
          </div>
        </section>

        <div className="absolute bottom-8 left-1/2 w-[85%] -translate-x-1/2">
          <Link
            href="/reading"
            className="flex h-12 w-full items-center justify-center rounded-full bg-black text-sm text-white transition hover:bg-gray-800"
          >
            Continue →
          </Link>
        </div>
      </div>
    </main>
  );
}