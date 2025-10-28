"use client";

import { useState } from "react";
import { OrbitChat, type Message } from "@/components/aichat/Chat";

// Mock AI response generator
const generateMockAIResponse = async (userMessage: string): Promise<string> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const responses = [
    `I understand you said: "${userMessage}". Let me help you with that! Here's some **important information** you should know.`,
    `That's an interesting question about "${userMessage}". Let me break it down:\n\n- First point to consider\n- Second important aspect\n- Third key element`,
    `Great point! Regarding "${userMessage}", here's what I think:\n\n**Key Points:**\n- First consideration\n- Second aspect\n- Third element\n\nI hope this helps clarify things!`,
    `Let me break down "${userMessage}" for you:\n\n1. **Analysis**: This is a complex topic\n2. **Solution**: We can approach it systematically\n3. **Result**: Here's a practical example\n\n\`\`\`javascript\nconst example = "code block";\nconsole.log(example);\n\`\`\``,
  ];

  return responses[Math.floor(Math.random() * responses.length)];
};

interface HomeProps {
  onBack?: () => void;
  onNavigateToVoice?: () => void;
}

export default function Home({ onBack, onNavigateToVoice }: HomeProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const revealSpeed = 20;

  const handleSend = async (text: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Generate AI response
    const aiResponse = await generateMockAIResponse(text);

    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: aiResponse,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, aiMessage]);
  };

  const handleTalkClick = () => {
    onNavigateToVoice?.();
  };

  const handleClearChat = () => {
    setMessages([]);
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
        tokenRevealSpeedMs={revealSpeed}
        onStreamStop={() => console.log("Stream stopped")}
        onError={(error) => console.error("Chat error:", error)}
        onMessageRendered={(id) => console.log("Message rendered:", id)}
      />
    </div>
  );
}
