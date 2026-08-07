"use client";
import { useTarotStore } from "@/store/tarotStore";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { ReadingContent, Reading, ReadingMessage } from "@/types/reading";

import ReadingHeader from "@/components/reading/ReadingHeader";
import EndChatModal from "@/components/reading/EndChatModal";
import ChatInput from "@/components/reading/ChatInput";
import MessageList from "@/components/reading/MessageList";

import { useReadingChat } from "@/hooks/reading/useReadingChat";
import { useClarificationCard } from "@/hooks/reading/useClarificationCard";
import { useReadingSession } from "@/hooks/reading/useReadingSession";





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


  // 页面共享的 Conversation。
  //
  // 新咨询时初始值为空，首次解读 Hook
  // 会在请求成功后填入消息。
  //
  // 从 History进入时，直接使用已保存的消息。
  const [conversation, setConversation] = useState<ReadingMessage[]>(
    currentReading?.conversation ?? []
  );

  // hook for first reading content (keyInsight, interpretation, advice)
    const {
    loading,
    error,
  } = useReadingSession({
    currentReading,
    question,
    cards,
    selectedSpread,
    setConversation,
  });

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
  // Auto Scroll
  //
  // 每当聊天内容增加时，自动滚动到最底部。
  // ======================================

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation, loading]);

  // 新咨询建立前使用临时流程状态；
  // Reading建立后以 currentReading为准。
  const displayQuestion = currentReading?.focus ?? question;
  const displayCards = currentReading?.cards ?? cards;
  const displayReading = currentReading?.content ?? null;



  
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