"use client";

import { Bot, Mic, Send, User } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import PillSuggestions from "@/components/voice/PillSuggestions";
import { Input } from "../ui/input";

export interface Message {
	id: string;
	role: "user" | "assistant" | "system";
	content: string;
	timestamp?: string;
}

export interface OrbitChatProps {
	messages: Message[];
	onSend: (text: string) => Promise<void>;
	onTalkClick?: () => void;
	onError?: (error: Error) => void;
	isSearching?: boolean;
}

function MarkdownContent({ content }: { content: string }) {
	const parseMarkdown = (text: string) => {
		const lines = text.split("\n");
		const elements: React.ReactNode[] = [];
		let inCodeBlock = false;
		let codeBlockContent: string[] = [];

		lines.forEach((line, index) => {
			if (line.startsWith("```")) {
				if (!inCodeBlock) {
					inCodeBlock = true;
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

function AnimatedContent({ content }: { content: string }) {
	const [displayedContent, setDisplayedContent] = useState("");
	const [currentWordIndex, setCurrentWordIndex] = useState(0);

	const words = content.split(" ");

	useEffect(() => {
		setDisplayedContent("");
		setCurrentWordIndex(0);
	}, [content]);

	useEffect(() => {
		if (currentWordIndex < words.length) {
			const timer = setTimeout(() => {
				setDisplayedContent(
					(prev) => prev + (prev ? " " : "") + words[currentWordIndex],
				);
				setCurrentWordIndex((prev) => prev + 1);
			}, 100); // Word-by-word animation speed

			return () => clearTimeout(timer);
		}
	}, [currentWordIndex, words]);

	return <MarkdownContent content={displayedContent} />;
}

export function OrbitChat({
	messages,
	onSend,
	onTalkClick,
	onError,
	isSearching = false,
}: OrbitChatProps) {
	const [input, setInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	const handleSend = async () => {
		if (!input.trim() || isLoading) return;

		const text = input.trim();
		setInput("");
		setIsLoading(true);

		try {
			await onSend(text);
		} catch (error) {
			onError?.(error as Error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleSend();
		}
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setInput(e.target.value);
	};

	const hasMessages = messages.length > 0;

	return (
		<div className="flex flex-col h-screen max-h-screen orbit-bg">
			{!hasMessages ? (
				<div className="flex-1 flex flex-col items-center justify-center px-8 py-12 animate-fade-in">
					<div className="text-center space-y-12 max-w-4xl w-full">
						<div className="space-y-6">
							<h1 className="text-6xl md:text-7xl lg:text-8xl font-orbitron font-bold tracking-tight text-foreground mb-4">
								Orbit <span className="text-primary">AI</span>
							</h1>
							<p className="text-lg md:text-xl lg:text-2xl text-muted-foreground font-normal leading-relaxed max-w-2xl mx-auto">
								Ask me anything, and I'll help you find the answers
							</p>
						</div>

						<div className="w-full max-w-4xl mx-auto pt-8">
							<div className="flex items-center gap-4 bg-card border-2 border-border rounded-3xl px-4 py-2 hover:border-primary/40 transition-all duration-300">
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
									<Input
										ref={inputRef}
										value={input}
										onChange={handleInputChange}
										onKeyDown={handleKeyDown}
										placeholder="Type your message here..."
										disabled={isLoading}
										className="h-12 border-0 focus-visible:ring-0 shadow-none bg-transparent rounded-lg px-2 text-lg placeholder:text-muted-foreground/50 transition-all md:text-xl"
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

						<div className="mt-8">
							<PillSuggestions
								onPillClick={(suggestion) => {
									setInput(suggestion);
									if (inputRef.current) {
										inputRef.current.focus();
									}
								}}
							/>
						</div>
					</div>
				</div>
			) : (
				<>
					<div className="flex-1 overflow-y-auto px-6 py-8 space-y-8 md:px-10 lg:px-16">
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
											) : message.content ? (
												<AnimatedContent content={message.content} />
											) : (
												<div className="flex items-center gap-2">
													<div className="flex gap-1">
														<span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0ms]"></span>
														<span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:150ms]"></span>
														<span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:300ms]"></span>
													</div>
													<span className="text-sm font-medium text-muted-foreground">
														{isSearching
															? "Searching on internet..."
															: "Thinking..."}
													</span>
												</div>
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
						{isLoading &&
							messages.length > 0 &&
							messages[messages.length - 1].role === "user" && (
								<div className="flex gap-4 animate-fade-in">
									<div className="flex flex-col items-center gap-2 flex-shrink-0">
										<div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 text-white animate-breathe">
											<Bot className="w-6 h-6" />
										</div>
										<span className="text-xs font-orbitron font-semibold text-muted-foreground">
											Orbit AI
										</span>
									</div>
									<div className="flex flex-col gap-2 max-w-[80%] md:max-w-[70%]">
										<div className="rounded-2xl px-5 py-4 bg-card border border-border text-card-foreground">
											<div className="flex items-center gap-2">
												<div className="flex gap-1">
													<span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0ms]"></span>
													<span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:150ms]"></span>
													<span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:300ms]"></span>
												</div>
												<span className="text-sm font-medium text-muted-foreground">
													{isSearching
														? "Searching on internet..."
														: "Thinking..."}
												</span>
											</div>
										</div>
									</div>
								</div>
							)}
						<div ref={messagesEndRef} />
					</div>

					<div className="border-t border-border bg-card px-6 py-6 md:px-10 lg:px-16">
						<div className="max-w-5xl mx-auto">
							<div className="flex items-center gap-4 bg-card border-2 border-border rounded-2xl px-4 py-2 hover:border-primary/40 transition-all duration-300">
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
									<Input
										ref={inputRef}
										value={input}
										onChange={handleInputChange}
										onKeyDown={handleKeyDown}
										placeholder="Message Orbit..."
										disabled={isLoading}
										className="h-12 border-0 focus-visible:ring-0 shadow-none bg-transparent rounded-lg px-2 text-lg placeholder:text-muted-foreground/50 transition-all md:text-xl"
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
