"use client";

import Link from "next/link";
import TarotCard from "@/components/TarotCard";
import { useTarotStore } from "@/store/tarotStore";
import type { ReadingContent, Reading, ReadingMessage } from "@/types/reading";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";

export default function ReadingPage() {
  const router = useRouter();

  const question = useTarotStore((state) => state.question);
  const cards = useTarotStore((state) => state.cards);
  const selectedSpread = useTarotStore((state) => state.selectedSpread);
  const currentReading = useTarotStore((state) => state.currentReading);

  const setCurrentReading = useTarotStore((state) => state.setCurrentReading);
  const addHistory = useTarotStore((state) => state.addHistory);

  const [reading, setReading] = useState<ReadingContent | null>(
    currentReading?.content ?? null
  );
  const [conversation, setConversation] = useState<ReadingMessage[]>(
    currentReading?.conversation ?? []
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(!currentReading);
  const [error, setError] = useState<string | null>(null);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const hasFetchedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (currentReading) {
      setReading(currentReading.content);
      setConversation(currentReading.conversation);
      setLoading(false);
      return;
    }

    if (hasFetchedRef.current) return;

    if (!question.trim() || cards.length !== selectedSpread.cardCount) {
      router.replace("/question");
      return;
    }

    hasFetchedRef.current = true;

    async function getReading() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/reading", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question,
            spread: selectedSpread,
            cards,
          }),
        });

        if (!res.ok) throw new Error("Failed to generate reading.");

        const data: ReadingContent = await res.json();
        const now = new Date().toISOString();

        const newConversation: ReadingMessage[] = [
          {
            id: crypto.randomUUID(),
            role: "user",
            content: question,
            createdAt: now,
          },
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: formatInitialReading(data),
            createdAt: now,
          },
        ];

        const newReading: Reading = {
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
          focus: question,
          spread: selectedSpread,
          cards,
          content: data,
          conversation: newConversation,
          status: "active",
        };

        setReading(data);
        setConversation(newConversation);
        setCurrentReading(newReading);
        addHistory(newReading);
      } catch (err) {
        console.error(err);
        setError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    getReading();
  }, [
    currentReading,
    question,
    cards,
    selectedSpread,
    router,
    setCurrentReading,
    addHistory,
  ]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation, loading]);

  const displayQuestion = currentReading?.focus ?? question;
  const displayCards = currentReading?.cards ?? cards;
  const displayReading = currentReading?.content ?? reading;

  function handleSend(message?: string) {
    const text = (message ?? input).trim();
    if (!text) return;

    const now = new Date().toISOString();

    const userMessage: ReadingMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      createdAt: now,
    };

    const assistantMessage: ReadingMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content:
        "I’ll help you explore this further. This follow-up chat UI is ready, and the next step is connecting it to the AI chat API.",
      createdAt: now,
    };

    const nextConversation = [...conversation, userMessage, assistantMessage];

    setConversation(nextConversation);
    setInput("");

    if (currentReading) {
      setCurrentReading({
        ...currentReading,
        conversation: nextConversation,
        updatedAt: now,
      });
    }
  }

  function handleEndChat() {
    const now = new Date().toISOString();

    if (currentReading) {
      setCurrentReading({
        ...currentReading,
        status: "completed",
        updatedAt: now,
      });
    }

    router.push("/history");
  }

  return (
    <main className="flex h-screen justify-center bg-gray-100">
      <div className="relative flex h-screen w-full max-w-[520px] flex-col bg-white">
        <header className="shrink-0 border-b border-gray-100 bg-white px-5 py-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.back()}
              className="cursor-pointer flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-lg text-gray-700 transition hover:bg-gray-200"
              aria-label="Go back"
            >
              <ChevronLeft size={18} />
    
            </button>

            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">Your Reading</p>
              <p className="mt-1 max-w-[260px] truncate text-xs text-gray-400">
                {displayQuestion || "No question yet."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowEndConfirm(true)}
              className=" cursor-pointer flex h-9 items-center justify-center rounded-full bg-gray-100 px-4 text-sm text-gray-700 transition hover:bg-gray-200"
      
            >
              End
            </button>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="rounded-[28px] bg-gray-100 px-5 py-4 text-sm text-gray-500">
              ✨ Interpreting the cards...
            </div>
          ) : error ? (
            <div className="rounded-[28px] bg-red-50 px-5 py-4 text-sm text-red-500">
              {error}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {conversation.map((message, index) => (
                <div
                  key={message.id}
                  className={
                    message.role === "user"
                      ? "ml-auto max-w-[78%] rounded-[24px] bg-black px-5 py-3 text-sm leading-relaxed text-white"
                      : "mr-auto max-w-[92%] rounded-[28px] bg-gray-100 px-5 py-4 text-sm leading-relaxed text-gray-800"
                  }
                >
                  {message.role === "assistant" && index === 1 ? (
                    <div className="mb-5">
                      <p className="mb-3 text-xs uppercase tracking-wide text-gray-400">
                        Your Cards
                      </p>

                      <div className="flex justify-between gap-3">
                        {displayCards.map((card) => (
                          <div
                            key={card.id}
                            className="flex flex-1 flex-col items-center gap-2"
                          >
                            <div className="scale-[0.72]">
                              <TarotCard
                                card={card}
                                revealed={true}
                                onClick={() => {}}
                              />
                            </div>

                            <p className="-mt-4 text-center text-[10px] font-medium leading-snug text-gray-600">
                              {card.name}
                              {card.isReversed ? " Reversed" : ""}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {message.content.split("\n").map((line, lineIndex) => (
                    <p key={lineIndex} className={lineIndex === 0 ? "" : "mt-3"}>
                      {line}
                    </p>
                  ))}
                </div>
              ))}

              {displayReading?.followUps?.length ? (
                <section className="mt-2 rounded-[28px] bg-gray-100 px-5 py-5">
                  <h2 className="text-sm font-medium text-gray-900">
                    🧚‍♀️ Continue Exploring
                  </h2>

                  <div className="mt-4 flex flex-col gap-3">
                    {displayReading.followUps.map((followUp) => (
                      <button
                        key={followUp}
                        type="button"
                        onClick={() => setInput(followUp)}
                        className="rounded-full bg-white px-5 py-3 text-left text-sm text-gray-700 transition hover:bg-gray-50"
                      >
                        {followUp}
                      </button>
                    ))}
                  </div>
                </section>
              ) : null}

              <div ref={scrollRef} />
            </div>
          )}
        </section>

        <footer className="shrink-0 border-t border-gray-100 bg-white px-6 pb-6 pt-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 rounded-full bg-gray-100 px-4 py-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a follow-up..."
              className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
            />

            <button
              type="submit"
              disabled={!input.trim()}
              className="rounded-full bg-black px-4 py-2 text-xs text-white disabled:bg-gray-300"
            >
              Send
            </button>
          </form>

          <Link
            href="/question"
            className="mt-3 flex h-11 items-center justify-center rounded-full border border-black text-sm text-black"
          >
            Start New Reading
          </Link>
        </footer>

        {showEndConfirm ? (
          <div className="absolute inset-0 z-50 flex items-end bg-black/30 px-5 pb-5">
            <div className="w-full rounded-[32px] bg-white px-6 py-6 shadow-xl">
              <h2 className="text-lg font-medium text-gray-900">End chat?</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                This reading will be saved to your history. You can still review
                it later.
              </p>

              <div className="mt-6 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleEndChat}
                  className="h-12 rounded-full bg-black text-sm text-white"
                >
                  End Chat
                </button>

                <button
                  type="button"
                  onClick={() => setShowEndConfirm(false)}
                  className="h-12 rounded-full border border-gray-300 text-sm text-gray-900"
                >
                  Continue Reading
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}

function formatInitialReading(data: ReadingContent) {
  return [
    `✨ Key Insight\n${data.keyInsight}`,
    `📖 Interpretation\n${data.interpretation}`,
    `💡 Advice\n${data.advice}`,
  ].join("\n\n");
}