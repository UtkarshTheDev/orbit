import type React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, MapPin, CheckCircle2 } from "lucide-react";
import type { Location, MobileStep } from '../types';

interface MobileStepNavigationProps {
  mobileStep: MobileStep;
  currentLocation: Location | null;
  destinationLocation?: Location | null;
  onBack: () => void;
  onChangeCurrentLocation?: () => void;
}

export const MobileStepNavigation: React.FC<MobileStepNavigationProps> = ({
  mobileStep,
  currentLocation,
  destinationLocation,
  onBack,
  onChangeCurrentLocation,
}) => {
  return (
    <div className="sticky top-0 z-10 bg-gradient-to-b from-white via-white to-transparent pb-4">
      {/* Header with animated title */}
      <div className="mb-6 overflow-hidden">
        <div
          className={`transition-all duration-500 ${
            mobileStep === "current" ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
          }`}
        >
          {mobileStep === "current" && (
            <div className="text-center">
              <h2 className="font-orbitron text-xl font-bold uppercase tracking-wider text-slate-800">
                Select Current Location
              </h2>
              <p className="mt-2 font-sans text-sm text-slate-500">
                Where are you right now?
              </p>
            </div>
          )}
        </div>
        
        <div
          className={`transition-all duration-500 ${
            mobileStep === "destination" ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          {mobileStep === "destination" && (
            <div className="text-center">
              <h2 className="font-orbitron text-xl font-bold uppercase tracking-wider text-slate-800">
                Select Destination
              </h2>
              <p className="mt-2 font-sans text-sm text-slate-500">
                Where do you want to go?
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Progress Indicators */}
      <div className="mb-6 flex items-center justify-center gap-3">
        {/* Step 1: Current Location */}
        <div className="flex flex-col items-center gap-2">
          <div
            className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-500 ${
              mobileStep === "current"
                ? "bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/50 ring-4 ring-blue-300/50 scale-110"
                : currentLocation
                  ? "bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/50"
                  : "bg-slate-200"
            }`}
          >
            {currentLocation ? (
              <CheckCircle2 className="h-5 w-5 text-white animate-in zoom-in duration-300" />
            ) : (
              <span className="font-orbitron text-sm font-bold text-white">1</span>
            )}
            {mobileStep === "current" && (
              <div className="absolute inset-0 animate-ping rounded-full bg-blue-400 opacity-75" />
            )}
          </div>
          <span
            className={`font-sans text-xs font-medium transition-colors ${
              mobileStep === "current" || currentLocation ? "text-blue-700" : "text-slate-400"
            }`}
          >
            Current
          </span>
        </div>

        {/* Connecting Line */}
        <div className="relative h-1 w-16 overflow-hidden rounded-full bg-slate-200">
          <div
            className={`h-full transition-all duration-700 ease-out ${
              destinationLocation 
                ? "w-full bg-gradient-to-r from-green-500 to-green-600" 
                : currentLocation 
                  ? "w-full bg-gradient-to-r from-blue-500 to-blue-600" 
                  : "w-0 bg-gradient-to-r from-blue-500 to-blue-600"
            }`}
          />
        </div>

        {/* Step 2: Destination */}
        <div className="flex flex-col items-center gap-2">
          <div
            className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-500 ${
              mobileStep === "destination"
                ? "bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/50 ring-4 ring-blue-300/50 scale-110"
                : destinationLocation
                  ? "bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/50"
                  : currentLocation
                    ? "bg-blue-200"
                    : "bg-slate-200"
            }`}
          >
            {destinationLocation ? (
              <CheckCircle2 className="h-5 w-5 text-white animate-in zoom-in duration-300" />
            ) : (
              <span
                className={`font-orbitron text-sm font-bold ${
                  mobileStep === "destination" ? "text-white" : "text-slate-500"
                }`}
              >
                2
              </span>
            )}
            {mobileStep === "destination" && (
              <div className="absolute inset-0 animate-ping rounded-full bg-blue-400 opacity-75" />
            )}
          </div>
          <span
            className={`font-sans text-xs font-medium transition-colors ${
              mobileStep === "destination" || destinationLocation ? "text-blue-700" : "text-slate-400"
            }`}
          >
            Destination
          </span>
        </div>
      </div>

      {/* Current Location Card (shown on destination step) */}
      {mobileStep === "destination" && currentLocation && (
        <div className="mb-4 animate-in slide-in-from-top duration-500">
          <Card className="border-2 border-green-300 bg-gradient-to-br from-green-50 to-white p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-green-500 p-2 shadow-md shadow-green-500/30">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-sans text-xs font-medium text-slate-600">Starting from</p>
                  <p className="font-orbitron text-sm font-bold text-green-700">
                    {currentLocation.name}
                  </p>
                </div>
              </div>
              {onChangeCurrentLocation && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onChangeCurrentLocation}
                  className="text-xs text-blue-600 hover:bg-blue-50"
                >
                  Change
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Back Button */}
      {mobileStep === "destination" && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="mb-4 text-blue-600 hover:bg-blue-50 animate-in fade-in slide-in-from-left duration-300"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Current Location
        </Button>
      )}
    </div>
  );
};