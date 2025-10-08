import { cn } from "@/lib/utils"

/**
 * RobotExhibitionBackground
 * - Full-page responsive SVG with:
 *   - Light gradient background (soft white → silver-blue)
 *   - Mixed dashed/solid futuristic grid lines
 *   - Minimal dots and robotic outlines
 *   - Vibrant holographic circuit traces with glow
 *   - Labels positioned toward edges/corners with enhanced visibility
 */
export default function Background({
  className,
  decorative = true,
}: {
  className?: string
  decorative?: boolean
}) {
  return (
    <div className={cn("fixed inset-0 w-full h-full z-0", className)}>
      <svg
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
        role={decorative ? "img" : "group"}
        aria-hidden={decorative ? "true" : undefined}
        className="h-full w-full"
      >
        <defs>
          <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--fx-bg-start)" />
            <stop offset="100%" stopColor="var(--fx-bg-end)" />
          </linearGradient>

          {/* Glow for holographic circuit traces */}
          <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Subtle grid pattern (very low opacity) */}
          <pattern id="microGrid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 0 0 L 80 0 M 0 0 L 0 80" stroke="var(--fx-line)" strokeOpacity="0.08" strokeWidth="1" />
          </pattern>

          {/* Glow for holographic circuit traces */}
          <style>
            {`
              @keyframes fx-shine-dash {
                0% { stroke-dashoffset: 0; }
                100% { stroke-dashoffset: -1400; }
              }
              @keyframes fx-shine-pulse {
                0%, 70% { opacity: 0; }
                80% { opacity: 0.18; }
                100% { opacity: 0; }
              }
              .fx-shine {
                animation: fx-shine-dash 9s linear infinite, fx-shine-pulse 9s ease-in-out infinite;
              }
            `}
          </style>
        </defs>

        {/* Background gradient */}
        <rect x="0" y="0" width="1600" height="900" fill="url(#bgGrad)" />

        {/* Whisper grid overlay */}
        <rect x="0" y="0" width="1600" height="900" fill="url(#microGrid)" />

        <g stroke="var(--fx-line)" strokeWidth="1.5" fill="none">
          {/* Top-left corner bracket - solid lines */}
          <path d="M 80 180 L 80 80 L 280 80" strokeOpacity="0.35" />
          <path d="M 120 200 L 120 120 L 280 120" strokeOpacity="0.28" strokeDasharray="8 4" />

          {/* Top-right corner bracket - mixed */}
          <path d="M 1520 180 L 1520 80 L 1320 80" strokeOpacity="0.35" />
          <path d="M 1480 200 L 1480 120 L 1320 120" strokeOpacity="0.28" strokeDasharray="8 4" />

          {/* Bottom-left corner bracket - dashed */}
          <path d="M 80 720 L 80 820 L 280 820" strokeOpacity="0.35" />
          <path d="M 120 700 L 120 780 L 280 780" strokeOpacity="0.28" strokeDasharray="8 4" />

          {/* Bottom-right corner bracket - mixed */}
          <path d="M 1520 720 L 1520 820 L 1320 820" strokeOpacity="0.35" />
          <path d="M 1480 700 L 1480 780 L 1320 780" strokeOpacity="0.28" strokeDasharray="8 4" />

          {/* Diagonal lines toward center - mix of solid and dashed */}
          <path d="M 200 200 L 700 420" strokeOpacity="0.18" />
          <path d="M 1400 200 L 900 420" strokeOpacity="0.18" strokeDasharray="12 6" />
          <path d="M 200 700 L 700 480" strokeOpacity="0.15" strokeDasharray="10 5" />
          <path d="M 1400 700 L 900 480" strokeOpacity="0.15" />

          {/* Additional horizontal/vertical grid accents */}
          <path d="M 400 450 L 1200 450" strokeOpacity="0.12" strokeDasharray="16 8" />
          <path d="M 800 200 L 800 700" strokeOpacity="0.10" strokeDasharray="12 6" />
        </g>

        {/* Themed Motifs — base strokes (subtle) */}
        <g
          stroke="var(--fx-line)"
          strokeOpacity="0.16"
          strokeWidth="1.4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Science — Advanced atom with torque arc (TOP-LEFT, above center) */}
          <g id="motif-science-base-1">
            {/* multi-orbit atom */}
            <ellipse cx="480" cy="300" rx="90" ry="42" />
            <ellipse cx="480" cy="300" rx="90" ry="42" transform="rotate(60 480 300)" strokeOpacity="0.12" />
            <ellipse cx="480" cy="300" rx="90" ry="42" transform="rotate(-60 480 300)" strokeOpacity="0.12" />
            {/* nucleus */}
            <circle cx="480" cy="300" r="7" strokeOpacity="0.2" />
            {/* torque arc with arrow */}
            <path d="M 560 265 Q 620 300 555 380" strokeOpacity="0.18" />
            <path d="M 555 380 L 565 372 M 555 380 L 561 392" strokeOpacity="0.18" />
          </g>

          {/* Programming — Refined code module (TOP-RIGHT, above center) */}
          <g id="motif-programming-base-1">
            <rect x="1040" y="240" width="280" height="120" rx="12" ry="12" />
            {/* header strip */}
            <path d="M 1040 270 H 1320" strokeOpacity="0.12" />
            {/* binary tag circle */}
            <circle cx="1300" cy="255" r="10" strokeOpacity="0.14" />
            {/* code braces and flow */}
            <path d="M 1096 294 L 1072 308 L 1096 322" />
            <path d="M 1214 294 L 1238 308 L 1214 322" />
            <path d="M 1192 290 L 1144 326" strokeOpacity="0.12" />
            {/* subtle code lines */}
            <path d="M 1060 340 H 1280" strokeOpacity="0.10" />
            <path d="M 1060 360 H 1260" strokeOpacity="0.08" />
            <path d="M 1060 320 H 1230" strokeOpacity="0.08" />
          </g>

          {/* Science — Advanced atom with torque arc (BOTTOM-RIGHT, below center) */}
          <g id="motif-science-base-2">
            <ellipse cx="1180" cy="610" rx="80" ry="36" />
            <ellipse cx="1180" cy="610" rx="80" ry="36" transform="rotate(55 1180 610)" strokeOpacity="0.12" />
            <ellipse cx="1180" cy="610" rx="80" ry="36" transform="rotate(-55 1180 610)" strokeOpacity="0.12" />
            <circle cx="1180" cy="610" r="6" strokeOpacity="0.2" />
            <path d="M 1260 580 Q 1300 610 1245 675" strokeOpacity="0.18" />
            <path d="M 1245 675 L 1255 667 M 1245 675 L 1251 687" strokeOpacity="0.18" />
          </g>

          {/* Programming — Refined code module (BOTTOM-LEFT, below center) */}
          <g id="motif-programming-base-2">
            <rect x="260" y="560" width="260" height="110" rx="12" ry="12" />
            <path d="M 260 588 H 520" strokeOpacity="0.12" />
            <circle cx="506" cy="575" r="9" strokeOpacity="0.14" />
            <path d="M 308 604 L 288 616 L 308 628" />
            <path d="M 410 604 L 430 616 L 410 628" />
            <path d="M 394 600 L 352 630" strokeOpacity="0.12" />
            <path d="M 276 646 H 498" strokeOpacity="0.10" />
            <path d="M 276 664 H 486" strokeOpacity="0.08" />
            <path d="M 276 628 H 456" strokeOpacity="0.08" />
          </g>

          {/* optional tiny vias/dots to enhance premium feel (very minimal) */}
          <circle cx="520" cy="258" r="2" strokeOpacity="0.10" />
          <circle cx="1140" cy="266" r="2" strokeOpacity="0.10" />
          <circle cx="1220" cy="656" r="2" strokeOpacity="0.10" />
          <circle cx="324" cy="600" r="2" strokeOpacity="0.10" />
        </g>

        {/* Shine overlays — impactful blue sweep with subtle glow (staggered) */}
        <g filter="url(#softGlow)" stroke="var(--fx-accent)" strokeLinecap="round" fill="none">
          {/* Science shine (outer ellipse sweep) - TOP-LEFT */}
          <path id="motif-science-1" d="M 390 300 a 90 42 0 1 1 180 0 a 90 42 0 1 1 -180 0" />
          <use
            href="#motif-science-1"
            strokeWidth="3.0"
            strokeOpacity="0.22"
            className="fx-shine"
            style={{ strokeDasharray: "160 1200", animationDelay: "0s" }}
          />
          {/* torque arc sweep - TOP-LEFT */}
          <path id="motif-science-torque-1" d="M 560 265 Q 620 300 555 380" />
          <use
            href="#motif-science-torque-1"
            strokeWidth="3.0"
            strokeOpacity="0.22"
            className="fx-shine"
            style={{ strokeDasharray: "100 1000", animationDelay: "0.3s" }}
          />

          {/* Programming shine (module perimeter) - TOP-RIGHT */}
          <path id="motif-programming-1" d="M 1040 240 H 1320 V 360 H 1040 Z" />
          <use
            href="#motif-programming-1"
            strokeWidth="3.0"
            strokeOpacity="0.24"
            className="fx-shine"
            style={{ strokeDasharray: "180 1200", animationDelay: "1.0s" }}
          />

          {/* Science shine (outer ellipse sweep) - BOTTOM-RIGHT */}
          <path id="motif-science-2" d="M 1100 610 a 80 36 0 1 1 160 0 a 80 36 0 1 1 -160 0" />
          <use
            href="#motif-science-2"
            strokeWidth="3.0"
            strokeOpacity="0.22"
            className="fx-shine"
            style={{ strokeDasharray: "150 1100", animationDelay: "2.0s" }}
          />
          {/* torque arc sweep - BOTTOM-RIGHT */}
          <path id="motif-science-torque-2" d="M 1260 580 Q 1300 610 1245 675" />
          <use
            href="#motif-science-torque-2"
            strokeWidth="3.0"
            strokeOpacity="0.22"
            className="fx-shine"
            style={{ strokeDasharray: "100 1000", animationDelay: "2.3s" }}
          />

          {/* Programming shine (module perimeter) - BOTTOM-LEFT */}
          <path id="motif-programming-2" d="M 260 560 H 520 V 670 H 260 Z" />
          <use
            href="#motif-programming-2"
            strokeWidth="3.0"
            strokeOpacity="0.24"
            className="fx-shine"
            style={{ strokeDasharray: "170 1150", animationDelay: "3.0s" }}
          />
        </g>

        <g
          fill="var(--fx-line)"
          fillOpacity="0.55"
          fontFamily="var(--font-sans)"
          fontWeight="300"
          letterSpacing="0.08em"
        >
          {/* #LPS — Top Left corner area */}
          <text x="200" y="200" fontSize="32" textAnchor="start">
            #LPS
          </text>

          {/* #Eldeco — Top Right corner area */}
          <text x="1400" y="200" fontSize="32" textAnchor="end">
            #Eldeco
          </text>

          {/* #Science — Bottom Left area (vertical) */}
          <g transform="translate(260,740) rotate(-90)">
            <text fontSize="30" textAnchor="start">
              #Science
            </text>
          </g>

          {/* #Exhibition — Bottom Right (vertical) */}
          <g transform="translate(1380,750) rotate(-90)">
            <text fontSize="30" textAnchor="start">
              #Exhibition
            </text>
          </g>

          {/* #2025 — Bottom Center */}
          <text x="800" y="780" fontSize="34" textAnchor="middle">
            #2025
          </text>
        </g>
      </svg>
    </div>
  )
}
