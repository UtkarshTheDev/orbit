import { createRootRoute, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { useSessionStore } from "@/lib/sessionStore";

function WsBootstrap() {
  const connectWs = useSessionStore((s) => s.connectWs);
  useEffect(() => {
    console.log("[Root] Bootstrapping WebSocket connection for all routes...");
    connectWs();
  }, [connectWs]);
  return null;
}

export const Route = createRootRoute({
  component: () => (
    <>
      <WsBootstrap />
      <Outlet />
    </>
  ),
});
