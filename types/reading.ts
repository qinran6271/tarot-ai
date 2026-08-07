import type { DrawnCard } from "@/types/tarot";
import type { TarotSpread } from "@/lib/spreads";

export type ReadingContent = {
  keyInsight: string;
  interpretation: string;
  advice: string;
  followUps: string[];
};

export type ClarificationSuggestion = {
  reason: string;
  question: string;
  status: "pending" | "drawn";
  card?: DrawnCard;
};

export type ReadingMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;

  clarificationSuggestion?: ClarificationSuggestion;
  clarificationCard?: DrawnCard;
};

export type Reading = {
  id: string; //咨询 ID
  createdAt: string; //咨询创建时间
  updatedAt: string; //咨询更新时间

  focus: string; //咨询的焦点问题
  spread: TarotSpread; //所使用的牌阵

  cards: DrawnCard[]; //所抽到的牌
  content: ReadingContent; // 首次解读

  conversation: ReadingMessage[]; //整个对话的记录，为了方便后续的追问和澄清，记录了用户和 AI 的对话内容

  status: "active" | "completed"; //咨询状态，active 表示咨询仍在进行中，completed 表示咨询已完成
  summary?: string; //可选总结
};