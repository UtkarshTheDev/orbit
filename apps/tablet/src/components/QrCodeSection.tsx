"use client";

import { useState } from "react";

export function QRCodeSection() {
	const [isHovered, setIsHovered] = useState(false);

	return (
		<div
			className="flex flex-col items-center gap-6 animate-slide-in-left"
			style={{ animationDelay: "0.2s" }}
		>
			{/* QR Code Container */}
			<div
				className="relative group"
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
			>
				{/* Outer frame */}
				<div
					className={`relative p-4 bg-white rounded-2xl border-2 border-blue-400/40 transition-all duration-500 ${isHovered ? "scale-105 glow-effect" : "shadow-lg"}`}
				>
					{/* Corner decorations */}
					<div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-blue-400" />
					<div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-blue-400" />
					<div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-blue-400" />
					<div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-blue-400" />

					{/* QR Code */}
					<div className="bg-white p-2 rounded-xl">
						<img
							src="/qr/capture-qr.svg"
							alt="Scan QR Code"
							className="w-64 h-64 md:w-78 md:h-78"
						/>
					</div>

					{/* Scan indicator - hidden */}
				</div>

				{/* Floating label */}
				<div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-600 text-white text-xs font-[family-name:var(--font-orbitron)] rounded-full shadow-lg uppercase tracking-wider">
					Scan Me
				</div>
			</div>

			{/* Digital Polaroid Preview */}
			<div className="relative animate-float">
				<div className="bg-white p-2 rounded-lg shadow-xl border border-gray-200 rotate-[-2deg] hover:rotate-0 transition-transform duration-300">
					<div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-md overflow-hidden flex items-center justify-center w-36 h-36">
						<img src="/polaroid-sample.png" alt="Sample Poloroid image" />
					</div>
					<div className="mt-1 text-center">
						<p className="text-xs font-[family-name:var(--font-pacifico)] text-gray-900">
							Your Orbit Moment
						</p>
					</div>
				</div>

				{/* Polaroid shadow */}
				<div className="absolute inset-0 bg-blue-500/10 blur-xl -z-10 scale-95" />
			</div>
		</div>
	);
}
