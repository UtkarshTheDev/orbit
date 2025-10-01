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
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
      <div className="relative flex h-full w-full flex-col items-center justify-center">
        {/* Step 1: "Welcome Sir" handwriting with entrance animation */}
        <motion.div
          animate={
            step === 1
              ? { opacity: 1, scale: 1 }
              : step >= 2
                ? {
                  opacity: 0.6,
                  scale: 0.5,
                  y: -180,
                }
                : {}
          }
          className="absolute"
          initial={{ opacity: 0, scale: 0.8 }}
          transition={{
            duration: 0.8,
            ease: [0.4, 0, 0.2, 1],
          }}
        >
          <WritingWelcomeEffect
            className="h-24"
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
                    opacity: 0.5,
                    scale: 0.7,
                    y: -120,
                  }
                  : {}
            }
            className="absolute font-light text-4xl text-foreground/80 tracking-wide"
            initial={{ opacity: 0, y: 20 }}
            onAnimationComplete={() => {
              if (step === 3) {
                setTimeout(() => setStep(4), 1200);
              }
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
            className="absolute flex items-center gap-3"
            initial={{ opacity: 0, scale: 0.9 }}
            transition={{
              duration: 0.9,
              ease: [0.4, 0, 0.2, 1],
              delay: 0.4,
            }}
          >
            <span className="font-light text-5xl text-foreground/90">I am</span>
            <OrbitWritingEffect className="h-16" speed={1.0} />
          </motion.div>
        )}
      </div>
    </div>
  );
}
