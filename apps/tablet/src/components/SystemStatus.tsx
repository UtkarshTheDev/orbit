export function SystemStatus() {
	return (
		<div className="relative inline-flex items-center justify-center px-8 py-3 mt-4">
			{/* Corner Accents */}
			<div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-blue-500" />
			<div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-blue-500" />
			<div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-blue-500" />
			<div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-blue-500" />

			{/* System Online Text */}
			<span className="font-orbitron text-lg font-medium tracking-[0.3em] text-blue-500 uppercase">
				System Online
			</span>
		</div>
	);
}
