export function SystemStatus() {
  return (
    <div className="relative mt-4 inline-flex items-center justify-center px-8 py-3">
      {/* Corner Accents */}
      <div className="absolute top-0 left-0 h-3 w-3 border-blue-500 border-t-2 border-l-2" />
      <div className="absolute top-0 right-0 h-3 w-3 border-blue-500 border-t-2 border-r-2" />
      <div className="absolute bottom-0 left-0 h-3 w-3 border-blue-500 border-b-2 border-l-2" />
      <div className="absolute right-0 bottom-0 h-3 w-3 border-blue-500 border-r-2 border-b-2" />

      {/* System Online Text */}
      <span className="font-medium font-orbitron text-blue-500 text-lg uppercase tracking-[0.3em]">
        System Online
      </span>
    </div>
  );
}
