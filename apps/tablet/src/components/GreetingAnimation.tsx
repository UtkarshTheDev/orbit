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
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center">
      {/* Step 1: "Welcome Sir" handwriting with entrance animation */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
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
        transition={{
          duration: 0.8,
          ease: [0.4, 0, 0.2, 1],
        }}
        className="absolute"
        style={{
          filter: "drop-shadow(0 4px 20px rgba(88, 28, 135, 0.3))",
          color: "#6b21a8",
        }}
      >
        <WritingWelcomeEffect
          speed={1.2}
          onAnimationComplete={() => {
            setTimeout(() => setStep(2), 800);
          }}
          className="h-40"
        />
      </motion.div>

      {/* Step 3: "Good Morning/Afternoon" text */}
      {step >= 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
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
          transition={{
            duration: 0.6,
            ease: [0.4, 0, 0.2, 1],
            delay: step === 3 ? 0.3 : 0,
          }}
          onAnimationComplete={() => {
            if (step === 3) {
              setTimeout(() => setStep(4), 1200);
            }
          }}
          className="absolute text-7xl font-space font-bold tracking-wide"
          style={{
            textShadow: "0 4px 16px rgba(71, 85, 105, 0.2)",
            color: "#475569",
          }}
        >
          {greeting}
        </motion.div>
      )}

      {/* Step 5: "I am Orbit" handwriting in center */}
      {step >= 5 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.9,
            ease: [0.4, 0, 0.2, 1],
            delay: 0.4,
          }}
          className="absolute font-inter flex items-center gap-6"
        >
          <span
            className="text-8xl font-semibold tracking-wide"
            style={{
              textShadow: "0 4px 16px rgba(71, 85, 105, 0.2)",
              color: "#475569",
            }}
          >
            I am
          </span>
          <div
            style={{
              filter: "drop-shadow(0 4px 16px rgba(100, 116, 139, 0.25))",
              color: "#64748b",
            }}
          >
            <OrbitWritingEffect speed={1.0} className="h-32" />
          </div>
        </motion.div>
      )}
    </div>
  );
}
