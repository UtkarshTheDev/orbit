import { motion } from "framer-motion"
import { useNavigate } from "@tanstack/react-router"
import { ModelCard } from "@/components/models/Card"
import { getAllModels } from "@/config/models"

export default function Models() {
  const navigate = useNavigate()
  const models = getAllModels()

  const handleModelSelect = (modelId: string) => {
    navigate({ to: '/viewer/$id', params: { id: modelId } })
  }

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto px-8 md:px-12 lg:px-16 py-12 md:py-16">
        {/* Header */}
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-5xl lg:text-6xl font-[family-name:var(--font-display)] text-center mb-12 md:mb-16 text-foreground tracking-wider"
        >
          Pick a 3D Model
        </motion.h1>

        {/* Model Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-8 md:gap-10 lg:gap-12"
        >
          {models.map((model, index) => (
            <motion.div
              key={model.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="w-full max-w-sm md:w-[calc(50%-1.25rem)] lg:w-[calc(33.333%-2rem)] xl:w-[calc(25%-2.25rem)]"
            >
              <ModelCard model={model} onClick={() => handleModelSelect(model.id)} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
