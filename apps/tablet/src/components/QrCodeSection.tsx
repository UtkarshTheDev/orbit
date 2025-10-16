"use client";

import { useState } from "react";

export function QRCodeSection() {
	const [isHovered, setIsHovered] = useState(false);

	return (
		<div className="flex flex-col items-center gap-6 animate-in fade-in slide-in-from-left duration-700 delay-300">
			{/* QR Code Container */}
			<div
				className="relative group"
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
			>
				{/* Outer frame */}
				<div
					className={`relative p-6 bg-card rounded-2xl border-2 border-primary/30 transition-all duration-500 ${isHovered ? "scale-105 glow-effect" : "shadow-lg"}`}
				>
					{/* Corner decorations */}
					<div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-accent" />
					<div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-accent" />
					<div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-accent" />
					<div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-accent" />

					{/* QR Code */}
					<div className="bg-white p-4 rounded-xl">
						<img
							src="/qr/capture-qr.svg"
							alt="Scan QR Code"
							className="w-64 h-64 md:w-72 md:h-72"
						/>
					</div>

					{/* Scan indicator */}
					<div className="absolute inset-0 pointer-events-none">
						<div
							className={`absolute top-1/2 left-0 right-0 h-0.5 bg-accent/50 transition-all duration-1000 ${isHovered ? "animate-pulse" : ""}`}
						/>
					</div>
				</div>

				{/* Floating label */}
				<div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-xs font-[family-name:var(--font-heading)] rounded-full shadow-lg uppercase tracking-wider">
					Scan Me
				</div>
			</div>

			{/* Digital Polaroid Preview */}
			<div className="relative animate-float">
				<div className="bg-white p-2 rounded-lg shadow-xl border border-border rotate-[-2deg] hover:rotate-0 transition-transform duration-300">
					<div className="bg-muted rounded-md overflow-hidden">
						<img
							src="/happy-person-with-robot-ai-photo-booth-polaroid-st.jpg"
							alt="Photo Preview"
							className="w-36 h-36 object-cover"
						/>
					</div>
					<div className="mt-1 text-center">
						<p className="text-xs font-[family-name:var(--font-brand)] text-foreground">
							Your Orbit Moment
						</p>
					</div>
				</div>

				{/* Polaroid shadow */}
				<div className="absolute inset-0 bg-primary/5 blur-xl -z-10 scale-95" />
			</div>
		</div>
	);
}
