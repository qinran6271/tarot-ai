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

  const setCurrentReading = useTarotStore((state) => state.setCurrentReading);
  const addHistory = useTarotStore((state) => state.addHistory);
  const updateHistory = useTarotStore((state) => state.updateHistory);

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

  // 输入框
  const [input, setInput] = useState("");

  // 第一次解牌 Loading
  const [loading, setLoading] = useState(!currentReading);

  // API Error
  const [error, setError] = useState<string | null>(null);

  // 是否显示 End Chat Modal
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  // Follow-up Chat Loading
  const [chatLoading, setChatLoading] = useState(false);

  // ======================================
  // Refs
  // ======================================

  // 防止第一次 Reading 重复请求 API
  const hasFetchedRef = useRef(false);

  // 用于聊天自动滚动到底部
  const scrollRef = useRef<HTMLDivElement | null>(null);



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
        // 保存到 Zustand
        setCurrentReading(newReading);
        // 保存到 History
        addHistory(newReading);
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
    setCurrentReading,
    addHistory,
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




  // 用户点击 Send 或点击 Follow-up Question 时都会来到这里
async function handleSend(message?: string) {
  // 如果是点击 Follow-up Question，就使用 message
  // 如果是输入框发送，就使用 input
  const text = (message ?? input).trim();

  // 没有内容或者没有当前 Reading 就直接结束
  if (!text || !currentReading) return;

  const now = new Date().toISOString();

  // ==============================
  // Step 1：先创建一条 User Message
  // ==============================

  const userMessage: ReadingMessage = {
    id: crypto.randomUUID(),
    role: "user",
    content: text,
    createdAt: now,
  };

  // 先把 User Message 放到 Conversation
  // 这样用户点击 Send 后，可以立刻看到自己的消息
  const conversationWithUser = [...conversation, userMessage];

  // 更新 UI
  setConversation(conversationWithUser);

  // 清空输入框
  setInput("");

  // 开始等待 AI 回复
  setChatLoading(true);


  try {
    // ==============================
    // Step 2：请求 Follow-up API
    // ==============================

    const res = await fetch("/api/reading-chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({

        // 把整个 Reading 发给 AI
        // AI 才知道：
        // 1. 原来的问题
        // 2. 抽到了什么牌
        // 3. 前面聊了什么

        reading: {
          ...currentReading,
          conversation: conversationWithUser,
        },

        // 这一次用户真正问的问题
        message: text,
      }),
    });

    if (!res.ok) {
      throw new Error("Failed to generate follow-up response.");
    }

    // ==============================
    // Step 3：AI 返回 Follow-up 回答
    // ==============================

    const data = await res.json();

    // ----------------------------------
    // 把 AI 的回复包装成一条 Assistant Message
    //
    // conversation 里的每一项都是 ReadingMessage。
    // 无论是 User 还是 Assistant，都使用统一的数据结构。
    // ----------------------------------
    const assistantMessage: ReadingMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: data.message,
      createdAt: new Date().toISOString(),
    };

    // ----------------------------------
    // 更新整个 Conversation
    //
    // 当前聊天记录：
    // User -> Assistant -> User
    //
    // +
    // 新的 Assistant Message
    //
    // =
    // 最新的完整聊天记录
    // ----------------------------------
    const finalConversation = [
      ...conversationWithUser,
      assistantMessage,
    ];

    // 更新当前页面的聊天 UI
    setConversation(finalConversation);

    // ----------------------------------
    // 更新整个 Reading
    //
    // 除了保存最新 Conversation，
    // 还要把 AI 新推荐的 Follow-up Questions
    // 保存到 Reading.content.followUps。
    //
    // 这样用户下一次打开 Reading 或 History，
    // 看到的都是最新推荐的问题，而不是第一次解牌时的推荐。
    // ----------------------------------
    const updatedReading: Reading = {
      ...currentReading,

      // 保存完整聊天记录
      conversation: finalConversation,

      // 更新推荐问题，其余解牌内容保持不变
      content: {
        ...currentReading.content,
        followUps: data.followUps ?? currentReading.content.followUps,
      },

      updatedAt: new Date().toISOString(),
    };

    // ----------------------------------
    // 同步更新 State
    //
    // currentReading：当前正在聊天的 Reading
    // readingContent：当前页面显示的解牌内容
    // history：同步更新 History 中对应的 Reading
    // ----------------------------------
    setCurrentReading(updatedReading);
    setReadingContent(updatedReading.content);
    updateHistory(updatedReading);

  } catch (err) {
    console.error(err);

    // ==============================
    // Step 4：如果 AI 出错
    // 给用户一个友好的提示
    // ==============================

    const errorMessage: ReadingMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content:
        "Sorry, I couldn't generate a follow-up right now. Please try again.",
      createdAt: new Date().toISOString(),
    };

    setConversation([
      ...conversationWithUser,
      errorMessage,
    ]);
    
  } finally {
  // 不管成功还是失败，都停止 loading
    setChatLoading(false);
  }

}


  
  function handleEndChat() {
    const now = new Date().toISOString();

    if (currentReading) {
      setCurrentReading({
        ...currentReading,
        status: "completed",
        updatedAt: now,
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
        />

        <ChatInput
          input={input}
          setInput={setInput}
          onSend={() => handleSend()}
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