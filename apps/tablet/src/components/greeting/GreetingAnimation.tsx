"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import AudioSync from "./AudioSync";
import Background from "../ui/Background";
import RobotHead from "../robot/RobotHead";
import { SystemStatus } from "../ui/SystemStatus";

type GreetingAnimationProps = {
	onComplete: () => void;
};

export default function GreetingAnimation({
	onComplete,
}: GreetingAnimationProps) {
	const [stage, setStage] = useState<"detecting" | "greeting" | "complete">(
		"detecting",
	);
	const [currentText, setCurrentText] = useState("");
	const [lineIndex, setLineIndex] = useState(0);
	const [charIndex, setCharIndex] = useState(0);

	const getTimeBasedGreeting = () => {
		const hour = new Date().getHours();
		if (hour < 12) {
			return "Good Morning";
		}
		if (hour < 17) {
			return "Good Afternoon";
		}
		return "Good Evening";
	};

	const greetingLines = ["LPS Eldeco", getTimeBasedGreeting()];

	const completeAnimation = () => {
		if (stage === "complete") {
			onComplete();
		}
	};

	useEffect(() => {
		const timer = setTimeout(() => {
			setStage("greeting");
		}, 1500);
		return () => clearTimeout(timer);
	}, []);

	useEffect(() => {
		if (stage !== "greeting") {
			return;
		}

		if (lineIndex < greetingLines.length) {
			if (charIndex < greetingLines[lineIndex].length) {
				const timer = setTimeout(() => {
					setCurrentText((prev) => prev + greetingLines[lineIndex][charIndex]);
					setCharIndex(charIndex + 1);
				}, 80);
				return () => clearTimeout(timer);
			}
			const timer = setTimeout(() => {
				setCurrentText("");
				setCharIndex(0);
				setLineIndex(lineIndex + 1);
			}, 800);
			return () => clearTimeout(timer);
		}

		const completeTimer = setTimeout(() => {
			setStage("complete");
		}, 100);
		return () => clearTimeout(completeTimer);
	}, [stage, lineIndex, charIndex, greetingLines.length]);

	useEffect(() => {
		if (stage === "complete") {
			const audio = new Audio("/audio/iam.mp3");
			audio.play().catch((error) => {
				console.error("Failed to play audio:", error);
			});

			return () => {
				audio.pause();
				audio.currentTime = 0;
			};
		}
	}, [stage]);

	return (
		<motion.div
			className="fixed inset-0 z-50 flex items-center justify-center"
			exit={{ opacity: 0, scale: 0.95 }}
			initial={{ opacity: 1 }}
			onClick={completeAnimation}
			transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
		>
			<Background />

			<AudioSync
				charIndex={charIndex}
				isPlaying={stage !== "detecting"}
				lineIndex={lineIndex}
				stage={stage}
			/>

			<div className="relative z-10 flex min-h-screen items-center justify-center px-4">
				<AnimatePresence mode="wait">
					{stage === "detecting" && (
						<motion.div
							animate={{ opacity: 1, scale: 1 }}
							className="flex flex-col items-center gap-6"
							exit={{ opacity: 0, scale: 0.9 }}
							initial={{ opacity: 0, scale: 0.9 }}
							key="detecting"
						>
							<div className="scale-[0.8]">
								<RobotHead />
							</div>

							<SystemStatus />
						</motion.div>
					)}

					{(stage === "greeting" || stage === "complete") && (
						<motion.div
							animate={{ opacity: 1, y: 0 }}
							className="flex max-w-5xl flex-col items-center text-center"
							initial={{ opacity: 0, y: 20 }}
							key="greeting"
						>
							<motion.div
								animate={{ scale: 1 }}
								className="relative"
								initial={{ scale: 0 }}
								transition={{
									type: "spring",
									stiffness: 200,
									damping: 15,
									delay: 0.2,
								}}
							>
								<motion.div
									animate={{ rotate: 360 }}
									className="-m-8 absolute inset-0"
									transition={{
										duration: 20,
										repeat: Number.POSITIVE_INFINITY,
										ease: "linear",
									}}
								>
									<div className="absolute inset-0 rounded-full border border-blue-300/30" />
								</motion.div>
								<motion.div
									animate={{ rotate: -360 }}
									className="-m-12 absolute inset-0"
									transition={{
										duration: 15,
										repeat: Number.POSITIVE_INFINITY,
										ease: "linear",
									}}
								>
									<div className="absolute inset-0 rounded-full border border-cyan-200/20" />
								</motion.div>

								<motion.div
									animate={{
										scale: [1, 1.15, 1],
										opacity: [0.3, 0.5, 0.3],
									}}
									className="-inset-8 absolute rounded-full bg-gradient-to-r from-blue-400/20 via-cyan-400/20 to-blue-400/20 blur-3xl"
									transition={{
										duration: 3,
										repeat: Number.POSITIVE_INFINITY,
										ease: "easeInOut",
									}}
								/>

								<RobotHead />
							</motion.div>

							<div className="mt-8 min-h-[240px] space-y-12">
								{stage === "greeting" && lineIndex === 0 && (
									<p className="font-pacifico text-5xl text-gray-900 leading-none md:text-7xl lg:text-8xl">
										Welcome to
									</p>
								)}

								{stage === "greeting" && lineIndex < greetingLines.length && (
									<motion.div
										animate={{ opacity: 1, y: 0 }}
										className={`${
											lineIndex === 0
												? "font-bold font-sans text-6xl text-blue-500 tracking-tight md:text-8xl lg:text-9xl"
												: "font-sans font-semibold text-5xl text-blue-500 tracking-tight md:text-7xl lg:text-8xl"
										} mt-6`}
										initial={{ opacity: 0, y: 10 }}
										key={lineIndex}
									>
										{currentText}
										<motion.span
											animate={{ opacity: [1, 0.35] }}
											className={`ml-1 inline-block h-[0.85em] w-[3px] align-middle ${
												lineIndex === 1 ? "bg-blue-600" : "bg-gray-900"
											}`}
											transition={{
												duration: 0.8,
												repeat: Number.POSITIVE_INFINITY,
											}}
										/>
									</motion.div>
								)}

								{stage === "complete" && (
									<motion.div
										animate={{ opacity: 1 }}
										className="mt-8 space-y-8"
										initial={{ opacity: 0 }}
									>
										<motion.h2
											animate={{ opacity: 1, y: 0 }}
											className="font-black font-sans text-6xl text-gray-900 md:text-8xl lg:text-9xl"
											initial={{ opacity: 0, y: 20 }}
											transition={{ delay: 0.3 }}
										>
											I am{" "}
											<span className="font-orbitron text-blue-500">Orbit</span>
										</motion.h2>

										<SystemStatus />
									</motion.div>
								)}
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</motion.div>
	);
}
