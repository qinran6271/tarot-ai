"use client";
import { useEffect, useState, useRef } from "react";
import {
  DailyReading,
  getDailyReading,
  isTodayReading,
  saveDailyReading,
  clearDailyReading
} from "@/lib/dailyReading";
import TarotCard from "@/components/TarotCard";
import { drawCards } from "@/lib/tarot";
import GuestJourneyPrompt, {
  shouldSkipGuestJourneyPrompt,
} from "@/components/reading/GuestJourneyPrompt";
import { authClient } from "@/lib/auth/client";
import { dailyCardSpread } from "@/lib/spreads";
import { readGuestReadings } from "@/lib/readings/guest";
import type { Reading, ReadingContent, ReadingMessage } from "@/types/reading";

import { useRouter } from "next/navigation";
import { useTarotStore } from "@/store/tarotStore";

function timeBasedGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}



// Load today's saved reading from localStorage when the page first loads.
// If a reading exists and was created today, display it on the homepage.
export default function Home() {
  const [reading, setReading] = useState<DailyReading | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);

  const isDrawingRef = useRef(false);
  const hasMigratedGuestDailyRef = useRef(false);
  const router = useRouter();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const userId = session?.user?.id;
  const setCurrentReading = useTarotStore((state) => state.setCurrentReading);
  const createReading = useTarotStore((state) => state.createReading);
  const removeHistory = useTarotStore((state) => state.removeHistory);
  const history = useTarotStore((state) => state.history);
  const storageReady = useTarotStore((state) => state.storageReady);
  const [dailyReadingId, setDailyReadingId] = useState<string | null>(null);

  function beginJourney() {
    setCurrentReading(null);
    router.push("/question");
  }

  function handleStartJourney() {
    if (sessionPending) return;

    if (session?.user || shouldSkipGuestJourneyPrompt()) {
      beginJourney();
      return;
    }

    setShowGuestPrompt(true);
  }

  useEffect(() => {
    if (sessionPending || !storageReady) return;

    const todayDailyReadings = history.filter(
      (item) =>
        item.spread.id === dailyCardSpread.id &&
        new Date(item.createdAt).toDateString() === new Date().toDateString(),
    );
    const guestReadingIds = userId
      ? new Set(readGuestReadings().map((item) => item.id))
      : null;
    const savedReading =
      todayDailyReadings.find(
        (item) => !guestReadingIds?.has(item.id),
      ) ?? todayDailyReadings[0];

    if (savedReading?.cards[0]) {
      queueMicrotask(() => {
        setDailyReadingId(savedReading.id);
        setReading({
          date: new Date(savedReading.createdAt).toDateString(),
          card: savedReading.cards[0],
          keyInsight: savedReading.content.keyInsight,
          interpretation: savedReading.content.interpretation,
          advice: savedReading.content.advice,
        });
      });
      return;
    }

    if (!userId) {
      const saved = getDailyReading();
      if (saved && isTodayReading(saved)) {
        const readingId = saved.readingId ?? crypto.randomUUID();
        queueMicrotask(() => {
          setDailyReadingId(readingId);
          setReading({ ...saved, readingId });

          if (!saved.readingId) {
            saveDailyReading({ ...saved, readingId });
          }

          if (
            saved.keyInsight &&
            !hasMigratedGuestDailyRef.current
          ) {
            hasMigratedGuestDailyRef.current = true;
            createReading(
              buildDailyReadingRecord({ ...saved, readingId }, readingId),
            );
          }
        });
        return;
      }
    }

    queueMicrotask(() => {
      setDailyReadingId(null);
      setReading(null);
    });
  }, [createReading, history, sessionPending, storageReady, userId]);

  

  async function drawTodayCard() {
    console.log("drawTodayCard called");
    if (isDrawingRef.current || isGenerating || reading) return;

    isDrawingRef.current = true;
    setIsGenerating(true);

    const baseCard = drawCards(1)[0];
    const readingId = crypto.randomUUID();

    const card = {
      ...baseCard,
      isReversed: Math.random() < 0.5,
      source: "daily" as const,
    };

    const tempReading = {
      readingId,
      date: new Date().toDateString(),
      card,
      keyInsight: "",
      interpretation: "",
      advice: "",
    };

    // 先立刻显示卡
    setReading(tempReading);
    if (!userId) saveDailyReading(tempReading);

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

      const data = (await response.json()) as ReadingContent;

      const dailyReading = {
        ...tempReading,
        keyInsight: data.keyInsight,
        interpretation: data.interpretation,
        advice: data.advice,
      };

      setReading(dailyReading);
      if (!userId) saveDailyReading(dailyReading);

      const now = new Date().toISOString();
      const persistedReading = buildDailyReadingRecord(
        dailyReading,
        readingId,
        now,
      );

      setDailyReadingId(readingId);
      createReading(persistedReading);
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
    clearDailyReading();
    if (dailyReadingId) removeHistory(dailyReadingId);
    setDailyReadingId(null);
    setReading(null);
  }

  const displayName = session?.user?.name?.trim();
  const greeting = displayName
    ? reading
      ? `Welcome back, ${displayName} ✨`
      : `${timeBasedGreeting()}, ${displayName} ✨`
    : "Welcome to WALAWALA ✨";
  const greetingMessage = displayName
    ? reading
      ? `Your card for today is ${reading.card.name}.`
      : "Your daily guidance is waiting."
    : reading
      ? `Your card for today is ${reading.card.name}.`
      : "Take a quiet moment for yourself.";

  return (
  <main className="min-h-screen bg-gray-100 flex justify-center">
  <div className="w-full max-w-[520px] min-h-screen bg-white flex flex-col items-center px-8 py-10">
    <div className="mt-12 w-full text-center">
      <p className="text-sm text-gray-500">WALAWALA</p>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-gray-900">
        {greeting}
      </h1>
      <p className="mt-2 text-sm text-gray-500">{greetingMessage}</p>
    </div>

    <h2 className="mt-10 text-xl font-medium">
      Today&apos;s Card
    </h2>

    <div className="mt-8 flex flex-col items-center">

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
      disabled={isGenerating || sessionPending || !storageReady}
      size="large"
    />

    <p className="mt-6 text-gray-500">
      Tap the card to reveal today&apos;s guidance.
    </p>
  </>
)}

{process.env.NODE_ENV === "development" ? (
  <button
    onClick={resetDailyReadingForTest}
    className="mt-6 text-sm text-gray-400 underline"
  >
    Reset today reading
  </button>
) : null}

        </div>

        <button
          type="button"
          onClick={handleStartJourney}
          disabled={sessionPending}
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
            cursor-pointer
            disabled:cursor-wait
            disabled:opacity-50
          "
        >
          Start Your Journey
        </button>

        <GuestJourneyPrompt
          open={showGuestPrompt}
          onClose={() => setShowGuestPrompt(false)}
          onContinueAsGuest={() => {
            setShowGuestPrompt(false);
            beginJourney();
          }}
          onSignIn={() => router.push("/auth/sign-in")}
        />

      </div>
    </main>
  );
}

function buildDailyReadingRecord(
  dailyReading: DailyReading,
  readingId: string,
  createdAt = new Date().toISOString(),
): Reading {
  const content: ReadingContent = {
    keyInsight: dailyReading.keyInsight,
    interpretation: dailyReading.interpretation,
    advice: dailyReading.advice,
    followUps: [],
  };
  const conversation: ReadingMessage[] = [
    {
      id: crypto.randomUUID(),
      role: "user",
      kind: "question",
      content: "What guidance do I need today?",
      createdAt,
    },
    {
      id: crypto.randomUUID(),
      role: "assistant",
      kind: "initial-reading",
      content: [
        `✨ Key Insight\n${content.keyInsight}`,
        `📖 Interpretation\n${content.interpretation}`,
        `💡 Advice\n${content.advice}`,
      ].join("\n\n"),
      createdAt,
    },
  ];

  return {
    id: readingId,
    createdAt,
    updatedAt: createdAt,
    focus: "What guidance do I need today?",
    spread: dailyCardSpread,
    cards: [{ ...dailyReading.card, position: "Today" }],
    content,
    conversation,
  };
}
