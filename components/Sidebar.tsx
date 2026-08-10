"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { authClient } from "@/lib/auth/client";
import { getDailyReading, isTodayReading } from "@/lib/dailyReading";
import { dailyCardSpread } from "@/lib/spreads";
import { useTarotStore } from "@/store/tarotStore";
import type { DrawnCard } from "@/types/tarot";

const BUTTON_WIDTH = 48;
const BUTTON_HEIGHT = 56;
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

type TrailParticle = {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  life: number;
  maxLife: number;
  size: number;
  phase: number;
};

function clampToViewport({ x, y }: Position): Position {
  return {
    x: Math.min(
      Math.max(VIEWPORT_MARGIN, x),
      Math.max(
        VIEWPORT_MARGIN,
        window.innerWidth - BUTTON_WIDTH - VIEWPORT_MARGIN,
      ),
    ),
    y: Math.min(
      Math.max(VIEWPORT_MARGIN, y),
      Math.max(
        VIEWPORT_MARGIN,
        window.innerHeight - BUTTON_HEIGHT - VIEWPORT_MARGIN,
      ),
    ),
  };
}

export default function Sidebar() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const history = useTarotStore((state) => state.history);
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [localTodayCard, setLocalTodayCard] = useState<DrawnCard | null>(null);
  const [position, setPosition] = useState<Position>({ x: 20, y: 20 });
  const dragState = useRef<DragState | null>(null);
  const suppressClick = useRef(false);
  const trailCanvas = useRef<HTMLCanvasElement>(null);
  const trailParticles = useRef<TrailParticle[]>([]);
  const trailAnimationFrame = useRef<number | null>(null);
  const lastTrailPoint = useRef<Position | null>(null);
  const storedTodayCard = useMemo(() => {
    const today = new Date().toDateString();
    return history.find(
      (reading) =>
        reading.spread.id === dailyCardSpread.id &&
        new Date(reading.createdAt).toDateString() === today &&
        Boolean(reading.cards[0]),
    )?.cards[0];
  }, [history]);
  const todayCard = storedTodayCard ?? localTodayCard;

  useEffect(() => {
    const refreshLocalDailyCard = () => {
      const reading = getDailyReading();
      setLocalTodayCard(
        reading && isTodayReading(reading) ? reading.card : null,
      );
    };

    refreshLocalDailyCard();
    window.addEventListener("storage", refreshLocalDailyCard);
    window.addEventListener("daily-reading-updated", refreshLocalDailyCard);
    return () => {
      window.removeEventListener("storage", refreshLocalDailyCard);
      window.removeEventListener(
        "daily-reading-updated",
        refreshLocalDailyCard,
      );
    };
  }, []);

  useEffect(() => {
    const canvas = trailCanvas.current;
    const context = canvas?.getContext("2d");

    const resizeTrailCanvas = () => {
      if (!canvas || !context) return;
      const density = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * density;
      canvas.height = window.innerHeight * density;
      context.setTransform(density, 0, 0, density, 0, 0);
    };

    const drawTrail = () => {
      if (!context) return;
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      context.globalCompositeOperation = "source-over";

      trailParticles.current = trailParticles.current.filter((particle) => {
        particle.life -= 16;
        if (particle.life <= 0) return false;

        particle.x += particle.velocityX;
        particle.y += particle.velocityY;

        const progress = particle.life / particle.maxLife;
        const opacity = Math.min(1, progress * 2.4);
        const radius = particle.size * (0.55 + progress * 0.45);
        const pulse = 0.78 + Math.sin(particle.phase + progress * 12) * 0.22;
        const longRay = radius * (4.4 + pulse * 2.2);
        const innerWidth = longRay * 0.14;
        context.save();
        context.translate(particle.x, particle.y);
        context.scale(pulse, pulse);
        context.shadowColor = `rgba(250, 224, 92, ${opacity * 0.30})`;
        context.shadowBlur = 2.5;
        context.fillStyle = `rgba(235, 213, 145, ${opacity})`;
        context.beginPath();
        context.moveTo(0, -longRay);
        context.lineTo(innerWidth, -innerWidth);
        context.lineTo(longRay, 0);
        context.lineTo(innerWidth, innerWidth);
        context.lineTo(0, longRay);
        context.lineTo(-innerWidth, innerWidth);
        context.lineTo(-longRay, 0);
        context.lineTo(-innerWidth, -innerWidth);
        context.closePath();
        context.fill();
        context.restore();
        return true;
      });

      if (trailParticles.current.length > 0) {
        trailAnimationFrame.current = requestAnimationFrame(drawTrail);
      } else {
        trailAnimationFrame.current = null;
      }
    };

    const emitTrail = (x: number, y: number) => {
      for (let index = 0; index < 1; index += 1) {
        const life = 680 + Math.random() * 420;
        trailParticles.current.push({
          x: x + (Math.random() - 0.5) * 18,
          y: y + (Math.random() - 0.5) * 18,
          velocityX: (Math.random() - 0.5) * 0.08,
          velocityY: (Math.random() - 0.5) * 0.08,
          life,
          maxLife: life,
          size: 0.7 + Math.random() * 1.35,
          phase: Math.random() * Math.PI * 2,
        });
      }
      trailParticles.current = trailParticles.current.slice(-260);
      if (trailAnimationFrame.current === null) {
        trailAnimationFrame.current = requestAnimationFrame(drawTrail);
      }
    };

    resizeTrailCanvas();
    const keepButtonOnScreen = () => {
      setPosition((current) => clampToViewport(current));
      resizeTrailCanvas();
    };

    const moveButton = (event: globalThis.PointerEvent) => {
      const drag = dragState.current;
      if (!drag || drag.pointerId !== event.pointerId) return;

      const deltaX = event.clientX - drag.startX;
      const deltaY = event.clientY - drag.startY;

      if (Math.hypot(deltaX, deltaY) > 10 && !drag.moved) {
        drag.moved = true;
        setIsDragging(true);
      }
      if (!drag.moved) return;

      const nextPosition = clampToViewport({
        x: drag.originX + deltaX,
        y: drag.originY + deltaY,
      });
      setPosition(nextPosition);

      const trailPoint = {
        x: nextPosition.x + BUTTON_WIDTH / 2,
        y: nextPosition.y + BUTTON_HEIGHT / 2,
      };
      const previousTrailPoint = lastTrailPoint.current;
      if (
        !previousTrailPoint ||
        Math.hypot(
          trailPoint.x - previousTrailPoint.x,
          trailPoint.y - previousTrailPoint.y,
        ) >= 9
      ) {
        lastTrailPoint.current = trailPoint;
        emitTrail(trailPoint.x, trailPoint.y);
      }
    };

    const finishDragging = (event: globalThis.PointerEvent) => {
      const drag = dragState.current;
      if (!drag || drag.pointerId !== event.pointerId) return;

      suppressClick.current = drag.moved;
      dragState.current = null;
      lastTrailPoint.current = null;
      setIsDragging(false);

      if (drag.moved) {
        const releasedPosition = clampToViewport({
          x: drag.originX + event.clientX - drag.startX,
          y: drag.originY + event.clientY - drag.startY,
        });

        const rightEdge = Math.max(
          VIEWPORT_MARGIN,
          window.innerWidth - BUTTON_WIDTH - VIEWPORT_MARGIN,
        );

        setPosition({
          x:
            releasedPosition.x + BUTTON_WIDTH / 2 < window.innerWidth / 2
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
      if (trailAnimationFrame.current !== null) {
        cancelAnimationFrame(trailAnimationFrame.current);
      }
    };
  }, []);

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    lastTrailPoint.current = {
      x: position.x + BUTTON_WIDTH / 2,
      y: position.y + BUTTON_HEIGHT / 2,
    };
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

    if (isOpen) {
      setIsOpen(false);
      return;
    }

    setIsOpen(true);
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    setIsOpen(false);
    router.push("/");
    router.refresh();
  };

  return (
    <>
      <canvas
        ref={trailCanvas}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[49] h-full w-full"
      />

      <button
        type="button"
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        title="Menu — drag to move"
        onClick={handleButtonClick}
        onPointerDown={handlePointerDown}
        style={{
          left: position.x,
          top: position.y,
          touchAction: "none",
        }}
        className={`group fixed z-[45] flex h-14 w-12 cursor-grab select-none items-center justify-center [perspective:500px] active:cursor-grabbing ${
          isDragging ? "" : "transition-[left,top] duration-200 ease-out"
        }`}
      >
        <span
          aria-hidden="true"
          className={`relative block h-[50px] w-[34px] transition-all duration-300 group-active:scale-105 ${
            isDragging
              ? "scale-105 drop-shadow-[0_0_10px_rgba(242,211,103,0.58)]"
              : "drop-shadow-[0_3px_5px_rgba(83,63,24,0.18)] group-hover:scale-[1.03]"
          }`}
        >
          {(isOpen || isDragging) && todayCard ? (
            <span className="absolute inset-0 overflow-hidden rounded-[5px] bg-[#fcfaf3]">
              <Image
                src={todayCard.img}
                alt=""
                fill
                draggable={false}
                sizes="34px"
                className={`object-cover ${todayCard.isReversed ? "rotate-180" : ""}`}
              />
            </span>
          ) : (
            <span className="absolute inset-0 overflow-hidden rounded-[5px] bg-[#fcfaf3]">
              <svg viewBox="0 0 68 100" className="h-full w-full text-[#d2ba7d]" role="presentation">
                <rect x="3" y="3" width="62" height="94" rx="7" fill="#fcfaf3" stroke="currentColor" strokeWidth="1.5" />
                <path d="M34 22v56M12 50h44M18 34l32 32M50 34L18 66" stroke="currentColor" strokeWidth="0.6" opacity="0.48" />
                <circle cx="34" cy="50" r="21" fill="none" stroke="currentColor" strokeWidth="1" />
                <circle cx="34" cy="50" r="12" fill="none" stroke="currentColor" strokeWidth="0.7" />
                <path d="M34 35l3.8 11.2L49 50l-11.2 3.8L34 65l-3.8-11.2L19 50l11.2-3.8z" fill="currentColor" />
                <circle cx="34" cy="50" r="3" fill="#fcfaf3" />
              </svg>
            </span>
          )}
        </span>
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
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="rounded-xl outline-none transition-opacity hover:opacity-70 focus-visible:ring-2 focus-visible:ring-yellow-200"
              aria-label="Go to home"
            >
              <p className="text-xs uppercase tracking-[0.25em] text-gray-400">
                WALAWALA
              </p>
              <h2 className="mt-2 text-xl font-semibold text-gray-900">
                Tarot
              </h2>
            </Link>

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
              href="/daily-readings"
              onClick={() => setIsOpen(false)}
              className="block rounded-2xl px-4 py-3 hover:bg-gray-100"
            >
              ☀️ Daily Readings
            </Link>

            <Link
              href="/history"
              onClick={() => setIsOpen(false)}
              className="block rounded-2xl px-4 py-3 hover:bg-gray-100"
            >
              📜 Readings
            </Link>

            <Link
              href="/favorites"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 rounded-2xl px-4 py-3 hover:bg-gray-100"
            >
              <Heart size={15} fill="currentColor" className="text-red-500" />
              Favorites
            </Link>
          </nav>

          <div className="-mx-6 -mb-7 mt-auto bg-gray-50 px-6 pb-7 pt-3">
            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-white hover:text-gray-900"
            >
              <Settings size={16} strokeWidth={1.8} />
              Settings
            </Link>

            <div className="mx-2 mt-2 px-1 pt-2">
              {sessionPending ? (
                <p className="px-1 py-2 text-xs text-gray-400">
                  Checking account…
                </p>
              ) : session?.user ? (
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href="/settings/account"
                    onClick={() => setIsOpen(false)}
                    className="min-w-0 flex-1 rounded-lg px-1 py-1 outline-none transition-opacity hover:opacity-65 focus-visible:ring-2 focus-visible:ring-yellow-200"
                    aria-label="Open account settings"
                  >
                    <p className="truncate text-sm font-medium text-gray-900">
                      {session.user.name}
                    </p>
                    <p className="mt-1 truncate text-xs text-gray-400">
                      {session.user.email}
                    </p>
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    aria-label="Sign out"
                    title="Sign out"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-white hover:text-gray-900 hover:shadow-sm"
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
                <div className="px-1 pb-1">
                  <p className="text-xs leading-relaxed text-gray-400">
                    Sign in to sync readings across devices. Guest readings
                    stay on this device.
                  </p>
                  <Link
                    href="/auth/sign-in"
                    onClick={() => setIsOpen(false)}
                    className="mt-3 inline-flex text-sm font-medium text-gray-700 transition-colors hover:text-black"
                  >
                    Sign in
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
