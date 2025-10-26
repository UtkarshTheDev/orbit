import { ShimmeringText } from "@/components/ui/shimmering-text"

interface StatusTextProps {
  state: string
}

const StatusText = ({ state }: StatusTextProps) => {
  const getStatusContent = () => {
    switch (state) {
      case "listening":
        return <ShimmeringText text="Listening…" className="text-gray-600" />
      case "analyzing":
        return (
          <span className="flex items-center gap-2">
            <ShimmeringText text="Analyzing your voice" className="text-blue-600" />
            <span className="flex gap-0.5">
              <span className="dot-pulse-1">•</span>
              <span className="dot-pulse-2">•</span>
              <span className="dot-pulse-3">•</span>
            </span>
          </span>
        )
      case "thinking":
        return (
          <span className="flex items-center gap-2">
            <ShimmeringText text="Thinking about your query" className="text-blue-600" />
            <span className="flex gap-0.5">
              <span className="dot-pulse-1">•</span>
              <span className="dot-pulse-2">•</span>
              <span className="dot-pulse-3">•</span>
            </span>
          </span>
        )
      default:
        return null
    }
  }

  if (state === "idle" || state === "done" || state === "responding" || state === "error") {
    return null
  }

  return (
    <div className="absolute bottom-16 md:bottom-20 left-1/2 transform -translate-x-1/2 z-10 animate-fade-in">
      <p className="font-orbitron font-medium text-sm md:text-base tracking-wide" style={{ letterSpacing: "0.05em" }}>
        {getStatusContent()}
      </p>
    </div>
  )
}

export default StatusText
