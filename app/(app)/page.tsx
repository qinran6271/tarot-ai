"use client";
import { useEffect, useState, useRef } from "react";
import {
  DailyReading,
  getDailyReading,
  isTodayReading,
} from "@/lib/dailyReading";
import TarotCard from "@/components/TarotCard";
import { drawCards } from "@/lib/tarot";
import Link from "next/link";
import { saveDailyReading } from "@/lib/dailyReading";


// Load today's saved reading from localStorage when the page first loads.
// If a reading exists and was created today, display it on the homepage.
export default function Home() {
  const [reading, setReading] = useState<DailyReading | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const isDrawingRef = useRef(false);

  useEffect(() => {
  const saved = getDailyReading();

  if (saved && isTodayReading(saved)) {
    setReading(saved);
  }
  }, []);

  

  async function drawTodayCard() {
    console.log("drawTodayCard called");
    if (isDrawingRef.current || isGenerating || reading) return;

    isDrawingRef.current = true;
    setIsGenerating(true);

    const baseCard = drawCards(1)[0];

    const card = {
      ...baseCard,
      isReversed: Math.random() < 0.5,
    };

    const tempReading = {
      date: new Date().toDateString(),
      card,
      keyInsight: "",
      interpretation: "",
      advice: "",
    };

    // 先立刻显示卡
    setReading(tempReading);
    saveDailyReading(tempReading);

    try {
      const response = await fetch("/api/reading", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: "今天我需要注意什么？请给我一张今日塔罗指引。",
          spread: "Daily Card",
          cards: [
            {
              ...card,
              position: "Today",
            },
          ],
        }),
      });

      const data = await response.json();

      const dailyReading = {
        ...tempReading,
        keyInsight: data.keyInsight,
        interpretation: data.interpretation,
        advice: data.advice,
      };

      setReading(dailyReading);
      saveDailyReading(dailyReading);
    } catch (error) {
      console.error(error);

      const failedReading = {
        ...tempReading,
        keyInsight: "Something went wrong.",
        interpretation: "The reading could not be generated right now.",
        advice: "Please try again in a moment.",
      };

      setReading(failedReading);
    } finally {
      setIsGenerating(false);
      isDrawingRef.current = false;
    }
  }

  function resetDailyReadingForTest() {
    localStorage.removeItem("dailyReading");
    setReading(null);
  }

  return (
  <main className="min-h-screen bg-gray-100 flex justify-center">
  <div className="w-full max-w-[520px] min-h-screen bg-white flex flex-col items-center px-8 py-10">
    <div className="mt-12">
          <p className="text-sm text-gray-500">✨ WALAWALA</p>
    </div>

    <h1 className="text-xl font-medium mt-4">
      Today's Card
    </h1>

    <div className="mt-10 flex flex-col items-center">

{reading ? (
  <>
    <TarotCard
      card={reading.card}
      revealed={true}
      size="large"
    />

    <h2 className="mt-6 text-lg font-medium">
      {reading.card.name}
      {reading.card.isReversed ? " (Reversed)" : ""}
    </h2>

    <p className="mt-6 text-gray-700">
      {reading.keyInsight || "Receive Today's Message.."}
    </p>

    {reading.keyInsight && (
      <button
        onClick={() => setShowMore(!showMore)}
        className="mt-4 text-sm font-medium text-gray-500 underline"
      >
        {showMore ? "⌃"  : "Reveal the Full Reading"}
      </button>
    )}

    {showMore && (
      <div className="mt-4 space-y-3 text-sm text-gray-600">
        <p>
          {reading.interpretation}
        </p>

        <p>
          {reading.advice}
        </p>
      </div>
    )}
  </>
  ) : (
      <>
    <TarotCard
      revealed={false}
      onClick={drawTodayCard}
      disabled={isGenerating}
      size="large"
    />

    <p className="mt-6 text-gray-500">
      Tap the card to reveal today's guidance.
    </p>
  </>
)}

<button
  onClick={resetDailyReadingForTest}
  className="mt-6 text-sm text-gray-400 underline"
>
  Reset today reading
</button>

        </div>

        <Link
          href="/question"
          className="
            mt-auto
            mb-10
            px-10
            py-3
            border
            border-black
            rounded-full
            hover:bg-black
            hover:text-white
            transition
          "
        >
          开始旅程
        </Link>

      </div>
    </main>
  );
}