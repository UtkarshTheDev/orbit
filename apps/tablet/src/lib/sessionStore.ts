import { create } from "zustand";
import { playSound } from "./basicAudioPlayer";

// Define sound file paths
const QR_SCANNED_SOUND = "/audio/qr-scanned.mp3";
const DOWNLOAD_POLAROID_SOUND = "/audio/download-polaroid.mp3";

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
  disconnectWs: () => void;
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
  connectionTimeout: 10_000, // 10 seconds connection timeout
};

// Helper function to create WebSocket connection
function createWebSocketConnection(): Promise<WebSocket> {
  return new Promise<WebSocket>((resolve, reject) => {
    // Close existing connection if any
    if (globalWsInstance) {
      console.log("[Frontend] Closing existing global WebSocket connection");
      globalWsInstance.close();
      globalWsInstance = null;
      globalWsReady = false;
    }

    const ws = new WebSocket(WS_CONFIG.url);
    globalWsInstance = ws;

    // Set connection timeout
    const connectionTimeout = setTimeout(() => {
      if (ws.readyState === WebSocket.CONNECTING) {
        console.error("[Frontend] WebSocket connection timeout");
        ws.close();
        connectionLock = false;
        connectionPromise = null;
        reject(new Error("Connection timeout"));
      }
    }, WS_CONFIG.connectionTimeout);

    ws.onopen = () => {
      console.log("[Frontend] WebSocket connected successfully");
      clearTimeout(connectionTimeout);
      globalWsReady = true;
      resolve(ws);
    };

    ws.onerror = (error) => {
      console.error("[Frontend] WebSocket error:", error);
      clearTimeout(connectionTimeout);
      globalWsReady = false;
      connectionLock = false;
      connectionPromise = null;
      reject(error);
    };
  });
}

// Singleton WebSocket instance to prevent multiple connections
let globalWsInstance: WebSocket | null = null;
let globalWsReady = false;
let connectionLock = false; // Prevent race conditions
let connectionPromise: Promise<WebSocket> | null = null; // Track ongoing connection

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

    // Return existing connection if already open
    if (globalWsInstance && globalWsInstance.readyState === WebSocket.OPEN) {
      console.log("[Frontend] Using existing global WebSocket connection");
      set({ ws: globalWsInstance, wsReady: globalWsReady });
      return;
    }

    // Return existing promise if connection is in progress
    if (connectionPromise) {
      console.log("[Frontend] Connection already in progress, waiting...");
      connectionPromise.then((ws) => {
        set({ ws, wsReady: globalWsReady });
      });
      return;
    }

    // Prevent multiple simultaneous connection attempts
    if (connectionLock) {
      console.log("[Frontend] Connection lock active, skipping");
      return;
    }

    if (state.wsReconnecting) {
      console.log("[Frontend] Already reconnecting, skipping");
      return;
    }

    // Set connection lock and create promise
    connectionLock = true;
    console.log(
      `[Frontend] Creating new global WebSocket connection: ${WS_CONFIG.url}`
    );

    connectionPromise = createWebSocketConnection()
      .then((ws) => {
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
          for (const msg of queuedMessages) {
            ws.send(JSON.stringify(msg));
          }
          set({ messageQueue: [] });
        }

        // Set up message handler
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
              // Only activate photo booth if not already active
              if (!get().photoBoothActive) {
                set({ photoBoothActive: true });
                console.log("[Frontend] Photo booth activated");
                
                // Play QR scanned sound with a small delay to ensure component is ready
                setTimeout(() => {
                  console.log("[SessionStore] Playing QR scanned sound");
                  // Only play if still in photo booth mode
                  if (get().photoBoothActive) {
                    playSound(QR_SCANNED_SOUND);
                  }
                }, 300);
              } else {
                console.log("[Frontend] Photo booth already active, ignoring duplicate request");
              }
            }
            if (msg.type === "photo_captured_sound" && get().isTablet) {
              console.log("[SessionStore] Received photo_captured_sound, playing photo sound");
              // Play photo sound directly
              playSound(DOWNLOAD_POLAROID_SOUND);
            }
            if (msg.type === "polaroid_queue_empty" && get().isTablet) {
              console.log(
                "[Frontend] Polaroid queue empty, scheduling OrbitMain display"
              );
              // Only transition if currently in photo booth mode
              if (get().photoBoothActive) {
                setTimeout(() => {
                  set({ photoBoothActive: false, showMainApp: true });
                  console.log("[Frontend] Showing OrbitMain after delay");
                }, 4000);
              } else {
                console.log("[Frontend] Not in photo booth mode, ignoring polaroid_queue_empty");
              }
            }
          } catch {
            // ignore non-JSON
          }
        };

        // Set up close handler
        ws.onclose = (event) => {
          console.log(
            "[Frontend] WebSocket connection closed:",
            event.code,
            event.reason
          );
          globalWsReady = false;
          globalWsInstance = null;
          connectionLock = false;
          connectionPromise = null;
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

        // Clear locks
        connectionLock = false;
        connectionPromise = null;
        return ws;
      })
      .catch((error) => {
        console.error("[Frontend] WebSocket connection failed:", error);
        connectionLock = false;
        connectionPromise = null;
        set({ wsReady: false });
        throw error; // Re-throw to maintain Promise<WebSocket> type
      });

    // Set initial state
    set({ ws: null, wsReady: false });
  },

  // Cleanup function to close global connection
  disconnectWs: () => {
    if (globalWsInstance) {
      console.log("[Frontend] Disconnecting global WebSocket");
      globalWsInstance.close();
      globalWsInstance = null;
      globalWsReady = false;
    }
    connectionLock = false;
    connectionPromise = null;
    set({ ws: null, wsReady: false, wsReconnecting: false });
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
