import { motion } from "framer-motion";
import { Box, Camera, MapPin, MessageCircle } from "lucide-react";
import { useState } from "react";
import { FeatureButton } from "@/components/FeatureButton";
import { InteractionBar } from "@/components/InteractionBar";
import RobotHead from "./RobotHead";

export function OrbitMain() {
  const [inputMode, setInputMode] = useState<"voice" | "text">("voice");

  const features = [
    {
      title: "Find a Room",
      subtitle: "Get directions to any classroom or lab",
      icon: MapPin,
      delay: 0,
    },
    {
      title: "Take a Photo",
      subtitle: "Scan QR code and capture your moment",
      icon: Camera,
      delay: 100,
    },
    {
      title: "Ask Questions",
      subtitle: "Learn about the school and students",
      icon: MessageCircle,
      delay: 200,
    },
    {
      title: "View 3D Models",
      subtitle: "Explore science models in 3D",
      icon: Box,
      delay: 300,
    },
  ];

  return (
    <motion.main
      animate={{ opacity: 1 }}
      className="flex min-h-screen flex-col items-center justify-between bg-[#F9FAFB] pb-6 md:pb-10 lg:pb-12"
      initial={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="flex w-full flex-1 items-center justify-center">
        <div className="flex w-full max-w-5xl flex-col items-center justify-center text-center">
          <RobotHead />
          <motion.h1
            animate={{ opacity: 1, y: 0 }}
            className="text-balance px-4 font-bold font-orbitron text-3xl text-gray-900 leading-tight tracking-tight md:text-4xl lg:text-5xl"
            initial={{ opacity: 0, y: -20 }}
            transition={{
              delay: 0.2,
              duration: 0.6,
              ease: [0.25, 0.1, 0.25, 1],
            }}
          >
            How can <span className="font-pacifico text-blue-500">I</span> help
            <span className="font-pacifico text-blue-500"> you</span> today?
          </motion.h1>

          <motion.div
            animate={{ opacity: 1 }}
            className="mt-8 grid grid-cols-2 gap-4 px-2 md:mt-12 md:gap-6"
            initial={{ opacity: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            {features.map((feature, index) => (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                key={index}
                transition={{
                  delay: 0.5 + index * 0.1,
                  duration: 0.5,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
              >
                <FeatureButton
                  animationClass=""
                  delay={feature.delay}
                  icon={feature.icon}
                  subtitle={feature.subtitle}
                  title={feature.title}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 w-full max-w-2xl"
        initial={{ opacity: 0, y: 20 }}
        transition={{
          delay: 0.9,
          duration: 0.5,
          ease: [0.25, 0.1, 0.25, 1],
        }}
      >
        <InteractionBar mode={inputMode} onModeChange={setInputMode} />
      </motion.div>
    </motion.main>
  );
}
