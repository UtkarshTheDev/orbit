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

	// Phase 2: Check URL query parameters for destination on mount
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const destinationParam = urlParams.get('destination');
		
		if (destinationParam) {
			// Find the location by ID
			const location = CAMPUS_LOCATIONS.find(loc => loc.id === destinationParam);
			if (location) {
				if (isTablet) {
					// Tablet: auto-select the destination
					setSelectedLocation(location);
					setNavigationDestination(location.id);
				} else {
					// Mobile: set as destination and skip to map view
					const gateLocation = CAMPUS_LOCATIONS.find(loc => loc.id === 'entry');
					if (gateLocation) {
						setCurrentLocation(gateLocation);
						setDestinationLocation(location);
						setMobileStep('map');
					}
				}
			}
		}
	}, [isTablet]);

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

	// Render tablet layout
	if (isTablet) {
		return (
			<div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-white flex flex-row">
				<QRDialog
					isOpen={isQRDialogOpen}
					onClose={() => setIsQRDialogOpen(false)}
					destinationId={selectedLocation?.id || null}
					destinationName={selectedLocation?.name}
				/>

				{/* Left Side - Campus Map */}
				<div className="flex-1 h-full bg-slate-100 relative">
					<CampusNavigationMap
						initialDestination={navigationDestination}
						showLocationDetails={selectedLocation}
					/>
				</div>

				{/* Right Sidebar - Location List */}
				<div className="w-[420px] h-full border-l-2 border-slate-300 bg-white shadow-2xl overflow-y-auto flex-shrink-0">
					<div className="p-8">
						{/* Header */}
						<div className="mb-8">
							{/* Title */}
							<div className="mb-6">
								<h1 className="font-orbitron text-3xl font-bold text-slate-900 tracking-tight">
									Campus Navigation
								</h1>
								<p className="font-sans text-base text-gray-500 mt-2 leading-relaxed">
									Select a location to navigate from Gate No. 1
								</p>
							</div>
							
							{/* View Map in Phone Button */}
							<Button
								onClick={() => setIsQRDialogOpen(true)}
								className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-sans font-semibold py-7 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-3 text-lg min-h-[64px]"
							>
								<ExternalLink className="h-6 w-6" />
								<span>View Map in Phone</span>
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
									<div key={category} className="mb-7">
																			<h3 className="mb-4 font-sans text-sm font-bold text-gray-600 uppercase tracking-wider">
																				{category}
																			</h3>										<div className="space-y-3">
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
