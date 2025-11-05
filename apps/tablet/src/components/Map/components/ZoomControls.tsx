import type React from "react";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onResetView,
}) => {
  return (
    <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 flex flex-col gap-3 sm:gap-2">
      <Button
        size="icon"
        variant="secondary"
        onClick={onZoomIn}
        className="w-12 h-12 sm:w-10 sm:h-10 bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white touch-manipulation"
      >
        <ZoomIn className="h-5 w-5 sm:h-4 sm:w-4" />
      </Button>
      <Button
        size="icon"
        variant="secondary"
        onClick={onZoomOut}
        className="w-12 h-12 sm:w-10 sm:h-10 bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white touch-manipulation"
      >
        <ZoomOut className="h-5 w-5 sm:h-4 sm:w-4" />
      </Button>
      <Button
        size="icon"
        variant="secondary"
        onClick={onResetView}
        className="w-12 h-12 sm:w-10 sm:h-10 bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white touch-manipulation"
      >
        <Maximize2 className="h-5 w-5 sm:h-4 sm:w-4" />
      </Button>
    </div>
  );
};