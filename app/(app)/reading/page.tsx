"use client";
import { useTarotStore } from "@/store/tarotStore";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { ReadingMessage } from "@/types/reading";

import ReadingHeader from "@/components/reading/ReadingHeader";
import EndChatModal from "@/components/reading/EndChatModal";
import ChatInput from "@/components/reading/ChatInput";
import MessageList from "@/components/reading/MessageList";

import { useReadingChat } from "@/hooks/reading/useReadingChat";
import { useClarificationCard } from "@/hooks/reading/useClarificationCard";
import { useReadingSession } from "@/hooks/reading/useReadingSession";

export default function ReadingPage() {
  const router = useRouter();

  // ========================================
  // 1. 全局业务状态
  //
  // question、cards、selectedSpread：
  // 创建新咨询时产生的临时流程数据。
  //
  // currentReading：
  // 已经完成首次解读的完整咨询。
  //
  // updateCurrentReading：
  // 更新当前咨询，并同步更新 History。
  // ========================================
  const question = useTarotStore((state) => state.question);
  const cards = useTarotStore((state) => state.cards);
  const selectedSpread = useTarotStore((state) => state.selectedSpread);
  const currentReading = useTarotStore((state) => state.currentReading);
  const updateCurrentReading = useTarotStore(
    (state) => state.updateCurrentReading,
  );

  // ========================================
  // 2. 页面共享的对话状态
  //
  // 三个 Reading Hook 都需要读取或修改
  // Conversation，因此暂时由页面统一持有。
  //
  // 新咨询：
  // 初始值为空，首次解读完成后由
  // useReadingSession 填入初始消息。
  //
  // 历史咨询：
  // 直接使用 currentReading 中已保存的消息。
  // ========================================

  const [conversation, setConversation] = useState<ReadingMessage[]>(
    currentReading?.conversation ?? [],
  );

  // ========================================
  // 3. 首次解读与会话初始化
  //
  // 负责：
  // - 判断是新咨询还是已有咨询
  // - 验证新咨询流程数据
  // - 请求首次 AI 解读
  // - 创建并保存完整 Reading
  // ========================================
  const { loading, error } = useReadingSession({
    currentReading,
    question,
    cards,
    selectedSpread,
    setConversation,
  });

  // ========================================
  // 4. 普通后续聊天
  //
  // 负责：
  // - 管理聊天输入
  // - 发送用户的后续问题
  // - 保存 AI 回复
  // - 更新 Conversation
  // ========================================
  const { input, setInput, chatLoading, chatError, sendMessage } =
    useReadingChat({
      currentReading,
      conversation,
      setConversation,
    });

  // ========================================
  // 5. 补充牌流程
  //
  // 负责：
  // - 抽取不重复的补充牌
  // - 请求补充牌解释
  // - 更新卡牌与 Conversation
  // ========================================
  const {
    clarificationLoading,
    clarificationError,
    drawClarificationCard,
  } = useClarificationCard({
    currentReading,
    conversation,
    setConversation,
  });

  // ========================================
  // 6. 页面局部 UI 状态
  //
  // 该状态只控制结束咨询确认弹窗，
  // 不属于 Reading 业务数据。
  // ========================================
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  // ========================================
  // 7. Assistant 请求状态
  //
  // 普通聊天和补充牌解释不能同时进行。
  // 任意请求进行时，统一禁用相关操作。
  // ========================================
  const isAssistantLoading = chatLoading || clarificationLoading;

  // ========================================
  // 8. 聊天自动滚动
  //
  // scrollRef 指向消息列表底部。
  // Conversation 或首次 Loading 变化后，
  // 将页面滚动到最新内容。
  // ========================================
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation, loading, chatError, clarificationError]);

  // ========================================
  // 9. 页面展示数据
  //
  // 新咨询建立 Reading 之前，使用临时流程数据。
  // Reading 建立后，以 currentReading 为准。
  // ========================================
  const displayQuestion = currentReading?.focus ?? question;
  const displayCards = currentReading?.cards ?? cards;
  const displayReading = currentReading?.content ?? null;

  // ========================================
  // 10. 结束咨询
  //
  // 将当前咨询标记为 completed。
  // updateCurrentReading 会同步更新 History
  // 和浏览器本地持久化数据。
  // ========================================

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
          chatError={chatError}
          clarificationError={clarificationError}
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
