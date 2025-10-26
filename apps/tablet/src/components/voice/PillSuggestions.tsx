"use client"

interface PillSuggestionsProps {
  onPillClick: (suggestion: string) => void
}

const PillSuggestions = ({ onPillClick }: PillSuggestionsProps) => {
  const suggestions = [
    "Tell me about AC generators",
    "Explain light's wave & particle nature",
    "How does photosynthesis work?",
  ]

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 px-4">
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          type="button"
          onClick={() => onPillClick(suggestion)}
          className="px-5 py-2.5 bg-white/60 backdrop-blur-sm border border-blue-200/50 text-blue-600 rounded-full font-outfit font-medium text-sm md:text-base hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-95 shadow-md hover:shadow-lg"
          style={{
            transition: "transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease",
            animationDelay: `${index * 0.1}s`,
          }}
        >
          {suggestion}
        </button>
      ))}
    </div>
  )
}

export default PillSuggestions
