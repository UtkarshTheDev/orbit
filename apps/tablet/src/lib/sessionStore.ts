import { create } from "zustand";

type SessionState = {
  isTablet: boolean;
  photoBoothActive: boolean;
  ws: WebSocket | null;
  wsReady: boolean;
  connectWs: () => void;
  sendWs: (msg: unknown) => void;
  setPhotoBoothActive: (val: boolean) => void;
};

function detectTabletRole(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const params = new URLSearchParams(window.location.search);
  return params.get("tablet") === "1";
}

export const useSessionStore = create<SessionState>((set, get) => ({
  isTablet: detectTabletRole(),
  photoBoothActive: false,
  ws: null,
  wsReady: false,
  connectWs: () => {
    if (get().ws) {
      return;
    }
    const wsUrl = import.meta.env.VITE_WS_URL || "ws://localhost:3001";
    const ws = new WebSocket(wsUrl);
    ws.onopen = () => {
      set({ wsReady: true });
      ws.send(
        JSON.stringify({
          type: "identify",
          role: get().isTablet ? "tablet" : "phone",
        })
      );
    };
    ws.onclose = () => {
      set({ wsReady: false, ws: null });
    };
    ws.onerror = (_err) => {
      set({ wsReady: false });
    };
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "photo_booth_requested" && get().isTablet) {
          set({ photoBoothActive: true });
        }
      } catch (_e) {
        // Ignore non-JSON msg
      }
    };
    set({ ws });
  },
  sendWs: (msg) => {
    const ws = get().ws;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  },
  setPhotoBoothActive: (val) => {
    set({ photoBoothActive: val });
  },
}));
