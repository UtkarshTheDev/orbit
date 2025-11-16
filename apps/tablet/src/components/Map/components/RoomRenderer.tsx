import type React from "react";
import type { Room } from '../types';
import { wrapText } from '../utils/rendering';

interface RoomRendererProps {
  room: Room;
  isSelected?: boolean;
  isStartRoom?: boolean;
  isEndRoom?: boolean;
  onClick?: (room: Room) => void;
}

export const RoomRenderer: React.FC<RoomRendererProps> = ({
  room,
  isSelected = false,
  isStartRoom = false,
  isEndRoom = false,
  onClick,
}) => {
  const getRoomBorderColor = () => {
    if (isStartRoom) return "#10b981";
    if (isEndRoom) return "#f43f5e";
    if (isSelected) return "#3b82f6";
    return "#94a3b8";
  };

  const getRoomBorderWidth = () => {
    if (isStartRoom || isEndRoom || isSelected) return 3;
    return 1.5;
  };

  const handleClick = () => {
    if (onClick && room.type !== "corridor" && room.type !== "outdoor") {
      onClick(room);
    }
  };

  let currentY = room.y;
  const headerHeight = room.roomNumber ? 18 : 0;

  return (
    <g
      onClick={handleClick}
      className={`transition-all ${
        room.type !== "corridor" && room.type !== "outdoor" && onClick
          ? "cursor-pointer hover:opacity-80"
          : ""
      }`}
    >
      <rect
        x={room.x}
        y={room.y}
        width={room.width}
        height={room.height}
        fill={(room.type === 'classroom' && (!room.subjects || room.subjects.length === 0)) ? "#E5E7EB" : room.color}
        stroke={getRoomBorderColor()}
        strokeWidth={getRoomBorderWidth()}
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
            const lines = wrapText(room.roomNumber, room.width - 4, 8);
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
            ));
          })()}
        </>
      )}

      {room.subjects && room.subjects.length > 0 ? (
        <>
          {room.subjects.map((subject, index) => {
            const subjectY = currentY + (index === 0 ? headerHeight : 0);
            const subjectHeight = (room.height - headerHeight) / room.subjects!.length;
            const sectionCenterY = subjectY + subjectHeight / 2;
            currentY = subjectY + subjectHeight;

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
                  const lines = wrapText(subject.name, room.width - 4, 10);
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
                  ));
                })()}
              </g>
            );
          })}
        </>
      ) : (
        <>
          {(() => {
            const fontSize = 10;
            const lines = wrapText(room.name, room.width - 4, fontSize);
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
            ));
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
  );
};