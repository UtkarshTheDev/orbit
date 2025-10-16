import { InstructionSteps } from "./InstructionSteps";
import { QRCodeSection } from "./QrCodeSection";

export default function Home() {
	return (
		<main className="h-screen relative overflow-hidden flex items-center">
			{/* Circuit pattern background */}
			<div className="absolute inset-0 circuit-bg pointer-events-none" />

			{/* Main content */}
			<div className="relative z-10 container mx-auto px-6 py-6 w-full">
				<div className="text-center mb-8">
					<h1 className="text-4xl md:text-5xl font-[family-name:var(--font-brand)] text-primary animate-in fade-in duration-700">
						Photo Booth
					</h1>
				</div>

				<div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
					<QRCodeSection />
					<InstructionSteps />
				</div>
			</div>

			{/* Decorative elements */}
			<div className="absolute top-20 right-10 w-32 h-32 bg-accent/10 rounded-full blur-3xl animate-pulse-glow pointer-events-none" />
			<div
				className="absolute bottom-20 left-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl animate-pulse-glow pointer-events-none"
				style={{ animationDelay: "1s" }}
			/>
		</main>
	);
}
