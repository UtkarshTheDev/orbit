import type { Room, DoorPosition } from './types';

// Room dimensions
export const ROOM_WIDTH = 60;
export const GATE_WIDTH = 70; // Increased from 50 to 70 to match Gate No. 2 width
export const ROOM_HEIGHT = 120;
export const LEFT_COLUMN_WIDTH = 80;

// Grid constants for pathfinding
export const GRID_SIZE = 10; // 10px grid cells
export const GRID_WIDTH = Math.ceil(1040 / GRID_SIZE);
export const GRID_HEIGHT = Math.ceil(600 / GRID_SIZE);

// Campus rooms data
export const rooms: Room[] = [
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
];

// Room connections for pathfinding
export const roomConnections: Record<string, string[]> = {
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
};

// Door positions for room connections
export const roomDoors: Record<string, DoorPosition> = {
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
};