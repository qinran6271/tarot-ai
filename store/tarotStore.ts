import { create } from "zustand";

type TarotStore = {
  question: string;
  setQuestion: (question: string) => void;
};

// export 出去所有页面都可以使用
export const useTarotStore = create<TarotStore>((set) => ({
  question: "",

  setQuestion: (question) => set({ question }),
}));