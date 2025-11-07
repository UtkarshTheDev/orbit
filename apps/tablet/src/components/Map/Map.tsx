"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import type { Room } from './types'
import { rooms, roomDoors } from './constants'
import { 
  findGridPath, 
  simplifyPath, 
  snapToCenterlines, 
  enforceOrthogonalAlignment
} from './utils/pathfinding'
import { ZoomControls } from './components/ZoomControls'
import { RoomRenderer } from './components/RoomRenderer'
import { PathRenderer } from './components/PathRenderer'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface CampusNavigationMapProps {
  initialDestination?: string | null;
  mobileStartLocation?: string | null;
  showBackButton?: boolean;
  onBack?: () => void;
}



export default function CampusNavigationMap({ 
  initialDestination, 
  mobileStartLocation,
  showBackButton = false,
  onBack
}: CampusNavigationMapProps = {}) {
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [startRoom, setStartRoom] = useState<Room | null>(null)
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
        // Mobile: larger zoom for better visibility
        setZoom(0.85)
      } else if (width < 1024) {
        // Tablet: moderate zoom
        setZoom(0.9)
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

  // Handle automatic navigation when initialDestination is provided
  useEffect(() => {
    if (initialDestination) {
      const destinationRoom = rooms.find(r => r.id === initialDestination);
      if (destinationRoom) {
        // Determine start location
        let startLocationRoom: Room | null = null;
        
        if (mobileStartLocation) {
          // Use custom start location for mobile
          startLocationRoom = rooms.find(r => r.id === mobileStartLocation) || null;
        } else {
          // Default to Gate No. 1 for tablets
          startLocationRoom = rooms.find(r => r.id === "entry") || null;
        }
        
        if (startLocationRoom) {
          setStartRoom(startLocationRoom);
          setSelectedRoom(destinationRoom);
          setEndRoom(destinationRoom);
          
          // Calculate path directly here to ensure startRoom is set
          const startDoor = roomDoors[startLocationRoom.id];
          const endDoor = roomDoors[destinationRoom.id];
          
          if (startDoor && endDoor) {
            console.log("[v0] Auto-navigation from", startLocationRoom.name, "to", destinationRoom.name);
            
            const gridPath = findGridPath(startDoor.x, startDoor.y, endDoor.x, endDoor.y);
            const simplified = simplifyPath(gridPath);
            const centered = snapToCenterlines(simplified);
            const aligned = enforceOrthogonalAlignment(centered);
            
            setPathPoints(aligned);
          }
        }
      }
    }
  }, [initialDestination, mobileStartLocation])

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

    // Use current start room (set by mobile/tablet logic), or default to Entry
    const currentStartRoom = startRoom || rooms.find((r) => r.id === "entry")
    if (!currentStartRoom) return

    const startDoor = roomDoors[currentStartRoom.id]
    const endDoor = roomDoors[room.id]

    if (startDoor && endDoor) {
      console.log("[v0] Calculating path from", currentStartRoom.name, "to", room.name)
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

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.2, 2))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.2, 0.5))
  const handleResetView = () => {
    const width = window.innerWidth
    if (width < 640) {
      setZoom(0.85)
    } else if (width < 1024) {
      setZoom(0.9)
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


  return (
    <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
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
            {rooms.map((room) => (
              <RoomRenderer
                key={room.id}
                room={room}
                isSelected={room.id === selectedRoom?.id}
                isStartRoom={room.id === startRoom?.id}
                isEndRoom={room.id === endRoom?.id}
                onClick={handleRoomClick}
              />
            ))}

            <PathRenderer pathPoints={pathPoints} />
          </svg>
        </div>

        {/* Back Button for Mobile */}
        {showBackButton && onBack && (
          <div className="absolute left-4 top-4 sm:left-6 sm:top-6 z-10">
            <Button
              size="default"
              onClick={onBack}
              className="bg-white/95 text-blue-600 shadow-2xl backdrop-blur-md hover:bg-white hover:shadow-2xl border-2 border-blue-300 font-semibold transition-all duration-200 active:scale-95 px-4 py-2 touch-manipulation"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Change Route
            </Button>
          </div>
        )}

        <ZoomControls
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetView={handleResetView}
        />
      </div>
    </div>
  )
}

