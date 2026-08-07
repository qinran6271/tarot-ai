import { create } from "zustand";
import { DrawnCard } from "@/types/tarot";
import { TarotSpread, tarotSpreads } from "@/lib/spreads";
import type { Reading } from "@/types/reading";
import { persist } from "zustand/middleware";

type ReadingUpdates = Partial<
  Pick<
    Reading,
    "cards" | "content" | "conversation" | "status" | "summary"
  >
>;
type TarotStore = {
    question: string; // The user's question for the tarot reading
    cards: DrawnCard[]; // The cards drawn for the reading
    selectedSpread: TarotSpread; // The selected tarot spread for the reading
    currentReading: Reading | null; // The current reading being viewed or analyzed
    history: Reading[]; // The history of past readings


    setQuestion: (question: string) => void;
    setCards: (cards: DrawnCard[]) => void;
    setSelectedSpread: (spread: TarotSpread) => void;
    setCurrentReading: (reading: Reading | null) => void; //选择和清空

    createReading: (reading: Reading) => void; //创建新的咨询并保存到当前咨询和历史记录中
    updateCurrentReading: (updates: ReadingUpdates) => void; //修改当前咨询并同步更新历史记录中对应的咨询

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

        createReading: (reading) =>
            set((state) => ({
                currentReading: reading,
                history: [
                reading,
                ...state.history.filter((item) => item.id !== reading.id),
                ],
            })),


        removeHistory: (id) =>
        set((state) => ({
            history: state.history.filter(
            (reading) => reading.id !== id
            ),
            currentReading:
            state.currentReading?.id === id
                ? null
                : state.currentReading,
        })),

        clearHistory: () =>
            set({
            history: [],
            currentReading: null,
            }),

        updateCurrentReading: (updates) =>
            set((state) => {
            if (!state.currentReading) {
                return state;
            }

            const updatedReading: Reading = {
                ...state.currentReading,
                ...updates,
                updatedAt: new Date().toISOString(),
            };

            return {
                currentReading: updatedReading,

                history: state.history.map((reading) =>
                reading.id === updatedReading.id
                    ? updatedReading
                    : reading
                ),
            };
            }),
      
    }),

    {
      name: "tarot-storage",
      partialize: (state) => ({ // 把需要持久化的状态属性放在这里
        history: state.history,
        currentReading: state.currentReading,
      }),
    }
  )
);