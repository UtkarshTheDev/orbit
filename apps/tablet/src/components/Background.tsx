import { cn } from "@/lib/utils"

/**
 * RobotExhibitionBackground
 * - Full-page responsive SVG with:
 *   - Light gradient background (soft white → silver-blue)
 *   - Mixed dashed/solid futuristic grid lines
 *   - Corner brackets with blue/primary colors
 *   - Labels positioned toward edges/corners with reduced visibility
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
            <stop offset="0%" stopColor="#FAFBFC" />
            <stop offset="100%" stopColor="#F0F4F8" />
          </linearGradient>

          {/* Subtle grid pattern (very low opacity) */}
          <pattern id="microGrid" width="80" height="80" patternUnits="usersansOnUse">
            <path d="M 0 0 L 80 0 M 0 0 L 0 80" stroke="oklch(0.65 0.18 240)" strokeOpacity="0.05" strokeWidth="1" />
          </pattern>
        </defs>

        {/* Background gradient */}
        <rect x="0" y="0" width="1600" height="900" fill="url(#bgGrad)" />

        {/* Whisper grid overlay */}
        <rect x="0" y="0" width="1600" height="900" fill="url(#microGrid)" />

        <g stroke="oklch(0.65 0.18 240)" strokeWidth="1.5" fill="none">
          {/* Top-left corner bracket */}
          <path d="M 80 180 L 80 80 L 280 80" strokeOpacity="0.15" />

          {/* Top-right corner bracket */}
          <path d="M 1520 180 L 1520 80 L 1320 80" strokeOpacity="0.15" />

          {/* Bottom-left corner bracket */}
          <path d="M 80 720 L 80 820 L 280 820" strokeOpacity="0.15" />

          {/* Bottom-right corner bracket */}
          <path d="M 1520 720 L 1520 820 L 1320 820" strokeOpacity="0.15" />
        </g>

        <g
          fill="oklch(0.65 0.18 240)"
          fillOpacity="0.25"
          fontFamily="var(--font-sans)"
          fontWeight="300"
          letterSpacing="0.08em"
        >
          {/* #LPS — Top Left corner area */}
          <text x="150" y="150" fontSize="32" textAnchor="start" className="font-orbitron">
            #LPS
          </text>

          {/* #Eldeco — Top Right corner area */}
          <text x="1450" y="150" fontSize="32" textAnchor="end" className="font-orbitron">
            #Eldeco
          </text>

          {/* #Science — Bottom Left area (vertical) */}
          <g transform="translate(200,750) rotate(-90)" className="font-orbitron">
            <text fontSize="30" textAnchor="start">
              #Science
            </text>
          </g>

          {/* #Exhibition — Bottom Right (vertical) */}
          <g transform="translate(1450,750) rotate(-90)" className="font-orbitron">
            <text fontSize="30" textAnchor="start">
              #Exhibition
            </text>
          </g>

          {/* #2025 — Bottom Center */}
          <text x="800" y="850" fontSize="34" textAnchor="middle" className="font-pacifico">
            #2025
          </text>
        </g>
      </svg>
    </div>
  )
}
