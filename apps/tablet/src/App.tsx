import { useState } from "react";
import GreetingAnimation from "@/components/GreetingAnimation";
import RobotFace from "@/components/RobotFace";

export default function Home() {
  const [isDisappearing, setIsDisappearing] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);

  const handleClick = () => {
    if (!isDisappearing) {
      setIsDisappearing(true);
      // Show greeting after face disappears (2 seconds)
      setTimeout(() => setShowGreeting(true), 2000);
    }
  };

  return (
    <main
      className="h-screen w-full relative text-foreground flex items-center justify-center overflow-hidden cursor-pointer"
      onClick={handleClick}
    >
      {/* Aurora Dream Background - Full screen */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: `
            radial-gradient(ellipse 85% 65% at 8% 8%, rgba(175, 109, 255, 0.42), transparent 60%),
            radial-gradient(ellipse 75% 60% at 75% 35%, rgba(255, 235, 170, 0.55), transparent 62%),
            radial-gradient(ellipse 70% 60% at 15% 80%, rgba(255, 100, 180, 0.40), transparent 62%),
            radial-gradient(ellipse 70% 60% at 92% 92%, rgba(120, 190, 255, 0.45), transparent 62%),
            linear-gradient(180deg, #f7eaff 0%, #fde2ea 100%)
          `,
        }}
      />

      {/* Content layer */}
      <div className="relative z-10 w-full h-full">
        {/* Full-screen face only */}
        <RobotFace isDisappearing={isDisappearing} />

        {/* Greeting appears after face hides */}
        {showGreeting && <GreetingAnimation />}
      </div>
    </main>
  );
}
