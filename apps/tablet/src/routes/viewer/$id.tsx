import {
  Environment,
  Loader,
  OrbitControls,
  PerspectiveCamera,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ChevronLeft,
  Pause,
  Play,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Suspense, useEffect, useRef, useState } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Model3D, preloadModels } from "@/components/models/3D";
import { ModelSidebar } from "@/components/models/Sidebar";
import { Button } from "@/components/ui/button";
import { getAllModels, getModelById } from "@/config/models";

function ViewerPage() {
  const navigate = useNavigate();
  const { id: modelId } = Route.useParams();
  const canvasRef = useRef<HTMLDivElement>(null);

  const models = getAllModels();
  const [currentModelId, setCurrentModelId] = useState(modelId);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const controlsRef = useRef<OrbitControlsImpl>(null);

  const currentModel = getModelById(currentModelId);

  useEffect(() => {
    const modelPaths = models.map((m) => m.modelPath);
    preloadModels(modelPaths);
  }, [models]);

  // Double-tap to reset camera
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let lastTap = 0;

    const handleTouchEnd = () => {
      const now = Date.now();
      const timeSinceLastTap = now - lastTap;

      if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
        // Double tap detected
        handleReset();
        lastTap = 0;
      } else {
        lastTap = now;
      }
    };

    canvas.addEventListener("touchend", handleTouchEnd);
    return () => {
      canvas.removeEventListener("touchend", handleTouchEnd);
    };
  }, [currentModelId]);

  const handleModelChange = (newModelId: string) => {
    setCurrentModelId(newModelId);
    navigate({ to: "/viewer/$id", params: { id: newModelId } });
  };

  const handleZoomIn = () => {
    if (controlsRef.current) {
      const camera = controlsRef.current.object;
      const target = controlsRef.current.target;
      const direction = camera.position.clone().sub(target).normalize();
      camera.position.sub(direction.multiplyScalar(0.5));
      controlsRef.current.update();
    }
  };

  const handleZoomOut = () => {
    if (controlsRef.current) {
      const camera = controlsRef.current.object;
      const target = controlsRef.current.target;
      const direction = camera.position.clone().sub(target).normalize();
      camera.position.add(direction.multiplyScalar(0.5));
      controlsRef.current.update();
    }
  };

  const handleReset = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const handleToggleAutoRotate = () => {
    setIsAutoRotating((prev) => !prev);
    if (controlsRef.current) {
      controlsRef.current.autoRotate = !controlsRef.current.autoRotate;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-900" style={{ overscrollBehavior: "none" }}>
      {/* Main Viewer Area */}
      <div className="relative flex-1">
        {/* Back Button */}
        <motion.div
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-6 left-6 z-10"
          initial={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.4 }}
        >
          <Button
            className="h-14 w-14 rounded-full bg-white/90 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:shadow-xl md:h-12 md:w-12"
            onClick={() => navigate({ to: "/" })}
            size="icon"
            variant="secondary"
          >
            <ArrowLeft className="h-6 w-6 text-slate-900 md:h-5 md:w-5" />
          </Button>
        </motion.div>

        {/* Double-tap hint */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-6 left-1/2 -translate-x-1/2 z-10 rounded-full bg-slate-800/60 backdrop-blur-sm px-3 py-1.5 font-sans text-slate-300 text-xs md:hidden"
          initial={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4, delay: 0.8 }}
        >
          💡 Double-tap to reset view
        </motion.div>

        <motion.div
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-6 right-6 z-10 flex flex-col gap-3"
          initial={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Button
            className="h-20 w-20 rounded-full bg-white/90 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:shadow-xl active:scale-95 md:h-16 md:w-16"
            onClick={handleZoomIn}
            size="icon"
          >
            <ZoomIn className="h-7 w-7 text-slate-900" />
          </Button>
          <Button
            className="h-20 w-20 rounded-full bg-white/90 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:shadow-xl active:scale-95 md:h-16 md:w-16"
            onClick={handleZoomOut}
            size="icon"
          >
            <ZoomOut className="h-7 w-7 text-slate-900" />
          </Button>
          <Button
            className="h-20 w-20 rounded-full bg-white/90 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:shadow-xl active:scale-95 md:h-16 md:w-16"
            onClick={handleReset}
            size="icon"
          >
            <RotateCcw className="h-7 w-7 text-slate-900" />
          </Button>
          <Button
            className="h-20 w-20 rounded-full bg-white/90 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:shadow-xl active:scale-95 md:h-16 md:w-16"
            onClick={handleToggleAutoRotate}
            size="icon"
          >
            {isAutoRotating ? (
              <Pause className="h-7 w-7 text-slate-900" />
            ) : (
              <Play className="h-7 w-7 text-slate-900" />
            )}
          </Button>
        </motion.div>

        {/* 3D Canvas */}
        <div className="h-full w-full" ref={canvasRef}>
          <Canvas dpr={[1, 2]} gl={{ antialias: true, alpha: false }} shadows>
            <color args={["#0f172a"]} attach="background" />
            <PerspectiveCamera fov={50} makeDefault position={[0, 0, 5]} />
            <OrbitControls
              autoRotate={isAutoRotating}
              autoRotateSpeed={1.5}
              dampingFactor={0.08}
              enableDamping={true}
              enablePan={true}
              enableRotate={true}
              enableZoom={true}
              maxDistance={25}
              minDistance={0.5}
              panSpeed={1}
              ref={controlsRef}
              rotateSpeed={0.9}
              touches={{
                ONE: 2, // TOUCH.ROTATE
                TWO: 1, // TOUCH.DOLLY_PAN
              }}
              zoomSpeed={0.9}
            />
            <ambientLight intensity={0.8} />
            <directionalLight
              castShadow
              intensity={1.5}
              position={[10, 10, 5]}
              shadow-mapSize-height={2048}
              shadow-mapSize-width={2048}
            />
            <directionalLight intensity={0.6} position={[-10, -10, -5]} />
            <spotLight
              angle={0.3}
              intensity={0.8}
              penumbra={1}
              position={[0, 10, 0]}
            />
            <Suspense fallback={null}>
              <Model3D modelId={currentModelId} />
              <Environment background={false} preset="studio" />
            </Suspense>
          </Canvas>
          <Loader
            barStyles={{ background: "#ffffff" }}
            containerStyles={{ background: "transparent" }}
            dataStyles={{ color: "#ffffff" }}
            innerStyles={{ background: "#6478ff" }}
          />
        </div>

        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="-translate-x-1/2 absolute bottom-6 left-1/2 z-10 max-w-2xl px-4 text-center"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <h2 className="mb-2 font-[family-name:var(--font-orbitron)] text-2xl text-white tracking-wide md:text-3xl">
            {currentModel?.name}
          </h2>
          {currentModel?.description && (
            <p className="mb-3 font-sans text-slate-300 text-sm md:text-base">
              {currentModel.description}
            </p>
          )}
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-700/30 bg-slate-800/40 px-4 py-3 font-sans text-slate-300 text-xs backdrop-blur-md sm:flex-row sm:gap-4 md:text-sm md:py-2.5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-700/80">
                <span className="font-semibold text-white text-xs">1</span>
              </div>
              <span className="font-medium text-slate-200">
                Drag 1 finger to rotate
              </span>
            </div>
            <div className="hidden h-6 w-px bg-slate-600/50 sm:block" />
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-700/80">
                <span className="font-semibold text-white text-xs">2</span>
              </div>
              <span className="font-medium text-slate-200">
                Pinch to zoom & pan
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <ModelSidebar
            currentModelId={currentModelId}
            models={models}
            onClose={() => setSidebarOpen(false)}
            onModelSelect={handleModelChange}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Toggle Button (when closed) */}
      {!sidebarOpen && (
        <motion.div
          animate={{ opacity: 1, x: 0 }}
          className="-translate-y-1/2 absolute top-1/2 right-4 z-10"
          exit={{ opacity: 0, x: 20 }}
          initial={{ opacity: 0, x: 20 }}
        >
          <Button
            className="h-16 w-16 rounded-full bg-white/90 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:shadow-xl active:scale-95 md:h-12 md:w-12"
            onClick={() => setSidebarOpen(true)}
            size="icon"
            variant="secondary"
          >
            <ChevronLeft className="h-5 w-5 text-slate-900" />
          </Button>
        </motion.div>
      )}
    </div>
  );
}

export const Route = createFileRoute("/viewer/$id")({
  component: ViewerPage,
});
