import type { GridNode } from '../types';
import { rooms, roomConnections, roomDoors, GRID_SIZE, GRID_WIDTH, GRID_HEIGHT } from '../constants';

// Pathfinding utilities

export const findPath = (startId: string, endId: string): string[] => {
  if (startId === endId) return [startId];

  const openSet = new Set([startId]);
  const cameFrom: Record<string, string> = {};
  const gScore: Record<string, number> = { [startId]: 0 };
  const fScore: Record<string, number> = { [startId]: heuristic(startId, endId) };

  while (openSet.size > 0) {
    const current = Array.from(openSet).reduce((a, b) =>
      (fScore[a] ?? Number.POSITIVE_INFINITY) < (fScore[b] ?? Number.POSITIVE_INFINITY) ? a : b,
    );

    if (current === endId) {
      return reconstructPath(cameFrom, current);
    }

    openSet.delete(current);

    const neighbors = roomConnections[current] || [];
    for (const neighbor of neighbors) {
      const tentativeGScore = (gScore[current] ?? Number.POSITIVE_INFINITY) + 1;

      if (tentativeGScore < (gScore[neighbor] ?? Number.POSITIVE_INFINITY)) {
        cameFrom[neighbor] = current;
        gScore[neighbor] = tentativeGScore;
        fScore[neighbor] = tentativeGScore + heuristic(neighbor, endId);
        openSet.add(neighbor);
      }
    }
  }

  return []; // No path found
};

const heuristic = (roomId1: string, roomId2: string): number => {
  const room1 = rooms.find((r) => r.id === roomId1);
  const room2 = rooms.find((r) => r.id === roomId2);
  if (!room1 || !room2) return Number.POSITIVE_INFINITY;

  const dx = Math.abs(room1.x + room1.width / 2 - (room2.x + room2.width / 2));
  const dy = Math.abs(room1.y + room1.height / 2 - (room2.y + room2.height / 2));
  return dx + dy;
};

const reconstructPath = (cameFrom: Record<string, string>, current: string): string[] => {
  const path = [current];
  while (current in cameFrom) {
    current = cameFrom[current];
    path.unshift(current);
  }
  return path;
};

export const getRoomCenter = (roomId: string): { x: number; y: number } => {
  const room = rooms.find((r) => r.id === roomId);
  if (!room) return { x: 0, y: 0 };
  return {
    x: room.x + room.width / 2,
    y: room.y + room.height / 2,
  };
};

const isWalkable = (x: number, y: number): boolean => {
  // Pathway: full width, no change
  if (y >= 400 && y <= 450 && x >= 10 && x <= 1030) return true;

  // Corridor: old x: 100-950 → new x: 90-940
  if (y >= 210 && y <= 260 && x >= 90 && x <= 940) return true;

  // Ramp: old x: 890-950 → new x: 90-150
  if (y >= 210 && y <= 450 && x >= 90 && x <= 150) return true;

  // Entry (top left now): old x: 960-1030 → new x: 10-80
  if (x >= 10 && x <= 80 && y >= 390 && y <= 580) return true;

  // Entry left connection (Exit box): x: 740-800, y: 210-450
  if (x >= 740 && x <= 800 && y >= 210 && y <= 450) return true;

  // Entry right connection: x: 300-360, y: 210-390
  if (x >= 300 && x <= 360 && y >= 210 && y <= 390) return true;

  // Stairs-left connection to corridor only (not pathway)
  // Stairs-left: x: 810-870, y: 210-270 (connects corridor to stairs top)
  if (x >= 810 && x <= 870 && y >= 210 && y <= 270) return true;

  // Stairs-right connection to corridor only (not pathway)
  // Stairs-right: x: 370-430, y: 210-270 (connects corridor to stairs top)
  if (x >= 370 && x <= 430 && y >= 210 && y <= 270) return true;

  // Gate No. 2 connection: x: 950-1030, y: 400-580
  if (x >= 950 && x <= 1030 && y >= 400 && y <= 580) return true;

  return false;
};

const manhattanDistance = (x1: number, y1: number, x2: number, y2: number): number => {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
};

export const findGridPath = (startX: number, startY: number, endX: number, endY: number): { x: number; y: number }[] => {
  const startGridX = Math.floor(startX / GRID_SIZE);
  const startGridY = Math.floor(startY / GRID_SIZE);
  const endGridX = Math.floor(endX / GRID_SIZE);
  const endGridY = Math.floor(endY / GRID_SIZE);

  const openSet: GridNode[] = [];
  const closedSet = new Set<string>();

  const startNode: GridNode = {
    x: startGridX,
    y: startGridY,
    g: 0,
    h: manhattanDistance(startGridX, startGridY, endGridX, endGridY),
    f: 0,
    parent: null,
  };
  startNode.f = startNode.g + startNode.h;

  openSet.push(startNode);

  const getKey = (x: number, y: number) => `${x},${y}`;

  while (openSet.length > 0) {
    // Find node with lowest f score
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift()!;

    const currentKey = getKey(current.x, current.y);

    // Check if we reached the goal
    if (current.x === endGridX && current.y === endGridY) {
      // Reconstruct path
      const path: { x: number; y: number }[] = [];
      let node: GridNode | null = current;
      while (node) {
        path.unshift({ x: node.x * GRID_SIZE + GRID_SIZE / 2, y: node.y * GRID_SIZE + GRID_SIZE / 2 });
        node = node.parent;
      }
      return path;
    }

    closedSet.add(currentKey);

    // Check 4 neighbors (up, down, left, right - no diagonals)
    const neighbors = [
      { x: current.x, y: current.y - 1 }, // up
      { x: current.x, y: current.y + 1 }, // down
      { x: current.x - 1, y: current.y }, // left
      { x: current.x + 1, y: current.y }, // right
    ];

    for (const neighbor of neighbors) {
      const neighborKey = getKey(neighbor.x, neighbor.y);

      // Skip if out of bounds
      if (neighbor.x < 0 || neighbor.x >= GRID_WIDTH || neighbor.y < 0 || neighbor.y >= GRID_HEIGHT) {
        continue;
      }

      // Skip if already evaluated
      if (closedSet.has(neighborKey)) {
        continue;
      }

      // Check if walkable
      const pixelX = neighbor.x * GRID_SIZE + GRID_SIZE / 2;
      const pixelY = neighbor.y * GRID_SIZE + GRID_SIZE / 2;

      if (!isWalkable(pixelX, pixelY)) {
        continue;
      }

      const g = current.g + 1;
      const h = manhattanDistance(neighbor.x, neighbor.y, endGridX, endGridY);
      const f = g + h;

      // Check if this neighbor is already in open set
      const existingNode = openSet.find((n) => n.x === neighbor.x && n.y === neighbor.y);

      if (existingNode) {
        if (g < existingNode.g) {
          existingNode.g = g;
          existingNode.f = f;
          existingNode.parent = current;
        }
      } else {
        openSet.push({
          x: neighbor.x,
          y: neighbor.y,
          g,
          h,
          f,
          parent: current,
        });
      }
    }
  }

  return []; // No path found
};

export const simplifyPath = (path: { x: number; y: number }[]): { x: number; y: number }[] => {
  if (path.length <= 2) return path;

  const simplified: { x: number; y: number }[] = [path[0]];

  for (let i = 1; i < path.length - 1; i++) {
    const prev = path[i - 1];
    const current = path[i];
    const next = path[i + 1];

    // Check if direction changes (turning point)
    const dir1X = current.x - prev.x;
    const dir1Y = current.y - prev.y;
    const dir2X = next.x - current.x;
    const dir2Y = next.y - current.y;

    // If direction changes, keep this point
    if (dir1X !== dir2X || dir1Y !== dir2Y) {
      simplified.push(current);
    }
  }

  simplified.push(path[path.length - 1]);
  return simplified;
};

export const snapToCenterlines = (path: { x: number; y: number }[]): { x: number; y: number }[] => {
  return path.map((point) => {
    const snapped = { ...point };

    // Pathway centerline: y = 425 (unchanged)
    if (point.y >= 400 && point.y <= 450) {
      snapped.y = 425;
    }

    // Corridor centerline: y = 235 (unchanged)
    if (point.y >= 210 && point.y <= 260) {
      snapped.y = 235;
    }

    // Ramp centerline: old x: 920 → new x: 120 (center of 90-150)
    if (point.x >= 90 && point.x <= 150 && point.y >= 210 && point.y <= 450) {
      snapped.x = 120;
    }

    // Entry (top left) centerline: old x: 995 → new x: 45 (center of 10-80)
    if (point.x >= 10 && point.x <= 80 && point.y >= 390 && point.y <= 580) {
      snapped.x = 45;
    }

    // Exit box centerline: x = 770 (center of 740-800)
    if (point.x >= 740 && point.x <= 800 && point.y >= 210 && point.y <= 450) {
      snapped.x = 770;
    }

    // Stairs-left centerline: x = 840 (center of 810-870)
    if (point.x >= 810 && point.x <= 870 && point.y >= 210 && point.y <= 270) {
      snapped.x = 840;
    }

    // Stairs-right centerline: x = 400 (center of 370-430)
    if (point.x >= 370 && point.x <= 430 && point.y >= 210 && point.y <= 270) {
      snapped.x = 400;
    }

    // Gate No. 2 centerline: x = 990 (door position)
    if (point.x >= 950 && point.x <= 1030 && point.y >= 400 && point.y <= 580) {
      snapped.x = 990;
    }

    return snapped;
  });
};

export const enforceOrthogonalAlignment = (path: { x: number; y: number }[]): { x: number; y: number }[] => {
  if (path.length <= 1) return path;

  const aligned: { x: number; y: number }[] = [path[0]];

  for (let i = 1; i < path.length; i++) {
    const prev = aligned[aligned.length - 1];
    const current = path[i];

    // Calculate direction
    const dx = Math.abs(current.x - prev.x);
    const dy = Math.abs(current.y - prev.y);

    // If moving primarily horizontally, lock y-coordinate
    if (dx > dy) {
      aligned.push({ x: current.x, y: prev.y });
    }
    // If moving primarily vertically, lock x-coordinate
    else if (dy > dx) {
      aligned.push({ x: prev.x, y: current.y });
    }
    // If equal or very close, keep the point as is (turning point)
    else {
      aligned.push(current);
    }
  }

  return aligned;
};