export default function ScanLine() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="scan-line absolute left-0 w-full h-0.5 opacity-20"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.8), transparent)",
        }}
      />
    </div>
  )
}
