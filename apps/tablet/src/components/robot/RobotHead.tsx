import { motion } from "motion/react";
import { useState } from "react";

export default function RobotHead() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      animate={{ scale: 1, opacity: 1 }}
      className="relative"
      initial={{ scale: 0.95, opacity: 0 }}
      onHoverEnd={() => setIsHovered(false)}
      onHoverStart={() => setIsHovered(true)}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="relative flex h-full w-full items-center justify-center">
        <svg
          aria-label="Orbit Robot Head"
          className="h-full w-full drop-shadow-2xl"
          viewBox="0 0 320 320"
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>Orbit Robot Head</title>
          <defs>
            {/* Vibrant gradient for robot body */}
            <linearGradient
              id="robotGradient"
              x1="0%"
              x2="0%"
              y1="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="50%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#1E40AF" />
            </linearGradient>

            {/* Glowing inner gradient */}
            <linearGradient
              id="innerGradient"
              x1="0%"
              x2="0%"
              y1="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.2" />
            </linearGradient>

            {/* Glow filter for futuristic effect */}
            <filter id="glow">
              <feGaussianBlur result="coloredBlur" stdDeviation="2" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Main Robot Head - Perfect Geometric Octagon with straight edges */}
          <motion.path
            animate={isHovered ? { scale: 1.02 } : { scale: 1 }}
            d="M 160 70 L 210 70 L 250 110 L 250 160 L 250 210 L 210 250 L 110 250 L 70 210 L 70 160 L 70 110 L 110 70 Z"
            fill="url(#robotGradient)"
            stroke="#1E40AF"
            strokeWidth="3"
            style={{ transformOrigin: "160px 160px" }}
            transition={{ duration: 0.3 }}
          />

          {/* Inner octagon detail - straight lines */}
          <path
            d="M 160 90 L 200 90 L 230 120 L 230 160 L 230 200 L 200 230 L 120 230 L 90 200 L 90 160 L 90 120 L 120 90 Z"
            fill="url(#innerGradient)"
            opacity="0.5"
            stroke="#60A5FA"
            strokeWidth="1.5"
          />

          {/* Top horizontal circuit lines - like reference image */}
          <g filter="url(#glow)" opacity="0.8">
            <line
              stroke="#FFFFFF"
              strokeLinecap="round"
              strokeWidth="2.5"
              x1="130"
              x2="155"
              y1="105"
              y2="105"
            />
            <line
              stroke="#FFFFFF"
              strokeLinecap="round"
              strokeWidth="2.5"
              x1="165"
              x2="190"
              y1="105"
              y2="105"
            />
          </g>

          {/* Upper circuit detail lines */}
          <g opacity="0.6">
            <line
              stroke="#60A5FA"
              strokeLinecap="round"
              strokeWidth="2"
              x1="115"
              x2="135"
              y1="115"
              y2="115"
            />
            <line
              stroke="#60A5FA"
              strokeLinecap="round"
              strokeWidth="2"
              x1="185"
              x2="205"
              y1="115"
              y2="115"
            />
          </g>

          {/* Left Eye - White oval with blue pupil */}
          <motion.g
            animate={isHovered ? { y: [0, -1, 0] } : { y: 0 }}
            transition={{
              duration: 0.8,
              repeat: isHovered ? Number.POSITIVE_INFINITY : 0,
            }}
          >
            <ellipse cx="130" cy="145" fill="#FFFFFF" rx="13" ry="15" />
            <circle cx="130" cy="145" fill="#3B82F6" r="6" />
            <circle cx="132" cy="143" fill="#FFFFFF" opacity="0.9" r="2.5" />
          </motion.g>

          {/* Right Eye - White oval with blue pupil */}
          <motion.g
            animate={isHovered ? { y: [0, -1, 0] } : { y: 0 }}
            transition={{
              duration: 0.8,
              repeat: isHovered ? Number.POSITIVE_INFINITY : 0,
              delay: 0.1,
            }}
          >
            <ellipse cx="190" cy="145" fill="#FFFFFF" rx="13" ry="15" />
            <circle cx="190" cy="145" fill="#3B82F6" r="6" />
            <circle cx="192" cy="143" fill="#FFFFFF" opacity="0.9" r="2.5" />
          </motion.g>

          {/* Middle horizontal circuit lines - between eyes and mouth */}
          <g opacity="0.7">
            <line
              stroke="#60A5FA"
              strokeLinecap="round"
              strokeWidth="2"
              x1="105"
              x2="125"
              y1="168"
              y2="168"
            />
            <line
              stroke="#60A5FA"
              strokeLinecap="round"
              strokeWidth="2"
              x1="195"
              x2="215"
              y1="168"
              y2="168"
            />
          </g>

          {/* Smile - Curved upward smile */}
          <motion.g
            animate={isHovered ? { scaleX: 1.1 } : { scaleX: 1 }}
            style={{ transformOrigin: "160px 185px" }}
            transition={{ duration: 0.3 }}
          >
            <path
              d="M 125 180 Q 160 198, 195 180"
              fill="none"
              filter="url(#glow)"
              stroke="#FFFFFF"
              strokeLinecap="round"
              strokeWidth="3.5"
            />
            <path
              d="M 130 182 Q 160 196, 190 182"
              fill="none"
              opacity="0.7"
              stroke="#93C5FD"
              strokeLinecap="round"
              strokeWidth="2"
            />
          </motion.g>

          {/* Bottom horizontal circuit lines - below smile like reference */}
          <g filter="url(#glow)" opacity="0.8">
            <line
              stroke="#FFFFFF"
              strokeLinecap="round"
              strokeWidth="2.5"
              x1="130"
              x2="150"
              y1="205"
              y2="205"
            />
            <line
              stroke="#FFFFFF"
              strokeLinecap="round"
              strokeWidth="2.5"
              x1="160"
              x2="170"
              y1="205"
              y2="205"
            />
            <line
              stroke="#FFFFFF"
              strokeLinecap="round"
              strokeWidth="2.5"
              x1="180"
              x2="190"
              y1="205"
              y2="205"
            />
          </g>

          {/* Additional bottom circuit detail */}
          <g opacity="0.6">
            <line
              stroke="#60A5FA"
              strokeLinecap="round"
              strokeWidth="2"
              x1="140"
              x2="155"
              y1="215"
              y2="215"
            />
            <line
              stroke="#60A5FA"
              strokeLinecap="round"
              strokeWidth="2"
              x1="165"
              x2="180"
              y1="215"
              y2="215"
            />
          </g>

          {/* Side vertical tech lines for depth */}
          <g opacity="0.5">
            <line
              stroke="#60A5FA"
              strokeLinecap="round"
              strokeWidth="2"
              x1="90"
              x2="90"
              y1="130"
              y2="150"
            />
            <line
              stroke="#60A5FA"
              strokeLinecap="round"
              strokeWidth="2"
              x1="90"
              x2="90"
              y1="170"
              y2="190"
            />
            <line
              stroke="#60A5FA"
              strokeLinecap="round"
              strokeWidth="2"
              x1="230"
              x2="230"
              y1="130"
              y2="150"
            />
            <line
              stroke="#60A5FA"
              strokeLinecap="round"
              strokeWidth="2"
              x1="230"
              x2="230"
              y1="170"
              y2="190"
            />
          </g>

          {/* Corner tech details */}
          <g opacity="0.6">
            <rect fill="#60A5FA" height="8" rx="1" width="3" x="113" y="93" />
            <rect fill="#60A5FA" height="8" rx="1" width="3" x="204" y="93" />
            <rect fill="#60A5FA" height="8" rx="1" width="3" x="113" y="222" />
            <rect fill="#60A5FA" height="8" rx="1" width="3" x="204" y="222" />
          </g>
        </svg>
      </div>
    </motion.div>
  );
}
