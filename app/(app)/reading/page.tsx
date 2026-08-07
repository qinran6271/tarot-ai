"use client";

import Link from "next/link";
import TarotCard from "@/components/TarotCard";
import { useTarotStore } from "@/store/tarotStore";
import type { ReadingContent, Reading, ReadingMessage } from "@/types/reading";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";
import ReadingHeader from "@/components/reading/ReadingHeader";
import EndChatModal from "@/components/reading/EndChatModal";
import ChatInput from "@/components/reading/ChatInput";
import MessageList from "@/components/reading/MessageList";
import { drawAvailableCard } from "@/lib/tarot";
import { useReadingChat } from "@/hooks/reading/useReadingChat";




export default function ReadingPage() {
  const router = useRouter();

  // ======================================
  // Global State (Zustand)
  // 从 Store 获取当前 Reading 所需的数据
  // ======================================
  const question = useTarotStore((state) => state.question);
  const cards = useTarotStore((state) => state.cards);
  const selectedSpread = useTarotStore((state) => state.selectedSpread);
  const currentReading = useTarotStore((state) => state.currentReading);

  const createReading = useTarotStore((state) => state.createReading);

  const updateCurrentReading = useTarotStore((state) => state.updateCurrentReading);

  // ======================================
  // Local UI State
  // 这些状态只属于 Reading Page
  // ======================================  

  // AI 首次解牌内容
  const [readingContent, setReadingContent] = useState<ReadingContent | null>(
    currentReading?.content ?? null
  );

  // 聊天记录
  const [conversation, setConversation] = useState<ReadingMessage[]>(
    currentReading?.conversation ?? []
  );


  const [chatLoading, setChatLoading] = useState(false);

  const { 
    input, 
    setInput,
    // chatLoading,
    sendMessage,
  } = useReadingChat({
    currentReading,
    conversation,
    setConversation,
    chatLoading,
    setChatLoading,
  });

  // 第一次解牌 Loading
  const [loading, setLoading] = useState(!currentReading);

  // API Error
  const [error, setError] = useState<string | null>(null);

  // 是否显示 End Chat Modal
  const [showEndConfirm, setShowEndConfirm] = useState(false);


  // ======================================
  // Refs
  // ======================================

  // 防止第一次 Reading 重复请求 API
  const hasFetchedRef = useRef(false);

  // 用于聊天自动滚动到底部
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // 处理补充牌卡

async function handleDrawClarificationCard(
  message: ReadingMessage
) {
  if (!currentReading) return;

  const clarificationSuggestion =
    message.clarificationSuggestion;

  if (!clarificationSuggestion) {
    console.log("No clarification suggestion");
    return;
  }

  const clarificationQuestion =
    clarificationSuggestion.question;

  if (!clarificationQuestion) {
    console.log("No clarification question");
    return;
  }

  // 防止用户重复点击已经抽过的补充牌
  if (clarificationSuggestion.status === "drawn") {
    return;
  }

const excludedCardIds = currentReading.cards.map(
  (card) => card.id
);

const drawnCard = drawAvailableCard(excludedCardIds);

if (!drawnCard) {
  console.log("No available card was drawn");
  return;
}

  const clarificationCard: Reading["cards"][number] = {
    ...drawnCard,
    position: "Clarification",
    isReversed: Math.random() < 0.5,
  };

  // 更新触发这次补充牌的 Assistant Message
  const updatedConversation = conversation.map((item) => {
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

  // 先立即显示抽到的牌
  const updatedReading: Reading = {
    ...currentReading,
    cards: [
      ...currentReading.cards,
      clarificationCard,
    ],
    conversation: updatedConversation,
    updatedAt: new Date().toISOString(),
  };

  setConversation(updatedConversation);
  updateCurrentReading({
    cards: updatedReading.cards,
    conversation: updatedConversation,
  });
  setChatLoading(true);

  try {
    const res = await fetch("/api/reading-chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reading: updatedReading,

        clarification: {
          question: clarificationQuestion,
          card: clarificationCard,
        },

        disableClarificationSuggestion: true,
      }),
    });

    if (!res.ok) {
      throw new Error(
        "Failed to interpret clarification card."
      );
    }

    const data = await res.json();

    const interpretationMessage: ReadingMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: data.message,
      createdAt: new Date().toISOString(),
    };

    const finalConversation = [
      ...updatedConversation,
      interpretationMessage,
    ];

    const finalReading: Reading = {
      ...updatedReading,
      conversation: finalConversation,
      content: {
        ...updatedReading.content,
        followUps:
          data.followUps ??
          updatedReading.content.followUps,
      },
      updatedAt: new Date().toISOString(),
    };

    setConversation(finalConversation);
    setReadingContent(finalReading.content);
    updateCurrentReading({
    conversation: finalConversation,
    content: finalReading.content,
    });
  } catch (error) {
    console.error(
      "Clarification interpretation error:",
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

    const errorReading: Reading = {
      ...updatedReading,
      conversation: errorConversation,
      updatedAt: new Date().toISOString(),
    };

    setConversation(errorConversation);
    updateCurrentReading({
      conversation: errorConversation,
    });
  } finally {
    setChatLoading(false);
  }
}
  // ======================================
  // Initial Reading
  //
  // 当用户第一次进入 Reading Page 时：
  // 1. 如果当前已经有 Reading（例如从 History 打开），
  //    就直接使用 Store 里的数据，不再请求 AI。
  // 2. 如果是第一次解牌，则调用 /api/reading。
  // ======================================  
  useEffect(() => {

    // ----------------------------------
    // 从 History 打开的情况
    // ----------------------------------
    // 已经存在 currentReading，直接恢复聊天记录和解牌内容。

    if (currentReading) {
      setReadingContent(currentReading.content);
      setConversation(currentReading.conversation);
      setLoading(false);
      return;
    }
    // ----------------------------------
    // 防止 React Strict Mode 重复请求 API
    // ----------------------------------

    if (hasFetchedRef.current) return;

    // ----------------------------------
    // 如果用户直接访问 /reading
    // 没有问题或没有抽完牌，就回到 Question Page。
    // ----------------------------------

    if (!question.trim() || cards.length !== selectedSpread.cardCount) {
      router.replace("/question");
      return;
    }

    hasFetchedRef.current = true;

    // ----------------------------------
    // 请求第一次 AI 解牌
    // ----------------------------------
    async function getReading() {
      setLoading(true);
      setError(null);

      try {
        console.log(cards);
        const res = await fetch("/api/reading", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question,
            spread: selectedSpread,
            cards,
          }),
        });

        if (!res.ok) throw new Error("Failed to generate reading.");

        // AI 返回：
        // keyInsight
        // interpretation
        // advice
        // followUps
        const data: ReadingContent = await res.json();
        const now = new Date().toISOString();

        // ----------------------------------
        // 创建第一次 Conversation
        //
        // User：
        //    原始问题
        //
        // Assistant：
        //    第一次完整解牌
        // ----------------------------------
        const newConversation: ReadingMessage[] = [
          {
            id: crypto.randomUUID(),
            role: "user",
            content: question,
            createdAt: now,
          },
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: formatInitialReading(data),
            createdAt: now,
          },
        ];

        // ----------------------------------
        // 创建整个 Reading
        //
        // Reading 是 History 保存的对象
        // 包含：
        // - Focus
        // - Cards
        // - Content
        // - Conversation
        // ----------------------------------

        const newReading: Reading = {
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
          focus: question,
          spread: selectedSpread,
          cards,
          content: data,
          conversation: newConversation,
          status: "active",
        };

        // 更新当前页面
        setReadingContent(data);
        setConversation(newConversation);
        createReading(newReading);
      } catch (err) {
        console.error(err);
        setError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    getReading();
  }, [
    currentReading,
    question,
    cards,
    selectedSpread,
    router,
    createReading,
  ]);

  // ======================================
  // Auto Scroll
  //
  // 每当聊天内容增加时，自动滚动到最底部。
  // ======================================

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation, loading]);

  const displayQuestion = currentReading?.focus ?? question;
  const displayCards = currentReading?.cards ?? cards;
  const displayReading = currentReading?.content ?? readingContent;



  
  function handleEndChat() {
    const now = new Date().toISOString();

    if (currentReading) {
       updateCurrentReading({
        status: "completed",
      });
    }

    router.push("/history");
  }

  return (
    <main className="flex h-screen justify-center bg-gray-100">
      <div className="relative flex h-screen w-full max-w-[520px] flex-col bg-white">
        <ReadingHeader
          subtitle={displayQuestion || "No question yet."}
          onBack={() => router.back()}
          onEnd={() => setShowEndConfirm(true)}
        />

        <MessageList
          loading={loading}
          chatLoading={chatLoading}
          error={error}
          conversation={conversation}
          cards={displayCards}
          reading={displayReading}
          scrollRef={scrollRef}
          onSelectFollowUp={(followUp) => setInput(followUp)}
          onDrawClarificationCard={handleDrawClarificationCard}
        />

        <ChatInput
          input={input}
          setInput={setInput}
          onSend={() => sendMessage()}
        />

        <EndChatModal
          open={showEndConfirm}
          onCancel={() => setShowEndConfirm(false)}
          onConfirm={handleEndChat}
        />

      </div>
    </main>
  );
}

function formatInitialReading(data: ReadingContent) {
  return [
    `✨ Key Insight\n${data.keyInsight}`,
    `📖 Interpretation\n${data.interpretation}`,
    `💡 Advice\n${data.advice}`,
  ].join("\n\n");
}