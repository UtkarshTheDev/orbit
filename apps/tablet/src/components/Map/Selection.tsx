"use client";

import { useState } from "react";
import { Navigation, ArrowLeft, ExternalLink, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Location, MobileStep } from './types';
import { DUMMY_LOCATIONS } from './data/locations';
import { LocationCard } from './components/LocationCard';
import { MobileStepNavigation } from './components/MobileStepNavigation';
import { QRDialog } from './components/QRDialog';

export function LocationPicker() {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [destinationLocation, setDestinationLocation] =
    useState<Location | null>(null);
  const [mobileStep, setMobileStep] = useState<MobileStep>("current");
  const [isQRDialogOpen, setIsQRDialogOpen] = useState(false);

  const handleMobileLocationSelect = (location: Location) => {
    if (mobileStep === "current") {
      setCurrentLocation(location);
      setMobileStep("destination");
    } else if (mobileStep === "destination") {
      setDestinationLocation(location);
      setMobileStep("map");
    }
  };

  const handleMobileBack = () => {
    if (mobileStep === "destination") {
      setMobileStep("current");
      setDestinationLocation(null);
    } else if (mobileStep === "map") {
      setMobileStep("destination");
    }
  };

  const handleTabletLocationSelect = (location: Location) => {
    setSelectedLocation(location);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-white">
      <QRDialog 
        isOpen={isQRDialogOpen} 
        onClose={() => setIsQRDialogOpen(false)} 
      />

      <div className="lg:hidden">
        <div className="min-h-screen p-4">
          <MobileStepNavigation
            mobileStep={mobileStep}
            currentLocation={currentLocation}
            onBack={handleMobileBack}
          />

          <div className="grid gap-3">
            {DUMMY_LOCATIONS.map((location) => {
              const isCurrentlySelected =
                (mobileStep === "current" &&
                  currentLocation?.id === location.id) ||
                (mobileStep === "destination" &&
                  destinationLocation?.id === location.id);
              const isDisabled =
                mobileStep === "destination" &&
                currentLocation?.id === location.id;

              return (
                <LocationCard
                  key={location.id}
                  location={location}
                  isSelected={isCurrentlySelected}
                  isDisabled={isDisabled}
                  onClick={handleMobileLocationSelect}
                  variant="mobile"
                />
              );
            })}
          </div>
        </div>

        {mobileStep === "map" && currentLocation && destinationLocation && (
          <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-white">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMobileBack}
              className="absolute left-4 top-4 z-10 bg-white/80 text-blue-600 shadow-lg backdrop-blur-sm hover:bg-white"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Button>

            <div className="relative flex h-full flex-col">
              <div className="flex flex-1 flex-col items-center justify-center p-8">
                <div className="mb-8 rounded-full bg-blue-500/10 p-8 shadow-2xl shadow-blue-500/20 ring-2 ring-blue-400/30">
                  <Navigation className="h-20 w-20 text-blue-600" />
                </div>

                <div className="text-center">
                  <div className="mb-6">
                    <p className="mb-2 text-xs uppercase tracking-wider text-slate-500">
                      From
                    </p>
                    <h2 className="font-orbitron text-xl font-bold text-slate-800">
                      {currentLocation.name}
                    </h2>
                    <p className="text-sm text-slate-600">
                      {currentLocation.address}
                    </p>
                  </div>

                  <div className="my-6 flex items-center justify-center">
                    <div className="h-12 w-0.5 bg-gradient-to-b from-blue-400 to-blue-600" />
                  </div>

                  <div>
                    <p className="mb-2 text-xs uppercase tracking-wider text-slate-500">
                      To
                    </p>
                    <h2 className="font-orbitron text-xl font-bold text-blue-700">
                      {destinationLocation.name}
                    </h2>
                    <p className="text-sm text-slate-600">
                      {destinationLocation.address}
                    </p>
                  </div>

                  <div className="mt-8 text-xs text-slate-400">
                    <p>Route visualization</p>
                    <p className="font-mono mt-1">
                      {currentLocation.coordinates.lat.toFixed(4)},{" "}
                      {currentLocation.coordinates.lng.toFixed(4)} →{" "}
                      {destinationLocation.coordinates.lat.toFixed(4)},{" "}
                      {destinationLocation.coordinates.lng.toFixed(4)}
                    </p>
                  </div>
                </div>

                <div className="w-full border-t border-blue-200/50 bg-white/95 p-3 backdrop-blur-md">
                  <button
                    onClick={() => setIsQRDialogOpen(true)}
                    className="group relative w-full overflow-hidden rounded-lg border border-blue-400 bg-gradient-to-r from-white to-blue-50/50 px-4 py-2 shadow-md shadow-blue-200/30 transition-all duration-300 hover:scale-[1.01] hover:border-blue-500 hover:shadow-lg hover:shadow-blue-300/40 active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <ExternalLink className="h-4 w-4 text-blue-600" />
                      <p className="font-orbitron text-sm font-semibold text-blue-700">
                        Open Map in Phone
                      </p>
                    </div>
                    <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-400/0 via-blue-400/10 to-blue-400/0 opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="hidden lg:block">
        <div className="flex h-screen">
          <div className="w-80 overflow-y-auto border-r border-blue-100 bg-white/50 p-4 backdrop-blur-sm">
            <div className="mb-4">
              <p className="font-orbitron text-base uppercase tracking-wider text-slate-700">
                Select Location
              </p>
            </div>

            <div className="space-y-2">
              {DUMMY_LOCATIONS.map((location) => (
                <LocationCard
                  key={location.id}
                  location={location}
                  isSelected={selectedLocation?.id === location.id}
                  onClick={handleTabletLocationSelect}
                  variant="tablet"
                />
              ))}
            </div>
          </div>

          <div className="flex-1 bg-gradient-to-br from-white via-blue-50/20 to-white">
            {selectedLocation ? (
              <div className="relative flex h-full flex-col">
                <div className="flex flex-1 flex-col items-center justify-center p-12">
                  <div className="mb-8 rounded-full bg-blue-500/10 p-10 shadow-2xl shadow-blue-500/20 ring-2 ring-blue-400/30">
                    <Navigation className="h-24 w-24 text-blue-600" />
                  </div>
                  <h2 className="font-orbitron mb-3 text-center text-4xl font-bold text-slate-800">
                    {selectedLocation.name}
                  </h2>
                  <p className="mb-2 text-center text-lg text-slate-600">
                    {selectedLocation.address}
                  </p>
                  <span className="mt-4 rounded-full bg-blue-500/10 px-5 py-2 text-sm font-medium text-blue-700 ring-1 ring-blue-400/30">
                    {selectedLocation.category}
                  </span>
                  <div className="mt-8 text-center text-sm text-slate-500">
                    <p className="mb-1">Coordinates</p>
                    <p className="font-mono text-lg">
                      {selectedLocation.coordinates.lat.toFixed(4)},{" "}
                      {selectedLocation.coordinates.lng.toFixed(4)}
                    </p>
                  </div>
                </div>

                <div className="w-full border-t border-blue-200/50 bg-white/95 p-4 backdrop-blur-md">
                  <button
                    onClick={() => setIsQRDialogOpen(true)}
                    className="group relative w-full overflow-hidden rounded-lg border border-blue-400 bg-gradient-to-r from-white to-blue-50/50 px-6 py-2.5 shadow-md shadow-blue-200/30 transition-all duration-300 hover:scale-[1.01] hover:border-blue-500 hover:shadow-lg hover:shadow-blue-300/40 active:scale-[0.99]"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <ExternalLink className="h-4 w-4 text-blue-600" />
                      <p className="font-orbitron text-sm font-semibold text-blue-700">
                        Open Map in Phone
                      </p>
                    </div>
                    <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-400/0 via-blue-400/10 to-blue-400/0 opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <MapPin className="mx-auto mb-6 h-32 w-32 text-slate-200" />
                  <p className="font-orbitron text-xl text-slate-400">
                    Select a location to view on map
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
