import { Camera, RotateCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import PhotoViewer from "./PhotoViewer";

export default function CameraInterface() {
	const [stream, setStream] = useState<MediaStream | null>(null);
	const [capturedImage, setCapturedImage] = useState<string | null>(null);
	const [isCapturing, setIsCapturing] = useState(false);
	const [showFlash, setShowFlash] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

	const videoRef = useRef<HTMLVideoElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		startCamera();
		return () => {
			if (stream) {
				stream.getTracks().forEach((track) => track.stop());
			}
		};
	}, [facingMode]);

	const startCamera = async () => {
		try {
			setError(null);
			const mediaStream = await navigator.mediaDevices.getUserMedia({
				video: {
					facingMode,
					width: { ideal: 1920 },
					height: { ideal: 1080 },
				},
				audio: false,
			});

			setStream(mediaStream);

			if (videoRef.current) {
				videoRef.current.srcObject = mediaStream;
			}
		} catch (err) {
			console.error("[v0] Camera access error:", err);
			setError("Unable to access camera. Please grant camera permissions.");
		}
	};

	const capturePhoto = () => {
		if (!(videoRef.current && canvasRef.current)) return;

		setIsCapturing(true);
		setShowFlash(true);

		// Flash effect
		setTimeout(() => {
			setShowFlash(false);
		}, 500);

		// Capture after flash
		setTimeout(() => {
			const video = videoRef.current!;
			const canvas = canvasRef.current!;

			canvas.width = video.videoWidth;
			canvas.height = video.videoHeight;

			const ctx = canvas.getContext("2d");
			if (ctx) {
				ctx.drawImage(video, 0, 0);
				const imageData = canvas.toDataURL("image/png");
				setCapturedImage(imageData);

				// Stop camera stream
				if (stream) {
					stream.getTracks().forEach((track) => track.stop());
				}
			}

			setIsCapturing(false);
		}, 300);
	};

	const retakePhoto = () => {
		setCapturedImage(null);
		startCamera();
	};

	const toggleCamera = () => {
		if (stream) {
			stream.getTracks().forEach((track) => track.stop());
		}
		setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
	};

	return (
		<div className="fixed inset-0 h-full w-full overflow-hidden bg-background">
			<header className="absolute top-0 right-0 left-0 z-20 hidden px-6 py-8 md:block">
				<div className="flex items-center justify-center" />
			</header>

			<main className="relative h-full w-full">
				{error ? (
					<div className="flex h-full items-center justify-center p-6">
						<div className="flex flex-col items-center gap-4 text-center">
							<div className="rounded-full bg-destructive/10 p-6">
								<Camera className="h-12 w-12 text-destructive" />
							</div>
							<div className="space-y-2">
								<h2 className="font-semibold text-foreground text-xl">
									Camera Access Required
								</h2>
								<p className="max-w-sm text-muted-foreground text-sm">
									{error}
								</p>
							</div>
							<Button
								className="mt-4 bg-blue-500 text-white transition-transform active:scale-95"
								onClick={startCamera}
							>
								Try Again
							</Button>
						</div>
					</div>
				) : capturedImage ? (
					<PhotoViewer capturedImage={capturedImage} onRetake={retakePhoto} />
				) : (
					<div className="relative h-full w-full">
						<video
							autoPlay
							className="absolute inset-0 h-full w-full object-cover"
							muted
							playsInline
							ref={videoRef}
						/>
						<canvas className="hidden" ref={canvasRef} />

						{/* Flash overlay */}
						{showFlash && (
							<div className="absolute inset-0 z-30 animate-flash bg-white" />
						)}

						<div className="absolute top-6 right-6 z-20">
							<button
								className="rounded-full border border-white/20 bg-white/10 p-3 backdrop-blur-md transition-all duration-150 active:scale-95 active:bg-white/20"
								onClick={toggleCamera}
								type="button"
							>
								<RotateCw className="h-5 w-5 text-white" />
							</button>
						</div>

						<div className="absolute right-0 bottom-12 left-0 z-20 flex items-center justify-center">
							<button
								className="group relative h-24 w-24 rounded-full transition-transform duration-150 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
								disabled={isCapturing || !stream}
								onClick={capturePhoto}
								type="button"
							>
								{/* Liquid glass container */}
								<div className="absolute inset-0 rounded-full border border-white/30 bg-white/15 shadow-xl backdrop-blur-lg" />

								{/* Inner white circle */}
								<div className="absolute inset-2 flex items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform duration-150 group-active:scale-90">
									<Camera className="h-10 w-10 text-gray-900" strokeWidth={2} />
								</div>

								{/* Blue-500 accent ring */}
								<div className="absolute inset-0 rounded-full border-2 border-blue-500/30" />
							</button>
						</div>
					</div>
				)}
			</main>
		</div>
	);
}
