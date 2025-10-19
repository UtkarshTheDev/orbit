import { AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import OrbitGreeting from "@/components/greeting/GreetingAnimation";
import RobotFace from "@/components/robot/RobotFace";
import Background from "@/components/ui/Background";
import { OrbitMain } from "./components/OrbitMain";

export default function Home() {
  const [isDisappearing, setIsDisappearing] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const [showMainApp, setShowMainApp] = useState(false);

  // WebSocket client (dev/prototype)
  const wsRef = useRef<WebSocket | null>(null);
  useEffect(() => {
    // Use env-var for URL; default to localhost in dev
    const WsUrl = import.meta.env.VITE_WS_URL || "ws://localhost:3001";
    const ws = new WebSocket(WsUrl);
    wsRef.current = ws;
    ws.onopen = () => {
      console.log("[Tablet] WebSocket connected");
      ws.send("Hello from tablet");
    };
    ws.onmessage = (event) => {
      console.log("[Tablet] WebSocket message:", event.data);
    };
    ws.onerror = (err) => {
      console.error("[Tablet] WebSocket error:", err);
    };
    ws.onclose = () => {
      console.log("[Tablet] WebSocket connection closed");
    };
    return () => ws.close();
  }, []);

  const handleClick = () => {
    if (!isDisappearing) {
      setIsDisappearing(true);
      setTimeout(() => {
        setShowGreeting(true);
      }, 2000);
    }
  };

  return (
    <main
      className="relative flex h-screen w-full cursor-pointer items-center justify-center overflow-hidden text-foreground"
      onClick={handleClick}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
      role="button"
      tabIndex={0}
    >
      <Background />
      <div className="relative z-20 h-full w-full">
        {!(showGreeting || showMainApp) && (
          <RobotFace isDisappearing={isDisappearing} />
        )}
        <AnimatePresence mode="wait">
          {showGreeting && (
            <OrbitGreeting
              onComplete={() => {
                setShowGreeting(false);
                setShowMainApp(true);
              }}
            />
          )}
        </AnimatePresence>
        {!showGreeting && showMainApp && <OrbitMain />}
      </div>
    </main>
  );
}
