"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import { authClient } from "@/lib/auth/client";

const BUTTON_SIZE = 40;
const VIEWPORT_MARGIN = 12;

type Position = {
  x: number;
  y: number;
};

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  moved: boolean;
};

function clampToViewport({ x, y }: Position): Position {
  return {
    x: Math.min(
      Math.max(VIEWPORT_MARGIN, x),
      Math.max(VIEWPORT_MARGIN, window.innerWidth - BUTTON_SIZE - VIEWPORT_MARGIN),
    ),
    y: Math.min(
      Math.max(VIEWPORT_MARGIN, y),
      Math.max(VIEWPORT_MARGIN, window.innerHeight - BUTTON_SIZE - VIEWPORT_MARGIN),
    ),
  };
}

export default function Sidebar() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 20, y: 20 });
  const dragState = useRef<DragState | null>(null);
  const suppressClick = useRef(false);

  useEffect(() => {
    const keepButtonOnScreen = () => {
      setPosition((current) => clampToViewport(current));
    };

    const moveButton = (event: globalThis.PointerEvent) => {
      const drag = dragState.current;
      if (!drag || drag.pointerId !== event.pointerId) return;

      const deltaX = event.clientX - drag.startX;
      const deltaY = event.clientY - drag.startY;

      if (Math.hypot(deltaX, deltaY) > 4) drag.moved = true;
      if (!drag.moved) return;

      setPosition(
        clampToViewport({
          x: drag.originX + deltaX,
          y: drag.originY + deltaY,
        }),
      );
    };

    const finishDragging = (event: globalThis.PointerEvent) => {
      const drag = dragState.current;
      if (!drag || drag.pointerId !== event.pointerId) return;

      suppressClick.current = drag.moved;
      dragState.current = null;
      setIsDragging(false);

      if (drag.moved) {
        const releasedPosition = clampToViewport({
          x: drag.originX + event.clientX - drag.startX,
          y: drag.originY + event.clientY - drag.startY,
        });
        const rightEdge = Math.max(
          VIEWPORT_MARGIN,
          window.innerWidth - BUTTON_SIZE - VIEWPORT_MARGIN,
        );

        setPosition({
          x:
            releasedPosition.x + BUTTON_SIZE / 2 < window.innerWidth / 2
              ? VIEWPORT_MARGIN
              : rightEdge,
          y: releasedPosition.y,
        });
      }
    };

    window.addEventListener("resize", keepButtonOnScreen);
    window.addEventListener("pointermove", moveButton);
    window.addEventListener("pointerup", finishDragging);
    window.addEventListener("pointercancel", finishDragging);

    return () => {
      window.removeEventListener("resize", keepButtonOnScreen);
      window.removeEventListener("pointermove", moveButton);
      window.removeEventListener("pointerup", finishDragging);
      window.removeEventListener("pointercancel", finishDragging);
    };
  }, []);

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDragging(true);
    dragState.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
      moved: false,
    };
  };

  const handleButtonClick = () => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }

    setIsOpen((current) => !current);
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    setIsOpen(false);
    router.push("/");
    router.refresh();
  };

  return (
    <>
      <button
        type="button"
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        onClick={handleButtonClick}
        onPointerDown={handlePointerDown}
        style={{ left: position.x, top: position.y, touchAction: "none" }}
        className={`fixed z-50 flex h-10 w-10 cursor-grab select-none items-center justify-center rounded-full bg-white text-xl shadow-sm active:cursor-grabbing ${
          isDragging ? "" : "transition-[left,top] duration-200 ease-out"
        }`}
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
              ✨ Home
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

          <div className="mt-auto border-t border-gray-100 pt-5">
            {sessionPending ? (
              <p className="text-xs text-gray-400">Checking account…</p>
            ) : session?.user ? (
              <div>
                <p className="truncate text-sm font-medium text-gray-900">
                  {session.user.name}
                </p>
                <p className="mt-1 truncate text-xs text-gray-400">
                  {session.user.email}
                </p>
                <button
                  type="button"
                  onClick={handleSignOut}
                  aria-label="Sign out"
                  title="Sign out"
                  className="mt-4 flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="M10 4H5.75A1.75 1.75 0 0 0 4 5.75v12.5C4 19.22 4.78 20 5.75 20H10" />
                    <path d="M14 8l4 4-4 4" />
                    <path d="M18 12H8" />
                  </svg>
                </button>
              </div>
            ) : (
              <div>
                <p className="text-xs leading-relaxed text-gray-400">
                  Sign in to sync readings across devices. Guest readings stay
                  on this device.
                </p>
                <Link
                  href="/auth/sign-in"
                  onClick={() => setIsOpen(false)}
                  className="mt-4 inline-flex text-sm font-medium text-gray-700 transition-colors hover:text-black"
                >
                  Sign in
                </Link>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
