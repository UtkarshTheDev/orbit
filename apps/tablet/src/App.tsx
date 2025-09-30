"use client";

import { useState } from "react";
import RobotFace from "./components/RobotFace";

export default function Home() {
  const [isDisappearing, setIsDisappearing] = useState(false);

  const handleClick = () => {
    if (!isDisappearing) {
      setIsDisappearing(true);
    }
  };

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-background p-0 text-foreground">
      <button
        className="flex h-full w-full items-center justify-center"
        onClick={handleClick}
        onKeyDown={(e) => e.key === "Enter" && handleClick()}
        type="button"
      >
        {/* Full-screen face only */}
        <RobotFace isDisappearing={isDisappearing} />
      </button>
    </main>
  );
}
