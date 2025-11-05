// Shared types for Map components

export interface SubjectBox {
  name: string;
  height: number;
}

export interface PathNode {
  roomId: string;
  x: number;
  y: number;
}

export interface Room {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  roomNumber?: string;
  subjects?: SubjectBox[];
  type: "classroom" | "office" | "facility" | "entrance" | "outdoor" | "corridor" | "stairs";
  color: string;
  icon?: string;
}

export interface GridNode {
  x: number;
  y: number;
  g: number;
  h: number;
  f: number;
  parent: GridNode | null;
}

export interface DoorPosition {
  x: number;
  y: number;
  side: "top" | "bottom" | "left" | "right";
}

// External location types (for Selection component)
export interface Location {
  id: string;
  name: string;
  address: string;
  coordinates: { lat: number; lng: number };
  category: string;
}

export type MobileStep = "current" | "destination" | "map";