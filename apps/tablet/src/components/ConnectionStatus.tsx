import { useSessionStore } from "@/lib/sessionStore";

export function ConnectionStatus() {
  const wsReady = useSessionStore((s) => s.wsReady);
  const wsReconnecting = useSessionStore((s) => s.wsReconnecting);
  const reconnectAttempts = useSessionStore((s) => s.reconnectAttempts);

  if (wsReady) {
    return (
      <div className="fixed top-4 right-4 z-50 bg-green-500/90 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
        <span className="text-sm font-medium">Connected</span>
      </div>
    );
  }

  if (wsReconnecting) {
    return (
      <div className="fixed top-4 right-4 z-50 bg-yellow-500/90 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
        <span className="text-sm font-medium">
          Reconnecting... (Attempt {reconnectAttempts})
        </span>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-red-500/90 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
      <div className="w-2 h-2 bg-white rounded-full" />
      <span className="text-sm font-medium">Disconnected</span>
    </div>
  );
}
