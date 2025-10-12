export function SystemStatus() {
	return (
		<div className="inline-flex items-center gap-3 border-2 border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-3 rounded-lg shadow-sm">
			{/* Status Indicator Dot */}
			<div className="relative flex items-center justify-center">
				<div className="absolute h-2.5 w-2.5 bg-blue-500 rounded-full animate-ping opacity-75" />
				<div className="relative h-2 w-2 bg-blue-600 rounded-full shadow-sm" />
			</div>

			{/* System Online Text */}
			<span className="font-orbitron text-lg font-semibold tracking-wider text-gray-800 uppercase">
				System <span className="text-blue-500 font-sans">Online</span>
			</span>
		</div>
	);
}
