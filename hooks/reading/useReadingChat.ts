// 普通后续聊天
// 1. imports
// 2. Hook参数类型
// 3. useReadingChat函数
// 4. input State
// 5. chatLoading State
// 6. 从 Store读取 updateCurrentReading
// 7. sendMessage函数
// 8. return


"use client"; 
import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import { useTarotStore } from "@/store/tarotStore";
import type {
  Reading,
  ReadingMessage,
} from "@/types/reading";



// 这个Hook接收什么参数类型
// 1. currentReading：当前完整咨询（原始问题，牌阵，卡牌，以及解读，当前推荐问题）
// 2. conversation：页面当前显示的聊天记录  
// 3. setConversation：ReadingPage传给 Hook 的状态修改函数。 

type UseReadingChatParams = {
  currentReading: Reading | null;
  conversation: ReadingMessage[];
  chatLoading: boolean;
  setConversation: Dispatch<
    SetStateAction<ReadingMessage[]>
  >;
  setChatLoading: Dispatch<
    SetStateAction<boolean>
  >;
};
// Hook返回类型
type ReadingChatResponse = {
  message: string;
  followUps?: string[];
  shouldDrawClarificationCard: boolean;
  clarificationReason: string;
  clarificationQuestion: string;
};

export function useReadingChat({
  currentReading,
  conversation,
  setConversation,
  chatLoading,
  setChatLoading,
}: UseReadingChatParams) {

    // Hook内部管理
    const [input, setInput] = useState(""); // 保存聊天输入框内容。
    // const [chatLoading, setChatLoading] = useState(false); // 表示是否正在等待后续 AI回复。
    // 从 Store读取 updateCurrentReading
    const updateCurrentReading = useTarotStore(
        (state) => state.updateCurrentReading
    );

    async function sendMessage(message?: string) {
        const text = (message ?? input).trim(); // 如果传入了 message 参数，则使用它，否则使用 input 状态。
        if (!text || !currentReading || chatLoading) return; // 检查文本是否为空，以及当前咨询是否存在。

        // 创建用户信息
        const userMessage: ReadingMessage = {
            id: crypto.randomUUID(),
            role: "user",
            content: text,
            createdAt: new Date().toISOString(),
        };

        const conversationWithUser = [
            ...conversation,
            userMessage,
        ];

        // 立即显示用户消息
        setConversation(conversationWithUser);
        // 清空输入框
        setInput("");
        // 设置加载状态
        setChatLoading(true);

        // 调用 /api/reading-chat
        try {
            const response = await fetch("/api/reading-chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    reading: {
                        ...currentReading,
                        conversation: conversationWithUser,
                    },
                    message: text,
    
                }),
            });

            if (!response.ok) {
                throw new Error(
                    "Failed to generate follow-up response."
                );
            }

            // 解析响应
            const data =
            (await response.json()) as ReadingChatResponse;

            // 创建 AI消息
            const assistantMessage: ReadingMessage = {
                id: crypto.randomUUID(),
                role: "assistant",
                content: data.message,
                createdAt: new Date().toISOString(),
                clarificationSuggestion: data.shouldDrawClarificationCard
                    ? {
                          reason: data.clarificationReason,
                          question: data.clarificationQuestion,
                          status: "pending",
                      }
                    : undefined,    
            };

            const finalConversation = [
                ...conversationWithUser,
                assistantMessage,
            ];

            const updatedContent = {
                ...currentReading.content,
                followUps:
                    data.followUps ??
                    currentReading.content.followUps,
            };

            // 更新页面 Conversation
            setConversation(finalConversation);
            // 更新 Zustand中的 Reading，Zustand同步 History和 localStorage
            updateCurrentReading({
                conversation: finalConversation,
                content: updatedContent,
            });
        } catch (error) {
                console.error(
                    "Reading chat request failed:",
                    error
                );

            const errorMessage: ReadingMessage = {
                id: crypto.randomUUID(),
                role: "assistant",
                content:
                    "Sorry, I couldn't generate a follow-up right now. Please try again.",
                createdAt: new Date().toISOString(),
            };

            const errorConversation = [
                ...conversationWithUser,
                errorMessage,
            ];

            setConversation(errorConversation);
            updateCurrentReading({
                conversation: errorConversation,
            });
        } finally {
            setChatLoading(false);
        }
    }
    return {
        input,
        setInput,
        sendMessage,
    };
}