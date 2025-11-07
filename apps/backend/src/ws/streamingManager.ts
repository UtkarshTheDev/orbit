/**
 * Streaming Manager - Centralized streaming session management for AI responses
 * Provides sequence numbering, buffering, and retransmission capabilities
 */

import type { WSConnection } from "./connection";

export interface StreamingSession {
  sessionId: string;
  queryId: string;
  sequenceNumber: number;
  chunks: string[];
  startTime: number;
  lastActivityTime: number;
}

export class StreamingManager {
  private sessions = new Map<string, StreamingSession>();
  private readonly SESSION_TIMEOUT = 60000; // 60 seconds
  private readonly CHUNK_MIN_SIZE = 5; // Minimum characters before sending
  private readonly CHUNK_MAX_DELAY = 100; // Maximum delay in ms before flushing

  /**
   * Create a new streaming session
   */
  createSession(queryId: string): StreamingSession {
    const sessionId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session: StreamingSession = {
      sessionId,
      queryId,
      sequenceNumber: 0,
      chunks: [],
      startTime: Date.now(),
      lastActivityTime: Date.now(),
    };
    this.sessions.set(sessionId, session);
    console.log(`[StreamManager] Created session: ${sessionId} for query: ${queryId}`);
    return session;
  }

  /**
   * Get an existing session
   */
  getSession(sessionId: string): StreamingSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Send stream start marker to client
   */
  sendStreamStart(ws: WSConnection, session: StreamingSession): void {
    ws.send(
      JSON.stringify({
        type: "ai_stream_start",
        sessionId: session.sessionId,
        queryId: session.queryId,
        timestamp: Date.now(),
      })
    );
    console.log(`[StreamManager] Sent stream start for session: ${session.sessionId}`);
  }

  /**
   * Send a streaming chunk with sequence number and metadata
   */
  sendChunk(
    ws: WSConnection,
    session: StreamingSession,
    chunk: string,
    isFinal: boolean = false
  ): void {
    // Skip empty chunks unless it's the final marker
    if (!chunk && !isFinal) {
      return;
    }

    // Update activity time
    session.lastActivityTime = Date.now();

    // Get and increment sequence number
    const sequenceNumber = session.sequenceNumber++;

    // Store chunk for potential retransmission
    if (chunk) {
      session.chunks.push(chunk);
    }

    // Send chunk with metadata
    ws.send(
      JSON.stringify({
        type: "ai_stream",
        sessionId: session.sessionId,
        queryId: session.queryId,
        sequence: sequenceNumber,
        chunk,
        final: isFinal,
        timestamp: Date.now(),
      })
    );

    console.log(
      `[StreamManager] Sent chunk: session=${session.sessionId}, seq=${sequenceNumber}, len=${chunk.length}, final=${isFinal}`
    );
  }

  /**
   * Send stream completion marker
   */
  sendStreamEnd(
    ws: WSConnection,
    session: StreamingSession,
    fullText: string
  ): void {
    // Send final chunk marker
    this.sendChunk(ws, session, "", true);

    // Send ai_done message
    ws.send(
      JSON.stringify({
        type: "ai_done",
        sessionId: session.sessionId,
        text: fullText,
        totalChunks: session.sequenceNumber,
        timestamp: Date.now(),
      })
    );

    console.log(
      `[StreamManager] Stream complete: session=${session.sessionId}, chunks=${session.sequenceNumber}, length=${fullText.length}`
    );
  }

  /**
   * Create a buffered chunk sender with automatic flushing
   * Returns a function that buffers and sends chunks efficiently
   */
  createBufferedSender(
    ws: WSConnection,
    session: StreamingSession
  ): {
    sendChunk: (chunk: string) => void;
    flush: () => void;
  } {
    let buffer = "";
    let lastSendTime = Date.now();

    const flush = () => {
      if (buffer.length > 0) {
        this.sendChunk(ws, session, buffer, false);
        buffer = "";
        lastSendTime = Date.now();
      }
    };

    const sendChunk = (chunk: string) => {
      buffer += chunk;
      const now = Date.now();
      const timeSinceLastSend = now - lastSendTime;

      // Send if buffer is large enough or enough time has passed
      if (
        buffer.length >= this.CHUNK_MIN_SIZE ||
        timeSinceLastSend >= this.CHUNK_MAX_DELAY
      ) {
        flush();
      }
    };

    return { sendChunk, flush };
  }

  /**
   * Handle chunk retransmission request from client
   */
  retransmitChunk(
    ws: WSConnection,
    sessionId: string,
    sequence: number
  ): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(
        `[StreamManager] Retransmit failed: session not found: ${sessionId}`
      );
      return false;
    }

    if (sequence < 0 || sequence >= session.chunks.length) {
      console.warn(
        `[StreamManager] Retransmit failed: invalid sequence ${sequence} for session ${sessionId}`
      );
      return false;
    }

    const chunk = session.chunks[sequence];
    ws.send(
      JSON.stringify({
        type: "ai_stream",
        sessionId: session.sessionId,
        queryId: session.queryId,
        sequence: sequence,
        chunk: chunk,
        final: false,
        retransmit: true,
        timestamp: Date.now(),
      })
    );

    console.log(
      `[StreamManager] Retransmitted chunk: session=${sessionId}, seq=${sequence}`
    );
    return true;
  }

  /**
   * Cleanup a specific session
   */
  cleanupSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      const duration = Date.now() - session.startTime;
      console.log(
        `[StreamManager] Cleaned up session: ${sessionId}, duration=${duration}ms, chunks=${session.sequenceNumber}`
      );
      this.sessions.delete(sessionId);
    }
  }

  /**
   * Cleanup old sessions that have timed out
   */
  cleanupOldSessions(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      const age = now - session.lastActivityTime;
      if (age > this.SESSION_TIMEOUT) {
        this.cleanupSession(sessionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(
        `[StreamManager] Cleaned up ${cleanedCount} timed-out session(s)`
      );
    }
  }

  /**
   * Get statistics about active sessions
   */
  getStats(): {
    activeSessions: number;
    totalChunks: number;
    oldestSessionAge: number;
  } {
    const now = Date.now();
    let totalChunks = 0;
    let oldestAge = 0;

    for (const session of this.sessions.values()) {
      totalChunks += session.sequenceNumber;
      const age = now - session.startTime;
      if (age > oldestAge) {
        oldestAge = age;
      }
    }

    return {
      activeSessions: this.sessions.size,
      totalChunks,
      oldestSessionAge: oldestAge,
    };
  }
}

// Global streaming manager instance
export const streamingManager = new StreamingManager();

// Periodic cleanup of old sessions
setInterval(() => {
  streamingManager.cleanupOldSessions();
}, 30000); // Every 30 seconds
