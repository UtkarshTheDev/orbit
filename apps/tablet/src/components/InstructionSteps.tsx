import { Camera, Scan, Share2 } from "lucide-react";

const steps = [
	{
		number: 1,
		title: "Scan QR Code",
		description: "Point your camera at the code",
		icon: Scan,
		color: "text-primary",
		bgColor: "bg-primary/10",
	},
	{
		number: 2,
		title: "Capture Your Photo",
		description: "Strike a pose with Orbit Robo",
		icon: Camera,
		color: "text-accent",
		bgColor: "bg-accent/10",
	},
	{
		number: 3,
		title: "Download & Share",
		description: "Get your polaroid and share it",
		icon: Share2,
		color: "text-chart-3",
		bgColor: "bg-chart-3/10",
	},
];

export function InstructionSteps() {
	return (
		<div className="space-y-6 animate-in fade-in slide-in-from-right duration-700 delay-500">
			{/* Header */}
			<div className="mb-6">
				<h2 className="text-2xl md:text-3xl font-[family-name:var(--font-heading)] text-foreground text-balance">
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
							<div className="absolute left-7 top-16 w-0.5 h-8 bg-border" />
						)}

						{/* Step card */}
						<div className="relative flex gap-4 p-5 bg-card rounded-xl border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
							{/* Icon container */}
							<div
								className={`flex-shrink-0 w-14 h-14 ${step.bgColor} rounded-xl flex items-center justify-center group-hover:glow-effect transition-all duration-300`}
							>
								<step.icon className={`w-7 h-7 ${step.color}`} />
							</div>

							{/* Content */}
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-3 mb-2">
									<div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-[family-name:var(--font-heading)]">
										{step.number}
									</div>
									<h3 className="text-lg md:text-xl font-[family-name:var(--font-heading)] text-foreground text-balance">
										{step.title}
									</h3>
								</div>

								<p className="text-sm text-muted-foreground leading-relaxed pl-9">
									{step.description}
								</p>
							</div>

							{/* Hover indicator */}
							<div className="absolute top-1/2 -right-2 w-1 h-0 bg-primary rounded-full group-hover:h-8 transition-all duration-300 -translate-y-1/2" />
						</div>
					</div>
				))}
			</div>

			<div className="mt-6 p-3 bg-secondary/50 rounded-lg border border-border">
				<p className="text-xs text-center text-muted-foreground font-[family-name:var(--font-heading)] uppercase tracking-wider">
					Share on Instagram • X • Facebook
				</p>
			</div>
		</div>
	);
}
