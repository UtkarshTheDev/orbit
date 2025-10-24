"use client"

import { useRef, useEffect, useState } from "react"
import { useGLTF, Center, Bounds } from "@react-three/drei"
import type * as THREE from "three"
import { getModelById } from "@/config/models"

interface Model3DProps {
  modelId: string
}

export function Model3D({ modelId }: Model3DProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [modelConfig, setModelConfig] = useState(() => getModelById(modelId))

  useEffect(() => {
    setModelConfig(getModelById(modelId))
  }, [modelId])

  const { scene } = useGLTF(modelConfig?.modelPath || "/assets/3d/duck.glb")

  // This allows the touch controls to properly manage rotation

  if (!modelConfig) {
    return null
  }

  const { scale = 1, position = [0, 0, 0], rotation = [0, 0, 0] } = modelConfig

  return (
    <Bounds fit clip observe margin={1.2}>
      <Center>
        <group ref={groupRef} scale={scale} position={position} rotation={rotation}>
          <primitive object={scene.clone()} />
        </group>
      </Center>
    </Bounds>
  )
}

export function preloadModels(modelPaths: string[]) {
  modelPaths.forEach((path) => {
    useGLTF.preload(path)
  })
}
