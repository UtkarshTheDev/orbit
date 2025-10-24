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
        <h2 className="font-[family-name:var(--font-display)] text-card-foreground text-xl tracking-wide">
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

      <div className="scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800 flex-1 overflow-y-auto p-4">
        <div className="space-y-6">
          {models.map((model) => (
            <motion.button
              className={`w-full overflow-hidden rounded-xl transition-all ${
                currentModelId === model.id
                  ? "shadow-lg shadow-primary/20 ring-2 ring-primary"
                  : "hover:ring-2 hover:ring-slate-600"
              }`}
              key={model.id}
              onClick={() => onModelSelect(model.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-white shadow-sm">
                <img
                  alt={model.name}
                  className="object-contain"
                  src={model.preview || "/placeholder.svg"}
                />

                {/* Embedded title with blur background */}
                <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-slate-900/90 via-slate-900/70 to-transparent px-3 py-2 backdrop-blur-sm">
                  <p className="truncate text-center font-medium font-sans text-white text-xs">
                    {model.name}
                  </p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
