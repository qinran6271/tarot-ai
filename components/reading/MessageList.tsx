import TarotCard from "@/components/TarotCard";
import type { ReadingContent, ReadingMessage } from "@/types/reading";
import type { DrawnCard } from "@/types/tarot";
import type { RefObject } from "react";

type MessageListProps = {
  loading: boolean; //第一次回答 loading
  chatLoading: boolean; // followup 回答loading
  error: string | null;
  conversation: ReadingMessage[];
  cards: DrawnCard[];
  reading: ReadingContent | null;
  scrollRef: RefObject<HTMLDivElement | null>;
  onSelectFollowUp: (question: string) => void;
};

export default function MessageList({
  loading,
  chatLoading,
  error,
  conversation,
  cards,
  reading,
  scrollRef,
  onSelectFollowUp,
}: MessageListProps) {
  return (
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
                    {cards.map((card) => (
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

          {chatLoading ? (
            <div className="mr-auto max-w-[92%] rounded-[28px] bg-gray-100 px-5 py-4 text-sm text-gray-500">
                ✨ Thinking...
            </div>
            ) : null}

          {reading?.followUps?.length ? (
            <section className="mt-2 rounded-[28px] bg-gray-100 px-5 py-5">
              <h2 className="text-sm font-medium text-gray-900">
                🧚‍♀️ Continue Exploring
              </h2>

              <div className="mt-4 flex flex-col gap-3">
                {reading.followUps.map((followUp) => (
                  <button
                    key={followUp}
                    type="button"
                    onClick={() => onSelectFollowUp(followUp)}
                    className="cursor-pointer rounded-full bg-white px-5 py-3 text-left text-sm text-gray-700 transition hover:bg-gray-50 active:scale-[0.99]"
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
  );
}