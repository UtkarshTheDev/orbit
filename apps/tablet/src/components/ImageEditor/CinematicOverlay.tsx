"use client"

import { motion, AnimatePresence } from "motion/react"
import { useEffect, useState } from "react"

interface CinematicOverlayProps {
  isVisible: boolean
  duration?: number // Total animation duration in seconds (10-15s)
}

const messages = [
  "Analyzing your image…",
  "Understanding your request…",
  "Processing visual data…",
  "Applying intelligent edits…",
  "Finalizing AI edits…",
]

export default function CinematicOverlay({ isVisible, duration = 12 }: CinematicOverlayProps) {
  const [messageIndex, setMessageIndex] = useState(0)
  const [phase, setPhase] = useState<"start" | "middle" | "end">("start")

  useEffect(() => {
    if (!isVisible) {
      setMessageIndex(0)
      setPhase("start")
      return
    }

    // Phase timing
    const startDuration = 3000 // 0-3s
    const middleDuration = (duration - 5) * 1000 // 3-10s

    // Start phase
    const startTimer = setTimeout(() => {
      setPhase("middle")
    }, startDuration)

    // Middle phase - cycle messages (5x slower transitions)
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => {
        if (prev < messages.length - 2) return prev + 1
        return prev
      })
    }, (middleDuration / (messages.length - 2)) * 5)

    // End phase
    const endTimer = setTimeout(() => {
      setPhase("end")
      setMessageIndex(messages.length - 1)
    }, startDuration + middleDuration)

    return () => {
      clearTimeout(startTimer)
      clearTimeout(endTimer)
      clearInterval(messageInterval)
    }
  }, [isVisible, duration])

  if (!isVisible) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="absolute inset-0 z-30 overflow-hidden"
      style={{
        backdropFilter: "blur(8px)",
        background: "linear-gradient(135deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.1))",
      }}
    >
      {/* Desaturation overlay */}
      <div className="absolute inset-0 bg-black/10" />

      {/* Radial scan effect - Start phase */}
      <AnimatePresence>
        {phase === "start" && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 3, opacity: [0, 0.6, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.5, ease: "easeOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(59, 130, 246, 0.8) 0%, rgba(59, 130, 246, 0) 70%)",
              filter: "blur(20px)",
            }}
          />
        )}
      </AnimatePresence>

      {/* Particle shimmer trail - Start */}
      {phase === "start" && (
        <>
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={`particle-start-${i}`}
              initial={{
                x: "50%",
                y: "50%",
                opacity: 0,
                scale: 0,
              }}
              animate={{
                x: `${Math.random() * 100}%`,
                y: `${Math.random() * 100}%`,
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                delay: i * 0.1,
                ease: "easeOut",
              }}
              className="absolute w-1 h-1 rounded-full bg-blue-300"
              style={{
                boxShadow: "0 0 8px 2px rgba(147, 197, 253, 0.8)",
              }}
            />
          ))}
        </>
      )}

      {/* Scanning lines - Middle phase */}
      {phase === "middle" && (
        <>
          <motion.div
            animate={{
              y: ["-100%", "200%"],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-60"
            style={{
              boxShadow: "0 0 20px 4px rgba(59, 130, 246, 0.6)",
            }}
          />
          <motion.div
            animate={{
              y: ["200%", "-100%"],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "linear",
              delay: 2,
            }}
            className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-300 to-transparent opacity-40"
            style={{
              boxShadow: "0 0 15px 3px rgba(147, 197, 253, 0.5)",
            }}
          />
        </>
      )}

      {/* Data rings - Middle phase */}
      {phase === "middle" && (
        <>
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={`ring-${i}`}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{
                scale: [0.5, 1.5],
                opacity: [0.5, 0],
                rotate: [0, 180],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 1,
                ease: "easeOut",
              }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border-2 border-blue-400/40"
              style={{
                boxShadow: "0 0 30px rgba(59, 130, 246, 0.3)",
              }}
            />
          ))}
        </>
      )}

      {/* Digital waveform effect - Middle phase */}
      {phase === "middle" && (
        <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
          <motion.path
            d="M0,50 Q25,30 50,50 T100,50 T150,50 T200,50 T250,50 T300,50 T350,50 T400,50"
            stroke="rgba(59, 130, 246, 0.6)"
            strokeWidth="2"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: [0, 1, 0],
              opacity: [0, 0.6, 0],
              y: [0, 100, 200],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.path
            d="M0,150 Q25,130 50,150 T100,150 T150,150 T200,150 T250,150 T300,150 T350,150 T400,150"
            stroke="rgba(147, 197, 253, 0.5)"
            strokeWidth="2"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: [0, 1, 0],
              opacity: [0, 0.5, 0],
              y: [200, 100, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
          />
        </svg>
      )}

      {/* AI neuron spark particles - Middle phase edges */}
      {phase === "middle" && (
        <>
          {[...Array(12)].map((_, i) => {
            const isLeft = i % 2 === 0
            const yPos = (i / 12) * 100
            return (
              <motion.div
                key={`spark-${i}`}
                initial={{
                  x: isLeft ? "0%" : "100%",
                  y: `${yPos}%`,
                  opacity: 0,
                }}
                animate={{
                  x: isLeft ? ["0%", "10%", "0%"] : ["100%", "90%", "100%"],
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "easeInOut",
                }}
                className="absolute w-2 h-2 rounded-full bg-white"
                style={{
                  boxShadow: "0 0 12px 4px rgba(59, 130, 246, 0.8)",
                }}
              />
            )
          })}
        </>
      )}

      {/* Particle trails - Middle phase */}
      {phase === "middle" && (
        <>
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={`trail-${i}`}
              initial={{
                x: `${Math.random() * 100}%`,
                y: "-5%",
                opacity: 0,
              }}
              animate={{
                y: "105%",
                opacity: [0, 0.6, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.4,
                ease: "linear",
              }}
              className="absolute w-0.5 h-8 bg-gradient-to-b from-transparent via-blue-300 to-transparent"
              style={{
                boxShadow: "0 0 8px 2px rgba(147, 197, 253, 0.6)",
              }}
            />
          ))}
        </>
      )}

      {/* Text messages with glow */}
      <div className="absolute inset-0 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={messageIndex}
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative px-8 py-4"
          >
            {/* Glow background */}
            <div
              className="absolute inset-0 rounded-2xl opacity-40"
              style={{
                background: "radial-gradient(ellipse, rgba(59, 130, 246, 0.4) 0%, transparent 70%)",
                filter: "blur(30px)",
              }}
            />
            
            {/* Text with shimmer effect */}
            <motion.p
              animate={{
                textShadow: [
                  "0 0 20px rgba(59, 130, 246, 0.8), 0 0 40px rgba(59, 130, 246, 0.4)",
                  "0 0 30px rgba(59, 130, 246, 1), 0 0 60px rgba(59, 130, 246, 0.6)",
                  "0 0 20px rgba(59, 130, 246, 0.8), 0 0 40px rgba(59, 130, 246, 0.4)",
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative text-2xl font-semibold text-white text-center tracking-wide"
              style={{ 
                fontFamily: "Outfit, sans-serif",
                background: "linear-gradient(90deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.6) 100%)",
                backgroundSize: "200% 100%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                animation: "shimmer 3s infinite linear",
              }}
            >
              {messages[messageIndex]}
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Final scan - End phase */}
      <AnimatePresence>
        {phase === "end" && (
          <>
            <motion.div
              initial={{ y: "-100%" }}
              animate={{ y: "200%" }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2, ease: "easeInOut" }}
              className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent"
              style={{
                boxShadow: "0 0 40px 8px rgba(59, 130, 246, 0.8)",
              }}
            />
            
            {/* Volumetric light rays */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={`ray-${i}`}
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: [0, 0.3, 0], scaleY: [0, 1, 0] }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.1,
                  ease: "easeOut",
                }}
                className="absolute top-0 bottom-0 w-1"
                style={{
                  left: `${15 + i * 15}%`,
                  background: "linear-gradient(to bottom, rgba(59, 130, 246, 0.4), transparent)",
                  filter: "blur(8px)",
                  transformOrigin: "top",
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Edge light glow - Persistent */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: "inset 0 0 100px 20px rgba(59, 130, 246, 0.2)",
        }}
      />

      {/* Patience message at bottom */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 1 }}
          className="px-6 py-2 rounded-full backdrop-blur-sm"
          style={{
            background: "rgba(0, 0, 0, 0.3)",
            border: "1px solid rgba(59, 130, 246, 0.3)",
          }}
        >
          <motion.p
            animate={{
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="text-sm text-blue-200 text-center"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            ✨ Creating magic takes time, please be patient...
          </motion.p>
        </motion.div>
      </div>

      {/* Shimmer animation keyframes */}
      <style>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </motion.div>
  )
}
