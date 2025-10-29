"use client";

import { Camera, Download, Sparkles, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSessionStore } from "@/lib/sessionStore";
import { Button } from "../ui/button";
import { toast } from "sonner";

interface PhotoViewerProps {
  capturedImage: string;
  onRetake: () => void;
}

export default function PhotoViewer({
  capturedImage,
  onRetake,
}: PhotoViewerProps) {
  const sendWs = useSessionStore((s) => s.sendWs);
  const isTablet = useSessionStore((s) => s.isTablet);
  const ws = useSessionStore((s) => s.ws);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [polaroidImage, setPolaroidImage] = useState<string | null>(null);
  const [rotation] = useState(() => (Math.random() > 0.5 ? -2 : 3));
  const [isLoaded, setIsLoaded] = useState(false);
  const [isEditingWithAI, setIsEditingWithAI] = useState(false);
  const [currentImage, setCurrentImage] = useState(capturedImage);

  useEffect(() => {
    generatePolaroidImage();
  }, [currentImage]);

  // Listen for edited image from backend
  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data);
        
        if (msg.type === "ai_edit_started" && !isTablet) {
          console.log("[PhotoViewer] AI editing started", msg.sessionId);
          setIsEditingWithAI(true);
          toast.info("Your image is being edited with Orbit AI ✨");
        }
        
        if (msg.type === "ai_edit_complete" && !isTablet) {
          console.log("[PhotoViewer] AI editing complete, updating image");
          setIsEditingWithAI(false);
          setCurrentImage(msg.editedImage);
          toast.success("Image edited successfully! 🎨");
        }
        
        if (msg.type === "ai_edit_cancelled" && !isTablet) {
          console.log("[PhotoViewer] AI editing cancelled");
          setIsEditingWithAI(false);
          toast.info("Image editing was cancelled");
        }
      } catch (error) {
        // Ignore parse errors
      }
    };

    ws.addEventListener("message", handleMessage);
    return () => ws.removeEventListener("message", handleMessage);
  }, [ws, isTablet]);

  // Handle retake photo
  const handleRetakePhoto = () => {
    // Send retake_needed message to backend (only from phone)
    if (!isTablet) {
      console.log("[PhotoViewer] Sending retake_needed message to backend");
      sendWs({ type: "retake_needed" });
    }
    onRetake();
  };

  const generatePolaroidImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const polaroidWidth = 700;
      const topBorder = 40;
      const sideBorder = 40;
      const bottomBorder = 200;
      const imageSize = polaroidWidth - sideBorder * 2;
      const polaroidHeight = topBorder + bottomBorder + imageSize;
      const borderRadius = 8;

      canvas.width = polaroidWidth;
      canvas.height = polaroidHeight;

      ctx.fillStyle = "#FEFEF8";
      ctx.fillRect(0, 0, polaroidWidth, polaroidHeight);

      for (let i = 0; i < 3000; i++) {
        const x = Math.random() * polaroidWidth;
        const y = Math.random() * polaroidHeight;
        const opacity = Math.random() * 0.05;
        ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
        ctx.fillRect(x, y, 1, 1);
      }

      for (let i = 0; i < 15; i++) {
        const x = Math.random() * polaroidWidth;
        const y = Math.random() * polaroidHeight;
        const size = Math.random() * 20 + 10;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
        gradient.addColorStop(0, "rgba(210, 180, 140, 0.03)");
        gradient.addColorStop(1, "rgba(210, 180, 140, 0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(x - size, y - size, size * 2, size * 2);
      }

      ctx.save();
      ctx.beginPath();
      const frameRadius = 6;
      ctx.moveTo(frameRadius, 0);
      ctx.lineTo(polaroidWidth - frameRadius, 0);
      ctx.quadraticCurveTo(polaroidWidth, 0, polaroidWidth, frameRadius);
      ctx.lineTo(polaroidWidth, polaroidHeight - frameRadius);
      ctx.quadraticCurveTo(
        polaroidWidth,
        polaroidHeight,
        polaroidWidth - frameRadius,
        polaroidHeight
      );
      ctx.lineTo(frameRadius, polaroidHeight);
      ctx.quadraticCurveTo(0, polaroidHeight, 0, polaroidHeight - frameRadius);
      ctx.lineTo(0, frameRadius);
      ctx.quadraticCurveTo(0, 0, frameRadius, 0);
      ctx.closePath();
      ctx.clip();

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(sideBorder + borderRadius, topBorder);
      ctx.lineTo(sideBorder + imageSize - borderRadius, topBorder);
      ctx.quadraticCurveTo(
        sideBorder + imageSize,
        topBorder,
        sideBorder + imageSize,
        topBorder + borderRadius
      );
      ctx.lineTo(sideBorder + imageSize, topBorder + imageSize - borderRadius);
      ctx.quadraticCurveTo(
        sideBorder + imageSize,
        topBorder + imageSize,
        sideBorder + imageSize - borderRadius,
        topBorder + imageSize
      );
      ctx.lineTo(sideBorder + borderRadius, topBorder + imageSize);
      ctx.quadraticCurveTo(
        sideBorder,
        topBorder + imageSize,
        sideBorder,
        topBorder + imageSize - borderRadius
      );
      ctx.lineTo(sideBorder, topBorder + borderRadius);
      ctx.quadraticCurveTo(
        sideBorder,
        topBorder,
        sideBorder + borderRadius,
        topBorder
      );
      ctx.closePath();
      ctx.clip();

      const minDimension = Math.min(img.width, img.height);
      const cropX = (img.width - minDimension) / 2;
      const cropY = (img.height - minDimension) / 2;

      ctx.drawImage(
        img,
        cropX,
        cropY,
        minDimension,
        minDimension, // Source: square crop from center
        sideBorder,
        topBorder,
        imageSize,
        imageSize // Destination: square area
      );

      ctx.globalCompositeOperation = "multiply";
      ctx.fillStyle = "rgba(255, 240, 200, 0.25)";
      ctx.fillRect(sideBorder, topBorder, imageSize, imageSize);
      ctx.globalCompositeOperation = "source-over";

      ctx.globalCompositeOperation = "saturation";
      ctx.fillStyle = "rgba(128, 128, 128, 0.3)";
      ctx.fillRect(sideBorder, topBorder, imageSize, imageSize);
      ctx.globalCompositeOperation = "source-over";

      ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
      ctx.fillRect(sideBorder, topBorder, imageSize, imageSize);

      for (let i = 0; i < 2500; i++) {
        const grainX = sideBorder + Math.random() * imageSize;
        const grainY = topBorder + Math.random() * imageSize;
        const opacity = Math.random() * 0.12;
        ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
        ctx.fillRect(grainX, grainY, 1, 1);
      }

      ctx.restore();

      const gradient = ctx.createRadialGradient(
        polaroidWidth / 2,
        topBorder + imageSize / 2,
        imageSize / 4,
        polaroidWidth / 2,
        topBorder + imageSize / 2,
        imageSize / 1.1
      );
      gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0.25)");
      ctx.fillStyle = gradient;
      ctx.fillRect(sideBorder, topBorder, imageSize, imageSize);

      ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sideBorder + borderRadius, topBorder);
      ctx.lineTo(sideBorder + imageSize - borderRadius, topBorder);
      ctx.quadraticCurveTo(
        sideBorder + imageSize,
        topBorder,
        sideBorder + imageSize,
        topBorder + borderRadius
      );
      ctx.lineTo(sideBorder + imageSize, topBorder + imageSize - borderRadius);
      ctx.quadraticCurveTo(
        sideBorder + imageSize,
        topBorder + imageSize,
        sideBorder + imageSize - borderRadius,
        topBorder + imageSize
      );
      ctx.lineTo(sideBorder + borderRadius, topBorder + imageSize);
      ctx.quadraticCurveTo(
        sideBorder,
        topBorder + imageSize,
        sideBorder,
        topBorder + imageSize - borderRadius
      );
      ctx.lineTo(sideBorder, topBorder + borderRadius);
      ctx.quadraticCurveTo(
        sideBorder,
        topBorder,
        sideBorder + borderRadius,
        topBorder
      );
      ctx.closePath();
      ctx.stroke();

      ctx.restore();

      ctx.fillStyle = "#2c2c2c";
      ctx.font = "600 32px 'Courier New', monospace";
      ctx.textAlign = "center";
      const captionY = topBorder + imageSize + 60;
      ctx.fillText("Science Exhibition 2025", polaroidWidth / 2, captionY);

      // Enhanced "LPS Eldeco" text with increased size, weight, and better color
      ctx.font = "700 28px 'Courier New', monospace";
      ctx.fillStyle = "#222222";
      ctx.fillText("LPS Eldeco", polaroidWidth / 2, captionY + 45);

      ctx.font = "400 36px 'Pacifico', cursive";
      ctx.textAlign = "right";
      ctx.fillStyle = "#1a1a1a";
      const signatureX = polaroidWidth - sideBorder - 40;
      const signatureY = captionY + 85;
      ctx.fillText("– Orbit", signatureX, signatureY);

      const polaroidDataUrl = canvas.toDataURL("image/png");
      setPolaroidImage(polaroidDataUrl);
      setTimeout(() => setIsLoaded(true), 50);
    };

    img.src = currentImage;
  };

  const handleEditWithAI = () => {
    if (!isTablet) {
      console.log("[PhotoViewer] Starting AI edit with original image");
      sendWs({
        type: "start_ai_edit",
        image: currentImage,
      });
    }
  };

  const downloadPolaroid = () => {
    if (!polaroidImage) return;

    const link = document.createElement("a");
    link.href = polaroidImage;
    link.download = `orbit-polaroid-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="fixed inset-0 h-full w-full overflow-hidden bg-gradient-to-br from-stone-100 via-amber-50/40 to-orange-50/30">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.05' /%3E%3C/svg%3E")`,
        }}
      />

      <canvas className="hidden" ref={canvasRef} />

      <div className="relative flex h-full w-full flex-col items-center justify-center p-4 md:p-6">
        <div
          className={`relative transition-all duration-700 ease-out ${
            isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
          style={{
            willChange: "transform, opacity",
          }}
        >
          <div
            className="relative rounded-md bg-white"
            style={{
              padding: "0",
              transform: `rotate(${rotation}deg)`,
              maxWidth: "min(85vw, 420px)",
              maxHeight: "min(75vh, 504px)",
              boxShadow:
                "0 20px 40px rgba(0, 0, 0, 0.15), 0 10px 20px rgba(0, 0, 0, 0.1), 0 5px 10px rgba(0, 0, 0, 0.08)",
              filter: "brightness(0.98) contrast(1.02)",
            }}
          >
            {polaroidImage && (
              <div className="relative">
                <img
                  alt="Polaroid Img"
                  className="h-auto w-full rounded-md"
                  src={polaroidImage || "/placeholder.svg"}
                  style={{
                    aspectRatio: "700/840",
                    objectFit: "cover",
                  }}
                />
                <div
                  className="pointer-events-none absolute inset-0 rounded-md opacity-20"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paper'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='5' /%3E%3CfeColorMatrix type='saturate' values='0' /%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23paper)' /%3E%3C/svg%3E")`,
                    mixBlendMode: "multiply",
                  }}
                />
              </div>
            )}
          </div>

          <div className="-z-10 absolute inset-0 rounded-md bg-gradient-to-br from-amber-500/10 via-transparent to-orange-500/5 blur-2xl" />
        </div>

        <div
          className={`mt-6 flex w-full max-w-md flex-col items-center gap-4 px-4 transition-all delay-200 duration-700 ease-out md:mt-8 ${
            isLoaded ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
          style={{
            willChange: "transform, opacity",
          }}
        >
          <Button
            className="group relative h-14 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 font-semibold text-base text-white shadow-lg shadow-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/60 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleEditWithAI}
            size="lg"
            style={{ fontFamily: '"Quicksand", sans-serif' }}
            disabled={isEditingWithAI}
          >
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" 
                 style={{ 
                   backgroundSize: '200% 100%',
                   animation: 'gradient-shift 3s ease infinite'
                 }} 
            />
            
            {/* Magical glow rings */}
            <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="absolute inset-0 rounded-2xl bg-blue-400/20 blur-xl animate-pulse" />
            </div>
            
            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
            
            {/* Sparkle particles */}
            <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="absolute top-2 left-8 h-1 w-1 rounded-full bg-white/80 animate-ping" style={{ animationDelay: '0s' }} />
              <div className="absolute top-4 right-12 h-1 w-1 rounded-full bg-white/80 animate-ping" style={{ animationDelay: '0.3s' }} />
              <div className="absolute bottom-3 left-16 h-1 w-1 rounded-full bg-white/80 animate-ping" style={{ animationDelay: '0.6s' }} />
            </div>
            
            {/* Content */}
            <div className="relative flex items-center justify-center">
              {isEditingWithAI ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  <span className="tracking-wide">
                    Editing with <span className="font-orbitron font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">Orbit AI</span>...
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
                  <span className="tracking-wide">
                    Edit with <span className="font-orbitron font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">Orbit AI</span>
                  </span>
                </>
              )}
            </div>
          </Button>

          <Button
            className="relative h-14 w-full rounded-2xl border-2 border-amber-200 bg-amber-100 font-semibold text-amber-900 text-base shadow-sm transition-all duration-150 hover:bg-amber-150 active:scale-95"
            onClick={downloadPolaroid}
            size="lg"
            style={{ fontFamily: '"Quicksand", sans-serif' }}
          >
            <Download className="mr-2 h-5 w-5 flex-shrink-0" />
            <span className="text-amber-900">Download Polaroid</span>
          </Button>

          <button
            className="mt-2 flex items-center gap-2 px-6 py-3 font-medium font-sans text-amber-800 text-base underline decoration-2 underline-offset-4 transition-colors duration-150 active:text-amber-900"
            onClick={handleRetakePhoto}
            type="button"
          >
            <Camera className="h-4 w-4" />
            Retake Photo
          </button>
        </div>
      </div>
    </div>
  );
}
