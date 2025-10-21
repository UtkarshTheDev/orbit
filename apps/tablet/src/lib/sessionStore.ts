import { create } from "zustand";

type SessionState = {
  isTablet: boolean;
  photoBoothActive: boolean;
  showMainApp: boolean;
  ws: WebSocket | null;
  wsReady: boolean;
  connectWs: () => void;
  sendWs: (msg: unknown) => void;
  setPhotoBoothActive: (val: boolean) => void;
  setShowMainApp: (val: boolean) => void;
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
  connectWs: () => {
    if (get().ws) {
      return;
    }
    const wsUrl = import.meta.env.VITE_WS_URL || "ws://localhost:3001";
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      set({ wsReady: true });
      const role = get().isTablet ? "tablet" : "phone";
      ws.send(
        JSON.stringify({
          type: "identify",
          role,
        })
      );
      console.log("[Frontend] WS connected, identified as:", role);
    };

    ws.onclose = () => {
      set({ wsReady: false, ws: null });
    };

    ws.onerror = () => {
      set({ wsReady: false });
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "photo_booth_requested" && get().isTablet) {
          set({ photoBoothActive: true });
          console.log("[Frontend] Photo booth activated");
        }
        if (msg.type === "photo_session_complete" && get().isTablet) {
          set({ photoBoothActive: false, showMainApp: true });
          console.log("[Frontend] Photo session complete, showing main app");
        }
      } catch {
        // ignore non-JSON
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
  setShowMainApp: (val) => {
    set({ showMainApp: val });
  },
}));
