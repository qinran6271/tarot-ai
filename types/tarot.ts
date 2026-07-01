import { TarotCardData } from "@/lib/tarot";

export type DrawnCard = TarotCardData & {
  isReversed: boolean;
};