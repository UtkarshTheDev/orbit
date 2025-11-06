import type React from "react";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

interface ConfirmationOverlayProps {
  show: boolean;
  message: string;
  onComplete?: () => void;
}

export const ConfirmationOverlay: React.FC<ConfirmationOverlayProps> = ({
  show,
  message,
  onComplete,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 1500);
      
      const completeTimer = setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
      }, 1800); // Wait for fade out animation
      
      return () => {
        clearTimeout(timer);
        clearTimeout(completeTimer);
      };
    } else {
      setIsVisible(false);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm transition-all duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className={`flex flex-col items-center gap-4 rounded-3xl bg-white/95 p-8 shadow-2xl backdrop-blur-md transition-all duration-500 ${
          isVisible ? "scale-100 opacity-100" : "scale-75 opacity-0"
        }`}
      >
        {/* Animated Check Icon */}
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-green-400 opacity-75" />
          <div className="relative rounded-full bg-gradient-to-br from-green-400 to-green-600 p-4 shadow-lg shadow-green-500/50">
            <CheckCircle2 className="h-12 w-12 text-white animate-in zoom-in duration-300" />
          </div>
        </div>

        {/* Message */}
        <p className="font-orbitron text-lg font-semibold text-slate-800 tracking-tight">
          {message}
        </p>

        {/* Progress Bar */}
        <div className="h-1 w-48 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-1500 ease-linear"
            style={{
              width: isVisible ? "100%" : "0%",
            }}
          />
        </div>
      </div>
    </div>
  );
};
