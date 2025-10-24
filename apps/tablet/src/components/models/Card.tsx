import { motion } from "motion/react";
import type { Model3DConfig } from "@/config/models";

type ModelCardProps = {
  model: Model3DConfig;
  onClick: () => void;
};

export function ModelCard({ model, onClick }: ModelCardProps) {
  return (
    <motion.div
      className="card-glow pulse-border cursor-pointer overflow-hidden rounded-2xl bg-card"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="relative flex aspect-square items-center justify-center bg-slate-800 p-8">
        <img
          alt={model.name}
          className="object-contain p-4"
          height="100%"
          src={model.preview || "/placeholder.svg"}
          width="100%"
        />

        {/* Overlay label at bottom of image */}
        <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-6 pb-8">
          <h3 className="text-center font-sans font-semibold text-lg text-white md:text-xl">
            {model.name}
          </h3>
        </div>
      </div>
    </motion.div>
  );
}
