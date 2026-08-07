"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTarotStore } from "@/store/tarotStore";
import PageHeader from "@/components/PageHeader";

const STARTING_QUESTIONS = [
  {
    label: "Career",
    icon: "💼",
    question: "What should I focus on in my career right now?",
  },
  {
    label: "Relationships",
    icon: "❤️",
    question: "What do I need to understand about my relationships right now?",
  },
  {
    label: "Home",
    icon: "🏡",
    question: "What energy is surrounding my home life right now?",
  },
  {
    label: "Energy",
    icon: "🌙",
    question: "What is influencing my energy right now?",
  },
];

export default function QuestionPage() {
    const [question, setQuestion] = useState("");
    const questionInputRef = useRef<HTMLTextAreaElement>(null);
    const setCurrentReading = useTarotStore(
    (state) => state.setCurrentReading
  );

    // Zustand store to manage the global question state
    const setGlobalQuestion = useTarotStore(
    (state) => state.setQuestion
    );

    const router = useRouter();
    const handleContinue = () => {
      if (!question.trim()) {
        return;
      }

      setCurrentReading(null);
      setGlobalQuestion(question);
      router.push("/spreads");
    };  

    const isQuestionValid = question.trim().length > 0;

    const handleStartingQuestion = (startingQuestion: string) => {
      setQuestion(startingQuestion);
      questionInputRef.current?.focus();
    };

  return (
    <main className="min-h-screen bg-gray-100 flex justify-center">
      <div className="relative w-full max-w-[520px] min-h-screen bg-white px-6 py-10">
        <PageHeader
          onBack={() => router.back()}
        />
        <div className="mt-12">
          <p className="text-sm text-gray-500">✨ WALAWALA</p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-900">
            Set your focus
          </h1>

          <div className="mt-3 text-sm leading-relaxed text-gray-500">
            <p>Take a deep breath.</p>
            <p>Focus on one intention.</p>
            <p>Let&apos;s explore it together.</p>
          </div>
        </div>
        <div className="mt-8">



    <div className="absolute bottom-8 left-1/2 w-[85%] -translate-x-1/2">
        <p className="mb-3 text-xs uppercase tracking-wide text-gray-400">
            Need a starting point?
        </p>

        <div className="space-y-1 text-sm text-gray-400">
          {STARTING_QUESTIONS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => handleStartingQuestion(item.question)}
              className="block w-full rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400"
            >
              <span aria-hidden="true">{item.icon}</span> {item.label}
            </button>
          ))}
        </div>
    


        <div className="mt-6">
          <textarea
            ref={questionInputRef}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            maxLength={300}
            placeholder="For example: Will England win the championship?"
            className="h-20 w-full resize-none rounded-3xl border border-gray-200 bg-gray-50 px-5 py-4 text-base text-gray-900 outline-none transition focus:border-gray-400 focus:bg-white"
          />
            <div className="mt-2 text-right text-xs text-gray-400">
            {question.length}/300
            </div>
        </div>



       
            <button
            onClick={handleContinue}
            disabled={!isQuestionValid}
            className={`cursor-pointer flex h-12 w-full items-center justify-center rounded-full text-sm text-white transition ${
                isQuestionValid
                ? "bg-black hover:bg-gray-800"
                : "cursor-not-allowed bg-gray-300"
            }`}
            >
            Continue
            </button>
        </div>
        </div>
      </div>
    </main>
  );
}
