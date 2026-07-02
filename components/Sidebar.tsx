"use client";

import Link from "next/link";
import { useState } from "react";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="cursor-pointer fixed left-5 top-5 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl shadow-sm"
            
      >
        ☰
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 z-50 h-full w-72
          rounded-r-[15px] bg-white px-6 py-7 shadow-2xl
          transition-transform duration-300 ease-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex h-full flex-col">
          <div className="mb-10 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-gray-400">
                WALAWALA
              </p>
              <h2 className="mt-2 text-xl font-semibold text-gray-900">
                Tarot
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="cursor-pointer flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-500"
            >
              ×
            </button>
          </div>

          <nav className="space-y-2 text-sm font-medium text-gray-700">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="block rounded-2xl px-4 py-3 hover:bg-gray-100"
            >
              ✨ Daily Card
            </Link>

            <Link
              href="/question"
              onClick={() => setIsOpen(false)}
              className="block rounded-2xl px-4 py-3 hover:bg-gray-100"
            >
              🃏 New Reading
            </Link>

            <Link
              href="/history"
              onClick={() => setIsOpen(false)}
              className="block rounded-2xl px-4 py-3 hover:bg-gray-100"
            >
              📜 Reading History
            </Link>
          </nav>

          <div className="mt-10 border-t border-gray-100 pt-6">
            <p className="mb-3 text-xs uppercase tracking-[0.2em] text-gray-400">
              Coming Soon
            </p>

            <div className="space-y-2 text-sm text-gray-400">
              <p className="rounded-2xl px-4 py-3">♡ Favorites</p>
              <p className="rounded-2xl px-4 py-3">⚙ Settings</p>
            </div>
          </div>

          <p className="mt-auto text-xs leading-relaxed text-gray-400">
            Your readings are saved locally on this device.
          </p>
        </div>
      </aside>
    </>
  );
}