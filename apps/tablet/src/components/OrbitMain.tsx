import { motion, AnimatePresence } from "framer-motion";
import { Box, Camera, MapPin, MessageCircle, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { FeatureButton } from "./ui/FeatureButton";
import { InteractionBar } from "./interaction/InteractionBar";
import RobotHead from "./robot/RobotHead";
import PhotoBooth from "./photobooth/PhotoBooth";

export function OrbitMain() {
	const [inputMode, setInputMode] = useState<"voice" | "text">("voice");
	const [activeView, setActiveView] = useState<"main" | "photobooth">("main");

	const features = [
		{
			title: "Find a Room",
			subtitle: "Get directions to any classroom or lab",
			icon: MapPin,
			delay: 0,
		},
		{
			title: "Instant Polaroid",
			subtitle: "Snap a selfie and get your instant Polaroid-style photo!",
			icon: Camera,
			delay: 100,
		},
		{
			title: "Ask Questions",
			subtitle: "Ask anything about the school or anything else",
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
		if (feature === "Instant Polaroid") {
			setActiveView("photobooth");
		}
	};

	const handleBackToMain = () => {
		setActiveView("main");
	};

	return (
		<div className="relative min-h-screen bg-[#F9FAFB]">
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
					<div className="relative flex h-[240px] w-[240px] items-center justify-center">
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
						className="mt-8 grid grid-cols-2 gap-4 px-2 md:mt-10 md:gap-6"
						initial={{ opacity: 0 }}
						transition={{ delay: 0.4, duration: 0.4 }}
					>
						{features.map((feature, index) => (
							<motion.div
								animate={{ opacity: 1, y: 0 }}
								initial={{ opacity: 0, y: 20 }}
								key={index}
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
				className="mb-8 mt-12 w-full max-w-2xl px-4 md:mt-16"
				initial={{ opacity: 0, y: 20 }}
				transition={{
					delay: 0.9,
					duration: 0.5,
					ease: [0.25, 0.1, 0.25, 1],
				}}
			>
				<InteractionBar mode={inputMode} onModeChange={setInputMode} />
			</motion.div>
					</motion.main>
				)}

				{activeView === "photobooth" && (
					<motion.div
						animate={{ opacity: 1 }}
						className="min-h-screen"
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
			</AnimatePresence>
		</div>
	);
}
