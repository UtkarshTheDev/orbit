import { AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import OrbitGreeting from "@/components/greeting/GreetingAnimation";
import RobotFace from "@/components/robot/RobotFace";
import Background from "@/components/ui/Background";
import { OrbitMain } from "./components/OrbitMain";
import { useSessionStore } from "./lib/sessionStore";

export default function Home() {
  const [isDisappearing, setIsDisappearing] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const [showMainApp, setShowMainApp] = useState(false);

  // Connect the global websocket client on load
  const connectWs = useSessionStore((s) => s.connectWs);
  useEffect(() => {
    connectWs();
  }, [connectWs]);

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
