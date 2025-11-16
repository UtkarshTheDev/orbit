import type { Location } from '../types';
import { rooms } from '../constants';

// Create campus locations from actual room data
const createCampusLocations = (): Location[] => {
  const campusLocations: Location[] = [];

  // Event/Classroom locations (rooms with specific subjects)
  const eventRooms = [
    'room1', 'room2', 'room3', 'room5', 'room6', 'room7', 'room8', 'room9', 'room10', 'room11',
    'sports-room',
    'playground'
  ];

  eventRooms.forEach(roomId => {
    const room = rooms.find(r => r.id === roomId);
    if (room) {
      const subjects = room.subjects?.map(s => s.name).join(', ') || '';
      // Use subjects as main title, room name as subtitle
      campusLocations.push({
        id: room.id,
        name: subjects || room.name, // Main title: subjects
        address: room.name, // Subtitle: room number/name
        coordinates: { 
          lat: room.x + room.width/2, 
          lng: room.y + room.height/2 
        },
        category: "Events"
      });
    }
  });

  // Facility locations (administrative and utility areas)
  const facilityRooms = [
    'principal',
    'office-reception', 
    'drinking-water-boys',
    'drinking-water-girls'
  ];

  facilityRooms.forEach(roomId => {
    const room = rooms.find(r => r.id === roomId);
    if (room) {
      campusLocations.push({
        id: room.id,
        name: room.name,
        address: `${room.type.charAt(0).toUpperCase() + room.type.slice(1)} Area`,
        coordinates: { 
          lat: room.x + room.width/2, 
          lng: room.y + room.height/2 
        },
        category: "Facilities"
      });
    }
  });

  // Access Point locations (entry/exit gates)
  const accessRooms = [
    'entry', // Gate No. 1 / Entry
    'gate2', // Gate No. 2 / Exit
    'gate3', // Gate No. 3
    'gate4', // Gate No. 4
    'entry-left', // Exit
    'entry-right' // Entry
  ];

  accessRooms.forEach(roomId => {
    const room = rooms.find(r => r.id === roomId);
    if (room) {
      campusLocations.push({
        id: room.id,
        name: room.name,
        address: 'Campus Access Point',
        coordinates: { 
          lat: room.x + room.width/2, 
          lng: room.y + room.height/2 
        },
        category: "Access Points"
      });
    }
  });

  // Stairs locations (navigation helpers)
  const stairRooms = ['stairs-left', 'stairs-right'];
  
  stairRooms.forEach(roomId => {
    const room = rooms.find(r => r.id === roomId);
    if (room) {
      campusLocations.push({
        id: room.id,
        name: room.name,
        address: 'Navigation Helper',
        coordinates: { 
          lat: room.x + room.width/2, 
          lng: room.y + room.height/2 
        },
        category: "Navigation"
      });
    }
  });

  return campusLocations;
};

export const CAMPUS_LOCATIONS = createCampusLocations();

// Keep some dummy external locations for testing (optional)
export const DUMMY_LOCATIONS: Location[] = CAMPUS_LOCATIONS;