import { Camera, Scan, Share2 } from "lucide-react";

const steps = [
	{
		number: 1,
		title: "Scan QR Code",
		description: "Point your camera at the code",
		icon: Scan,
		color: "text-blue-600",
		bgColor: "bg-blue-100",
	},
	{
		number: 2,
		title: "Capture Your Photo",
		description: "Strike a pose with Orbit Robo",
		icon: Camera,
		color: "text-cyan-500",
		bgColor: "bg-cyan-100",
	},
	{
		number: 3,
		title: "Download & Share",
		description: "Get your polaroid and share it",
		icon: Share2,
		color: "text-indigo-600",
		bgColor: "bg-indigo-100",
	},
];

export function InstructionSteps() {
	return (
		<div className="space-y-6 animate-slide-in-right" style={{ animationDelay: "0.2s" }}>
			{/* Header */}
			<div className="mb-6">
				<h2 className="text-2xl md:text-3xl font-[family-name:var(--font-orbitron)] text-gray-900 text-balance">
					Three Simple Steps
				</h2>
			</div>

			{/* Steps */}
			<div className="space-y-5">
				{steps.map((step, index) => (
					<div
						key={step.number}
						className="group relative"
						style={{ animationDelay: `${600 + index * 150}ms` }}
					>
						{/* Connector line */}
						{index < steps.length - 1 && (
							<div className="absolute left-7 top-16 w-0.5 h-8 bg-gray-200" />
						)}

						{/* Step card */}
						<div className="relative flex gap-4 p-5 bg-white rounded-xl border border-gray-200 hover:border-blue-400/50 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
							{/* Icon container */}
							<div
								className={`flex-shrink-0 w-14 h-14 ${step.bgColor} rounded-xl flex items-center justify-center group-hover:glow-effect transition-all duration-300`}
							>
								<step.icon className={`w-7 h-7 ${step.color}`} />
							</div>

							{/* Content */}
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-3 mb-2">
									<div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-[family-name:var(--font-orbitron)]">
										{step.number}
									</div>
									<h3 className="text-lg md:text-xl font-[family-name:var(--font-orbitron)] text-gray-900 text-balance">
										{step.title}
									</h3>
								</div>

								<p className="text-sm text-gray-600 leading-relaxed pl-9">
									{step.description}
								</p>
							</div>

							{/* Hover indicator */}
							<div className="absolute top-1/2 -right-2 w-1 h-0 bg-blue-600 rounded-full group-hover:h-8 transition-all duration-300 -translate-y-1/2" />
						</div>
					</div>
				))}
			</div>

			<div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
				<p className="text-sm text-center text-gray-700 font-[family-name:var(--font-orbitron)] font-semibold uppercase tracking-wider">
					Share it on Instagram • X • Facebook
				</p>
			</div>
		</div>
	);
}
