import Link from "next/link";

export default function QuestionPage() {
  return (
    <main className="min-h-screen bg-gray-100 flex justify-center">
      <div className="relative w-full max-w-[390px] min-h-screen bg-white px-6 py-10">
        {/* User message */}
        <div className="mt-10 flex justify-end">
          <div className="max-w-[220px] rounded-full bg-black px-6 py-2 text-sm text-white">
            我的工作
          </div>
        </div>

        {/* AI message */}
        <div className="mt-20 flex justify-start">
          <div className="max-w-[280px] rounded-[32px] bg-gray-100 px-6 py-5 text-sm leading-relaxed text-gray-700">
            <p className="mb-2 font-medium text-gray-900">🔮 Tarot AI</p>
            <p>I understand.</p>
            <p className="mt-2">
              Focus on this question. When you're ready, choose three cards.
            </p>
          </div>
        </div>

        {/* Continue button */}
        <div className="absolute bottom-8 left-1/2 w-[85%] -translate-x-1/2">
          <Link
            href="/cards"
            className="flex h-12 w-full items-center justify-center rounded-full bg-black text-sm text-white transition hover:bg-gray-800"
          >
            Continue →
          </Link>
        </div>
      </div>
    </main>
  );
}