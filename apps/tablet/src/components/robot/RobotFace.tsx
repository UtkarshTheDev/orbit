import { motion, useAnimation, useSpring } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { eventManager } from "@/lib/eventManager";
import { playSound } from "@/lib/basicAudioPlayer";

// Minimalist, cute robot face with animated eyes, glowing cheeks, and expressive mouth
// - Eyes follow cursor smoothly with natural constraints + random blinks
// - Cheeks have soft pulsing glow and subtle breathing motion
// - Mouth morphs through talking/expression shapes smoothly

export default function RobotFace({
  isDisappearing = false,
  onAnimationComplete,
  isPhotoBooth = false,
}: {
  isDisappearing?: boolean;
  onAnimationComplete?: () => void;
  isPhotoBooth?: boolean;
}) {
  const faceRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);

  // Cursor tracking for eyes
  const [target, setTarget] = useState({ x: 0, y: 0 });
  const [idleTarget, setIdleTarget] = useState({ x: 0, y: 0 });
  const [lastMoveAt, setLastMoveAt] = useState<number>(Date.now());
  const [isIdle, setIsIdle] = useState(false);

  // Eyelid blinking
  const [isBlinking, setIsBlinking] = useState(false);
  const [isHalfBlink, setIsHalfBlink] = useState(false);
  const [forceSlowBlink, setForceSlowBlink] = useState(false);

  // Talking state cycles automatically for a lively feel
  const [isTalking, setIsTalking] = useState(true);

  // Disappearing animation state
  const [animationPhase, setAnimationPhase] = useState<
    "idle" | "blinking" | "fading"
  >("idle");

  // Smooth springs for pupil positions
  const pupilX = useSpring(0, { stiffness: 120, damping: 12, mass: 0.4 });
  const pupilY = useSpring(0, { stiffness: 120, damping: 12, mass: 0.4 });

  // Sound management using the new SoundManager
  // Sound hooks removed in favor of basic audio player
  
  // Sound file paths
  const QR_SCANNED_SOUND = "/audio/qr-scanned.mp3";
  const DOWNLOAD_POLAROID_SOUND = "/audio/download-polaroid.mp3";
  
  // Import playSound from basicAudioPlayer
  // import { playSound } from "@/lib/basicAudioPlayer";

  // Initialize component lifecycle tracking
  useEffect(() => {
    console.log("[RobotFace] Component mounting");
    isMountedRef.current = true;

    return () => {
      console.log("[RobotFace] Component unmounting");
      isMountedRef.current = false;
    };
  }, []);

  // Listen for QR scanned sound events using global event manager
  useEffect(() => {
    const handleQrScannedSound = () => {
      // Check if component is still mounted before playing sound
      if (!isMountedRef.current) {
        console.log(
          "[RobotFace] Component unmounted, skipping QR scanned sound"
        );
        return;
      }

      console.log(
        "[RobotFace] QR scanned sound event received, playing qr-scanned.mp3"
      );
      
      // Play sound using basic audio player
      playSound(QR_SCANNED_SOUND);
    };

    console.log(
      "[RobotFace] Registering QR scanned sound handler with event manager"
    );
    eventManager.addHandler("playQrScannedSound", handleQrScannedSound);

    return () => {
      console.log(
        "[RobotFace] Unregistering QR scanned sound handler from event manager"
      );
      eventManager.removeHandler("playQrScannedSound");
    };
  }, [playSound, isPhotoBooth]); // Add dependencies to re-register when they change

  // Listen for photo capture sound events using global event manager
  useEffect(() => {
    const handlePhotoSound = () => {
      // Check if component is still mounted before playing sound
      if (!isMountedRef.current) {
        console.log("[RobotFace] Component unmounted, skipping photo sound");
        return;
      }

      console.log(
        "[RobotFace] Photo sound event received, playing download-polaroid.mp3"
      );
      
      // Play sound using basic audio player
      playSound(DOWNLOAD_POLAROID_SOUND);
    };

    console.log(
      "[RobotFace] Registering photo sound handler with event manager"
    );
    eventManager.addHandler("playPhotoSound", handlePhotoSound);

    return () => {
      console.log(
        "[RobotFace] Unregistering photo sound handler from event manager"
      );
      eventManager.removeHandler("playPhotoSound");
    };
  }, [playSound, isPhotoBooth]); // Add dependencies to re-register when they change

  // Trigger disappear animation sequence
  useEffect(() => {
    if (!isDisappearing) return;

    // Phase 1: Slow blink
    setAnimationPhase("blinking");
    setForceSlowBlink(true);

    // Phase 2: Start fading after blink
    const fadeTimer = setTimeout(() => {
      setAnimationPhase("fading");
    }, 800);

    return () => clearTimeout(fadeTimer);
  }, [isDisappearing]);

  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (isDisappearing) return; // Stop tracking during disappear

      const rect = faceRef.current?.getBoundingClientRect();
      if (!rect) return;

      let clientX: number;
      let clientY: number;
      if (typeof TouchEvent !== "undefined" && e instanceof TouchEvent) {
        clientX = e.touches[0]?.clientX ?? 0;
        clientY = e.touches[0]?.clientY ?? 0;
      } else {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      }

      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      setTarget({ x: dx, y: dy });
      setLastMoveAt(Date.now());
    };

    window.addEventListener("mousemove", handler);
    window.addEventListener("touchmove", handler, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handler);
      window.removeEventListener("touchmove", handler);
    };
  }, [isDisappearing]);

  // Detect idle (good for tablets too)
  useEffect(() => {
    const id = setInterval(() => {
      setIsIdle(Date.now() - lastMoveAt > 3500);
    }, 500);
    return () => clearInterval(id);
  }, [lastMoveAt]);

  // Idle wandering eyes: generate gentle look-around targets when idle
  useEffect(() => {
    if (!isIdle || isDisappearing) return;
    let cancelled = false;
    const wander = () => {
      if (cancelled) return;
      const r = 140 + Math.random() * 180;
      const ang = Math.random() * Math.PI * 2;
      const nx = Math.cos(ang) * r * 0.25;
      const ny = Math.sin(ang) * r * 0.25;
      setIdleTarget({ x: nx, y: ny });
      setTimeout(wander, 900 + Math.random() * 900);
    };
    wander();
    return () => {
      cancelled = true;
    };
  }, [isIdle, isDisappearing]);

  // Map target to constrained pupil offset (use idle target when idle)
  useEffect(() => {
    const eff = isIdle ? idleTarget : target;
    const max = 22;
    const len = Math.hypot(eff.x, eff.y) || 1;
    const nx = (eff.x / len) * Math.min(max, len / 8);
    const ny = (eff.y / len) * Math.min(max, len / 8);
    pupilX.set(nx);
    pupilY.set(ny);
  }, [target, idleTarget, isIdle, pupilX, pupilY]);

  // Natural random blinking with occasional double and half-blinks
  useEffect(() => {
    if (forceSlowBlink) {
      setIsBlinking(true);
      const t = setTimeout(() => setIsBlinking(false), 600);
      return () => clearTimeout(t);
    }

    if (isDisappearing) return;

    let active = true;
    const loop = () => {
      if (!active) return;
      const base = isIdle ? 3200 : 2200;
      const spread = isIdle ? 4200 : 2800;
      const nextIn = base + Math.random() * spread;
      const doDouble = Math.random() < 0.18;
      const doHalf = Math.random() < 0.22;
      const blinkDuration = 90 + Math.random() * 70;
      const t = setTimeout(() => {
        if (doHalf) {
          setIsHalfBlink(true);
          setTimeout(() => setIsHalfBlink(false), 160 + Math.random() * 120);
        }
        setIsBlinking(true);
        const t2 = setTimeout(() => {
          setIsBlinking(false);
          if (doDouble) {
            setTimeout(
              () => {
                setIsBlinking(true);
                setTimeout(() => setIsBlinking(false), blinkDuration * 0.85);
              },
              90 + Math.random() * 120
            );
          }
          loop();
        }, blinkDuration);
        return () => clearTimeout(t2);
      }, nextIn);
      return () => clearTimeout(t);
    };
    const cleanup = loop();
    return () => {
      active = false;
      cleanup && cleanup();
    };
  }, [isIdle, forceSlowBlink, isDisappearing]);

  // Activity level for reactive cheeks
  const [activity, setActivity] = useState(0);
  useEffect(() => {
    const len = Math.hypot(target.x, target.y);
    const eyeFactor = Math.min(1, len / 240);
    const talkFactor = isTalking ? 0.55 : 0;
    const a = Math.min(1, eyeFactor * 0.6 + talkFactor);
    setActivity(a);
  }, [target, isTalking]);

  // Idle talking/expression toggling
  useEffect(() => {
    if (isDisappearing) return;

    let timeout: number;
    const schedule = () => {
      const on = 2500 + Math.random() * 3000;
      const off = isIdle
        ? 2400 + Math.random() * 3200
        : 1800 + Math.random() * 2400;
      setIsTalking(true);
      timeout = window.setTimeout(() => {
        setIsTalking(false);
        timeout = window.setTimeout(schedule, off);
      }, on);
    };
    schedule();
    return () => clearTimeout(timeout);
  }, [isIdle, isDisappearing]);

  // Mouth morph shapes (SVG path d)
  const mouthShapes = useMemo(
    () =>
      ({
        rest: "M 12 30 Q 64 40 116 30 Q 64 50 12 30 Z",
        speak1: "M 12 30 Q 64 62 116 30 Q 64 82 12 30 Z",
        speak2: "M 16 34 Q 64 56 112 34 Q 64 72 16 34 Z",
        grin: "M 12 36 Q 64 66 116 36 Q 64 70 12 36 Z",
        ee: "M 18 36 Q 64 44 110 36 Q 64 48 18 36 Z",
        ah: "M 22 32 Q 64 68 106 32 Q 64 86 22 32 Z",
        flat: "M 10 34 Q 64 38 118 34 Q 64 42 10 34 Z",
        smile: "M 14 34 Q 64 54 114 34 Q 64 46 14 34 Z",
      }) as const,
    []
  );

  const mouthControls = useAnimation();
  useEffect(() => {
    if (isDisappearing) return;

    let mounted = true;
    const seq = async () => {
      while (mounted) {
        if (isTalking) {
          const options = [
            "speak1",
            "speak2",
            "grin",
            "ee",
            "ah",
            "flat",
            "smile",
          ] as const;
          const pick = options[Math.floor(Math.random() * options.length)];
          await mouthControls.start({
            d: mouthShapes[pick],
            transition: {
              type: "spring",
              stiffness: 80,
              damping: 14,
              mass: 0.6,
            },
          });
          await mouthControls.start({
            d: mouthShapes["speak2"],
            transition: { duration: 0.18, ease: "easeInOut" },
          });
        } else {
          await mouthControls.start({
            d: mouthShapes.rest,
            transition: { duration: 0.4, ease: "easeOut" },
          });
          await new Promise((r) => setTimeout(r, 300));
        }
      }
    };
    seq();
    return () => {
      mounted = false;
    };
  }, [isTalking, mouthControls, mouthShapes, isDisappearing]);

  // Add onAnimationComplete callback to the fading phase
  useEffect(() => {
    if (animationPhase === "fading" && onAnimationComplete) {
      const timer = setTimeout(onAnimationComplete, 1200); // Match the fade duration
      return () => clearTimeout(timer);
    }
  }, [animationPhase, onAnimationComplete]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-transparent">
      <motion.div
        animate={{
          opacity: animationPhase === "fading" ? 0 : 1,
          scale: animationPhase === "fading" ? 0.85 : 1,
        }}
        className="relative isolate h-full w-full rounded-none bg-transparent p-0"
        ref={faceRef}
        transition={{
          duration: 1.2,
          ease: [0.4, 0, 0.2, 1],
        }}
      >
        {/* Eyes Row */}
        <motion.div
          animate={{
            opacity: animationPhase === "fading" ? 0 : 1,
          }}
          className="-translate-x-1/2 absolute top-[8%] left-1/2 flex w-[90%] items-center justify-center gap-[8vmin] sm:top-[10%] sm:w-[84%] sm:gap-[9vmin] md:top-[12%] md:w-[80%] md:gap-[10vmin]"
          transition={{
            duration: 0.8,
            delay: 0.1,
            ease: [0.4, 0, 0.2, 1],
          }}
        >
          <Eye
            isBlinking={isBlinking}
            isHalfBlink={isHalfBlink}
            pupilX={pupilX}
            pupilY={pupilY}
          />
          <Eye
            isBlinking={isBlinking}
            isHalfBlink={isHalfBlink}
            mirror
            pupilX={pupilX}
            pupilY={pupilY}
          />
        </motion.div>

        {/* Cheeks - fade last */}
        <motion.div
          animate={{
            opacity: animationPhase === "fading" ? 0 : 1,
          }}
          className="-translate-x-1/2 -translate-y-1/2 pointer-events-none absolute top-[50%] left-1/2 flex w-[78%] justify-between sm:w-[80%]"
          transition={{
            duration: 1,
            delay: 0.4, // Cheeks fade last
            ease: [0.4, 0, 0.2, 1],
          }}
        >
          <GlowingCheek activity={activity} side="left" />
          <GlowingCheek activity={activity} side="right" />
        </motion.div>

        {/* Mouth */}
        <motion.div
          animate={{
            opacity: animationPhase === "fading" ? 0 : 1,
          }}
          className="-translate-x-1/2 absolute bottom-[8%] left-1/2 w-[70%] sm:bottom-[10%] sm:w-[62%] md:bottom-[12%] md:w-[56%]"
          transition={{
            duration: 0.9,
            delay: 0.15,
            ease: [0.4, 0, 0.2, 1],
          }}
        >
          <Mouth animateControls={mouthControls} mouthShapes={mouthShapes} />
        </motion.div>

        {/* Subtle status light */}
        <motion.div
          animate={{
            opacity: animationPhase === "fading" ? 0 : [0.7, 1, 0.7],
          }}
          className="absolute top-4 right-4 h-2.5 w-2.5 rounded-full"
          style={{
            background:
              "radial-gradient(70% 70% at 50% 50%, oklch(0.9 0.18 148 / 1) 0%, oklch(0.8 0.18 148 / 0.7) 55%, transparent 65%)",
          }}
          transition={{
            duration: animationPhase === "fading" ? 0.6 : 3.2,
            repeat: animationPhase === "fading" ? 0 : Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
      </motion.div>
    </div>
  );
}

function Eye({
  isBlinking,
  isHalfBlink,
  pupilX,
  pupilY,
  mirror = false,
}: {
  isBlinking: boolean;
  isHalfBlink: boolean;
  pupilX: ReturnType<typeof useSpring>;
  pupilY: ReturnType<typeof useSpring>;
  mirror?: boolean;
}) {
  return (
    <div
      className="relative h-[26vmin] w-[26vmin] rounded-full sm:h-[28vmin] sm:w-[28vmin] md:h-[30vmin] md:w-[30vmin]"
      style={{
        background:
          "radial-gradient(85% 85% at 50% 30%, oklch(1 0 0) 0%, oklch(0.96 0.02 230 / 0.7) 55%, oklch(0.9 0 0) 100%)",
        border: "1px solid oklch(0 0 0 / 0.06)",
      }}
    >
      {/* Iris */}
      <div
        className="absolute inset-[16%] rounded-full"
        style={{
          background:
            "radial-gradient(80% 80% at 50% 40%, oklch(0.95 0.02 230) 0%, oklch(0.72 0.12 240) 60%, oklch(0.58 0.1 250) 100%)",
        }}
      />

      {/* Pupil */}
      <motion.div
        className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 h-[48%] w-[48%] rounded-full"
        style={{
          x: mirror ? motionValueMirror(pupilX) : pupilX,
          y: pupilY,
          background:
            "radial-gradient(60% 60% at 45% 40%, oklch(0.28 0 0) 0%, oklch(0.18 0 0) 70%, oklch(0.1 0 0) 100%)",
        }}
      >
        {/* specular highlight */}
        <div className="absolute top-[28%] left-[28%] h-3 w-3 rounded-full bg-white/80 blur-[0.5px]" />
      </motion.div>

      {/* Blinking eyelid */}
      <motion.div
        animate={{ scaleY: isBlinking ? 1 : isHalfBlink ? 0.25 : 0 }}
        className="absolute inset-0 origin-top rounded-full"
        style={{
          background:
            "linear-gradient(to bottom, oklch(0.94 0.02 230 / 0.85), oklch(0.92 0.02 230 / 0.95) 60%, oklch(0.9 0 0 / 0.95))",
        }}
        transition={{ duration: isBlinking ? 0.1 : 0.28, ease: "easeInOut" }}
      />
    </div>
  );
}

// Mirror helper for motion values (simple inversion for symmetrical eye motion)
function motionValueMirror(v: ReturnType<typeof useSpring>) {
  const m = useSpring(0, { stiffness: 120, damping: 12, mass: 0.4 });
  useEffect(() => {
    const unsub = v.on("change", (val) => m.set(-val));
    return () => unsub();
  }, [v, m]);
  return m;
}

function GlowingCheek({
  side,
  activity,
}: {
  side: "left" | "right";
  activity: number;
}) {
  const dir = side === "left" ? -1 : 1;
  const amp = 0.06 + activity * 0.14; // scale amplitude
  const shift = 2 + activity * 4; // px movement amplitude
  const seed = useMemo(() => Math.random(), []); // per-cheek variation
  const baseDur = 4.6 + seed * 1.6;
  const phaseDelay = seed * 1.2;
  return (
    <motion.div
      animate={{
        opacity: [
          0.5 + activity * 0.2,
          0.85,
          0.6 + activity * 0.15,
          0.9,
          0.5 + activity * 0.2,
        ],
        scale: [1 - amp, 1 + amp, 1 + amp * 0.5, 1 + amp, 1 - amp],
        y: [0, -shift, 0, shift * 0.5, 0],
        x: [0, shift * 0.6 * dir, 0, -shift * 0.4 * dir, 0],
        rotate: [-1.2 * dir, 0, 0.8 * dir, 0, -1.2 * dir],
      }}
      className="relative h-14 w-14 rounded-full sm:h-16 sm:w-16"
      style={{
        background:
          "radial-gradient(60% 60% at 50% 50%, oklch(0.95 0.15 12 / 0.9), oklch(0.9 0.12 28 / 0.6) 55%, transparent 70%)",
        filter: "blur(0.4px)",
      }}
      transition={{
        duration: baseDur,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
        delay: phaseDelay,
      }}
    >
      {/* tinted halo */}
      <div
        className="-inset-3 -z-10 absolute rounded-full"
        style={{
          background:
            "radial-gradient(70% 70% at 50% 50%, oklch(0.93 0.15 12 / 0.35), transparent 70%)",
          filter: "blur(6px)",
        }}
      />
      {/* occasional soft flare for variation */}
      <motion.div
        animate={{ scale: [1, 1.12, 1], opacity: [0, 0.18, 0] }}
        className="-inset-4 -z-20 absolute rounded-full"
        style={{
          background:
            "radial-gradient(75% 75% at 50% 50%, oklch(0.96 0.15 12 / 0.25), transparent 70%)",
          filter: "blur(10px)",
        }}
        transition={{
          duration: 2.4 + seed * 1.2,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
          repeatDelay: 1.2 + seed * 1.8,
          delay: phaseDelay / 2,
        }}
      />
    </motion.div>
  );
}

function Mouth({
  animateControls,
  mouthShapes,
}: {
  animateControls: ReturnType<typeof useAnimation>;
  mouthShapes: { [k: string]: string };
}) {
  return (
    <div className="relative aspect-[2.6/1] w-full">
      <svg
        className="h-full w-full"
        shapeRendering="geometricPrecision"
        viewBox="0 0 128 64"
      >
        {/* lip background */}
        <defs>
          <linearGradient id="lipGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.72 0.12 240 / 0.9)" />
            <stop offset="60%" stopColor="oklch(0.64 0.11 250 / 0.9)" />
            <stop offset="100%" stopColor="oklch(0.58 0.1 260 / 0.95)" />
          </linearGradient>
        </defs>

        <motion.path
          animate={animateControls}
          d={mouthShapes.rest}
          fill="url(#lipGrad)"
          stroke="oklch(0 0 0 / 0.2)"
          strokeWidth="1.5"
        />

        {/* inner gloss */}
        <motion.path
          animate={animateControls}
          d={mouthShapes.rest}
          fill="none"
          stroke="white"
          strokeOpacity={0.35}
          strokeWidth={1}
        />
      </svg>

      {/* removed under-mouth shadow for cleaner look */}
    </div>
  );
}
