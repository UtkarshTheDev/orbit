import { useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ModelCard } from "@/components/models/Card";
import { getAllModels } from "@/config/models";

export default function Models() {
  const navigate = useNavigate();
  const models = getAllModels();

  const handleModelSelect = (modelId: string) => {
    navigate({ to: "/viewer/$id", params: { id: modelId } });
  };

  return (
    <div className="gradient-bg h-screen">
      <div className="container mx-auto px-8 py-12 md:px-12 md:py-16 lg:px-16">
        {/* Header */}
        <motion.h1
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center font-orbitron text-4xl text-foreground tracking-wider md:mb-16 md:text-5xl lg:text-6xl"
          initial={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.6 }}
        >
          Pick a 3D Model
        </motion.h1>

        <motion.div
          animate={{ opacity: 1 }}
          className="flex flex-wrap justify-center gap-6 md:gap-8 lg:gap-10"
          initial={{ opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {models.map((model, index) => (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-md md:w-[calc(50%-1rem)] lg:w-[calc(50%-1.25rem)] xl:w-[calc(33.333%-1.67rem)]"
              initial={{ opacity: 0, y: 20 }}
              key={model.id}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <ModelCard
                model={model}
                onClick={() => handleModelSelect(model.id)}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
