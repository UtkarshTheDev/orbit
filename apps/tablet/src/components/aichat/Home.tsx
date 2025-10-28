"use client";

import { useState, useEffect } from "react";
import { OrbitChat, type Message } from "@/components/aichat/Chat";
import { useVoiceWebSocket } from "@/hooks/useVoiceWebSocket";

interface HomeProps {
  onBack?: () => void;
  onNavigateToVoice?: () => void;
}

export default function Home({ onBack, onNavigateToVoice }: HomeProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const { sendTextQuery, response, resetResponse } = useVoiceWebSocket();

  // Handle WebSocket response updates
  useEffect(() => {
    const { stage, aiText, aiTextChunk, error } = response;

    if (error) {
      console.error("[Home] WebSocket error:", error);
      setStreamingMessageId(null);
      // Add error message
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        role: "assistant",
        content: `Sorry, I encountered an error: ${error}`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, errorMessage]);
      return;
    }

    if (aiTextChunk && streamingMessageId) {
      // Update the streaming message in real-time by appending the chunk
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === streamingMessageId) {
            return { ...msg, content: msg.content + aiTextChunk };
          }
          return msg;
        })
      );
    }

    if (stage === "responding" && aiText && streamingMessageId) {
      // AI response is complete
      setStreamingMessageId(null);
    }
  }, [response, streamingMessageId]);

  const handleSend = async (text: string) => {
    // Add user message
    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Create streaming AI message placeholder
    const messageId = `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setStreamingMessageId(messageId);

    const streamingMessage: Message = {
      id: messageId,
      role: "assistant",
      content: "", // Will be updated as we stream
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, streamingMessage]);

    // Send via WebSocket without TTS
    resetResponse();
    sendTextQuery(text, false); // TTS disabled
  };

  const handleTalkClick = () => {
    onNavigateToVoice?.();
  };


  return (
    <div className="relative h-screen">
      {onBack && (
        <button
          className="absolute top-6 left-6 z-20 flex items-center gap-2 rounded-xl bg-white/90 px-4 py-2.5 font-sans text-gray-700 text-sm shadow-lg backdrop-blur-sm transition-all duration-200 hover:bg-white hover:shadow-xl active:scale-95"
          onClick={onBack}
          type="button"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="font-medium">Back</span>
        </button>
      )}
      <OrbitChat
        messages={messages}
        onSend={handleSend}
        onTalkClick={handleTalkClick}
        onError={(error) => console.error("Chat error:", error)}
      />
    </div>
  );
}
