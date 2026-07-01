import { create } from "zustand";
import type { TarotCardData } from "@/lib/tarot";


type TarotStore = {
  question: string;
  setQuestion: (question: string) => void;

  cards: TarotCardData[];
  setCards: (cards: TarotCardData[]) => void;
};

// export 出去所有页面都可以使用
export const useTarotStore = create<TarotStore>((set) => ({
  question: "",
  cards: [],

  setQuestion: (question) => set({ question }),
  setCards: (cards) => set({ cards }),
  
}));