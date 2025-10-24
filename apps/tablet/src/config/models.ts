export interface Model3DConfig {
  id: string;
  name: string;
  description?: string;
  preview: string; // Path to preview image in /public
  modelPath: string; // Path to 3D model file (.glb or .gltf) in /public/models
  scale?: number; // Optional: scale the model (default: 1)
  position?: [number, number, number]; // Optional: initial position (default: [0, 0, 0])
  rotation?: [number, number, number]; // Optional: initial rotation in radians (default: [0, 0, 0])
  autoRotate?: boolean; // Optional: enable auto-rotation (default: true)
  autoRotateSpeed?: number; // Optional: rotation speed (default: 0.5)
}

/**
 * HOW TO ADD YOUR OWN 3D MODELS:
 *
 * 1. Place your .glb or .gltf files in the /public/models folder
 * 2. Place preview images in the /public folder
 * 3. Add a new entry to the MODELS array below with:
 *    - Unique id (used in URLs)
 *    - Display name
 *    - Path to preview image
 *    - Path to 3D model file
 *    - Optional: scale, position, rotation, autoRotate settings
 *
 * SINGLE FILE MODELS (.glb):
 * - Just place the .glb file in /public/models
 * - Example: /public/models/my-robot.glb
 * - Point modelPath to: "/models/my-robot.glb"
 *
 * FOLDER-BASED MODELS (.gltf with assets):
 * - Create a folder in /public/models (e.g., /public/models/robot/)
 * - Place the .gltf file and all assets (textures, materials) in that folder
 * - Example structure:
 *   /public/models/robot/
 *     ├── robot.gltf
 *     ├── textures/
 *     │   ├── diffuse.jpg
 *     │   ├── normal.jpg
 *     │   └── metallic.jpg
 *     └── materials.bin
 * - Point modelPath to the main .gltf file: "/models/robot/robot.gltf"
 * - The loader automatically finds all related assets using relative paths!
 *
 * Example:
 * {
 *   id: "my-robot",
 *   name: "My Custom Robot",
 *   preview: "/my-robot-preview.jpg",
 *   modelPath: "/models/my-robot.glb",
 *   scale: 1.5,
 *   autoRotate: true,
 *   autoRotateSpeed: 0.3
 * }
 */

export const MODELS: Model3DConfig[] = [
  {
    id: "earth",
    name: "Planet Earth",
    description: "3D model of planet Earth showing continents and oceans",
    preview: "/models/earth/Thumbnail.jpg",
    modelPath: "/models/earth/earth.glb",
    scale: 0.0075,
    autoRotate: true,
    autoRotateSpeed: 0.5,
  },
  {
    id: "dna",
    name: "DNA Molecule",
    description: "Double helix structure of DNA molecule",
    preview: "/models/dna/Thumbnail.jpg",
    modelPath: "/models/dna/DNA.glb",
    scale: 1,
    autoRotate: true,
    autoRotateSpeed: 0.5,
  },
  {
    id: "heart",
    name: "Human Heart",
    description:
      "Anatomical model of the human heart with chambers and vessels",
    preview: "/models/heart/Thumbnail.jpg",
    modelPath: "/models/heart/heart.glb",
    scale: 0.001,
    autoRotate: true,
    autoRotateSpeed: 0.5,
  },
  {
    id: "galvanometer",
    name: "Galvanometer",
    description: "Sensitive instrument for measuring electric current",
    preview: "/models/galvanometer/Thumbnail.jpg",
    modelPath: "/models/galvanometer/galavanometer.glb",
    scale: 1,
    autoRotate: true,
    autoRotateSpeed: 0.5,
  },
  {
    id: "ac-generator",
    name: "AC Generator",
    description: "Alternating current electrical generator",
    preview: "/models/ac-generator/Thumbnail.jpg",
    modelPath: "/models/ac-generator/generator.glb",
    scale: 1,
    autoRotate: true,
    autoRotateSpeed: 0.5,
  },
  {
    id: "windmill",
    name: "Wind Turbine",
    description: "Wind turbine for renewable energy generation",
    preview: "/models/windmill/Thumbnail.jpg",
    modelPath: "/models/windmill/windmill.glb",
    scale: 0.05,
    autoRotate: true,
    autoRotateSpeed: 0.5,
  },
];

// Helper function to get a model by ID
export function getModelById(id: string): Model3DConfig | undefined {
  return MODELS.find((model) => model.id === id);
}

// Helper function to get all models
export function getAllModels(): Model3DConfig[] {
  return MODELS;
}
