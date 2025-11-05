// Main Map components
export { default as CampusNavigationMap } from './Map';
export { LocationPicker } from './Selection';

// Types
export type {
  Room,
  SubjectBox,
  PathNode,
  GridNode,
  DoorPosition,
  Location,
  MobileStep
} from './types';

// Data
export { rooms, roomConnections, roomDoors } from './constants';
export { DUMMY_LOCATIONS } from './data/locations';

// Utility functions
export {
  findPath,
  findGridPath,
  simplifyPath,
  snapToCenterlines,
  enforceOrthogonalAlignment,
  getRoomCenter
} from './utils/pathfinding';
export { wrapText } from './utils/rendering';

// UI Components
export { ZoomControls } from './components/ZoomControls';
export { RoomRenderer } from './components/RoomRenderer';
export { PathRenderer } from './components/PathRenderer';
export { LocationCard } from './components/LocationCard';
export { MobileStepNavigation } from './components/MobileStepNavigation';
export { QRDialog } from './components/QRDialog';