"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface SubjectBox {
  name: string
  height: number
}

interface PathNode {
  roomId: string
  x: number
  y: number
}

interface Room {
  id: string
  x: number
  y: number
  width: number
  height: number
  name: string
  roomNumber?: string
  subjects?: SubjectBox[]
  type: "classroom" | "office" | "facility" | "entrance" | "outdoor" | "corridor" | "stairs"
  color: string
  icon?: string
}

interface GridNode {
  x: number
  y: number
  g: number
  h: number
  f: number
  parent: GridNode | null
}

const ROOM_WIDTH = 60
const GATE_WIDTH = 70 // Increased from 50 to 70 to match Gate No. 2 width
const ROOM_HEIGHT = 120
const LEFT_COLUMN_WIDTH = 80

const rooms: Room[] = [
  // Bottom outdoor areas (previously top, now also flipped horizontally)
  { id: "playground", x: 160, y: 460, width: 780, height: 120, name: "PLAYGROUND", type: "outdoor", color: "#D9F99D" },
  { id: "stage", x: 90, y: 460, width: ROOM_WIDTH, height: 120, name: "STAGE", type: "outdoor", color: "#F87171" },

  {
    id: "gate2",
    x: 950,
    y: 460,
    width: LEFT_COLUMN_WIDTH,
    height: 120,
    name: "GATE NO 2 / Exit",
    subjects: [
      { name: "GATE NO 2", height: 60 },
      { name: "EXIT", height: 60 },
    ],
    type: "entrance",
    color: "#FEF08A",
  },
  {
    id: "gate3",
    x: 950,
    y: 20,
    width: LEFT_COLUMN_WIDTH,
    height: 50,
    name: "GATE NO 3",
    type: "entrance",
    color: "#E7E5E4",
  },
  {
    id: "gate4",
    x: 10,
    y: 20,
    width: GATE_WIDTH,
    height: 60,
    name: "GATE NO 4",
    type: "entrance",
    color: "#E7E5E4",
  },

  {
    id: "staff-parking",
    x: 950,
    y: 80,
    width: LEFT_COLUMN_WIDTH,
    height: 180,
    name: "STAFF PARKING",
    type: "facility",
    color: "#D6D3D1",
  },

  {
    id: "canteen",
    x: 950,
    y: 270,
    width: LEFT_COLUMN_WIDTH,
    height: 120,
    name: "CANTEEN",
    type: "facility",
    color: "#FDBA74",
  },

  {
    id: "pathway",
    x: 10,
    y: 400,
    width: 1020,
    height: 50,
    name: "PATHWAY",
    type: "corridor",
    color: "#FEF9C3",
  },

  // Middle row of rooms (flipped horizontally)
  {
    id: "sports-room",
    x: 880,
    y: 270,
    width: ROOM_WIDTH,
    height: ROOM_HEIGHT,
    name: "Sports Room",
    roomNumber: "Sports Room",
    subjects: [{ name: "Science", height: 90 }],
    type: "classroom",
    color: "#FFB4A2",
  },

  {
    id: "stairs-left",
    x: 810,
    y: 270,
    width: ROOM_WIDTH,
    height: ROOM_HEIGHT,
    name: "STAIRS",
    type: "stairs",
    color: "#FED7AA",
  },

  {
    id: "entry-left",
    x: 740,
    y: 270,
    width: 60,
    height: ROOM_HEIGHT,
    name: "EXIT",
    type: "entrance",
    color: "#FFCDB2", // Soft peach-coral - visually feels like an exit
  },

  {
    id: "room3",
    x: 670,
    y: 270,
    width: ROOM_WIDTH,
    height: ROOM_HEIGHT,
    name: "Room No. 3",
    roomNumber: "Room No. 3",
    subjects: [
      { name: "Craft", height: 35 },
      { name: "EVS", height: 35 },
      { name: "Maths", height: 35 },
    ],
    type: "classroom",
    color: "#93C5FD",
  },

  {
    id: "office-reception",
    x: 540,
    y: 270,
    width: ROOM_WIDTH * 2,
    height: ROOM_HEIGHT,
    name: "Office / Reception",
    subjects: [
      { name: "Reception", height: ROOM_HEIGHT / 2 },
      { name: "Office", height: ROOM_HEIGHT / 2 },
    ],
    type: "office",
    color: "#DDD6FE",
  },

  {
    id: "principal",
    x: 440,
    y: 270,
    width: ROOM_WIDTH + 20,
    height: ROOM_HEIGHT,
    name: "PRINCIPAL ROOM",
    type: "office",
    color: "#3B82F6",
  },

  {
    id: "stairs-right",
    x: 370,
    y: 270,
    width: ROOM_WIDTH,
    height: ROOM_HEIGHT,
    name: "STAIRS",
    type: "stairs",
    color: "#FED7AA",
  },

  {
    id: "entry-right",
    x: 300,
    y: 270,
    width: 60,
    height: ROOM_HEIGHT,
    name: "ENTRY",
    type: "entrance",
    color: "#BBF7D0",
  },

  {
    id: "room2",
    x: 230,
    y: 270,
    width: ROOM_WIDTH,
    height: ROOM_HEIGHT,
    name: "Room No. 2",
    roomNumber: "Room No. 2",
    subjects: [
      { name: "Craft", height: 35 },
      { name: "EVS", height: 35 },
      { name: "Maths", height: 35 },
    ],
    type: "classroom",
    color: "#93C5FD",
  },

  {
    id: "room1",
    x: 160,
    y: 270,
    width: ROOM_WIDTH,
    height: ROOM_HEIGHT,
    name: "Room No. 1",
    roomNumber: "Room No. 1",
    subjects: [
      { name: "Craft", height: 35 },
      { name: "EVS", height: 35 },
      { name: "Maths", height: 35 },
    ],
    type: "classroom",
    color: "#93C5FD",
  },

  {
    id: "ramp",
    x: 90,
    y: 210,
    width: ROOM_WIDTH,
    height: 190,
    name: "RAMP",
    type: "facility",
    color: "#FEF9C3",
  },

  {
    id: "parking-ramp",
    x: 90,
    y: 80,
    width: ROOM_WIDTH,
    height: 120,
    name: "PARKING",
    type: "facility",
    color: "#E7E5E4",
  },

  {
    id: "entry",
    x: 10,
    y: 460,
    width: GATE_WIDTH,
    height: 120,
    name: "Gate No. 1 / Entry",
    subjects: [
      { name: "GATE NO 1", height: 60 },
      { name: "ENTRY", height: 60 },
    ],
    type: "entrance",
    color: "#FEF08A",
  },

  {
    id: "parking-entry",
    x: 10,
    y: 90,
    width: GATE_WIDTH,
    height: 300,
    name: "PARKING",
    type: "facility",
    color: "#E7E5E4",
  },

  { id: "corridor", x: 160, y: 210, width: 780, height: 50, name: "CORRIDOR", type: "corridor", color: "#FEF9C3" },

  // Top row of rooms (flipped horizontally)
  {
    id: "drinking-water-boys",
    x: 880,
    y: 80,
    width: ROOM_WIDTH,
    height: ROOM_HEIGHT,
    name: "Drinking Water / Boys Toilets",
    subjects: [
      { name: "Drinking Water", height: 40 },
      { name: "Boys Toilets", height: 70 },
    ],
    type: "facility",
    color: "#BFDBFE",
    icon: "water",
  },

  {
    id: "room4",
    x: 800,
    y: 80,
    width: 70,
    height: ROOM_HEIGHT,
    name: "Room No. 4",
    roomNumber: "Room No. 4",
    subjects: [
      { name: "Craft", height: 35 },
      { name: "EVS", height: 35 },
      { name: "Maths", height: 35 },
    ],
    type: "classroom",
    color: "#C4B5FD",
  },

  {
    id: "room5",
    x: 720,
    y: 80,
    width: 70,
    height: ROOM_HEIGHT,
    name: "Room No. 5",
    roomNumber: "Room No. 5",
    subjects: [
      { name: "Craft", height: 35 },
      { name: "EVS", height: 35 },
      { name: "Maths", height: 35 },
    ],
    type: "classroom",
    color: "#C4B5FD",
  },

  {
    id: "room6",
    x: 640,
    y: 80,
    width: 70,
    height: ROOM_HEIGHT,
    name: "Room No. 6",
    roomNumber: "Room No. 6",
    subjects: [
      { name: "Craft", height: 35 },
      { name: "Science", height: 35 },
      { name: "Maths", height: 35 },
    ],
    type: "classroom",
    color: "#C4B5FD",
  },

  {
    id: "room7",
    x: 560,
    y: 80,
    width: 70,
    height: ROOM_HEIGHT,
    name: "Room No. 7",
    roomNumber: "Room No. 7",
    type: "classroom",
    color: "#D6D3D1",
  },

  {
    id: "room8",
    x: 480,
    y: 80,
    width: 70,
    height: ROOM_HEIGHT,
    name: "Room No. 8",
    roomNumber: "Room No. 8",
    type: "classroom",
    color: "#D6D3D1",
  },

  {
    id: "room9",
    x: 400,
    y: 80,
    width: 70,
    height: ROOM_HEIGHT,
    name: "Room No. 9",
    roomNumber: "Room No. 9",
    type: "classroom",
    color: "#D6D3D1",
  },

  {
    id: "room10",
    x: 320,
    y: 80,
    width: 70,
    height: ROOM_HEIGHT,
    name: "Room No. 10",
    roomNumber: "Room No. 10",
    subjects: [{ name: "Maths", height: 90 }],
    type: "classroom",
    color: "#86EFAC",
  },

  {
    id: "room11",
    x: 240,
    y: 80,
    width: 70,
    height: ROOM_HEIGHT,
    name: "Room No. 11",
    roomNumber: "Room No. 11",
    type: "classroom",
    color: "#D6D3D1",
  },

  {
    id: "drinking-water-girls",
    x: 170,
    y: 80,
    width: ROOM_WIDTH,
    height: ROOM_HEIGHT,
    name: "Drinking Water / Girls Toilets",
    subjects: [
      { name: "Drinking Water", height: 50 },
      { name: "Girls Toilets", height: 60 },
    ],
    type: "facility",
    color: "#FBCFE8",
    icon: "water",
  },

  {
    id: "cycle-stand",
    x: 90,
    y: 20,
    width: 850,
    height: 50,
    name: "CYCLE STAND",
    type: "facility",
    color: "#D1D5DB",
  },
]

const wrapText = (text: string, maxWidth: number, fontSize: number): string[] => {
  const words = text.split(" ")
  const lines: string[] = []
  let currentLine = ""

  const charWidth = fontSize * 0.6 // Approximate character width

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const testWidth = testLine.length * charWidth

    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines
}

const roomConnections: Record<string, string[]> = {
  gate2: ["canteen"],
  canteen: ["gate2", "sports-room", "staff-parking"],
  "staff-parking": ["canteen", "gate3"],
  gate3: ["staff-parking", "cycle-stand"],

  "sports-room": ["canteen", "pathway", "stairs-left", "drinking-water-boys"],
  "stairs-left": ["sports-room", "pathway", "entry-left"],
  "entry-left": ["stairs-left", "pathway", "room3"],
  room3: ["entry-left", "pathway", "room4"],
  "office-reception": ["room3", "pathway", "principal"],
  principal: ["office-reception", "pathway", "stairs-right"],
  "stairs-right": ["principal", "pathway", "entry-right"],
  "entry-right": ["stairs-right", "pathway", "room2"],
  room2: ["entry-right", "pathway", "room1"],
  room1: ["room2", "pathway", "ramp"],

  pathway: [
    "sports-room",
    "stairs-left",
    "entry-left",
    "room3",
    "office-reception",
    "principal",
    "stairs-right",
    "entry-right",
    "room2",
    "room1",
    "playground",
    "stage",
    "entry",
  ],

  playground: ["pathway", "corridor"],
  stage: ["pathway", "ramp", "entry"],
  entry: ["stage", "pathway", "parking-entry"],
  "parking-entry": ["entry", "gate4"],

  ramp: ["stage", "room1", "corridor", "parking-ramp"],
  "parking-ramp": ["ramp"],

  corridor: [
    "playground",
    "ramp",
    "drinking-water-boys",
    "room4",
    "room5",
    "room6",
    "room7",
    "room8",
    "room9",
    "room10",
    "room11",
    "drinking-water-girls",
  ],

  "drinking-water-boys": ["sports-room", "corridor", "room4", "cycle-stand"],
  room4: ["room3", "drinking-water-boys", "corridor", "room5"],
  room5: ["room4", "corridor", "room6"],
  room6: ["room5", "corridor", "room7"],
  room7: ["room6", "corridor", "room8"],
  room8: ["room7", "corridor", "room9"],
  room9: ["room8", "corridor", "room10"],
  room10: ["room9", "corridor", "room11"],
  room11: ["room10", "corridor", "drinking-water-girls"],
  "drinking-water-girls": ["room11", "corridor", "cycle-stand"],

  "cycle-stand": ["drinking-water-boys", "drinking-water-girls", "gate3", "gate4"],
  gate4: ["parking-entry", "cycle-stand"],
}

const findPath = (startId: string, endId: string): string[] => {
  if (startId === endId) return [startId]

  const openSet = new Set([startId])
  const cameFrom: Record<string, string> = {}
  const gScore: Record<string, number> = { [startId]: 0 }
  const fScore: Record<string, number> = { [startId]: heuristic(startId, endId) }

  while (openSet.size > 0) {
    const current = Array.from(openSet).reduce((a, b) =>
      (fScore[a] ?? Number.POSITIVE_INFINITY) < (fScore[b] ?? Number.POSITIVE_INFINITY) ? a : b,
    )

    if (current === endId) {
      return reconstructPath(cameFrom, current)
    }

    openSet.delete(current)

    const neighbors = roomConnections[current] || []
    for (const neighbor of neighbors) {
      const tentativeGScore = (gScore[current] ?? Number.POSITIVE_INFINITY) + 1

      if (tentativeGScore < (gScore[neighbor] ?? Number.POSITIVE_INFINITY)) {
        cameFrom[neighbor] = current
        gScore[neighbor] = tentativeGScore
        fScore[neighbor] = tentativeGScore + heuristic(neighbor, endId)
        openSet.add(neighbor)
      }
    }
  }

  return [] // No path found
}

const heuristic = (roomId1: string, roomId2: string): number => {
  const room1 = rooms.find((r) => r.id === roomId1)
  const room2 = rooms.find((r) => r.id === roomId2)
  if (!room1 || !room2) return Number.POSITIVE_INFINITY

  const dx = Math.abs(room1.x + room1.width / 2 - (room2.x + room2.width / 2))
  const dy = Math.abs(room1.y + room1.height / 2 - (room2.y + room2.height / 2))
  return dx + dy
}

const reconstructPath = (cameFrom: Record<string, string>, current: string): string[] => {
  const path = [current]
  while (current in cameFrom) {
    current = cameFrom[current]
    path.unshift(current)
  }
  return path
}

const getRoomCenter = (roomId: string): { x: number; y: number } => {
  const room = rooms.find((r) => r.id === roomId)
  if (!room) return { x: 0, y: 0 }
  return {
    x: room.x + room.width / 2,
    y: room.y + room.height / 2,
  }
}

interface DoorPosition {
  x: number
  y: number
  side: "top" | "bottom" | "left" | "right"
}

const roomDoors: Record<string, DoorPosition> = {
  gate2: { x: 990, y: 460, side: "top" },
  canteen: { x: 990, y: 390, side: "bottom" },
  "staff-parking": { x: 990, y: 235, side: "left" },
  gate3: { x: 990, y: 70, side: "bottom" },

  "sports-room": { x: 910, y: 235, side: "bottom" },
  "stairs-left": { x: 840, y: 235, side: "bottom" },
  "entry-left": { x: 770, y: 270, side: "top" },
  room3: { x: 700, y: 235, side: "bottom" },
  "office-reception": { x: 600, y: 235, side: "bottom" },
  principal: { x: 480, y: 235, side: "bottom" },
  "stairs-right": { x: 400, y: 235, side: "bottom" },
  "entry-right": { x: 330, y: 425, side: "top" },
  room2: { x: 260, y: 235, side: "bottom" },
  room1: { x: 190, y: 235, side: "bottom" },

  ramp: { x: 150, y: 300, side: "right" },
  "parking-ramp": { x: 150, y: 200, side: "right" },
  entry: { x: 45, y: 460, side: "top" },
  "parking-entry": { x: 45, y: 390, side: "bottom" },

  "drinking-water-boys": { x: 910, y: 235, side: "top" },
  room4: { x: 835, y: 235, side: "top" },
  room5: { x: 755, y: 235, side: "top" },
  room6: { x: 675, y: 235, side: "top" },
  room7: { x: 595, y: 235, side: "top" },
  room8: { x: 515, y: 235, side: "top" },
  room9: { x: 435, y: 235, side: "top" },
  room10: { x: 355, y: 235, side: "top" },
  room11: { x: 275, y: 235, side: "top" },
  "drinking-water-girls": { x: 200, y: 235, side: "top" },

  gate4: { x: 45, y: 80, side: "bottom" },
  playground: { x: 550, y: 425, side: "bottom" },
  stage: { x: 120, y: 425, side: "bottom" },
}

const GRID_SIZE = 10 // 10px grid cells
const GRID_WIDTH = Math.ceil(1040 / GRID_SIZE)
const GRID_HEIGHT = Math.ceil(600 / GRID_SIZE)

const isWalkable = (x: number, y: number): boolean => {
  // Pathway: full width, no change
  if (y >= 400 && y <= 450 && x >= 10 && x <= 1030) return true

  // Corridor: old x: 100-950 → new x: 90-940
  if (y >= 210 && y <= 260 && x >= 90 && x <= 940) return true

  // Ramp: old x: 890-950 → new x: 90-150
  if (y >= 210 && y <= 450 && x >= 90 && x <= 150) return true

  // Entry (top left now): old x: 960-1030 → new x: 10-80
  if (x >= 10 && x <= 80 && y >= 390 && y <= 580) return true

  // Entry left connection (Exit box): x: 740-800, y: 210-450
  if (x >= 740 && x <= 800 && y >= 210 && y <= 450) return true

  // Entry right connection: x: 300-360, y: 210-390
  if (x >= 300 && x <= 360 && y >= 210 && y <= 390) return true

  // Stairs-left connection to corridor only (not pathway)
  // Stairs-left: x: 810-870, y: 210-270 (connects corridor to stairs top)
  if (x >= 810 && x <= 870 && y >= 210 && y <= 270) return true

  // Stairs-right connection to corridor only (not pathway)
  // Stairs-right: x: 370-430, y: 210-270 (connects corridor to stairs top)
  if (x >= 370 && x <= 430 && y >= 210 && y <= 270) return true

  // Gate No. 2 connection: x: 950-1030, y: 400-580
  if (x >= 950 && x <= 1030 && y >= 400 && y <= 580) return true

  return false
}

const manhattanDistance = (x1: number, y1: number, x2: number, y2: number): number => {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2)
}

const findGridPath = (startX: number, startY: number, endX: number, endY: number): { x: number; y: number }[] => {
  const startGridX = Math.floor(startX / GRID_SIZE)
  const startGridY = Math.floor(startY / GRID_SIZE)
  const endGridX = Math.floor(endX / GRID_SIZE)
  const endGridY = Math.floor(endY / GRID_SIZE)

  const openSet: GridNode[] = []
  const closedSet = new Set<string>()

  const startNode: GridNode = {
    x: startGridX,
    y: startGridY,
    g: 0,
    h: manhattanDistance(startGridX, startGridY, endGridX, endGridY),
    f: 0,
    parent: null,
  }
  startNode.f = startNode.g + startNode.h

  openSet.push(startNode)

  const getKey = (x: number, y: number) => `${x},${y}`

  while (openSet.length > 0) {
    // Find node with lowest f score
    openSet.sort((a, b) => a.f - b.f)
    const current = openSet.shift()!

    const currentKey = getKey(current.x, current.y)

    // Check if we reached the goal
    if (current.x === endGridX && current.y === endGridY) {
      // Reconstruct path
      const path: { x: number; y: number }[] = []
      let node: GridNode | null = current
      while (node) {
        path.unshift({ x: node.x * GRID_SIZE + GRID_SIZE / 2, y: node.y * GRID_SIZE + GRID_SIZE / 2 })
        node = node.parent
      }
      return path
    }

    closedSet.add(currentKey)

    // Check 4 neighbors (up, down, left, right - no diagonals)
    const neighbors = [
      { x: current.x, y: current.y - 1 }, // up
      { x: current.x, y: current.y + 1 }, // down
      { x: current.x - 1, y: current.y }, // left
      { x: current.x + 1, y: current.y }, // right
    ]

    for (const neighbor of neighbors) {
      const neighborKey = getKey(neighbor.x, neighbor.y)

      // Skip if out of bounds
      if (neighbor.x < 0 || neighbor.x >= GRID_WIDTH || neighbor.y < 0 || neighbor.y >= GRID_HEIGHT) {
        continue
      }

      // Skip if already evaluated
      if (closedSet.has(neighborKey)) {
        continue
      }

      // Check if walkable
      const pixelX = neighbor.x * GRID_SIZE + GRID_SIZE / 2
      const pixelY = neighbor.y * GRID_SIZE + GRID_SIZE / 2

      if (!isWalkable(pixelX, pixelY)) {
        continue
      }

      const g = current.g + 1
      const h = manhattanDistance(neighbor.x, neighbor.y, endGridX, endGridY)
      const f = g + h

      // Check if this neighbor is already in open set
      const existingNode = openSet.find((n) => n.x === neighbor.x && n.y === neighbor.y)

      if (existingNode) {
        if (g < existingNode.g) {
          existingNode.g = g
          existingNode.f = f
          existingNode.parent = current
        }
      } else {
        openSet.push({
          x: neighbor.x,
          y: neighbor.y,
          g,
          h,
          f,
          parent: current,
        })
      }
    }
  }

  return [] // No path found
}

const simplifyPath = (path: { x: number; y: number }[]): { x: number; y: number }[] => {
  if (path.length <= 2) return path

  const simplified: { x: number; y: number }[] = [path[0]]

  for (let i = 1; i < path.length - 1; i++) {
    const prev = path[i - 1]
    const current = path[i]
    const next = path[i + 1]

    // Check if direction changes (turning point)
    const dir1X = current.x - prev.x
    const dir1Y = current.y - prev.y
    const dir2X = next.x - current.x
    const dir2Y = next.y - current.y

    // If direction changes, keep this point
    if (dir1X !== dir2X || dir1Y !== dir2Y) {
      simplified.push(current)
    }
  }

  simplified.push(path[path.length - 1])
  return simplified
}

const snapToCenterlines = (path: { x: number; y: number }[]): { x: number; y: number }[] => {
  return path.map((point) => {
    const snapped = { ...point }

    // Pathway centerline: y = 425 (unchanged)
    if (point.y >= 400 && point.y <= 450) {
      snapped.y = 425
    }

    // Corridor centerline: y = 235 (unchanged)
    if (point.y >= 210 && point.y <= 260) {
      snapped.y = 235
    }

    // Ramp centerline: old x: 920 → new x: 120 (center of 90-150)
    if (point.x >= 90 && point.x <= 150 && point.y >= 210 && point.y <= 450) {
      snapped.x = 120
    }

    // Entry (top left) centerline: old x: 995 → new x: 45 (center of 10-80)
    if (point.x >= 10 && point.x <= 80 && point.y >= 390 && point.y <= 580) {
      snapped.x = 45
    }

    // Exit box centerline: x = 770 (center of 740-800)
    if (point.x >= 740 && point.x <= 800 && point.y >= 210 && point.y <= 450) {
      snapped.x = 770
    }

    // Stairs-left centerline: x = 840 (center of 810-870)
    if (point.x >= 810 && point.x <= 870 && point.y >= 210 && point.y <= 270) {
      snapped.x = 840
    }

    // Stairs-right centerline: x = 400 (center of 370-430)
    if (point.x >= 370 && point.x <= 430 && point.y >= 210 && point.y <= 270) {
      snapped.x = 400
    }

    // Gate No. 2 centerline: x = 990 (door position)
    if (point.x >= 950 && point.x <= 1030 && point.y >= 400 && point.y <= 580) {
      snapped.x = 990
    }

    return snapped
  })
}

const enforceOrthogonalAlignment = (path: { x: number; y: number }[]): { x: number; y: number }[] => {
  if (path.length <= 1) return path

  const aligned: { x: number; y: number }[] = [path[0]]

  for (let i = 1; i < path.length; i++) {
    const prev = aligned[aligned.length - 1]
    const current = path[i]

    // Calculate direction
    const dx = Math.abs(current.x - prev.x)
    const dy = Math.abs(current.y - prev.y)

    // If moving primarily horizontally, lock y-coordinate
    if (dx > dy) {
      aligned.push({ x: current.x, y: prev.y })
    }
    // If moving primarily vertically, lock x-coordinate
    else if (dy > dx) {
      aligned.push({ x: prev.x, y: current.y })
    }
    // If equal or very close, keep the point as is (turning point)
    else {
      aligned.push(current)
    }
  }

  return aligned
}

export default function CampusNavigationMap() {
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [startRoom, setStartRoom] = useState<Room | null>(() => rooms.find((r) => r.id === "entry") || null)
  const [endRoom, setEndRoom] = useState<Room | null>(null)
  const [pathPoints, setPathPoints] = useState<{ x: number; y: number }[]>([])
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const [pinchStart, setPinchStart] = useState(0)
  const [initialZoom, setInitialZoom] = useState(1)

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      if (width < 640) {
        // Mobile: zoom out to fit entire map
        setZoom(0.5)
      } else if (width < 1024) {
        // Tablet: slight zoom out
        setZoom(0.7)
      } else {
        // Desktop: default zoom
        setZoom(1)
      }
      // Reset pan on resize
      setPan({ x: 0, y: 0 })
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const handleRoomClick = (room: Room) => {
    if (room.type === "corridor" || room.type === "outdoor") return

    if (room.id === "gate2") {
      if (selectedRoom) {
        // Navigate from selected room → Exit box → Gate No. 2
        const exitBox = rooms.find((r) => r.id === "entry-left")
        const gate2 = room

        if (exitBox) {
          setEndRoom(gate2) // Final destination is Gate No. 2

          const startDoor = roomDoors[selectedRoom.id]
          const exitDoor = roomDoors[exitBox.id]
          const gate2Door = roomDoors[gate2.id]

          if (startDoor && exitDoor && gate2Door) {
            console.log("[v0] Multi-segment path:", selectedRoom.name, "→ Exit box → Gate No. 2")
            console.log("[v0] Start door:", startDoor)
            console.log("[v0] Exit door:", exitDoor)
            console.log("[v0] Gate 2 door:", gate2Door)

            // Segment 1: Selected room → Exit box
            const path1 = findGridPath(startDoor.x, startDoor.y, exitDoor.x, exitDoor.y)
            console.log("[v0] Path segment 1 (room → exit box):", path1.length, "points")

            // Segment 2: Exit box → Gate No. 2
            const path2 = findGridPath(exitDoor.x, exitDoor.y, gate2Door.x, gate2Door.y)
            console.log("[v0] Path segment 2 (exit box → gate 2):", path2.length, "points")

            // Combine paths (remove duplicate point at Exit box)
            const combinedPath = [...path1, ...path2.slice(1)]
            console.log("[v0] Combined path:", combinedPath.length, "points")

            const simplified = simplifyPath(combinedPath)
            console.log("[v0] Simplified path:", simplified.length, "points")

            const centered = snapToCenterlines(simplified)
            console.log("[v0] Centered path:", centered.length, "points")

            const aligned = enforceOrthogonalAlignment(centered)
            console.log("[v0] Final aligned path:", aligned.length, "points")

            setPathPoints(aligned)
          }
        }
      }
      return
    }

    if (room.id === "entry") return // Don't navigate to the start point itself

    setSelectedRoom(room)
    setEndRoom(room)

    // Always use Entry as start point
    const entryRoom = rooms.find((r) => r.id === "entry")
    if (!entryRoom) return

    const startDoor = roomDoors[entryRoom.id]
    const endDoor = roomDoors[room.id]

    if (startDoor && endDoor) {
      console.log("[v0] Calculating path from Entry to", room.name)
      console.log("[v0] Start door:", startDoor)
      console.log("[v0] End door:", endDoor)

      const gridPath = findGridPath(startDoor.x, startDoor.y, endDoor.x, endDoor.y)
      console.log("[v0] Grid path points:", gridPath.length)

      const simplified = simplifyPath(gridPath)
      console.log("[v0] Simplified path points:", simplified.length)

      const centered = snapToCenterlines(simplified)
      console.log("[v0] Centered path points:", centered.length)

      const aligned = enforceOrthogonalAlignment(centered)
      console.log("[v0] Aligned path points:", aligned.length)

      setPathPoints(aligned)
    }
  }

  const handleClearNavigation = () => {
    const entryRoom = rooms.find((r) => r.id === "entry")
    setStartRoom(entryRoom || null)
    setEndRoom(null)
    setPathPoints([])
    setSelectedRoom(null)
  }

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.2, 2))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.2, 0.5))
  const handleResetView = () => {
    const width = window.innerWidth
    if (width < 640) {
      setZoom(0.5)
    } else if (width < 1024) {
      setZoom(0.7)
    } else {
      setZoom(1)
    }
    setPan({ x: 0, y: 0 })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // Single touch - pan
      setIsDragging(true)
      setDragStart({
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      })
    } else if (e.touches.length === 2) {
      // Two fingers - pinch zoom
      const distance = getTouchDistance(e.touches)
      setPinchStart(distance)
      setInitialZoom(zoom)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault() // Prevent scrolling

    if (e.touches.length === 1 && isDragging) {
      // Pan with single touch
      setPan({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      })
    } else if (e.touches.length === 2) {
      // Pinch zoom with two fingers
      const distance = getTouchDistance(e.touches)
      const scale = distance / pinchStart
      setZoom(Math.max(0.5, Math.min(2, initialZoom * scale)))
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  const getTouchDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  const getRoomBorderColor = (room: Room) => {
    if (room.id === startRoom?.id) return "#10b981"
    if (room.id === endRoom?.id) return "#f43f5e"
    if (room.id === selectedRoom?.id) return "#3b82f6"
    return "#94a3b8"
  }

  const getRoomBorderWidth = (room: Room) => {
    if (room.id === startRoom?.id || room.id === endRoom?.id || room.id === selectedRoom?.id) return 3
    return 1.5
  }

  return (
    <div className="fixed inset-0 w-screen h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div
        className={cn(
          "relative w-full h-full bg-gradient-to-br from-slate-100 via-white to-blue-50",
          isDragging ? "cursor-grabbing" : "cursor-grab",
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: "none" }}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center",
            transition: isDragging ? "none" : "transform 0.3s ease",
          }}
          className="absolute inset-0 flex items-center justify-center p-4 sm:p-6 md:p-8"
        >
          <svg className="w-full h-full" viewBox="0 0 1040 600" preserveAspectRatio="xMidYMid meet">
            {rooms.map((room) => {
              let currentY = room.y
              const headerHeight = room.roomNumber ? 18 : 0

              return (
                <g
                  key={room.id}
                  onClick={() => handleRoomClick(room)}
                  className={cn(
                    "transition-all",
                    room.type !== "corridor" && room.type !== "outdoor" && "cursor-pointer hover:opacity-80",
                  )}
                >
                  <rect
                    x={room.x}
                    y={room.y}
                    width={room.width}
                    height={room.height}
                    fill={room.color}
                    stroke={getRoomBorderColor(room)}
                    strokeWidth={getRoomBorderWidth(room)}
                    rx="4"
                    className="transition-all"
                  />

                  {room.roomNumber && (
                    <>
                      <rect
                        x={room.x}
                        y={room.y}
                        width={room.width}
                        height={headerHeight}
                        fill="rgba(0,0,0,0.05)"
                        rx="4"
                      />
                      {(() => {
                        const lines = wrapText(room.roomNumber, room.width - 4, 8)
                        return lines.map((line, i) => (
                          <text
                            key={`header-${i}`}
                            x={room.x + room.width / 2}
                            y={room.y + headerHeight / 2 + (i - (lines.length - 1) / 2) * 9}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="font-tech font-bold pointer-events-none"
                            fontSize="8"
                            fill="#1e293b"
                          >
                            {line}
                          </text>
                        ))
                      })()}
                    </>
                  )}

                  {room.subjects && room.subjects.length > 0 ? (
                    <>
                      {room.subjects.map((subject, index) => {
                        const subjectY = currentY + (index === 0 ? headerHeight : 0)
                        const subjectHeight = (room.height - headerHeight) / room.subjects!.length
                        const sectionCenterY = subjectY + subjectHeight / 2
                        currentY = subjectY + subjectHeight

                        return (
                          <g key={`${room.id}-subject-${index}`}>
                            {index > 0 && (
                              <line
                                x1={room.x}
                                y1={subjectY}
                                x2={room.x + room.width}
                                y2={subjectY}
                                stroke="#94a3b8"
                                strokeWidth="1"
                                strokeDasharray="3,3"
                              />
                            )}
                            {(() => {
                              const lines = wrapText(subject.name, room.width - 4, 10)
                              return lines.map((line, i) => (
                                <text
                                  key={`subject-${index}-line-${i}`}
                                  x={room.x + room.width / 2}
                                  y={sectionCenterY + (i - (lines.length - 1) / 2) * 12}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  className="font-body font-medium pointer-events-none"
                                  fontSize="10"
                                  fill="#334155"
                                >
                                  {line}
                                </text>
                              ))
                            })()}
                          </g>
                        )
                      })}
                    </>
                  ) : (
                    <>
                      {(() => {
                        const fontSize = 10
                        const lines = wrapText(room.name, room.width - 4, fontSize)
                        return lines.map((line, i) => (
                          <text
                            key={`name-${i}`}
                            x={room.x + room.width / 2}
                            y={
                              room.y +
                              room.height / 2 +
                              (headerHeight ? headerHeight / 2 : 0) +
                              (i - (lines.length - 1) / 2) * 12
                            }
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="font-tech font-bold pointer-events-none"
                            fontSize={fontSize}
                            fill="#1e293b"
                          >
                            {line}
                          </text>
                        ))
                      })()}
                    </>
                  )}

                  {room.icon === "water" && (
                    <g>
                      <circle cx={room.x + room.width / 2} cy={room.y + 12} r="5" fill="#0ea5e9" opacity="0.7" />
                      <path
                        d={`M ${room.x + room.width / 2 - 2} ${room.y + 10} Q ${room.x + room.width / 2} ${room.y + 8} ${room.x + room.width / 2 + 2} ${room.y + 10}`}
                        fill="white"
                        opacity="0.8"
                      />
                    </g>
                  )}
                </g>
              )
            })}

            {pathPoints.length > 1 && (
              <g style={{ pointerEvents: "none" }}>
                {/* White outline for contrast */}
                <polyline
                  points={pathPoints.map((p) => `${p.x},${p.y}`).join(" ")}
                  fill="none"
                  stroke="white"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.8"
                />

                {/* Main path line */}
                <polyline
                  points={pathPoints.map((p) => `${p.x},${p.y}`).join(" ")}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.9"
                />

                {/* Animated dashed line */}
                <polyline
                  points={pathPoints.map((p) => `${p.x},${p.y}`).join(" ")}
                  fill="none"
                  stroke="#60a5fa"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="12,8"
                  opacity="0.95"
                >
                  <animate attributeName="stroke-dashoffset" from="20" to="0" dur="1s" repeatCount="indefinite" />
                </polyline>

                {/* Waypoint markers at turning points */}
                {pathPoints.slice(1, -1).map((point, index) => (
                  <circle
                    key={`waypoint-${index}`}
                    cx={point.x}
                    cy={point.y}
                    r="5"
                    fill="#3b82f6"
                    stroke="white"
                    strokeWidth="2"
                  />
                ))}

                {/* Start marker */}
                {pathPoints.length > 0 && (
                  <g>
                    <circle
                      cx={pathPoints[0].x}
                      cy={pathPoints[0].y}
                      r="10"
                      fill="#10b981"
                      stroke="white"
                      strokeWidth="3"
                    />
                    <text
                      x={pathPoints[0].x}
                      y={pathPoints[0].y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="12"
                      fill="white"
                      fontWeight="bold"
                    >
                      S
                    </text>
                  </g>
                )}

                {/* End marker */}
                {pathPoints.length > 0 && (
                  <g>
                    <circle
                      cx={pathPoints[pathPoints.length - 1].x}
                      cy={pathPoints[pathPoints.length - 1].y}
                      r="10"
                      fill="#f43f5e"
                      stroke="white"
                      strokeWidth="3"
                    />
                    <text
                      x={pathPoints[pathPoints.length - 1].x}
                      y={pathPoints[pathPoints.length - 1].y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="12"
                      fill="white"
                      fontWeight="bold"
                    >
                      E
                    </text>
                  </g>
                )}
              </g>
            )}
          </svg>
        </div>

        <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 flex flex-col gap-3 sm:gap-2">
          <Button
            size="icon"
            variant="secondary"
            onClick={handleZoomIn}
            className="w-12 h-12 sm:w-10 sm:h-10 bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white touch-manipulation"
          >
            <ZoomIn className="h-5 w-5 sm:h-4 sm:w-4" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            onClick={handleZoomOut}
            className="w-12 h-12 sm:w-10 sm:h-10 bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white touch-manipulation"
          >
            <ZoomOut className="h-5 w-5 sm:h-4 sm:w-4" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            onClick={handleResetView}
            className="w-12 h-12 sm:w-10 sm:h-10 bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white touch-manipulation"
          >
            <Maximize2 className="h-5 w-5 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

