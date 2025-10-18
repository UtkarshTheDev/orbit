"use client";

import { Camera, Download, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";

interface PhotoViewerProps {
	capturedImage: string;
	onRetake: () => void;
}

export default function PhotoViewer({
	capturedImage,
	onRetake,
}: PhotoViewerProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [polaroidImage, setPolaroidImage] = useState<string | null>(null);
	const [rotation] = useState(() => (Math.random() > 0.5 ? -2 : 3));
	const [isLoaded, setIsLoaded] = useState(false);

	useEffect(() => {
		generatePolaroidImage();
	}, [capturedImage]);

	const generatePolaroidImage = () => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvasRef.current.getContext("2d");
		if (!ctx) return;

		const img = new Image();
		img.crossOrigin = "anonymous";
		img.onload = () => {
			const polaroidWidth = 700;
			const polaroidHeight = 840;
			const topBorder = 40;
			const sideBorder = 40;
			const bottomBorder = 200;
			const imageSize = polaroidWidth - sideBorder * 2;
			const borderRadius = 8;

			canvas.width = polaroidWidth;
			canvas.height = polaroidHeight;

			ctx.fillStyle = "#FEFEF8";
			ctx.fillRect(0, 0, polaroidWidth, polaroidHeight);

			for (let i = 0; i < 3000; i++) {
				const x = Math.random() * polaroidWidth;
				const y = Math.random() * polaroidHeight;
				const opacity = Math.random() * 0.05;
				ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
				ctx.fillRect(x, y, 1, 1);
			}

			for (let i = 0; i < 15; i++) {
				const x = Math.random() * polaroidWidth;
				const y = Math.random() * polaroidHeight;
				const size = Math.random() * 20 + 10;
				const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
				gradient.addColorStop(0, "rgba(210, 180, 140, 0.03)");
				gradient.addColorStop(1, "rgba(210, 180, 140, 0)");
				ctx.fillStyle = gradient;
				ctx.fillRect(x - size, y - size, size * 2, size * 2);
			}

			ctx.save();
			ctx.beginPath();
			const frameRadius = 6;
			ctx.moveTo(frameRadius, 0);
			ctx.lineTo(polaroidWidth - frameRadius, 0);
			ctx.quadraticCurveTo(polaroidWidth, 0, polaroidWidth, frameRadius);
			ctx.lineTo(polaroidWidth, polaroidHeight - frameRadius);
			ctx.quadraticCurveTo(
				polaroidWidth,
				polaroidHeight,
				polaroidWidth - frameRadius,
				polaroidHeight,
			);
			ctx.lineTo(frameRadius, polaroidHeight);
			ctx.quadraticCurveTo(0, polaroidHeight, 0, polaroidHeight - frameRadius);
			ctx.lineTo(0, frameRadius);
			ctx.quadraticCurveTo(0, 0, frameRadius, 0);
			ctx.closePath();
			ctx.clip();

			ctx.save();
			ctx.beginPath();
			ctx.moveTo(sideBorder + borderRadius, topBorder);
			ctx.lineTo(sideBorder + imageSize - borderRadius, topBorder);
			ctx.quadraticCurveTo(
				sideBorder + imageSize,
				topBorder,
				sideBorder + imageSize,
				topBorder + borderRadius,
			);
			ctx.lineTo(sideBorder + imageSize, topBorder + imageSize - borderRadius);
			ctx.quadraticCurveTo(
				sideBorder + imageSize,
				topBorder + imageSize,
				sideBorder + imageSize - borderRadius,
				topBorder + imageSize,
			);
			ctx.lineTo(sideBorder + borderRadius, topBorder + imageSize);
			ctx.quadraticCurveTo(
				sideBorder,
				topBorder + imageSize,
				sideBorder,
				topBorder + imageSize - borderRadius,
			);
			ctx.lineTo(sideBorder, topBorder + borderRadius);
			ctx.quadraticCurveTo(
				sideBorder,
				topBorder,
				sideBorder + borderRadius,
				topBorder,
			);
			ctx.closePath();
			ctx.clip();

			const minDimension = Math.min(img.width, img.height);
			const cropX = (img.width - minDimension) / 2;
			const cropY = (img.height - minDimension) / 2;

			ctx.drawImage(
				img,
				cropX,
				cropY,
				minDimension,
				minDimension, // Source: square crop from center
				sideBorder,
				topBorder,
				imageSize,
				imageSize, // Destination: square area
			);

			ctx.globalCompositeOperation = "multiply";
			ctx.fillStyle = "rgba(255, 240, 200, 0.25)";
			ctx.fillRect(sideBorder, topBorder, imageSize, imageSize);
			ctx.globalCompositeOperation = "source-over";

			ctx.globalCompositeOperation = "saturation";
			ctx.fillStyle = "rgba(128, 128, 128, 0.3)";
			ctx.fillRect(sideBorder, topBorder, imageSize, imageSize);
			ctx.globalCompositeOperation = "source-over";

			ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
			ctx.fillRect(sideBorder, topBorder, imageSize, imageSize);

			for (let i = 0; i < 2500; i++) {
				const grainX = sideBorder + Math.random() * imageSize;
				const grainY = topBorder + Math.random() * imageSize;
				const opacity = Math.random() * 0.12;
				ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
				ctx.fillRect(grainX, grainY, 1, 1);
			}

			ctx.restore();

			const gradient = ctx.createRadialGradient(
				polaroidWidth / 2,
				topBorder + imageSize / 2,
				imageSize / 4,
				polaroidWidth / 2,
				topBorder + imageSize / 2,
				imageSize / 1.1,
			);
			gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
			gradient.addColorStop(1, "rgba(0, 0, 0, 0.25)");
			ctx.fillStyle = gradient;
			ctx.fillRect(sideBorder, topBorder, imageSize, imageSize);

			ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(sideBorder + borderRadius, topBorder);
			ctx.lineTo(sideBorder + imageSize - borderRadius, topBorder);
			ctx.quadraticCurveTo(
				sideBorder + imageSize,
				topBorder,
				sideBorder + imageSize,
				topBorder + borderRadius,
			);
			ctx.lineTo(sideBorder + imageSize, topBorder + imageSize - borderRadius);
			ctx.quadraticCurveTo(
				sideBorder + imageSize,
				topBorder + imageSize,
				sideBorder + imageSize - borderRadius,
				topBorder + imageSize,
			);
			ctx.lineTo(sideBorder + borderRadius, topBorder + imageSize);
			ctx.quadraticCurveTo(
				sideBorder,
				topBorder + imageSize,
				sideBorder,
				topBorder + imageSize - borderRadius,
			);
			ctx.lineTo(sideBorder, topBorder + borderRadius);
			ctx.quadraticCurveTo(
				sideBorder,
				topBorder,
				sideBorder + borderRadius,
				topBorder,
			);
			ctx.closePath();
			ctx.stroke();

			ctx.restore();

			ctx.fillStyle = "#2c2c2c";
			ctx.font = "600 32px 'Courier New', monospace";
			ctx.textAlign = "center";
			const captionY = topBorder + imageSize + 70;
			ctx.fillText("Science Exhibition 2025", polaroidWidth / 2, captionY);

			ctx.font = "500 20px 'Courier New', monospace";
			ctx.fillStyle = "#4a4a4a";
			ctx.fillText("LPS Eldeco", polaroidWidth / 2, captionY + 35);

			ctx.font = "400 36px 'Pacifico', cursive";
			ctx.textAlign = "right";
			ctx.fillStyle = "#1a1a1a";
			const signatureX = polaroidWidth - sideBorder - 40;
			const signatureY = captionY + 85;
			ctx.fillText("– Orbit", signatureX, signatureY);

			const polaroidDataUrl = canvas.toDataURL("image/png");
			setPolaroidImage(polaroidDataUrl);
			setTimeout(() => setIsLoaded(true), 50);
		};

		img.src = capturedImage;
	};

	const downloadPolaroid = () => {
		if (!polaroidImage) return;

		const link = document.createElement("a");
		link.href = polaroidImage;
		link.download = `orbit-polaroid-${Date.now()}.png`;
		link.click();
	};

	return (
		<div className="fixed inset-0 w-full h-full bg-gradient-to-br from-stone-100 via-amber-50/40 to-orange-50/30 overflow-hidden">
			<div
				className="absolute inset-0 opacity-30"
				style={{
					backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.05' /%3E%3C/svg%3E")`,
				}}
			/>

			<canvas ref={canvasRef} className="hidden" />

			<div className="relative w-full h-full flex flex-col items-center justify-center p-4 md:p-6">
				<div
					className={`relative transition-all duration-700 ease-out ${
						isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
					}`}
					style={{
						willChange: "transform, opacity",
					}}
				>
					<div
						className="relative bg-white rounded-md"
						style={{
							padding: "0",
							transform: `rotate(${rotation}deg)`,
							maxWidth: "min(85vw, 420px)",
							maxHeight: "min(75vh, 504px)",
							boxShadow:
								"0 20px 40px rgba(0, 0, 0, 0.15), 0 10px 20px rgba(0, 0, 0, 0.1), 0 5px 10px rgba(0, 0, 0, 0.08)",
							filter: "brightness(0.98) contrast(1.02)",
						}}
					>
						{polaroidImage && (
							<div className="relative">
								<img
									src={polaroidImage || "/placeholder.svg"}
									alt="Polaroid Img"
									className="w-full h-auto rounded-md"
									style={{
										aspectRatio: "700/840",
										objectFit: "cover",
									}}
								/>
								<div
									className="absolute inset-0 rounded-md pointer-events-none opacity-20"
									style={{
										backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paper'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='5' /%3E%3CfeColorMatrix type='saturate' values='0' /%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23paper)' /%3E%3C/svg%3E")`,
										mixBlendMode: "multiply",
									}}
								/>
							</div>
						)}
					</div>

					<div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-orange-500/5 rounded-md blur-2xl -z-10" />
				</div>

				<div
					className={`mt-6 md:mt-8 flex flex-col items-center gap-4 w-full max-w-md px-4 transition-all duration-700 ease-out delay-200 ${
						isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
					}`}
					style={{
						willChange: "transform, opacity",
					}}
				>
					<Button
						onClick={() => {
							/* TODO: Implement AI editing */
						}}
						size="lg"
						className="relative w-full h-14 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md active:scale-95 transition-all duration-150 font-semibold text-base font-sans"
					>
						<Sparkles className="mr-2 h-5 w-5" />
						<span>
							Edit with <span className="font-orbitron">Orbit AI</span>
						</span>
					</Button>

					<Button
						onClick={downloadPolaroid}
						size="lg"
						className="relative w-full h-14 rounded-2xl bg-amber-100 border-2 border-amber-200 text-amber-900 hover:bg-amber-150 active:scale-95 transition-all duration-150 font-semibold text-base shadow-sm font-sans"
					>
						<Download className="mr-2 h-5 w-5 flex-shrink-0" />
						<span className="text-amber-900">Download Image</span>
					</Button>

					<button
						onClick={onRetake}
						className="mt-2 flex items-center gap-2 px-6 py-3 text-base font-medium text-amber-800 active:text-amber-900 transition-colors duration-150 underline underline-offset-4 decoration-2 font-sans"
						type="button"
					>
						<Camera className="h-4 w-4" />
						Retake Photo
					</button>
				</div>
			</div>
		</div>
	);
}
