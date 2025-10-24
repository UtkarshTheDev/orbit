import { X } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Model3DConfig } from "@/config/models";

type ModelSidebarProps = {
  models: Model3DConfig[];
  currentModelId: string;
  onModelSelect: (modelId: string) => void;
  onClose: () => void;
};

export function ModelSidebar({
  models,
  currentModelId,
  onModelSelect,
  onClose,
}: ModelSidebarProps) {
  return (
    <motion.div
      animate={{ x: 0 }}
      className="flex h-full w-full flex-col border-border border-l bg-card/95 shadow-2xl backdrop-blur-md md:w-96"
      exit={{ x: "100%" }}
      initial={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-border border-b p-6">
        <h2 className="font-[family-name:var(--font-orbitron)] text-card-foreground text-xl tracking-wide">
          Models
        </h2>
        <Button
          className="rounded-full md:hidden"
          onClick={onClose}
          size="icon"
          variant="ghost"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Model List */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {models.map((model) => (
            <motion.button
              className={`flex w-full items-center gap-4 rounded-xl p-4 transition-all ${
                currentModelId === model.id
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "bg-secondary/50 text-card-foreground hover:bg-secondary"
              }`}
              key={model.id}
              onClick={() => onModelSelect(model.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Thumbnail */}
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-background/50">
                <img
                  alt={model.name}
                  className="object-contain p-2"
                  height="100%"
                  src={model.preview || "/placeholder.svg"}
                  width="100%"
                />
              </div>

              {/* Name */}
              <span className="text-left font-medium font-sans text-sm md:text-base">
                {model.name}
              </span>
            </motion.button>
          ))}
        </div>
      </ScrollArea>
    </motion.div>
  );
}
