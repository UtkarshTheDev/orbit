"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import RobotHead from "./RobotHead";

export default function OrbitGreeting() {
  const [stage, setStage] = useState<"detecting" | "greeting" | "complete">(
    "detecting"
  );
  const [currentText, setCurrentText] = useState("");
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);

  // Get time-based greeting
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return "Good Morning";
    }
    if (hour < 17) {
      return "Good Afternoon";
    }
    return "Good Evening";
  };

  const greetingLines = ["Welcome, Sir", getTimeBasedGreeting(), "I am Orbit"];

  // Simulate proximity detection
  useEffect(() => {
    const timer = setTimeout(() => {
      setStage("greeting");
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Typing animation effect
  useEffect(() => {
    if (stage !== "greeting") {
      return;
    }

    if (lineIndex < greetingLines.length) {
      if (charIndex < greetingLines[lineIndex].length) {
        const timer = setTimeout(() => {
          setCurrentText((prev) => prev + greetingLines[lineIndex][charIndex]);
          setCharIndex(charIndex + 1);
        }, 80);
        return () => clearTimeout(timer);
      }
      const timer = setTimeout(() => {
        setCurrentText("");
        setCharIndex(0);
        setLineIndex(lineIndex + 1);
      }, 800);
      return () => clearTimeout(timer);
    }
    setStage("complete");
  }, [stage, lineIndex, charIndex]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white">
      {/* Subtle geometric pattern background */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f6_1px,transparent_1px),linear-gradient(to_bottom,#3b82f6_1px,transparent_1px)] bg-[size:80px_80px]" />
      </div>

      {/* Subtle gradient orbs */}
      <div className="absolute top-20 right-20 h-[500px] w-[500px] rounded-full bg-blue-100/40 blur-3xl" />
      <div className="absolute bottom-20 left-20 h-[600px] w-[600px] rounded-full bg-cyan-50/60 blur-3xl" />

      {/* Main content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <AnimatePresence mode="wait">
          {stage === "detecting" && (
            <motion.div
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-8"
              exit={{ opacity: 0, scale: 0.9 }}
              initial={{ opacity: 0, scale: 0.9 }}
              key="detecting"
            >
              <div className="scale-[0.8]">
                <RobotHead />
              </div>

              <motion.p
                animate={{ opacity: [0.4, 1, 0.4] }}
                className="font-light font-space text-blue-600 text-xs uppercase tracking-[0.4em]"
                style={{ fontWeight: 400 }}
                transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY }}
              >
                Scanning Systems
              </motion.p>
            </motion.div>
          )}

          {(stage === "greeting" || stage === "complete") && (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="flex max-w-5xl flex-col items-center text-center"
              initial={{ opacity: 0, y: 20 }}
              key="greeting"
            >
              {/* Futuristic Robot Avatar */}
              <motion.div
                animate={{ scale: 1 }}
                className="relative"
                initial={{ scale: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                  delay: 0.2,
                }}
              >
                {/* Orbital rings */}
                <motion.div
                  animate={{ rotate: 360 }}
                  className="-m-0 absolute inset-0"
                  transition={{
                    duration: 20,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "linear",
                  }}
                >
                  <div className="absolute inset-0 rounded-full border border-blue-300/30" />
                </motion.div>
                <motion.div
                  animate={{ rotate: -360 }}
                  className="-m-4 absolute inset-0"
                  transition={{
                    duration: 15,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "linear",
                  }}
                >
                  <div className="absolute inset-0 rounded-full border border-cyan-200/20" />
                </motion.div>

                {/* Energy glow */}
                <motion.div
                  animate={{
                    scale: [1, 1.15, 1],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  className="-inset-4 absolute rounded-full bg-gradient-to-r from-blue-400/20 via-cyan-400/20 to-blue-400/20 blur-3xl"
                  transition={{
                    duration: 3,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                />

                <div className="scale-[1]">
                  <RobotHead />
                </div>
              </motion.div>

              {/* Greeting text */}
              <div className="min-h-[280px] space-y-8 mt-8">
                {stage === "greeting" && lineIndex < greetingLines.length && (
                  <motion.div
                    animate={{ opacity: 1, y: 0 }}
                    className={`${lineIndex === 0 ? "font-pacifico text-7xl text-slate-800 md:text-9xl" : ""}
                      ${lineIndex === 1 ? "font-space text-6xl text-blue-600 md:text-8xl" : ""}
                      ${lineIndex === 2 ? "font-orbitron text-7xl text-slate-900 md:text-9xl" : ""} mt-4`}
                    initial={{ opacity: 0, y: 10 }}
                    key={lineIndex}
                    style={{
                      fontWeight: (() => {
                        switch (lineIndex) {
                          case 0:
                            return 500;
                          case 1:
                            return 600;
                          default:
                            return 500;
                        }
                      })(),
                    }}
                  >
                    {currentText}
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      className="ml-1 inline-block h-[0.85em] w-1 bg-blue-500 align-middle"
                      transition={{
                        duration: 0.8,
                        repeat: Number.POSITIVE_INFINITY,
                      }}
                    />
                  </motion.div>
                )}

                {stage === "complete" && (
                  <motion.div
                    animate={{ opacity: 1 }}
                    className="space-y-14"
                    initial={{ opacity: 0 }}
                  >
                    <motion.h1
                      animate={{ opacity: 1, y: 0 }}
                      className="font-pacifico text-7xl text-slate-800 md:text-9xl"
                      initial={{ opacity: 0, y: 20 }}
                      style={{
                        fontWeight: 500,
                      }}
                      transition={{ delay: 0.1 }}
                    >
                      Welcome, Sir
                    </motion.h1>

                    <motion.h2
                      animate={{ opacity: 1, y: 0 }}
                      className="font-quicksand text-7xl text-slate-900 md:text-9xl"
                      initial={{ opacity: 0, y: 20 }}
                      style={{
                        fontWeight: 900,
                      }}
                      transition={{ delay: 0.3 }}
                    >
                      I am <span className="font-orbitron">Orbit</span>
                    </motion.h2>

                    {/* Status indicator */}
                    <motion.div
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-center gap-3 pt-8"
                      initial={{ opacity: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <motion.div
                        animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                        className="h-2 w-2 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]"
                        transition={{
                          duration: 2,
                          repeat: Number.POSITIVE_INFINITY,
                        }}
                      />
                      <span
                        className="font-space text-slate-500 text-xs uppercase tracking-[0.3em]"
                        style={{
                          fontWeight: 400,
                        }}
                      >
                        System Online
                      </span>
                      <motion.div
                        animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                        className="h-2 w-2 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]"
                        transition={{
                          duration: 2,
                          repeat: Number.POSITIVE_INFINITY,
                          delay: 1,
                        }}
                      />
                    </motion.div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Minimal corner accents */}
      <div className="absolute top-8 left-8 h-24 w-24 border-blue-200/40 border-t-2 border-l-2" />
      <div className="absolute top-8 right-8 h-24 w-24 border-blue-200/40 border-t-2 border-r-2" />
      <div className="absolute bottom-8 left-8 h-24 w-24 border-blue-200/40 border-b-2 border-l-2" />
      <div className="absolute right-8 bottom-8 h-24 w-24 border-blue-200/40 border-r-2 border-b-2" />
    </div>
  );
}
