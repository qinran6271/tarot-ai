"use client";

import { useEffect, useRef, useState } from "react";

const REMINDER_STORAGE_KEY = "tarot-skip-guest-reading-reminder";

export function shouldSkipGuestJourneyPrompt() {
  return localStorage.getItem(REMINDER_STORAGE_KEY) === "true";
}

export default function GuestJourneyPrompt({
  open,
  onClose,
  onContinueAsGuest,
  onSignIn,
}: {
  open: boolean;
  onClose: () => void;
  onContinueAsGuest: () => void;
  onSignIn: () => void;
}) {
  const [doNotRemind, setDoNotRemind] = useState(false);
  const signInButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    signInButtonRef.current?.focus();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose, open]);

  if (!open) return null;

  function continueAsGuest() {
    if (doNotRemind) {
      localStorage.setItem(REMINDER_STORAGE_KEY, "true");
    }
    onContinueAsGuest();
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30 px-5 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="guest-journey-title"
        className="w-full max-w-sm rounded-[28px] bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-gray-400">
              Before you begin
            </p>
            <h2
              id="guest-journey-title"
              className="mt-2 text-xl font-semibold text-gray-900"
            >
              Keep your readings safe
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-lg text-gray-500 hover:bg-gray-200"
          >
            ×
          </button>
        </div>

        <p className="mt-4 text-sm leading-6 text-gray-600">
          Sign in to save your readings and access them across devices. Guest
          readings stay only on this device and may be lost if browser data is
          cleared.
        </p>

        <div className="mt-6 space-y-3">
          <button
            ref={signInButtonRef}
            type="button"
            onClick={onSignIn}
            className="flex h-11 w-full items-center justify-center rounded-full border border-black bg-transparent text-sm font-medium text-gray-900 transition-colors hover:bg-black hover:text-white"
          >
            Sign in to continue
          </button>
          <button
            type="button"
            onClick={continueAsGuest}
            className="mx-auto flex h-7 items-center justify-center px-3 text-xs text-gray-500 transition-colors hover:text-gray-800"
          >
            Continue as guest
          </button>
        </div>

        <label className="mt-5 flex cursor-pointer items-center gap-3 text-xs text-gray-500">
          <input
            type="checkbox"
            checked={doNotRemind}
            onChange={(event) => setDoNotRemind(event.target.checked)}
            className="h-4 w-4 rounded border-gray-300 accent-gray-900"
          />
          Don&apos;t remind me again on this device
        </label>
      </section>
    </div>
  );
}
