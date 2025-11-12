import { motion, AnimatePresence } from "motion/react";
import { Box, Camera, MapPin, MessageCircle, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useSessionStore } from "@/lib/sessionStore";
import { FeatureButton } from "./ui/FeatureButton";
import { InteractionBar } from "./interaction/InteractionBar";
import RobotHead from "./robot/RobotHead";
import PhotoBooth from "./photobooth/PhotoBooth";
import Models from "./models/Models";
import VoiceApp from "./voice/VoiceApp";
import Home from "./aichat/Home";
import { LocationPicker } from "./Map";
import { playSound } from "@/lib/basicAudioPlayer";

type OrbitMainProps = {
	skipWelcomeAudio?: boolean;
};

export function OrbitMain({ skipWelcomeAudio = false }: OrbitMainProps) {
	const [inputMode, setInputMode] = useState<"voice" | "text">("voice");
	const [
		activeView,
		setActiveView,
	] = useState<"main" | "photobooth" | "models" | "voice" | "home" | "map">(
		"main",
	);
	const navigate = useNavigate();
	const isTablet = useSessionStore((s) => s.isTablet);

	const features = [
		{
			title: "Find a Room",
			subtitle: "Get directions to any classroom or lab",
			icon: MapPin,
			delay: 0,
		},
		{
			title: "Instant Polaroid",
			subtitle: "Snap a selfie, get a Polaroid!",
			icon: Camera,
			delay: 100,
		},
		{
			title: "Ask Questions",
			subtitle: "Ask anything about school",
			icon: MessageCircle,
			delay: 200,
		},
		{
			title: "View 3D Models",
			subtitle: "Explore science models in 3D",
			icon: Box,
			delay: 300,
		},
	];

	const handleFeatureClick = (feature: string) => {
		if (feature === "Find a Room") {
			// For tablets: show map directly, for phones: navigate to /map route
			if (isTablet) {
				setActiveView("map");
			} else {
				navigate({ to: "/map" });
			}
		}
		if (feature === "Instant Polaroid") {
			setActiveView("photobooth");
		}
		if (feature === "View 3D Models") {
			setActiveView("models");
		}
		if (feature === "Ask Questions") {
			setActiveView("home");
		}
	};

	const handleTalkWithOrbit = () => {
		setActiveView("voice");
	};

	const handleBackToMain = () => {
		setActiveView("main");
	};

	const handleNavigateToHome = () => {
		setActiveView("home");
	};

	useEffect(() => {
		if (!skipWelcomeAudio) {
			playSound("/audio/help-you.mp3");
		}
	}, [skipWelcomeAudio]);

	return (
		<div className="relative h-screen bg-[#F9FAFB]">
			<AnimatePresence mode="wait">
				{activeView === "main" && (
					<motion.main
						animate={{ opacity: 1 }}
						className="flex min-h-screen flex-col items-center justify-between pb-4 md:pb-8 lg:pb-10"
						exit={{ opacity: 0 }}
						initial={{ opacity: 0 }}
						key="main"
						transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
					>
						<div className="flex w-full flex-1 items-start justify-center pt-8 md:pt-12">
							<div className="flex w-full max-w-5xl flex-col items-center text-center">
								<div className="relative flex h-[200px] w-[200px] items-center justify-center">
									<RobotHead />
								</div>
								<motion.h1
									animate={{ opacity: 1, y: 0 }}
									className="text-balance px-4 font-bold font-orbitron text-3xl text-gray-900 leading-tight tracking-tight md:text-4xl lg:text-5xl"
									initial={{ opacity: 0, y: -20 }}
									transition={{
										delay: 0.2,
										duration: 0.6,
										ease: [0.25, 0.1, 0.25, 1],
									}}
								>
									How can <span className="font-pacifico text-blue-500">I</span> help
									<span className="font-pacifico text-blue-500"> you</span> today?
								</motion.h1>

								<motion.div
									animate={{ opacity: 1 }}
									className="mt-10 grid grid-cols-2 gap-4 px-2 md:mt-12 md:gap-6"
									initial={{ opacity: 0 }}
									transition={{ delay: 0.4, duration: 0.4 }}
								>
									{features.map((feature, index) => (
										<motion.div
											animate={{ opacity: 1, y: 0 }}
											initial={{ opacity: 0, y: 20 }}
											key={feature.title}
											transition={{
												delay: 0.5 + index * 0.1,
												duration: 0.5,
												ease: [0.25, 0.1, 0.25, 1],
											}}
										>
											<FeatureButton
												animationClass=""
												delay={feature.delay}
												icon={feature.icon}
												onClick={() => handleFeatureClick(feature.title)}
												subtitle={feature.subtitle}
												title={feature.title}
											/>
										</motion.div>
									))}
								</motion.div>
							</div>
						</div>

						<motion.div
							animate={{ opacity: 1, y: 0 }}
							className="mb-8 mt-4 w-full max-w-2xl px-4 md:mt-6"
							initial={{ opacity: 0, y: 20 }}
							transition={{
								delay: 0.9,
								duration: 0.5,
								ease: [0.25, 0.1, 0.25, 1],
							}}
						>
							<InteractionBar
								mode={inputMode}
								onModeChange={setInputMode}
								onTalkWithOrbit={handleTalkWithOrbit}
								onNavigateToHome={handleNavigateToHome}
							/>
						</motion.div>
					</motion.main>
				)}

				{activeView === "photobooth" && (
					<motion.div
						animate={{ opacity: 1 }}
						className="h-screen"
						exit={{ opacity: 0 }}
						initial={{ opacity: 0 }}
						key="photobooth"
						transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
					>
						<button
							className="absolute top-6 left-6 z-20 flex items-center gap-2 rounded-xl bg-white/90 px-4 py-2.5 font-sans text-gray-700 text-sm shadow-lg backdrop-blur-sm transition-all duration-200 hover:bg-white hover:shadow-xl active:scale-95"
							onClick={handleBackToMain}
							type="button"
						>
							<ArrowLeft className="h-4 w-4" />
							<span className="font-medium">Back</span>
						</button>
						<PhotoBooth />
					</motion.div>
				)}
				{activeView === "models" && (
					<motion.div
						animate={{ opacity: 1 }}
						className="h-screen"
						exit={{ opacity: 0 }}
						initial={{ opacity: 0 }}
						key="models"
						transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
					>
						<button
							className="absolute top-6 left-6 z-20 flex items-center gap-2 rounded-xl bg-white/90 px-4 py-2.5 font-sans text-gray-700 text-sm shadow-lg backdrop-blur-sm transition-all duration-200 hover:bg-white hover:shadow-xl active:scale-95"
							onClick={handleBackToMain}
							type="button"
						>
							<ArrowLeft className="h-4 w-4" />
							<span className="font-medium">Back</span>
						</button>
						<Models />
					</motion.div>
				)}
				{activeView === "voice" && (
					<motion.div
						animate={{ opacity: 1 }}
						className="h-screen"
						exit={{ opacity: 0 }}
						initial={{ opacity: 0 }}
						key="voice"
						transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
					>
						<button
							className="absolute top-6 left-6 z-20 flex items-center gap-2 rounded-xl bg-white/90 px-4 py-2.5 font-sans text-gray-700 text-sm shadow-lg backdrop-blur-sm transition-all duration-200 hover:bg-white hover:shadow-xl active:scale-95"
							onClick={handleBackToMain}
							type="button"
						>
							<ArrowLeft className="h-4 w-4" />
							<span className="font-medium">Back</span>
						</button>
						<VoiceApp />
					</motion.div>
				)}
				{activeView === "home" && (
					<motion.div
						animate={{ opacity: 1 }}
						className="h-screen"
						exit={{ opacity: 0 }}
						initial={{ opacity: 0 }}
						key="home"
						transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
					>
						<Home onBack={handleBackToMain} onNavigateToVoice={handleTalkWithOrbit} />
					</motion.div>
				)}
				{activeView === "map" && (
					<motion.div
						animate={{ opacity: 1 }}
						className="h-screen"
						exit={{ opacity: 0 }}
						initial={{ opacity: 0 }}
						key="map"
						transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
					>
						<button
							className="absolute top-6 left-6 z-20 flex items-center gap-2 rounded-xl bg-white/90 px-4 py-2.5 font-sans text-gray-700 text-sm shadow-lg backdrop-blur-sm transition-all duration-200 hover:bg-white hover:shadow-xl active:scale-95"
							onClick={handleBackToMain}
							type="button"
						>
							<ArrowLeft className="h-4 w-4" />
							<span className="font-medium">Back</span>
						</button>
						<LocationPicker />
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
