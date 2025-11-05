import type React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import type { Location, MobileStep } from '../types';

interface MobileStepNavigationProps {
  mobileStep: MobileStep;
  currentLocation: Location | null;
  onBack: () => void;
}

export const MobileStepNavigation: React.FC<MobileStepNavigationProps> = ({
  mobileStep,
  currentLocation,
  onBack,
}) => {
  return (
    <>
      <div className="mb-6">
        <p className="font-orbitron text-center text-lg uppercase tracking-wider text-slate-700">
          {mobileStep === "current"
            ? "Select Current Location"
            : "Select Destination"}
        </p>
      </div>

      <div className="mb-6 flex items-center justify-center gap-2">
        <div
          className={`h-2 w-2 rounded-full transition-all ${
            mobileStep === "current" ? "bg-blue-500 ring-2 ring-blue-300" : "bg-blue-300"
          }`}
        />
        <div className="h-0.5 w-8 bg-blue-200" />
        <div
          className={`h-2 w-2 rounded-full transition-all ${
            mobileStep === "destination" ? "bg-blue-500 ring-2 ring-blue-300" : "bg-blue-200"
          }`}
        />
      </div>

      {mobileStep === "destination" && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="mb-4 text-blue-600 hover:bg-blue-50"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
      )}

      {mobileStep === "destination" && currentLocation && (
        <Card className="mb-4 border-2 border-blue-300 bg-blue-50/50 p-3">
          <p className="mb-1 text-xs text-slate-600">Starting from:</p>
          <p className="font-orbitron text-sm font-semibold text-blue-700">
            {currentLocation.name}
          </p>
        </Card>
      )}
    </>
  );
};