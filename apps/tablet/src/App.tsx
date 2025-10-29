import { AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import OrbitGreeting from "@/components/greeting/GreetingAnimation";
import RobotFace from "@/components/robot/RobotFace";
import Background from "@/components/ui/Background";
import { OrbitMain } from "./components/OrbitMain";
import AIImageEditor from "./components/ImageEditor/Editor";
import { useSessionStore } from "./lib/sessionStore";
import { Toaster } from "sonner";

export default function Home() {
  const [isDisappearing, setIsDisappearing] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const [showMainApp, setShowMainApp] = useState(false);

  // Session state: isTablet + photo booth mode + AI editing
  const connectWs = useSessionStore((s) => s.connectWs);
  const isTablet = useSessionStore((s) => s.isTablet);
  const photoBoothActive = useSessionStore((s) => s.photoBoothActive);
  const showMainAppFromStore = useSessionStore((s) => s.showMainApp);
  const isRetakeRequested = useSessionStore((s) => s.isRetakeRequested);
  const aiEditActive = useSessionStore((s) => s.aiEditActive);

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

  // Tablet: AI Image Editor (highest priority)
  if (isTablet && aiEditActive) {
    return (
      <main className="relative flex h-screen w-full items-center justify-center overflow-hidden text-foreground">
        <Background />
        <div className="relative z-20 h-full w-full flex items-center justify-center">
          <AIImageEditor />
        </div>
        <Toaster position="top-center" richColors />
      </main>
    );
  }
  
  // Tablet should always display specialized robotface in booth mode OR when retake is requested
  if (isTablet && (photoBoothActive || isRetakeRequested)) {
    return (
      <main className="relative flex h-screen w-full items-center justify-center overflow-hidden text-foreground">
        <Background />
        <div className="relative z-20 h-full w-full">
          <RobotFace isPhotoBooth isRetake={isRetakeRequested} />
        </div>
        <Toaster position="top-center" richColors />
      </main>
    );
  }
  // Tablet should show OrbitMain after photo session completes (and no retake requested)
  if (isTablet && showMainAppFromStore && !isRetakeRequested) {
    return (
      <main className="relative flex h-screen w-full items-center justify-center overflow-hidden text-foreground">
        <Background />
        <div className="relative z-20 h-full w-full">
          <OrbitMain skipWelcomeAudio />
        </div>
        <Toaster position="top-center" richColors />
      </main>
    );
  }

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
      <Toaster position="top-center" richColors />
    </main>
  );
}
