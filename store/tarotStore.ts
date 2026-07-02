import { create } from "zustand";
import { DrawnCard } from "@/types/tarot";
import { TarotSpread, tarotSpreads } from "@/lib/spreads";
import type { Reading } from "@/types/reading";
import { persist } from "zustand/middleware";

type TarotStore = {
    question: string; // The user's question for the tarot reading
    cards: DrawnCard[]; // The cards drawn for the reading
    selectedSpread: TarotSpread; // The selected tarot spread for the reading
    currentReading: Reading | null; // The current reading being viewed or analyzed
    history: Reading[]; // The history of past readings


    setQuestion: (question: string) => void;
    setCards: (cards: DrawnCard[]) => void;
    setSelectedSpread: (spread: TarotSpread) => void;
    setCurrentReading: (reading: Reading | null) => void;
    addHistory: (reading: Reading) => void;
    removeHistory: (id: string) => void;
    clearHistory: () => void;
};

export const useTarotStore = create<TarotStore>()(
  persist(
    (set) => ({
      question: "",
      cards: [],
      selectedSpread: tarotSpreads[0],
      currentReading: null,
      history: [],

      setQuestion: (question) => set({ question }),
      setCards: (cards) => set({ cards }),
      setSelectedSpread: (spread) => set({ selectedSpread: spread }),
      setCurrentReading: (reading) => set({ currentReading: reading }),

      addHistory: (reading) =>
        set((state) => ({
          history: [reading, ...state.history],
        })),

      removeHistory: (id) =>
        set((state) => ({
          history: state.history.filter((reading) => reading.id !== id),
        })),

      clearHistory: () => set({ history: [] }),
    }),
    {
      name: "tarot-storage",
      partialize: (state) => ({
        history: state.history,
        currentReading: state.currentReading,
      }),
    }
  )
);