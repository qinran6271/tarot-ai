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
import {
  getClarificationCopy,
  getStoredReadingLanguage,
} from "@/lib/readingLanguage";
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
  const [clarificationError, setClarificationError] = useState<string | null>(
    null
  );

  // 从 Store读取 updateCurrentReading
  const updateCurrentReading = useTarotStore(
    (state) => state.updateCurrentReading
  );

  async function drawClarificationCard(
    message: ReadingMessage,
    baseConversation: ReadingMessage[] = conversation,
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

    let clarificationCard: Reading["cards"][number];
    let updatedCards = currentReading.cards;

    // failed 表示牌已经抽过，只需要重新请求解释。
    if (suggestion.status === "failed" && suggestion.card) {
      clarificationCard = suggestion.card;
    } else {
      // pending 表示第一次抽补充牌。
      const excludedCardIds = currentReading.cards.map((card) => card.id);

      const drawnCard = drawAvailableCard(excludedCardIds);

      if (!drawnCard) {
        console.error("No available clarification card.");
        return;
      }

      clarificationCard = {
        ...drawnCard,
        position: "Clarification",
        isReversed: Math.random() < 0.5,
        source: "clarification",
      };

      updatedCards = [
        ...currentReading.cards,
        clarificationCard,
      ];
    }

    // 无论是首次抽牌还是失败重试，
    // 请求开始时都进入 drawn 状态。
    const updatedConversation = baseConversation.map((item) => {
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

    setClarificationError(null);
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
            readingLanguage: getStoredReadingLanguage(),
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
        kind: "clarification-reading",
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

      const failedConversation =
        updatedConversation.map((item) => {
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
              status: "failed" as const,
            },
          };
        });

      // 保留已经抽出的牌，但标记解释失败。
      setConversation(failedConversation);

      // 同步 Reading 和 History，但不保存错误消息。
      updateCurrentReading({
        conversation: failedConversation,
      });

      // 错误只作为临时 UI 状态存在。
      setClarificationError(
        "Sorry, I couldn't interpret this clarification card right now. Please try again."
      );
    } finally {
      setClarificationLoading(false);
    }
  }

  function drawManualClarificationCard() {
    if (!currentReading || clarificationLoading) {
      return;
    }

    const copy = getClarificationCopy(
      currentReading.focus,
      getStoredReadingLanguage(),
    );

    const message: ReadingMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      kind: "clarification-reading",
      content: copy.content,
      createdAt: new Date().toISOString(),
      clarificationSuggestion: {
        reason: copy.reason,
        question: copy.question,
        status: "pending",
      },
    };

    const conversationWithPrompt = [...conversation, message];
    setConversation(conversationWithPrompt);
    void drawClarificationCard(message, conversationWithPrompt);
  }

  return {
    clarificationLoading,
    clarificationError,
    drawClarificationCard,
    drawManualClarificationCard,
  };
}
