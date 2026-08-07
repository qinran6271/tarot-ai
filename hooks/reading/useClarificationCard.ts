// 抽补充牌和解释补充牌
// 1. 检查消息中是否包含补充牌建议；
// 2. 防止同一建议重复抽牌；
// 3. 排除已经抽过的卡牌；
// 4. 抽取补充牌；
// 5. 设置位置和正逆位；
// 6. 将建议状态从 pending 改为 drawn；
// 7. 调用补充牌解释 API；
// 8. 创建 AI解释消息；
// 9. 更新 Conversation；
// 10. 更新 Reading卡牌；
// 11. 更新推荐问题；
// 12. 处理 Loading和错误；
// 13. 调用 updateCurrentReading。

"use client";
import { useState } from "react";
import type {
  Dispatch,
  SetStateAction,
} from "react";

import { drawAvailableCard } from "@/lib/tarot";
import { useTarotStore } from "@/store/tarotStore";
import type {
  Reading,
  ReadingMessage,
} from "@/types/reading";

// 这个Hook接收什么参数类型
type UseClarificationCardParams = {
  currentReading: Reading | null; // 当前完整咨询（原始问题，牌阵，卡牌，以及解读，当前推荐问题）
  conversation: ReadingMessage[]; // 页面当前显示的聊天记录
  // 修改修改页面对话
  setConversation: Dispatch<
    SetStateAction<ReadingMessage[]>
  >;
};

// Hook返回的 AI 回复类型
type ClarificationResponse = {
  message: string;
  followUps?: string[];
  shouldDrawClarificationCard: false;
  clarificationReason: string; 
  clarificationQuestion: string;
};

export function useClarificationCard({
  currentReading,
  conversation,
  setConversation,
}: UseClarificationCardParams) {

  const [clarificationLoading, setClarificationLoading] = useState(false); // 表示是否正在等待补充牌解释。

  // 从 Store读取 updateCurrentReading
  const updateCurrentReading = useTarotStore(
    (state) => state.updateCurrentReading
  ); 

  async function drawClarificationCard(
    message: ReadingMessage
  ) {
    if (!currentReading || clarificationLoading) {
      return;
    }

    // 接收用户点击的 AI消息

    const suggestion =
      message.clarificationSuggestion;

    // 检查消息是否包含补充牌建议
    if (!suggestion) {
      return;
    }

    if (!suggestion.question.trim()) {
      return;
    }

    if (suggestion.status === "drawn") {
      return;
    }

    // 排除已经抽过的卡牌
    const excludedCardIds =
      currentReading.cards.map(
        (card) => card.id
      );

    const drawnCard =
      drawAvailableCard(excludedCardIds);

    if (!drawnCard) {
      console.error(
        "No available clarification card."
      );
      return;
    }

    const clarificationCard: Reading["cards"][number] =
      {
        ...drawnCard,
        position: "Clarification",
        isReversed: Math.random() < 0.5,
      };

    // 更新 Conversation，将建议状态从 pending 改为 drawn，并添加补充牌。
    const updatedConversation =
      conversation.map((item) => {
        if (
          item.id !== message.id ||
          !item.clarificationSuggestion
        ) {
          return item;
        }

        return {
          ...item,
          clarificationSuggestion: {
            ...item.clarificationSuggestion,
            status: "drawn" as const,
            card: clarificationCard,
          },
        };
      });


    const updatedCards = [
      ...currentReading.cards,
      clarificationCard,
    ];

    const updatedReading: Reading = {
      ...currentReading,
      cards: updatedCards,
      conversation: updatedConversation,
      updatedAt: new Date().toISOString(),
    };

    // 先将补充牌显示在页面上。
    setConversation(updatedConversation);

    // 同步 currentReading、History 和 localStorage。
    updateCurrentReading({
      cards: updatedCards,
      conversation: updatedConversation,
    });

    setClarificationLoading(true);

    // 调用 /api/reading-chat
    try {
      const response = await fetch(
        "/api/reading-chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reading: updatedReading,

            clarification: {
              question: suggestion.question,
              card: clarificationCard,
            },

            disableClarificationSuggestion: true,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to interpret clarification card."
        );
      }

      // 收到补充牌解释
      const data =
        (await response.json()) as ClarificationResponse;

      const interpretationMessage: ReadingMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.message,
        createdAt: new Date().toISOString(),
      };

      // 追加 Assistant消息
      const finalConversation = [
        ...updatedConversation,
        interpretationMessage,
      ];

      // 更新 Reading的 content.followUps
      const updatedContent = {
        ...currentReading.content,
        followUps:
          data.followUps ??
          currentReading.content.followUps,
      };

      setConversation(finalConversation);

      // 同步 currentReading、History 和 localStorage。
      updateCurrentReading({
        conversation: finalConversation,
        content: updatedContent,
      });
    } catch (error) {
      console.error(
        "Clarification interpretation failed:",
        error
      );

      const errorMessage: ReadingMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          "Sorry, I couldn't interpret this clarification card right now. Please try again.",
        createdAt: new Date().toISOString(),
      };

      const errorConversation = [
        ...updatedConversation,
        errorMessage,
      ];

      setConversation(errorConversation);

      updateCurrentReading({
        conversation: errorConversation,
      });
    } finally {
      setClarificationLoading(false);
    }
  }

  return {
    clarificationLoading,
    drawClarificationCard,
  };
}