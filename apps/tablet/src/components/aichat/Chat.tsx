"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Mic, User, Bot } from "lucide-react";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
}

export interface OrbitChatProps {
  messages: Message[];
  onSend: (text: string) => Promise<void>;
  aiAvatar?: string;
  userAvatar?: string;
  onTalkClick?: () => void;
  tokenRevealSpeedMs?: number;
  onStreamStop?: () => void;
  onError?: (error: Error) => void;
  onMessageRendered?: (messageId: string) => void;
}

function MarkdownContent({ content }: { content: string }) {
  const parseMarkdown = (text: string) => {
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let codeBlockLang = "";

    lines.forEach((line, index) => {
      if (line.startsWith("```")) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeBlockLang = line.slice(3).trim();
          codeBlockContent = [];
        } else {
          inCodeBlock = false;
          elements.push(
            <pre
              key={`code-${index}`}
              className="bg-muted p-3 rounded-md overflow-x-auto my-2"
            >
              <code className="text-sm text-foreground">
                {codeBlockContent.join("\n")}
              </code>
            </pre>,
          );
          codeBlockContent = [];
        }
        return;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        return;
      }

      const processedLine = line;
      const boldRegex = /\*\*(.+?)\*\*/g;
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;
      let match;

      while ((match = boldRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(processedLine.slice(lastIndex, match.index));
        }
        parts.push(
          <strong key={`bold-${index}-${match.index}`}>{match[1]}</strong>,
        );
        lastIndex = match.index + match[0].length;
      }

      if (lastIndex < processedLine.length) {
        parts.push(processedLine.slice(lastIndex));
      }

      const finalLine = parts.length > 0 ? parts : processedLine;

      const inlineCodeRegex = /`(.+?)`/g;
      const processInlineCode = (content: React.ReactNode) => {
        if (typeof content !== "string") return content;
        const codeParts: React.ReactNode[] = [];
        let lastIdx = 0;
        let codeMatch;

        while ((codeMatch = inlineCodeRegex.exec(content)) !== null) {
          if (codeMatch.index > lastIdx) {
            codeParts.push(content.slice(lastIdx, codeMatch.index));
          }
          codeParts.push(
            <code
              key={`code-${codeMatch.index}`}
              className="bg-muted px-1 py-0.5 rounded text-sm"
            >
              {codeMatch[1]}
            </code>,
          );
          lastIdx = codeMatch.index + codeMatch[0].length;
        }

        if (lastIdx < content.length) {
          codeParts.push(content.slice(lastIdx));
        }

        return codeParts.length > 0 ? codeParts : content;
      };

      if (line.match(/^[-*]\s/)) {
        elements.push(
          <li key={`li-${index}`} className="ml-4">
            {Array.isArray(finalLine)
              ? finalLine.map(processInlineCode)
              : processInlineCode(finalLine)}
          </li>,
        );
      } else if (line.match(/^\d+\.\s/)) {
        elements.push(
          <li key={`li-${index}`} className="ml-4 list-decimal">
            {Array.isArray(finalLine)
              ? finalLine.map(processInlineCode)
              : processInlineCode(finalLine)}
          </li>,
        );
      } else if (line.trim() === "") {
        elements.push(<br key={`br-${index}`} />);
      } else {
        elements.push(
          <p key={`p-${index}`} className="leading-relaxed">
            {Array.isArray(finalLine)
              ? finalLine.map(processInlineCode)
              : processInlineCode(finalLine)}
          </p>,
        );
      }
    });

    return elements;
  };

  return <div className="space-y-1 text-sm">{parseMarkdown(content)}</div>;
}

export function OrbitChat({
  messages,
  onSend,
  aiAvatar,
  userAvatar,
  onTalkClick,
  tokenRevealSpeedMs = 20,
  onStreamStop,
  onError,
  onMessageRendered,
}: OrbitChatProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const text = input.trim();
    setInput("");
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      await onSend(text);
    } catch (error) {
      onError?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);

    const textarea = e.target;
    textarea.style.height = "auto";
    const newHeight = Math.min(textarea.scrollHeight, 144);
    textarea.style.height = `${newHeight}px`;
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-screen max-h-screen orbit-bg">
      {!hasMessages ? (
        <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 animate-fade-in">
          <div className="text-center space-y-12 max-w-4xl w-full">
            <div className="space-y-6">
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-orbitron font-bold tracking-tight text-foreground">
                Orbit <span className="text-primary">AI</span>
              </h1>
              <p className="text-2xl md:text-3xl lg:text-4xl text-muted-foreground font-normal leading-relaxed">
                Ask me anything, and I'll help you find the answers
              </p>
            </div>

            <div className="w-full max-w-4xl mx-auto pt-8">
              <div className="flex items-end gap-4 bg-card border-2 border-border rounded-3xl p-4 hover:border-primary/40 transition-all duration-300">
                <Button
                  type="button"
                  size="icon"
                  onClick={onTalkClick}
                  className="w-14 h-14 rounded-2xl flex-shrink-0 bg-primary/10 text-primary border-2 border-primary/20 active:scale-95 transition-transform"
                  aria-label="Voice input"
                >
                  <Mic className="w-6 h-6" />
                </Button>

                <div className="flex-1 relative">
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={handleTextareaChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message here..."
                    disabled={isLoading}
                    className="min-h-[48px] max-h-[144px] resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent rounded-lg px-4 py-3 text-base placeholder:text-muted-foreground/50 transition-all duration-200"
                    rows={1}
                  />
                </div>

                <Button
                  type="button"
                  size="icon"
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="w-14 h-14 rounded-2xl flex-shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground active:scale-95 transition-transform"
                  aria-label="Send message"
                >
                  <Send className="w-6 h-6" />
                </Button>
              </div>

              <p className="text-base text-muted-foreground text-center mt-5">
                Tap Send to submit your message
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto px-6 py-8 space-y-8 md:px-10 lg:px-16"
          >
            {messages.map((message) => {
              const isUser = message.role === "user";

              return (
                <div
                  key={message.id}
                  className={`flex gap-4 animate-fade-in ${isUser ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div className="flex flex-col items-center gap-2 flex-shrink-0">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isUser
                          ? "bg-primary text-primary-foreground"
                          : "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                      } ${!isUser && "animate-breathe"}`}
                    >
                      {isUser ? (
                        <User className="w-6 h-6" />
                      ) : (
                        <Bot className="w-6 h-6" />
                      )}
                    </div>
                    <span className="text-xs font-orbitron font-semibold text-muted-foreground">
                      {isUser ? "You" : "Orbit AI"}
                    </span>
                  </div>

                  <div
                    className={`flex flex-col gap-2 max-w-[80%] md:max-w-[70%]`}
                  >
                    <div
                      className={`rounded-2xl px-5 py-4 ${
                        isUser
                          ? "bg-primary text-primary-foreground ml-auto"
                          : "bg-card border border-border text-card-foreground"
                      }`}
                    >
                      {isUser ? (
                        <p className="text-base leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </p>
                      ) : (
                        <MarkdownContent content={message.content} />
                      )}
                    </div>

                    {message.timestamp && (
                      <span className="text-sm text-muted-foreground px-2">
                        {message.timestamp}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-border bg-card px-6 py-6 md:px-10 lg:px-16">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-end gap-4">
                <Button
                  type="button"
                  size="icon"
                  onClick={onTalkClick}
                  className="w-14 h-14 rounded-full flex-shrink-0 bg-primary/10 text-primary border-2 border-primary/30 active:scale-95 transition-transform"
                  aria-label="Talk with Orbit"
                >
                  <Mic className="w-6 h-6" />
                </Button>

                <div className="flex-1 relative">
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={handleTextareaChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Message Orbit..."
                    disabled={isLoading}
                    className="min-h-[48px] max-h-[144px] resize-none pr-4 rounded-2xl border-input focus-visible:ring-2 focus-visible:ring-ring text-base py-3 px-4"
                    rows={1}
                  />
                </div>

                <Button
                  type="button"
                  size="icon"
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="w-14 h-14 rounded-full flex-shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground active:scale-95 transition-transform"
                  aria-label="Send message"
                >
                  <Send className="w-6 h-6" />
                </Button>
              </div>

              <p className="text-base text-muted-foreground text-center mt-4">
                Tap Send to submit your message
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
