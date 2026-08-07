import { TarotCardData } from "@/lib/tarot";

export type DrawnCard = TarotCardData & {
  isReversed: boolean;
  position?: string;
  source: "spread" | "clarification" | "daily";
};

export type TarotKnowledgeCard = {
  type: string;
  name_short: string;
  name: string;
  value: string;
  value_int: number;
  meaning_up: string;
  meaning_rev: string;
  desc: string;
};
