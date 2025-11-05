import type React from "react";

interface PathRendererProps {
  pathPoints: { x: number; y: number }[];
}

export const PathRenderer: React.FC<PathRendererProps> = ({ pathPoints }) => {
  if (pathPoints.length <= 1) return null;

  return (
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
  );
};