import { create } from "zustand";

type SessionState = {
  isTablet: boolean;
  photoBoothActive: boolean;
  showMainApp: boolean;
  ws: WebSocket | null;
  wsReady: boolean;
  wsReconnecting: boolean;
  reconnectAttempts: number;
  messageQueue: unknown[];
  connectWs: () => void;
  sendWs: (msg: unknown) => void;
  setPhotoBoothActive: (val: boolean) => void;
  setShowMainApp: (val: boolean) => void;
};

// Connection configuration
const WS_CONFIG = {
  url: import.meta.env.VITE_WS_URL || "ws://localhost:3001",
  maxReconnectAttempts: 10,
  reconnectDelay: 1000, // Start with 1 second
  maxReconnectDelay: 30_000, // Max 30 seconds
  heartbeatInterval: 30_000, // 30 seconds
};

function detectTabletRole(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const params = new URLSearchParams(window.location.search);
  const isTablet = params.get("tablet") === "1";
  console.log("[Frontend] Role:", isTablet ? "tablet" : "phone");
  return isTablet;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  isTablet: detectTabletRole(),
  photoBoothActive: false,
  showMainApp: false,
  ws: null,
  wsReady: false,
  wsReconnecting: false,
  reconnectAttempts: 0,
  messageQueue: [],
  connectWs: () => {
    const state = get();
    if (state.ws && state.ws.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    if (state.wsReconnecting) {
      return; // Already reconnecting
    }

    console.log(`[Frontend] Connecting to WebSocket: ${WS_CONFIG.url}`);
    const ws = new WebSocket(WS_CONFIG.url);

    ws.onopen = () => {
      console.log("[Frontend] WebSocket connected successfully");
      const role = get().isTablet ? "tablet" : "phone";

      set({
        wsReady: true,
        wsReconnecting: false,
        reconnectAttempts: 0,
        ws,
      });

      // Send identification
      ws.send(JSON.stringify({ type: "identify", role }));
      console.log("[Frontend] WS connected, identified as:", role);

      // Send queued messages
      const queuedMessages = get().messageQueue;
      if (queuedMessages.length > 0) {
        console.log(
          `[Frontend] Sending ${queuedMessages.length} queued messages`
        );
        queuedMessages.forEach((msg) => {
          ws.send(JSON.stringify(msg));
        });
        set({ messageQueue: [] });
      }
    };

    ws.onclose = (event) => {
      console.log(
        "[Frontend] WebSocket connection closed:",
        event.code,
        event.reason
      );
      set({ wsReady: false, ws: null });

      // Auto-reconnect with exponential backoff
      if (
        !event.wasClean &&
        get().reconnectAttempts < WS_CONFIG.maxReconnectAttempts
      ) {
        const attempts = get().reconnectAttempts + 1;
        const delay = Math.min(
          WS_CONFIG.reconnectDelay * 2 ** (attempts - 1),
          WS_CONFIG.maxReconnectDelay
        );

        console.log(
          `[Frontend] Reconnecting in ${delay}ms (attempt ${attempts}/${WS_CONFIG.maxReconnectAttempts})`
        );
        set({ wsReconnecting: true, reconnectAttempts: attempts });

        setTimeout(() => {
          set({ wsReconnecting: false });
          get().connectWs();
        }, delay);
      }
    };

    ws.onerror = (error) => {
      console.error("[Frontend] WebSocket error:", error);
      set({ wsReady: false });
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        // Handle heartbeat
        if (msg.type === "ping") {
          ws.send(JSON.stringify({ type: "pong" }));
          return;
        }

        // Handle business logic
        if (msg.type === "photo_booth_requested" && get().isTablet) {
          set({ photoBoothActive: true });
          console.log("[Frontend] Photo booth activated");
        }
        if (msg.type === "photo_captured_sound" && get().isTablet) {
          // Trigger sound event without changing state
          console.log(
            "[SessionStore] Received photo_captured_sound, dispatching playPhotoSound event"
          );
          window.dispatchEvent(new CustomEvent("playPhotoSound"));
        }
        if (msg.type === "polaroid_queue_empty" && get().isTablet) {
          set({ photoBoothActive: false, showMainApp: true });
          console.log("[Frontend] Polaroid queue empty, showing main app");
        }
      } catch {
        // ignore non-JSON
      }
    };

    set({ ws });
  },
  sendWs: (msg) => {
    const state = get();
    if (state.ws && state.ws.readyState === WebSocket.OPEN) {
      state.ws.send(JSON.stringify(msg));
    } else {
      // Queue message for when connection is restored
      console.log("[Frontend] WebSocket not ready, queuing message");
      set({ messageQueue: [...state.messageQueue, msg] });

      // Try to reconnect if not already reconnecting
      if (!state.wsReconnecting) {
        get().connectWs();
      }
    }
  },
  setPhotoBoothActive: (val) => {
    set({ photoBoothActive: val });
  },
  setShowMainApp: (val) => {
    set({ showMainApp: val });
  },
}));
