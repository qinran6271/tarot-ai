import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";

import { tarotSpreads, type TarotSpread } from "@/lib/spreads";
import {
  deleteDatabaseReading,
  saveDatabaseReading,
} from "@/lib/readings/client";
import { deleteGuestReading } from "@/lib/readings/guest";
import type { Reading } from "@/types/reading";
import type { DrawnCard } from "@/types/tarot";

type PersistenceMode = "pending" | "guest" | "authenticated";
type PersistedTarotState = Pick<TarotStore, "history" | "currentReading">;
type ReadingUpdates = Partial<
  Pick<
    Reading,
    | "cards"
    | "content"
    | "conversation"
    | "favoritedAt"
    | "archivedAt"
  >
>;

type TarotStore = {
  question: string;
  cards: DrawnCard[];
  selectedSpread: TarotSpread;
  pendingReadingId: string | null;
  currentReading: Reading | null;
  history: Reading[];
  persistenceMode: PersistenceMode;
  storageReady: boolean;

  setQuestion: (question: string) => void;
  setCards: (cards: DrawnCard[]) => void;
  setSelectedSpread: (spread: TarotSpread) => void;
  setPendingReadingId: (readingId: string | null) => void;
  setCurrentReading: (reading: Reading | null) => void;
  replaceReadings: (readings: Reading[]) => void;
  setStorageReady: (ready: boolean) => void;
  createReading: (reading: Reading) => void;
  updateReading: (id: string, updates: ReadingUpdates) => void;
  updateCurrentReading: (updates: ReadingUpdates) => void;
  removeHistory: (id: string) => void;
  clearHistory: () => void;
};

let guestPersistenceEnabled = false;

const guestStorage: StateStorage = {
  getItem: (name) => localStorage.getItem(name),
  setItem: (name, value) => {
    if (guestPersistenceEnabled) localStorage.setItem(name, value);
  },
  removeItem: (name) => localStorage.removeItem(name),
};

function reportPersistenceError(action: string, error: unknown) {
  console.error(`Failed to ${action} database reading:`, error);
}

export const useTarotStore = create<TarotStore>()(
  persist<TarotStore, [], [], PersistedTarotState>(
    (set, get) => ({
      question: "",
      cards: [],
      selectedSpread: tarotSpreads[0],
      pendingReadingId: null,
      currentReading: null,
      history: [],
      persistenceMode: "pending",
      storageReady: false,

      setQuestion: (question) => set({ question }),
      setCards: (cards) => set({ cards }),
      setSelectedSpread: (selectedSpread) => set({ selectedSpread }),
      setPendingReadingId: (pendingReadingId) => set({ pendingReadingId }),
      setCurrentReading: (currentReading) => set({ currentReading }),
      replaceReadings: (history) => set({ history, currentReading: null }),
      setStorageReady: (storageReady) => set({ storageReady }),

      createReading: (reading) => {
        set((state) => ({
          pendingReadingId:
            state.pendingReadingId === reading.id
              ? null
              : state.pendingReadingId,
          currentReading: reading,
          history: [
            reading,
            ...state.history.filter((item) => item.id !== reading.id),
          ],
        }));

        if (get().persistenceMode === "authenticated") {
          void saveDatabaseReading(reading).catch((error) =>
            reportPersistenceError("save", error),
          );
        }
      },

      updateReading: (id, updates) => {
        const reading = get().history.find((item) => item.id === id);
        if (!reading) return;

        const updatedReading: Reading = {
          ...reading,
          ...updates,
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          currentReading:
            state.currentReading?.id === id
              ? updatedReading
              : state.currentReading,
          history: state.history.map((item) =>
            item.id === id ? updatedReading : item,
          ),
        }));

        if (get().persistenceMode === "authenticated") {
          void saveDatabaseReading(updatedReading).catch((error) =>
            reportPersistenceError("update", error),
          );
        }
      },

      updateCurrentReading: (updates) => {
        const currentReading = get().currentReading;
        if (!currentReading) return;

        const updatedReading: Reading = {
          ...currentReading,
          ...updates,
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          currentReading: updatedReading,
          history: state.history.map((reading) =>
            reading.id === updatedReading.id ? updatedReading : reading,
          ),
        }));

        if (get().persistenceMode === "authenticated") {
          void saveDatabaseReading(updatedReading).catch((error) =>
            reportPersistenceError("update", error),
          );
        }
      },

      removeHistory: (id) => {
        set((state) => ({
          history: state.history.filter((reading) => reading.id !== id),
          currentReading:
            state.currentReading?.id === id ? null : state.currentReading,
        }));

        deleteGuestReading(id);

        if (get().persistenceMode === "authenticated") {
          void deleteDatabaseReading(id).catch((error) =>
            reportPersistenceError("delete", error),
          );
        }
      },

      clearHistory: () => {
        const readingIds = get().history.map((reading) => reading.id);
        set({ history: [], currentReading: null });

        if (get().persistenceMode === "authenticated") {
          void Promise.all(readingIds.map(deleteDatabaseReading)).catch(
            (error) => reportPersistenceError("clear", error),
          );
        }
      },
    }),
    {
      name: "tarot-storage",
      storage: createJSONStorage<PersistedTarotState>(() => guestStorage),
      skipHydration: true,
      partialize: (state) => ({
        history: state.history,
        currentReading: state.currentReading,
      }),
    },
  ),
);

export async function activateGuestReadingStorage() {
  guestPersistenceEnabled = false;
  useTarotStore.setState({
    persistenceMode: "guest",
    storageReady: false,
    history: [],
    currentReading: null,
  });
  guestPersistenceEnabled = true;
  await useTarotStore.persist.rehydrate();
  useTarotStore.setState({ storageReady: true });
}

export function activateAuthenticatedReadingStorage(readings: Reading[]) {
  guestPersistenceEnabled = false;
  useTarotStore.setState({
    persistenceMode: "authenticated",
    storageReady: true,
    history: readings,
    currentReading: null,
  });
}
