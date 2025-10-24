import { motion } from "framer-motion"
import { ZoomIn, ZoomOut, RotateCcw, Play, Pause } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TouchControlsProps {
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
  onToggleAutoRotate: () => void
  isAutoRotating: boolean
}

export function TouchControls({
  onZoomIn,
  onZoomOut,
  onReset,
  onToggleAutoRotate,
  isAutoRotating,
}: TouchControlsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="absolute right-6 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-3"
    >
      {/* Zoom In */}
      <div className="flex flex-col items-center gap-1">
        <Button
          onClick={onZoomIn}
          size="lg"
          className="rounded-2xl w-16 h-16 shadow-lg hover:shadow-xl transition-all bg-white/95 backdrop-blur-sm hover:bg-white text-slate-900 hover:text-slate-900 border-2 border-slate-200"
        >
          <ZoomIn className="h-7 w-7" />
        </Button>
        <span className="text-xs font-medium text-white/90 bg-slate-800/80 px-2 py-1 rounded-md backdrop-blur-sm">
          Zoom In
        </span>
      </div>

      {/* Zoom Out */}
      <div className="flex flex-col items-center gap-1">
        <Button
          onClick={onZoomOut}
          size="lg"
          className="rounded-2xl w-16 h-16 shadow-lg hover:shadow-xl transition-all bg-white/95 backdrop-blur-sm hover:bg-white text-slate-900 hover:text-slate-900 border-2 border-slate-200"
        >
          <ZoomOut className="h-7 w-7" />
        </Button>
        <span className="text-xs font-medium text-white/90 bg-slate-800/80 px-2 py-1 rounded-md backdrop-blur-sm">
          Zoom Out
        </span>
      </div>

      {/* Reset View */}
      <div className="flex flex-col items-center gap-1">
        <Button
          onClick={onReset}
          size="lg"
          className="rounded-2xl w-16 h-16 shadow-lg hover:shadow-xl transition-all bg-white/95 backdrop-blur-sm hover:bg-white text-slate-900 hover:text-slate-900 border-2 border-slate-200"
        >
          <RotateCcw className="h-7 w-7" />
        </Button>
        <span className="text-xs font-medium text-white/90 bg-slate-800/80 px-2 py-1 rounded-md backdrop-blur-sm">
          Reset
        </span>
      </div>

      {/* Auto Rotate Toggle */}
      <div className="flex flex-col items-center gap-1">
        <Button
          onClick={onToggleAutoRotate}
          size="lg"
          className={`rounded-2xl w-16 h-16 shadow-lg hover:shadow-xl transition-all border-2 ${
            isAutoRotating
              ? "bg-blue-500 hover:bg-blue-600 text-white border-blue-400"
              : "bg-white/95 backdrop-blur-sm hover:bg-white text-slate-900 border-slate-200"
          }`}
        >
          {isAutoRotating ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7" />}
        </Button>
        <span className="text-xs font-medium text-white/90 bg-slate-800/80 px-2 py-1 rounded-md backdrop-blur-sm">
          {isAutoRotating ? "Pause" : "Auto Rotate"}
        </span>
      </div>

      {/* Touch Instructions */}
      <div className="mt-4 bg-slate-800/90 backdrop-blur-sm rounded-xl p-3 max-w-[140px]">
        <p className="text-xs text-slate-200 font-medium mb-2 text-center">Touch Gestures:</p>
        <ul className="text-xs text-slate-300 space-y-1">
          <li>• 1 finger: Rotate</li>
          <li>• 2 fingers: Zoom</li>
          <li>• 3 fingers: Pan</li>
        </ul>
      </div>
    </motion.div>
  )
}
