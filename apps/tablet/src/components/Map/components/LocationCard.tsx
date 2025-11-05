import type React from "react";
import { Card } from "@/components/ui/card";
import { MapPin, ArrowRight } from "lucide-react";
import type { Location } from '../types';

interface LocationCardProps {
  location: Location;
  isSelected?: boolean;
  isDisabled?: boolean;
  onClick?: (location: Location) => void;
  variant?: "mobile" | "tablet";
}

export const LocationCard: React.FC<LocationCardProps> = ({
  location,
  isSelected = false,
  isDisabled = false,
  onClick,
  variant = "mobile",
}) => {
  const handleClick = () => {
    if (!isDisabled && onClick) {
      onClick(location);
    }
  };

  const cardClasses = variant === "mobile" 
    ? `group cursor-pointer overflow-hidden border-2 bg-white/80 p-4 backdrop-blur-sm transition-all duration-300 active:scale-[0.98] ${
        isDisabled
          ? "cursor-not-allowed opacity-40"
          : isSelected
            ? "border-blue-400 shadow-lg shadow-blue-200/50 ring-2 ring-blue-300/50"
            : "border-slate-200 active:border-blue-300"
      }`
    : `group cursor-pointer overflow-hidden border bg-white/80 p-3 backdrop-blur-sm transition-all duration-300 hover:scale-[1.01] hover:shadow-md ${
        isSelected
          ? "border-blue-400 shadow-md shadow-blue-200/50 ring-1 ring-blue-300/50"
          : "border-slate-200 hover:border-blue-300"
      }`;

  const iconClasses = variant === "mobile"
    ? `rounded-xl p-2 transition-all duration-300 ${
        isSelected
          ? "bg-blue-500 shadow-lg shadow-blue-500/30"
          : "bg-blue-100 group-active:bg-blue-200"
      }`
    : `rounded-lg p-1.5 transition-all duration-300 ${
        isSelected
          ? "bg-blue-500 shadow-md shadow-blue-500/30"
          : "bg-blue-100 group-hover:bg-blue-200"
      }`;

  const titleClasses = variant === "mobile"
    ? `font-orbitron text-sm font-semibold transition-colors ${
        isSelected ? "text-blue-700" : "text-slate-800"
      }`
    : `font-orbitron text-xs font-semibold transition-colors truncate ${
        isSelected
          ? "text-blue-700"
          : "text-slate-800 group-hover:text-blue-600"
      }`;

  const addressClasses = variant === "mobile"
    ? "text-xs text-slate-600"
    : "text-xs text-slate-500 truncate";

  return (
    <Card onClick={handleClick} className={cardClasses}>
      <div className="flex items-center gap-3">
        <div className={iconClasses}>
          <MapPin
            className={`${variant === "mobile" ? "h-5 w-5" : "h-4 w-4"} transition-colors ${
              isSelected ? "text-white" : "text-blue-600"
            }`}
          />
        </div>
        <div className={variant === "tablet" ? "flex-1 min-w-0" : "flex-1"}>
          <h3 className={titleClasses}>
            {location.name}
          </h3>
          <p className={addressClasses}>
            {location.address}
          </p>
        </div>
        {!isDisabled && variant === "mobile" && (
          <ArrowRight
            className={`h-5 w-5 transition-all ${
              isSelected ? "text-blue-600" : "text-slate-400"
            }`}
          />
        )}
      </div>
    </Card>
  );
};