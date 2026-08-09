// 首次解读、历史恢复和会话初始化
// 进入 Reading页面
//   ↓
// 检查 currentReading
//   ├── 已存在：说明是历史咨询，不重新请求
//   └── 不存在：说明是新咨询
//                     ↓
//               验证问题和卡牌
//                     ↓
//               调用 /api/reading
//                     ↓
//               创建首次 Conversation
//                     ↓
//               创建完整 Reading
//                     ↓
//               createReading

"use client";

import { useEffect, useRef, useState } from "react";
import type {
  Dispatch,
  SetStateAction,
} from "react";
import { useRouter } from "next/navigation";

import { useTarotStore } from "@/store/tarotStore";
import type {
  Reading,
  ReadingContent,
  ReadingMessage,
} from "@/types/reading";
import type { DrawnCard } from "@/types/tarot";
import type { TarotSpread } from "@/lib/spreads";

type UseReadingSessionParams = {
  readingId: string; // URL 中为本次咨询预先生成或已保存的 ID
  currentReading: Reading | null; // 当前完整咨询（原始问题，牌阵，卡牌，以及解读，当前推荐问题）
  question: string; // 用户输入的问题
  cards: DrawnCard[]; // 用户抽取的卡牌
  selectedSpread: TarotSpread; // 用户选择的牌阵

  // 修改页面对话
  setConversation: Dispatch<
    SetStateAction<ReadingMessage[]>
  >;
};

export function useReadingSession({
  readingId,
  currentReading,
  question,
  cards,
  selectedSpread,
  setConversation,
}: UseReadingSessionParams) {
  const router = useRouter();

  const [loading, setLoading] = useState(
    !currentReading
  );

  const [error, setError] = useState<
    string | null
  >(null);

  const [retryCount, setRetryCount] = useState(0);

  const hasFetchedRef = useRef(false);

  const createReading = useTarotStore(
    (state) => state.createReading
  );

  function retryInitialReading() {
    if (currentReading || loading) {
      return;
    }

    hasFetchedRef.current = false;
    setError(null);
    setLoading(true);
    setRetryCount((count) => count + 1);
  }

  useEffect(() => {
    // 已有 currentReading，说明用户从 History
    // 打开咨询，或者首次解读已经创建完成。
    if (currentReading) {
      return;
    }

    // 防止 React Strict Mode重复调用首次解读。
    if (hasFetchedRef.current) {
      return;
    }

    // 没有完整的新咨询流程数据时，
    // 不允许直接进入 Reading页面。
    if (
      !question.trim() ||
      cards.length !== selectedSpread.cardCount
    ) {
      router.replace("/question");
      return;
    }

    hasFetchedRef.current = true;

    async function generateInitialReading() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          "/api/reading",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              question,
              spread: selectedSpread,
              cards,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(
            "Failed to generate reading."
          );
        }

        const data =
          (await response.json()) as ReadingContent;

        const now = new Date().toISOString();

        const initialConversation: ReadingMessage[] =
          [
            {
              id: crypto.randomUUID(),
              role: "user",
              kind: "question",
              content: question,
              createdAt: now,
            },
            {
              id: crypto.randomUUID(),
              role: "assistant",
              kind: "initial-reading",
              content:
                formatInitialReading(data),
              createdAt: now,
            },
          ];

        const newReading: Reading = {
          id: readingId,
          createdAt: now,
          updatedAt: now,

          focus: question,
          spread: selectedSpread,
          cards,

          content: data,
          conversation: initialConversation,

          status: "active",
        };

        // 立即更新页面聊天记录。
        setConversation(initialConversation);

        // 同时保存 currentReading 和 History。
        createReading(newReading);
      } catch (error) {
        console.error(
          "Initial reading request failed:",
          error
        );

        setError(
          "Something went wrong. Please try again."
        );
      } finally {
        setLoading(false);
      }
    }

    generateInitialReading();
  }, [
    currentReading,
    readingId,
    question,
    cards,
    selectedSpread,
    router,
    createReading,
    setConversation,
    retryCount,
  ]);

  return {
    loading,
    error,
    retryInitialReading,
  };
}

function formatInitialReading(
  data: ReadingContent
) {
  return [
    `✨ Key Insight\n${data.keyInsight}`,
    `📖 Interpretation\n${data.interpretation}`,
    `💡 Advice\n${data.advice}`,
  ].join("\n\n");
}
