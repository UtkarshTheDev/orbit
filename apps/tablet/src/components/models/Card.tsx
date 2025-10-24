import { motion } from "motion/react";
import type { Model3DConfig } from "@/config/models";

type ModelCardProps = {
  model: Model3DConfig;
  onClick: () => void;
};

export function ModelCard({ model, onClick }: ModelCardProps) {
  return (
    <motion.div
      className="card-glow pulse-border cursor-pointer overflow-hidden rounded-lg bg-slate-800/90 backdrop-blur-sm"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="relative flex aspect-video items-center justify-center bg-white">
        <img
          alt={model.name}
          className="object-fill"
          src={model.preview || "/placeholder.svg"}
        />

        {/* Overlay label at bottom of image */}
        <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-slate-900/95 via-slate-900/70 to-transparent p-4 pb-5">
          <h3 className="text-center font-sans font-semibold text-base text-white md:text-lg">
            {model.name}
          </h3>
        </div>
      </div>
    </motion.div>
  );
}
