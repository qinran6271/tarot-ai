"use client";
import { useTarotStore } from "@/store/tarotStore";
import type { ReadingContent, Reading, ReadingMessage } from "@/types/reading";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ReadingHeader from "@/components/reading/ReadingHeader";
import EndChatModal from "@/components/reading/EndChatModal";
import ChatInput from "@/components/reading/ChatInput";
import MessageList from "@/components/reading/MessageList";
import { useReadingChat } from "@/hooks/reading/useReadingChat";
import { useClarificationCard } from "@/hooks/reading/useClarificationCard";




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


  // hook for managing chat input and sending messages
  const { 
    input, 
    setInput,
    chatLoading,
    sendMessage,
  } = useReadingChat({
    currentReading,
    conversation,
    setConversation,
  });

  // hook for managing clarification card drawing and interpretation
  const {
    clarificationLoading,
    drawClarificationCard,
  } = useClarificationCard({
    currentReading,
    conversation,
    setConversation,
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
  const isAssistantLoading =
  chatLoading || clarificationLoading;


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
          chatLoading={isAssistantLoading}
          error={error}
          conversation={conversation}
          cards={displayCards}
          reading={displayReading}
          scrollRef={scrollRef}
          onSelectFollowUp={(followUp) => setInput(followUp)}
          onDrawClarificationCard={drawClarificationCard}
        />

        <ChatInput
          input={input}
          setInput={setInput}
          onSend={() => sendMessage()}
          disabled={isAssistantLoading}
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