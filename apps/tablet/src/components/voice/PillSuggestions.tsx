"use client";

interface PillSuggestionsProps {
  onPillClick: (suggestion: string) => void;
}

const PillSuggestions = ({ onPillClick }: PillSuggestionsProps) => {
  const suggestions = [
    "Tell me about AC generators",
    "Explain light's wave & particle nature",
    "How does photosynthesis work?",
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 px-4">
      {suggestions.map((suggestion, index) => (
        <button
          className="rounded-full border border-blue-200/50 bg-white/60 px-5 py-2.5 font-medium font-orbitron text-blue-600 text-sm shadow-md backdrop-blur-sm transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-95 md:text-base"
          key={index}
          onClick={() => onPillClick(suggestion)}
          style={{
            transition:
              "transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease",
            animationDelay: `${index * 0.1}s`,
          }}
          type="button"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
};

export default PillSuggestions;
