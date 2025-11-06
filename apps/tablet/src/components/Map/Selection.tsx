"use client";

import { ArrowLeft, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useSessionStore } from "@/lib/sessionStore";
import { LocationCard } from "./components/LocationCard";
import { MobileStepNavigation } from "./components/MobileStepNavigation";
import { QRDialog } from "./components/QRDialog";
import { SearchBar } from "./components/SearchBar";
import { ConfirmationOverlay } from "./components/ConfirmationOverlay";
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
	const [searchQuery, setSearchQuery] = useState("");
	const [showConfirmation, setShowConfirmation] = useState(false);
	const [confirmationMessage, setConfirmationMessage] = useState("");

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
			setConfirmationMessage("✓ Current Location Set");
			setShowConfirmation(true);
			// Auto-advance to destination step after confirmation
			setTimeout(() => {
				setShowConfirmation(false);
				setMobileStep("destination");
				setSearchQuery(""); // Clear search for next step
			}, 1800);
		} else if (mobileStep === "destination") {
			setDestinationLocation(location);
			setConfirmationMessage("Calculating Route...");
			setShowConfirmation(true);
			// Navigate to map after brief confirmation
			setTimeout(() => {
				setShowConfirmation(false);
				setMobileStep("map");
			}, 1800);
		}
	};

	const handleMobileBack = () => {
		if (mobileStep === "destination") {
			setMobileStep("current");
			setDestinationLocation(null);
			setSearchQuery("");
		} else if (mobileStep === "map") {
			setMobileStep("destination");
		}
	};

	const handleChangeCurrentLocation = () => {
		setMobileStep("current");
		setCurrentLocation(null);
		setDestinationLocation(null);
		setSearchQuery("");
	};

	// Filter locations based on search query
	const filteredLocations = CAMPUS_LOCATIONS.filter((location) => {
		if (!searchQuery) return true;
		const query = searchQuery.toLowerCase();
		return (
			location.name.toLowerCase().includes(query) ||
			location.address.toLowerCase().includes(query) ||
			location.category.toLowerCase().includes(query)
		);
	});

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

			<ConfirmationOverlay
				show={showConfirmation}
				message={confirmationMessage}
				onComplete={() => setShowConfirmation(false)}
			/>

			<div className="min-h-screen">
				<div className="p-4 pb-0">
					<MobileStepNavigation
						mobileStep={mobileStep}
						currentLocation={currentLocation}
						onBack={handleMobileBack}
						onChangeCurrentLocation={handleChangeCurrentLocation}
					/>
				</div>

				{/* Search Bar */}
				{mobileStep !== "map" && (
					<SearchBar
						value={searchQuery}
						onChange={setSearchQuery}
						placeholder={
							mobileStep === "current"
								? "Search current location..."
								: "Search destination..."
						}
					/>
				)}

				{/* Location Cards */}
				<div className="px-4 pb-4">
					<div className="grid gap-3">
						{filteredLocations.length > 0 ? (
							filteredLocations.map((location) => {
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
							})
						) : (
							<div className="py-12 text-center">
								<p className="font-sans text-slate-500">
									No locations found matching "{searchQuery}"
								</p>
								<button
									type="button"
									onClick={() => setSearchQuery("")}
									className="mt-2 font-sans text-sm text-blue-600 hover:underline"
								>
									Clear search
								</button>
							</div>
						)}
					</div>
				</div>

				{mobileStep === "map" && currentLocation && destinationLocation && (
					<div className="fixed inset-0 bg-white z-0">
						{/* Actual Campus Map with Back Button */}
						<CampusNavigationMap
							initialDestination={destinationLocation.id}
							mobileStartLocation={currentLocation.id}
							showBackButton={true}
							onBack={handleMobileBack}
						/>
					</div>
				)}
			</div>
		</div>
	);
}
