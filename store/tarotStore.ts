import { create } from "zustand";
import { DrawnCard } from "@/types/tarot";
import { TarotSpread, tarotSpreads } from "@/lib/spreads";

type TarotStore = {
  question: string;
  cards: DrawnCard[];
  selectedSpread: TarotSpread;
  setQuestion: (question: string) => void;
  setCards: (cards: DrawnCard[]) => void;
  setSelectedSpread: (spread: TarotSpread) => void;
};

export const useTarotStore = create<TarotStore>((set) => ({
  question: "",
  cards: [],
  selectedSpread: tarotSpreads[0],
  setQuestion: (question) => set({ question }),
  setCards: (cards) => set({ cards }),
  setSelectedSpread: (spread) => set({ selectedSpread: spread }),
}));