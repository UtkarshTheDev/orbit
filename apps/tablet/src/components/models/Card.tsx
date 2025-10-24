import { motion } from "framer-motion"
import type { Model3DConfig } from "@/config/models"

interface ModelCardProps {
  model: Model3DConfig
  onClick: () => void
}

export function ModelCard({ model, onClick }: ModelCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-card rounded-2xl overflow-hidden cursor-pointer card-glow pulse-border"
    >
      <div className="aspect-square relative bg-slate-800 flex items-center justify-center p-8">
        <img src={model.preview || "/placeholder.svg"} alt={model.name} className="object-contain p-4" />

        {/* Overlay label at bottom of image */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-6 pb-8">
          <h3 className="text-lg md:text-xl font-sans font-semibold text-white text-center">{model.name}</h3>
        </div>
      </div>
    </motion.div>
  )
}
