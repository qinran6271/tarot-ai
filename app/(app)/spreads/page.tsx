"use client";

import { useRouter } from "next/navigation";
import { tarotSpreads } from "@/lib/spreads";
import { useTarotStore } from "@/store/tarotStore";
import { useEffect } from "react";
import { ChevronLeft, ChevronRight, Heart, Scale, Sparkles } from "lucide-react";

export default function SpreadsPage() {
  const router = useRouter();

  const question = useTarotStore((state) => state.question);
  const setSelectedSpread = useTarotStore((state) => state.setSelectedSpread);

  function handleSelectSpread(spread: (typeof tarotSpreads)[number]) {
    setSelectedSpread(spread);
    router.push("/cards");
  }

  function getSpreadIcon(index: number) {
    if (index === 0) return <Sparkles size={18} />;
    if (index === 1) return <Heart size={18} />;
    return <Scale size={18} />;
  }

  useEffect(() => {
    if (!question.trim()) {
      router.replace("/question");
    }
  }, [question, router]);

  return (
    <main className="flex min-h-screen justify-center bg-gray-100">
      <div className="min-h-screen w-full max-w-[520px] bg-white px-6 py-8">
        
      <header className="flex items-center">
        <button
          type="button"
          onClick={() => router.back()}
          className="-ml-2 cursor-pointer p-1 text-gray-500 transition hover:text-black active:scale-95"
          aria-label="Back"
        >
          <ChevronLeft size={24} strokeWidth={2.3} />
        </button>
      </header>

      <section className="mt-12">
        <p className="text-sm text-gray-500">
          ✨ WALAWALA
        </p>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-900">
          Choose your reading
        </h1>

        <p className="mt-8 text-lg font-medium text-gray-900">
          {question}
        </p>

      </section>

        <section className="mt-10">
          
          <p className="mt-3 text-sm leading-relaxed text-gray-500">
            Each spread offers a different way to understand your question.
          </p>

          <div className="mt-7 flex flex-col gap-4">
            {tarotSpreads.map((spread, index) => (
              <button
                key={spread.id}
                type="button"
                onClick={() => handleSelectSpread(spread)}
                className="group cursor-pointer rounded-[28px] border border-gray-200 bg-white px-5 py-5 text-left transition duration-150 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-sm active:scale-[0.99]"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-800 transition group-hover:bg-black group-hover:text-white">
                    {getSpreadIcon(index)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-base font-semibold leading-snug text-gray-900">
                        {spread.name}
                      </h3>

                      <div className="flex shrink-0 items-center gap-1 text-sm text-gray-400">
                        <span>{spread.cardCount} cards</span>
                        <ChevronRight
                          size={16}
                          className="transition group-hover:translate-x-0.5"
                        />
                      </div>
                    </div>

                    <p className="mt-2 text-sm leading-relaxed text-gray-500">
                      {spread.description}
                    </p>

                    {index === 0 ? (
                      <p className="mt-4 inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
                        Recommended
                      </p>
                    ) : null}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}