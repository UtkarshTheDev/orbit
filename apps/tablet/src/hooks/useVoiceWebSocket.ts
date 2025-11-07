import { useCallback, useEffect, useRef, useState } from "react";
import { useSessionStore } from "@/lib/sessionStore";

// Client-side streaming session management
interface StreamingChunk {
	sequence: number;
	chunk: string;
	timestamp: number;
	processed: boolean;
}

interface ClientStreamSession {
	sessionId: string;
	queryId: string;
	chunks: Map<number, StreamingChunk>;
	lastProcessedSequence: number;
	expectedSequence: number;
	fullText: string;
	isComplete: boolean;
	startTime: number;
}

class StreamingSessionManager {
	private sessions = new Map<string, ClientStreamSession>();
	private readonly MAX_SESSION_AGE = 60000; // Clean up sessions after 60s

	createSession(sessionId: string, queryId: string): ClientStreamSession {
		const session: ClientStreamSession = {
			sessionId,
			queryId,
			chunks: new Map(),
			lastProcessedSequence: -1,
			expectedSequence: 0,
			fullText: "",
			isComplete: false,
			startTime: Date.now(),
		};
		this.sessions.set(sessionId, session);
		console.log(`[StreamManager] Created session: ${sessionId}`);
		return session;
	}

	getSession(sessionId: string): ClientStreamSession | undefined {
		return this.sessions.get(sessionId);
	}

	addChunk(
		sessionId: string,
		sequence: number,
		chunk: string,
		timestamp: number,
		isFinal: boolean,
	): { text: string; hasGaps: boolean } {
		const session = this.sessions.get(sessionId);
		if (!session) {
			console.warn(`[StreamManager] Session not found: ${sessionId}`);
			return { text: "", hasGaps: false };
		}

		// Check for duplicate
		if (session.chunks.has(sequence)) {
			console.log(`[StreamManager] Duplicate chunk detected: seq ${sequence}`);
			return { text: session.fullText, hasGaps: false };
		}

		// Store chunk
		session.chunks.set(sequence, {
			sequence,
			chunk,
			timestamp,
			processed: false,
		});

		console.log(
			`[StreamManager] Added chunk: seq ${sequence}, length ${chunk.length}, final: ${isFinal}`,
		);

		// Mark as complete if final
		if (isFinal) {
			session.isComplete = true;
		}

		// Process chunks in order
		return this.processChunks(session);
	}

	private processChunks(session: ClientStreamSession): {
		text: string;
		hasGaps: boolean;
	} {
		let hasGaps = false;

		// Process all sequential chunks starting from expected sequence
		while (true) {
			const chunk = session.chunks.get(session.expectedSequence);

			if (!chunk || chunk.processed) {
				break;
			}

			// Process this chunk
			session.fullText += chunk.chunk;
			chunk.processed = true;
			session.lastProcessedSequence = session.expectedSequence;
			session.expectedSequence++;

			console.log(
				`[StreamManager] Processed chunk: seq ${chunk.sequence}, total length: ${session.fullText.length}`,
			);
		}

		// Check for gaps (missing sequences)
		if (!session.isComplete) {
			const maxSequence = Math.max(...Array.from(session.chunks.keys()));
			if (maxSequence > session.expectedSequence) {
				hasGaps = true;
				console.warn(
					`[StreamManager] Gap detected: expected ${session.expectedSequence}, have up to ${maxSequence}`,
				);
			}
		}

		return { text: session.fullText, hasGaps };
	}

	completeSession(sessionId: string): string {
		const session = this.sessions.get(sessionId);
		if (!session) {
			return "";
		}

		// Force process any remaining chunks
		session.isComplete = true;
		const result = this.processChunks(session);

		console.log(
			`[StreamManager] Session complete: ${sessionId}, total chunks: ${session.chunks.size}, final length: ${result.text.length}`,
		);

		return result.text;
	}

	cleanupSession(sessionId: string): void {
		this.sessions.delete(sessionId);
		console.log(`[StreamManager] Cleaned up session: ${sessionId}`);
	}

	cleanupOldSessions(): void {
		const now = Date.now();
		for (const [sessionId, session] of this.sessions.entries()) {
			if (now - session.startTime > this.MAX_SESSION_AGE) {
				this.cleanupSession(sessionId);
			}
		}
	}
}

type VoiceStage =
	| "idle"
	| "listening"
	| "uploading"
	| "analyzing"
	| "thinking"
	| "searching"
	| "responding"
	| "done"
	| "error";

interface VoiceResponse {
	stage: VoiceStage;
	transcribedText?: string;
	aiText?: string;
	aiTextChunk?: string;
	ttsAudio?: string;
	ttsDuration?: number;
	error?: string;
	webSearchActive?: boolean;
}

interface UseVoiceWebSocketReturn {
	sendVoiceQuery: (audioBase64: string, format: string) => void;
	sendTextQuery: (text: string, tts?: boolean) => void;
	response: VoiceResponse;
	resetResponse: () => void;
}

/**
 * Hook to handle WebSocket communication for voice queries
 * Sends audio to backend and receives STT, AI, and TTS responses
 */
export const useVoiceWebSocket = (): UseVoiceWebSocketReturn => {
	const sendWs = useSessionStore((s) => s.sendWs);
	const ws = useSessionStore((s) => s.ws);
	const wsReady = useSessionStore((s) => s.wsReady);

	const [response, setResponse] = useState<VoiceResponse>({ stage: "idle" });
	const currentQueryIdRef = useRef<string | null>(null);
	const streamManagerRef = useRef(new StreamingSessionManager());
	const currentSessionIdRef = useRef<string | null>(null);

	// Listen to WebSocket messages
	useEffect(() => {
		if (!ws || !wsReady) return;

		const handleMessage = (event: MessageEvent) => {
			try {
				const msg = JSON.parse(event.data);

				// Handle streaming session start
				if (msg.type === "ai_stream_start") {
					const { sessionId, queryId } = msg;
					console.log(
						`[VoiceWS] Stream started: session ${sessionId}, query ${queryId}`,
					);

					// Create new streaming session
					streamManagerRef.current.createSession(sessionId, queryId);
					currentSessionIdRef.current = sessionId;

					setResponse((prev) => ({
						...prev,
						stage: "thinking",
						aiText: "",
						aiTextChunk: "",
					}));
				}
				// Only process voice-related messages
				else if (msg.type === "status") {
					// Map backend stages to frontend stages
					const stageMap: Record<string, VoiceStage> = {
						received: "uploading",
						uploading: "uploading",
						analyzing: "analyzing",
						thinking: "thinking",
						tts: "responding",
					};

					const stage = stageMap[msg.stage] || "idle";
					setResponse((prev) => ({ ...prev, stage }));
					console.log(`[VoiceWS] Status: ${msg.stage} -> ${stage}`);
				} else if (msg.type === "web_search_active") {
					setResponse((prev) => ({
						...prev,
						stage: "searching",
						webSearchActive: true,
					}));
					console.log(`[VoiceWS] Web search active: ${msg.message}`);
				} else if (msg.type === "stt_done") {
					setResponse((prev) => ({
						...prev,
						stage: "thinking",
						transcribedText: msg.text,
					}));
					console.log(`[VoiceWS] STT done: ${msg.text}`);
				} else if (msg.type === "ai_stream") {
					const { sessionId, sequence, chunk, final, timestamp } = msg;

					if (!sessionId || sequence === undefined) {
						console.warn("[VoiceWS] Invalid stream chunk format");
						return;
					}

					// Add chunk to session manager
					const result = streamManagerRef.current.addChunk(
						sessionId,
						sequence,
						chunk,
						timestamp,
						final,
					);

					// Update response with ordered text
					setResponse((prev) => ({
						...prev,
						stage: "thinking",
						aiTextChunk: chunk,
						aiText: result.text,
					}));

					// If final chunk, complete the session
					if (final) {
						const finalText =
							streamManagerRef.current.completeSession(sessionId);
						console.log(`[VoiceWS] Stream complete: ${finalText.length} chars`);

						// Cleanup after a delay
						setTimeout(() => {
							streamManagerRef.current.cleanupSession(sessionId);
							currentSessionIdRef.current = null;
						}, 5000);
					}
				} else if (msg.type === "ai_done") {
					const { sessionId, text, totalChunks } = msg;

					// Verify session completion
					if (sessionId && currentSessionIdRef.current === sessionId) {
						const session = streamManagerRef.current.getSession(sessionId);
						if (session) {
							console.log(
								`[VoiceWS] AI done: ${text.length} chars, ${totalChunks} chunks, received ${session.chunks.size} chunks`,
							);

							// Use the accumulated text from streaming if available, otherwise use the full text
							const finalText = session.fullText || text;

							setResponse((prev) => ({
								...prev,
								stage: "responding",
								aiText: finalText,
							}));
						}
					} else {
						// Fallback for non-streaming or old format
						setResponse((prev) => ({
							...prev,
							stage: "responding",
							aiText: text,
						}));
						console.log(`[VoiceWS] AI done: ${text.substring(0, 100)}...`);
					}
				} else if (msg.type === "tts_ready") {
					setResponse((prev) => ({
						...prev,
						stage: "responding",
						ttsAudio: msg.audio,
						ttsDuration: msg.duration,
					}));
					console.log(`[VoiceWS] TTS ready: ${msg.duration}s`);
				} else if (msg.type === "error") {
					setResponse((prev) => ({
						...prev,
						stage: "error",
						error: msg.message || "An error occurred",
					}));
					console.error(`[VoiceWS] Error: ${msg.message}`);
				}
			} catch (err) {
				console.error("[VoiceWS] Failed to parse message:", err);
			}
		};

		ws.addEventListener("message", handleMessage);

		// Periodic cleanup of old sessions
		const cleanupInterval = setInterval(() => {
			streamManagerRef.current.cleanupOldSessions();
		}, 30000); // Every 30 seconds

		return () => {
			ws.removeEventListener("message", handleMessage);
			clearInterval(cleanupInterval);
		};
	}, [ws, wsReady]);

	const sendVoiceQuery = useCallback(
		(audioBase64: string, format: string) => {
			if (!wsReady) {
				console.error("[VoiceWS] WebSocket not ready");
				setResponse({ stage: "error", error: "Connection not ready" });
				return;
			}

			// Generate unique ID for this query
			const queryId = `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
			currentQueryIdRef.current = queryId;

			// Reset response state
			setResponse({ stage: "uploading" });

			// Extract format from base64 string if it has data URL prefix
			let audioFormat = format;
			if (audioBase64.startsWith("data:audio/")) {
				const match = audioBase64.match(/data:audio\/([^;]+)/);
				if (match) {
					audioFormat = match[1];
				}
			}

			// Send voice query message
			const message = {
				type: "voice_query",
				id: queryId,
				format: audioFormat,
				data: audioBase64,
			};

			console.log(
				`[VoiceWS] Sending voice query: ${queryId}, format: ${audioFormat}`,
			);
			sendWs(message);
		},
		[wsReady, sendWs],
	);

	const sendTextQuery = useCallback(
		(text: string, tts: boolean = false) => {
			if (!wsReady) {
				console.error("[VoiceWS] WebSocket not ready");
				setResponse({ stage: "error", error: "Connection not ready" });
				return;
			}

			// Generate unique ID for this query
			const queryId = `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
			currentQueryIdRef.current = queryId;

			// Reset response state
			setResponse({ stage: "thinking" });

			// Send text query message
			const message = {
				type: "text_query",
				id: queryId,
				text: text,
				tts,
			};

			console.log(
				`[VoiceWS] Sending text query: ${queryId}, text: ${text}, TTS: ${tts}`,
			);
			sendWs(message);
		},
		[wsReady, sendWs],
	);

	const resetResponse = useCallback(() => {
		setResponse({ stage: "idle" });
		currentQueryIdRef.current = null;

		// Cleanup current session if any
		if (currentSessionIdRef.current) {
			streamManagerRef.current.cleanupSession(currentSessionIdRef.current);
			currentSessionIdRef.current = null;
		}
	}, []);

	return {
		sendVoiceQuery,
		sendTextQuery,
		response,
		resetResponse,
	};
};
