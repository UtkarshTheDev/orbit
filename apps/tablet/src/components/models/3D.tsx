import { Bounds, Center, useGLTF } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import type * as Three from "three";
import { getModelById } from "@/config/models";

type Model3dProps = {
  modelId: string;
};

export function Model3D({ modelId }: Model3dProps) {
  const groupRef = useRef<Three.Group>(null);
  const [modelConfig, setModelConfig] = useState(() => getModelById(modelId));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setModelConfig(getModelById(modelId));
    setError(null);
  }, [modelId]);

  let scene: Three.Group | Three.Scene;
  
  try {
    const gltf = useGLTF(modelConfig?.modelPath || "/assets/3d/duck.glb");
    scene = gltf.scene;
  } catch (err) {
    console.error("[Model3D] Failed to load model:", err);
    setError(err as Error);
    return null;
  }

  if (!modelConfig) {
    return null;
  }

  if (error) {
    console.error("[Model3D] Error loading model:", error);
    return null;
  }

  const { scale = 1, position = [0, 0, 0], rotation = [0, 0, 0] } = modelConfig;

  return (
    <Bounds clip fit margin={1.2} observe>
      <Center>
        <group
          position={position}
          ref={groupRef}
          rotation={rotation}
          scale={scale}
        >
          <primitive object={scene.clone()} />
        </group>
      </Center>
    </Bounds>
  );
}

export function preloadModels(modelPaths: string[]) {
  for (const path of modelPaths) {
    useGLTF.preload(path);
  }
}
