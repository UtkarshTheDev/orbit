interface CornerBracketsProps {
  className?: string
}

export default function CornerBrackets({ className = "" }: CornerBracketsProps) {
  return (
    <>
      {/* Top-left bracket */}
      <div className={`absolute top-0 left-0 w-12 h-12 ${className}`}>
        <div className="corner-bracket absolute top-0 left-0 w-full h-0.5 bg-blue-500" />
        <div className="corner-bracket absolute top-0 left-0 w-0.5 h-full bg-blue-500" />
      </div>

      {/* Top-right bracket */}
      <div className={`absolute top-0 right-0 w-12 h-12 ${className}`}>
        <div className="corner-bracket absolute top-0 right-0 w-full h-0.5 bg-blue-500" />
        <div className="corner-bracket absolute top-0 right-0 w-0.5 h-full bg-blue-500" />
      </div>

      {/* Bottom-left bracket */}
      <div className={`absolute bottom-0 left-0 w-12 h-12 ${className}`}>
        <div className="corner-bracket absolute bottom-0 left-0 w-full h-0.5 bg-blue-500" />
        <div className="corner-bracket absolute bottom-0 left-0 w-0.5 h-full bg-blue-500" />
      </div>

      {/* Bottom-right bracket */}
      <div className={`absolute bottom-0 right-0 w-12 h-12 ${className}`}>
        <div className="corner-bracket absolute bottom-0 right-0 w-full h-0.5 bg-blue-500" />
        <div className="corner-bracket absolute bottom-0 right-0 w-0.5 h-full bg-blue-500" />
      </div>
    </>
  )
}
