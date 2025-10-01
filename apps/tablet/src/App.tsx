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
      className="flex h-screen w-full cursor-pointer items-center justify-center overflow-hidden bg-background text-foreground"
      onClick={handleClick}
    >
      {/* Full-screen face only */}
      <RobotFace isDisappearing={isDisappearing} />

      {/* Greeting appears after face hides */}
      {showGreeting && <GreetingAnimation />}
    </main>
  );
}
