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

  useEffect(() => {
    setModelConfig(getModelById(modelId));
  }, [modelId]);

  if (!modelConfig) {
    return null;
  }

  // Always call useGLTF at the top level - this is a hook rule
  // Errors will be handled by the Suspense boundary in the parent component
  const gltf = useGLTF(modelConfig.modelPath);
  let scene: Three.Group | Three.Scene = gltf.scene;

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
