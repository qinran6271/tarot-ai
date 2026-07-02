import type { DrawnCard } from "@/types/tarot";
import type { TarotSpread } from "@/lib/spreads";

export type ReadingContent = {
  keyInsight: string;
  interpretation: string;
  advice: string;
  followUps: string[];
};

export type ReadingMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type Reading = {
  id: string;
  createdAt: string;
  updatedAt: string;

  focus: string;
  spread: TarotSpread;

  cards: DrawnCard[];
  content: ReadingContent; // 第一次正解牌

  conversation: ReadingMessage[]; //整个对话的记录

  status: "active" | "completed";
  summary?: string;
};