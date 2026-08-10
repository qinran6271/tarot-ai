"use client";

import { Heart } from "lucide-react";

type ReadingHeaderProps = {
  subtitle?: string;
  favorited: boolean;
  favoriteDisabled?: boolean;
  onExit: () => void;
  onFavoriteToggle: () => void;
};

export default function ReadingHeader({
  subtitle,
  favorited,
  favoriteDisabled = false,
  onExit,
  onFavoriteToggle,
}: ReadingHeaderProps) {
  return (
    <header className="shrink-0 border-b border-gray-100 bg-white px-5 py-4">
      <div className="flex items-center justify-between">
        <div className="group relative w-10">
          <button
            type="button"
            onClick={onExit}
            aria-describedby="reading-close-hint"
            className="cursor-pointer text-sm text-gray-500 transition hover:text-black active:scale-95"
          >
            Close
          </button>
          <span
            id="reading-close-hint"
            role="tooltip"
            className="pointer-events-none absolute left-0 top-8 z-20 w-56 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs leading-relaxed text-gray-500 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
          >
            You can continue this conversation anytime from Readings.
          </span>
        </div>

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
          onClick={onFavoriteToggle}
          disabled={favoriteDisabled}
          aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
          aria-pressed={favorited}
          className={`flex h-8 w-10 items-center justify-end transition-colors active:scale-95 disabled:cursor-default disabled:opacity-40 ${
            favorited
              ? "cursor-pointer text-red-500"
              : "cursor-pointer text-gray-400 hover:text-gray-600"
          }`}
        >
          <Heart
            size={20}
            strokeWidth={1.8}
            fill={favorited ? "currentColor" : "none"}
          />
        </button>
      </div>
    </header>
  );
}
