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
    : `group cursor-pointer overflow-hidden rounded-xl border-2 bg-white p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
        isSelected
          ? "border-blue-500 shadow-xl shadow-blue-200/60 ring-2 ring-blue-400/50 bg-gradient-to-br from-blue-50 to-white"
          : "border-slate-200 hover:border-blue-400 hover:shadow-blue-100/50"
      }`;

  const iconClasses = variant === "mobile"
    ? `rounded-xl p-2 transition-all duration-300 ${
        isSelected
          ? "bg-blue-500 shadow-lg shadow-blue-500/30"
          : "bg-blue-100 group-active:bg-blue-200"
      }`
    : `rounded-xl p-3 transition-all duration-300 ${
        isSelected
          ? "bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/40"
          : "bg-blue-100 group-hover:bg-blue-200"
      }`;

  const titleClasses = variant === "mobile"
    ? `font-orbitron text-base font-bold transition-colors tracking-tight ${
        isSelected ? "text-blue-700" : "text-slate-900"
      }`
    : `font-orbitron text-lg font-bold transition-colors tracking-tight ${
        isSelected
          ? "text-blue-700"
          : "text-slate-900 group-hover:text-blue-600"
      }`;

  const addressClasses = variant === "mobile"
    ? "font-sans text-sm text-slate-600 mt-1"
    : "font-sans text-sm text-slate-600 leading-relaxed mt-1";

  return (
    <Card onClick={handleClick} className={cardClasses}>
      <div className="flex items-center gap-4">
        <div className={iconClasses}>
          <MapPin
            className={`${variant === "mobile" ? "h-5 w-5" : "h-6 w-6"} transition-colors ${
              isSelected ? "text-white" : "text-blue-600"
            }`}
          />
        </div>
        <div className="flex-1 min-w-0">
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