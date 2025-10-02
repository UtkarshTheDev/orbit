"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  OrbitWritingEffect,
  WritingWelcomeEffect,
} from "@/components/ui/shadcn-io/apple-hello-effect";

export default function GreetingAnimation() {
  const [step, setStep] = useState(1);

  // Determine greeting based on time
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? "Good Morning" : "Good Afternoon");
  }, []);

  // Handle automatic step transitions
  useEffect(() => {
    if (step === 2) {
      const timer = setTimeout(() => setStep(3), 600);
      return () => clearTimeout(timer);
    }
    if (step === 4) {
      const timer = setTimeout(() => setStep(5), 800);
      return () => clearTimeout(timer);
    }
  }, [step]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center">
      {/* Step 1: "Welcome Sir" handwriting with entrance animation */}
      <motion.div
        animate={
          step === 1
            ? { opacity: 1, scale: 1 }
            : step >= 2
              ? {
                opacity: 1,
                scale: 0.55,
                y: -220,
              }
              : {}
        }
        className="absolute"
        initial={{ opacity: 0, scale: 0.8 }}
        style={{
          filter: "drop-shadow(0 6px 24px rgba(109, 40, 217, 0.4))",
          color: "#1a1a1a",
        }}
        transition={{
          duration: 0.8,
          ease: [0.4, 0, 0.2, 1],
        }}
      >
        <WritingWelcomeEffect
          className="h-40"
          onAnimationComplete={() => {
            setTimeout(() => setStep(2), 800);
          }}
          speed={1.2}
        />
      </motion.div>

      {/* Step 3: "Good Morning/Afternoon" text */}
      {step >= 3 && (
        <motion.div
          animate={
            step === 3
              ? { opacity: 1, y: 0 }
              : step >= 4
                ? {
                  opacity: 1,
                  scale: 0.75,
                  y: -140,
                }
                : {}
          }
          className="absolute font-bold text-7xl tracking-wide"
          initial={{ opacity: 0, y: 20 }}
          onAnimationComplete={() => {
            if (step === 3) {
              setTimeout(() => setStep(4), 1200);
            }
          }}
          style={{
            textShadow: "0 6px 20px rgba(0, 0, 0, 0.35)",
            color: "#1a1a1a",
          }}
          transition={{
            duration: 0.6,
            ease: [0.4, 0, 0.2, 1],
            delay: step === 3 ? 0.3 : 0,
          }}
        >
          {greeting}
        </motion.div>
      )}

      {/* Step 5: "I am Orbit" handwriting in center */}
      {step >= 5 && (
        <motion.div
          animate={{ opacity: 1, scale: 1 }}
          className="absolute flex items-center gap-6"
          initial={{ opacity: 0, scale: 0.9 }}
          transition={{
            duration: 0.9,
            ease: [0.4, 0, 0.2, 1],
            delay: 0.4,
          }}
        >
          <span
            className="font-semibold text-8xl tracking-wide"
            style={{
              textShadow: "0 6px 20px rgba(0, 0, 0, 0.35)",
              color: "#1a1a1a",
            }}
          >
            I am
          </span>
          <div
            style={{
              filter: "drop-shadow(0 6px 24px rgba(120, 190, 255, 0.5))",
              color: "#1a1a1a",
            }}
          >
            <OrbitWritingEffect className="h-32" speed={1.0} />
          </div>
        </motion.div>
      )}
    </div>
  );
}
