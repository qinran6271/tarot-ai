"use client";

import { useState } from "react";
import { drawThreeCards, type TarotCardData } from "@/lib/tarot";
import { useRouter } from "next/navigation";
import TarotCard from "@/components/TarotCard";
import { useTarotStore } from "@/store/tarotStore";
import { DrawnCard } from "@/types/tarot";

export default function CardsPage() {
    const router = useRouter();
    const [selectedCards, setSelectedCards] = useState<DrawnCard[]>([]);
    const [revealedCardIds, setRevealedCardIds] = useState<string[]>([]);
    const question = useTarotStore((state) => state.question);
    const setCards = useTarotStore((state) => state.setCards);




    function handleDrawCards() {
    const cards = drawThreeCards().map((card) => ({
        ...card,
        isReversed: Math.random() < 0.5,
    }));

    setSelectedCards(cards);
    setRevealedCardIds([]);
    }

  function handleRevealCard(cardId: string) {
    setRevealedCardIds((prev) => {
      if (prev.includes(cardId)) {
        return prev;
      }

      return [...prev, cardId];
    });
  }

  function handleContinue() {
  setCards(selectedCards);
  router.push("/reading");
}

  const allCardsRevealed =
    selectedCards.length === 3 && revealedCardIds.length === 3;

  return (
    <main className="min-h-screen bg-gray-100 flex justify-center">
      <div className="relative w-full max-w-[390px] min-h-screen bg-white px-6 py-10">
        <div className="mt-10 flex justify-end">
          <div className="max-w-[220px] rounded-full bg-black px-6 py-2 text-sm text-white">
            {question || "No question yet."}
          </div>
        </div>

        <section className="mt-16 text-center">
          <p className="text-sm font-medium text-gray-900">🔮 Tarot AI</p>

          <button
            onClick={handleDrawCards}
            className="mt-6 rounded-xl bg-purple-600 px-6 py-3 font-medium text-white hover:bg-purple-700"
          >
            Draw 3 Cards
          </button>

          <p className="mt-3 text-sm leading-relaxed text-gray-500">
            Keep your question in mind.
            <br />
            Tap the cards when you are ready.
          </p>
        </section>

        <section className="mt-14 flex justify-center gap-6">
          {selectedCards.map((card) => (
            <TarotCard
              key={card.id}
              card={card}
              revealed={revealedCardIds.includes(card.id)}
              onClick={() => handleRevealCard(card.id)}
            />
          ))}
        </section>

        {allCardsRevealed && (
          <div className="absolute bottom-8 left-1/2 w-[85%] -translate-x-1/2">
            <button
              onClick={handleContinue}
              className="flex h-12 w-full items-center justify-center rounded-full bg-black text-sm text-white transition hover:bg-gray-800"
            >
              Continue →
            </button>
          </div>
        )}
      </div>
    </main>
  );
}