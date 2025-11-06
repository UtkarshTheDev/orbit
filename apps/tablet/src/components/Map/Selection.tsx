"use client";

import { ArrowLeft, ExternalLink, MapPin, Navigation } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSessionStore } from "@/lib/sessionStore";
import { LocationCard } from "./components/LocationCard";
import { MobileStepNavigation } from "./components/MobileStepNavigation";
import { QRDialog } from "./components/QRDialog";
import { CAMPUS_LOCATIONS } from "./data/locations";
import CampusNavigationMap from "./Map";
import type { Location, MobileStep } from "./types";

export function LocationPicker() {
	// Simplified tablet detection - check multiple sources
	const sessionIsTablet = useSessionStore((s) => s.isTablet);
	const urlIsTablet =
		new URLSearchParams(window.location.search).get("tablet") === "1";
	const isTablet = sessionIsTablet || urlIsTablet;

	const [selectedLocation, setSelectedLocation] = useState<Location | null>(
		null,
	);
	const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
	const [destinationLocation, setDestinationLocation] =
		useState<Location | null>(null);
	const [mobileStep, setMobileStep] = useState<MobileStep>("current");
	const [isQRDialogOpen, setIsQRDialogOpen] = useState(false);

	// For tablet: selected location becomes the navigation destination
	const [navigationDestination, setNavigationDestination] = useState<
		string | null
	>(null);

	// Debug tablet detection
	console.log("LocationPicker - sessionIsTablet:", sessionIsTablet);
	console.log("LocationPicker - urlIsTablet:", urlIsTablet);
	console.log("LocationPicker - final isTablet:", isTablet);
	console.log("LocationPicker - URL params:", window.location.search);

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
		// Set navigation destination for the map (Gate No. 1 -> selected location)
		setNavigationDestination(location.id);
	};

	// Debug: Force show tablet layout
	console.log("LocationPicker - About to render, isTablet:", isTablet);
	
	// TEMPORARY: Force tablet layout for testing - REMOVE AFTER TESTING
	const forceTablet = true;

	// Render tablet layout with left sidebar + right map
	if (isTablet || forceTablet) {
		console.log("LocationPicker - Rendering TABLET layout");
		return (
			<div className="h-screen bg-gradient-to-br from-white via-blue-50/30 to-white">
				{/* Debug Info - Remove after testing */}
				<div className="absolute top-2 right-2 z-50 bg-green-500 text-white px-2 py-1 rounded text-xs">
					TABLET LAYOUT ACTIVE
				</div>
				
				<QRDialog
					isOpen={isQRDialogOpen}
					onClose={() => setIsQRDialogOpen(false)}
				/>

				<div className="flex h-full">
					{/* Left Sidebar - Location List */}
					<div className="w-80 border-r-4 border-blue-300 bg-white shadow-xl overflow-y-auto flex-shrink-0 z-10">
						<div className="p-4">
							<div className="mb-6 text-center">
								<h1 className="font-orbitron text-xl font-bold text-slate-800">
									Campus Navigation
								</h1>
								<p className="mt-1 text-sm text-slate-600">
									Select a location to navigate from Gate No. 1
								</p>
								{/* View Map in Phone Button */}
								<Button
									onClick={() => setIsQRDialogOpen(true)}
									className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
								>
									<ExternalLink className="h-4 w-4" />
									View Map in Phone
								</Button>
							</div>

							{/* Group locations by category */}
							{["Events", "Facilities", "Access Points", "Navigation"].map(
								(category) => {
									const categoryLocations = CAMPUS_LOCATIONS.filter(
										(loc) => loc.category === category,
									);
									if (categoryLocations.length === 0) return null;

									return (
										<div key={category} className="mb-4">
											<h3 className="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
												{category}
											</h3>
											<div className="space-y-2">
												{categoryLocations.map((location) => (
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
									);
								},
							)}
						</div>
					</div>

					{/* Right Side - Campus Map */}
					<div className="flex-1 relative">
						<CampusNavigationMap
							initialDestination={navigationDestination}
							showLocationDetails={selectedLocation}
						/>

						{/* Location Info Overlay - only show when location is selected */}
						{selectedLocation && (
							<div className="absolute top-4 left-4 right-4 z-10">
								<Card className="bg-white/95 backdrop-blur-sm border-blue-200/50 p-4 shadow-lg">
									<div className="flex items-center justify-between">
										<div>
											<h3 className="font-orbitron text-lg font-semibold text-slate-800">
												Navigation: Gate No. 1 → {selectedLocation.name}
											</h3>
											<p className="text-sm text-slate-600">
												{selectedLocation.address}
											</p>
										</div>
										<div className="flex items-center gap-2">
											<div className="rounded-lg bg-blue-100 px-2 py-1">
												<span className="text-xs font-medium text-blue-700">
													{selectedLocation.category}
												</span>
											</div>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => setIsQRDialogOpen(true)}
												className="text-blue-600 hover:bg-blue-50"
											>
												<ExternalLink className="h-4 w-4" />
											</Button>
										</div>
									</div>
								</Card>
							</div>
						)}

						{/* Remove the default placeholder - let the map show through */}
					</div>
				</div>
			</div>
		);
	}

	// Mobile layout
	console.log("LocationPicker - Rendering MOBILE layout");

	// Mobile layout (existing flow)
	return (
		<div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-white">
			<QRDialog
				isOpen={isQRDialogOpen}
				onClose={() => setIsQRDialogOpen(false)}
			/>

			<div className="min-h-screen p-4">
				<MobileStepNavigation
					mobileStep={mobileStep}
					currentLocation={currentLocation}
					onBack={handleMobileBack}
				/>

				<div className="grid gap-3">
					{CAMPUS_LOCATIONS.map((location) => {
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

				{mobileStep === "map" && currentLocation && destinationLocation && (
					<div className="fixed inset-0 bg-white">
						<Button
							variant="ghost"
							size="sm"
							onClick={handleMobileBack}
							className="absolute left-4 top-4 z-10 bg-white/90 text-blue-600 shadow-lg backdrop-blur-sm hover:bg-white"
						>
							<ArrowLeft className="mr-1 h-4 w-4" />
							Back
						</Button>

						{/* Mobile Navigation Info Bar */}
						<div className="absolute top-4 left-16 right-4 z-10">
							<Card className="bg-white/95 backdrop-blur-sm border-blue-200/50 p-3 shadow-lg">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<div className="flex items-center gap-1">
											<div className="w-2 h-2 bg-green-500 rounded-full"></div>
											<span className="text-xs text-slate-600">
												{currentLocation.name}
											</span>
										</div>
										<span className="text-slate-400">→</span>
										<div className="flex items-center gap-1">
											<div className="w-2 h-2 bg-red-500 rounded-full"></div>
											<span className="text-xs text-slate-600">
												{destinationLocation.name}
											</span>
										</div>
									</div>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setIsQRDialogOpen(true)}
										className="text-blue-600 hover:bg-blue-50 p-1 h-auto"
									>
										<ExternalLink className="h-3 w-3" />
									</Button>
								</div>
							</Card>
						</div>

						{/* Actual Campus Map */}
						<CampusNavigationMap
							initialDestination={destinationLocation.id}
							mobileStartLocation={currentLocation.id}
							showLocationDetails={destinationLocation}
						/>
					</div>
				)}
			</div>
		</div>
	);
}
