import { ChevronLeft } from "lucide-react";

type ReadingHeaderProps = {
  subtitle?: string;
  onBack: () => void;
  onEnd: () => void;
};

export default function ReadingHeader({
  subtitle,
  onBack,
  onEnd,
}: ReadingHeaderProps) {
  return (
    <header className="shrink-0 border-b border-gray-100 bg-white px-5 py-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="-ml-2 cursor-pointer p-1 text-gray-500 transition hover:text-black active:scale-95"
          aria-label="Back"
        >
          <ChevronLeft size={24} strokeWidth={2.3} />
        </button>

        <div className="min-w-0 text-center">
          <p className="text-sm font-medium text-gray-900">Your Reading</p>

          {subtitle ? (
            <p className="mt-1 max-w-[260px] truncate text-xs text-gray-400">
              {subtitle}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onEnd}
          className="cursor-pointer text-sm text-gray-500 transition hover:text-black active:scale-95"
        >
          End
        </button>
      </div>
    </header>
  );
}