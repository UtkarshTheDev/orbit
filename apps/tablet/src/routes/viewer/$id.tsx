import { Suspense, useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { ArrowLeft, ChevronLeft, ZoomIn, ZoomOut, RotateCcw, Play, Pause } from "lucide-react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, PerspectiveCamera, Environment, Loader } from "@react-three/drei"
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib"
import { Model3D, preloadModels } from "@/components/models/3D"
import { ModelSidebar } from "@/components/models/Sidebar"
import { Button } from "@/components/ui/button"
import { getAllModels, getModelById } from "@/config/models"

function ViewerPage() {
  const navigate = useNavigate()
  const { id: modelId } = Route.useParams()

  const models = getAllModels()
  const [currentModelId, setCurrentModelId] = useState(modelId)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isAutoRotating, setIsAutoRotating] = useState(true)
  const controlsRef = useRef<OrbitControlsImpl>(null)

  const currentModel = getModelById(currentModelId)

  useEffect(() => {
    const modelPaths = models.map((m) => m.modelPath)
    preloadModels(modelPaths)
  }, [models])

  const handleModelChange = (newModelId: string) => {
    setCurrentModelId(newModelId)
    navigate({ to: '/viewer/$id', params: { id: newModelId } })
  }

  const handleZoomIn = () => {
    if (controlsRef.current) {
      const camera = controlsRef.current.object
      const target = controlsRef.current.target
      const direction = camera.position.clone().sub(target).normalize()
      camera.position.sub(direction.multiplyScalar(0.5))
      controlsRef.current.update()
    }
  }

  const handleZoomOut = () => {
    if (controlsRef.current) {
      const camera = controlsRef.current.object
      const target = controlsRef.current.target
      const direction = camera.position.clone().sub(target).normalize()
      camera.position.add(direction.multiplyScalar(0.5))
      controlsRef.current.update()
    }
  }

  const handleReset = () => {
    if (controlsRef.current) {
      controlsRef.current.reset()
    }
  }

  const handleToggleAutoRotate = () => {
    setIsAutoRotating((prev) => !prev)
    if (controlsRef.current) {
      controlsRef.current.autoRotate = !controlsRef.current.autoRotate
    }
  }

  return (
    <div className="h-screen w-screen bg-slate-900 overflow-hidden flex">
      {/* Main Viewer Area */}
      <div className="flex-1 relative">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="absolute top-6 left-6 z-10"
        >
          <Button
            onClick={() => navigate({ to: '/' })}
            variant="secondary"
            size="icon"
            className="rounded-full w-14 h-14 md:w-12 md:h-12 shadow-lg hover:shadow-xl transition-all bg-white/90 backdrop-blur-sm hover:bg-white"
          >
            <ArrowLeft className="h-6 w-6 md:h-5 md:w-5 text-slate-900" />
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="absolute top-6 right-6 z-10 flex flex-col gap-3"
        >
          <Button
            onClick={handleZoomIn}
            size="icon"
            className="rounded-full w-16 h-16 shadow-lg hover:shadow-xl transition-all bg-white/90 backdrop-blur-sm hover:bg-white"
          >
            <ZoomIn className="h-7 w-7 text-slate-900" />
          </Button>
          <Button
            onClick={handleZoomOut}
            size="icon"
            className="rounded-full w-16 h-16 shadow-lg hover:shadow-xl transition-all bg-white/90 backdrop-blur-sm hover:bg-white"
          >
            <ZoomOut className="h-7 w-7 text-slate-900" />
          </Button>
          <Button
            onClick={handleReset}
            size="icon"
            className="rounded-full w-16 h-16 shadow-lg hover:shadow-xl transition-all bg-white/90 backdrop-blur-sm hover:bg-white"
          >
            <RotateCcw className="h-7 w-7 text-slate-900" />
          </Button>
          <Button
            onClick={handleToggleAutoRotate}
            size="icon"
            className="rounded-full w-16 h-16 shadow-lg hover:shadow-xl transition-all bg-white/90 backdrop-blur-sm hover:bg-white"
          >
            {isAutoRotating ? (
              <Pause className="h-7 w-7 text-slate-900" />
            ) : (
              <Play className="h-7 w-7 text-slate-900" />
            )}
          </Button>
        </motion.div>

        {/* 3D Canvas */}
        <div className="w-full h-full">
          <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, alpha: false }}>
            <color attach="background" args={["#0f172a"]} />
            <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
            <OrbitControls
              ref={controlsRef}
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              minDistance={1}
              maxDistance={20}
              dampingFactor={0.05}
              rotateSpeed={0.8}
              zoomSpeed={1.2}
              panSpeed={0.8}
              autoRotate={isAutoRotating}
              autoRotateSpeed={2}
              touches={{
                ONE: 2, // TOUCH.ROTATE
                TWO: 1, // TOUCH.DOLLY_PAN
              }}
              enableDamping={true}
            />
            <ambientLight intensity={0.8} />
            <directionalLight
              position={[10, 10, 5]}
              intensity={1.5}
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
            />
            <directionalLight position={[-10, -10, -5]} intensity={0.6} />
            <spotLight position={[0, 10, 0]} intensity={0.8} angle={0.3} penumbra={1} />
            <Suspense fallback={null}>
              <Model3D modelId={currentModelId} />
              <Environment preset="studio" background={false} />
            </Suspense>
          </Canvas>
          <Loader
            containerStyles={{ background: "transparent" }}
            innerStyles={{ background: "#6478ff" }}
            barStyles={{ background: "#ffffff" }}
            dataStyles={{ color: "#ffffff" }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center z-10 max-w-2xl px-4"
        >
          <h2 className="text-2xl md:text-3xl font-[family-name:var(--font-display)] text-white mb-2 tracking-wide">
            {currentModel?.name}
          </h2>
          {currentModel?.description && (
            <p className="text-sm md:text-base text-slate-300 font-sans mb-3">{currentModel.description}</p>
          )}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs md:text-sm text-slate-300 font-sans bg-slate-800/40 backdrop-blur-md rounded-xl px-4 py-2.5 border border-slate-700/30">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-700/80 flex items-center justify-center">
                <span className="text-white text-xs font-semibold">1</span>
              </div>
              <span className="text-slate-200 font-medium">Slide 1 finger to rotate</span>
            </div>
            <div className="hidden sm:block w-px h-6 bg-slate-600/50"></div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-700/80 flex items-center justify-center">
                <span className="text-white text-xs font-semibold">2</span>
              </div>
              <span className="text-slate-200 font-medium">Pinch 2 fingers to zoom</span>
            </div>
            <div className="hidden sm:block w-px h-6 bg-slate-600/50"></div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-700/80 flex items-center justify-center">
                <span className="text-white text-xs font-semibold">3</span>
              </div>
              <span className="text-slate-200 font-medium">Drag 3 fingers to pan</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <ModelSidebar
            models={models}
            currentModelId={currentModelId}
            onModelSelect={handleModelChange}
            onClose={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Toggle Button (when closed) */}
      {!sidebarOpen && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="absolute top-1/2 right-4 -translate-y-1/2 z-10"
        >
          <Button
            onClick={() => setSidebarOpen(true)}
            variant="secondary"
            size="icon"
            className="rounded-full w-12 h-12 shadow-lg hover:shadow-xl transition-all bg-white/90 backdrop-blur-sm hover:bg-white"
          >
            <ChevronLeft className="h-5 w-5 text-slate-900" />
          </Button>
        </motion.div>
      )}
    </div>
  )
}

export const Route = createFileRoute('/viewer/$id')({
  component: ViewerPage,
})
