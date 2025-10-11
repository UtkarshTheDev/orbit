import { AnimatePresence } from "framer-motion";
import { useState } from "react";
import Background from "@/components/Background";
import OrbitGreeting from "@/components/GreetingAnimation";
import RobotFace from "@/components/RobotFace";
import { OrbitMain } from "./components/OrbitMain";

export default function Home() {
  const [isDisappearing, setIsDisappearing] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const [showMainApp, setShowMainApp] = useState(false);
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
