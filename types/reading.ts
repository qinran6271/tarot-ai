import type { TarotCardData } from "@/lib/tarot";
// AI 生成内容
export type ReadingContent = {
  keyInsight: string;
  interpretation: string;
  advice: string;
  followUps: string[];
};


export type Reading = {
  id: string;
  createdAt: string;
  question: string;
  spread: "daily" | "single" | "three-card";

  cards: TarotCardData[];

  content: ReadingContent;
};