import { createRootRoute, Outlet } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useSessionStore } from "@/lib/sessionStore";

function WsBootstrap() {
	const connectWs = useSessionStore((s) => s.connectWs);
	const disconnectWs = useSessionStore((s) => s.disconnectWs);
	const hasBootstrapped = useRef(false);

	useEffect(() => {
		// Only bootstrap once per app lifecycle
		if (hasBootstrapped.current) {
			console.log("[Root] WebSocket already bootstrapped, skipping");
			return;
		}

		console.log("[Root] Bootstrapping WebSocket connection for all routes...");
		hasBootstrapped.current = true;
		connectWs();

		// Cleanup on page unload to prevent multiple connections
		const handleBeforeUnload = () => {
			console.log("[Root] Page unloading, disconnecting WebSocket");
			hasBootstrapped.current = false;
			disconnectWs();
		};

		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => {
			window.removeEventListener("beforeunload", handleBeforeUnload);
		};
	}, [connectWs, disconnectWs]);

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
