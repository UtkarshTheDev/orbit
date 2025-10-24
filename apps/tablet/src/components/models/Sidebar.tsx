import { motion } from "framer-motion"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Model3DConfig } from "@/config/models"

interface ModelSidebarProps {
  models: Model3DConfig[]
  currentModelId: string
  onModelSelect: (modelId: string) => void
  onClose: () => void
}

export function ModelSidebar({ models, currentModelId, onModelSelect, onClose }: ModelSidebarProps) {
  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="w-full md:w-96 h-full bg-card/95 backdrop-blur-md border-l border-border shadow-2xl flex flex-col"
    >
      {/* Header */}
      <div className="p-6 border-b border-border flex items-center justify-between">
        <h2 className="text-xl font-[family-name:var(--font-display)] text-card-foreground tracking-wide">Models</h2>
        <Button onClick={onClose} variant="ghost" size="icon" className="rounded-full md:hidden">
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Model List */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {models.map((model) => (
            <motion.button
              key={model.id}
              onClick={() => onModelSelect(model.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${
                currentModelId === model.id
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "bg-secondary/50 hover:bg-secondary text-card-foreground"
              }`}
            >
              {/* Thumbnail */}
              <div className="w-16 h-16 relative rounded-lg overflow-hidden bg-background/50 flex-shrink-0">
                <img src={model.preview || "/placeholder.svg"} alt={model.name} className="object-contain p-2" />
              </div>

              {/* Name */}
              <span className="text-left font-sans font-medium text-sm md:text-base">{model.name}</span>
            </motion.button>
          ))}
        </div>
      </ScrollArea>
    </motion.div>
  )
}
