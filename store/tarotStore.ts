import { create } from "zustand";
import { DrawnCard } from "@/types/tarot";


type TarotStore = {
  question: string;
  setQuestion: (question: string) => void;

  cards: DrawnCard[];
  setCards: (cards:  DrawnCard[]) => void;
};

// export 出去所有页面都可以使用
export const useTarotStore = create<TarotStore>((set) => ({
  question: "",
  cards: [],

  setQuestion: (question) => set({ question }),
  setCards: (cards) => set({ cards }),
  
}));