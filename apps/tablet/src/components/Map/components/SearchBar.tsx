import type React from "react";
import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = "Search locations...",
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="sticky top-0 z-20 mb-4 px-4 pt-4 pb-2 bg-gradient-to-b from-white via-white to-transparent">
      <div
        className={`relative flex items-center overflow-hidden rounded-2xl border-2 bg-white/80 backdrop-blur-md transition-all duration-300 ${
          isFocused
            ? "border-blue-400 shadow-lg shadow-blue-200/50 ring-2 ring-blue-300/30"
            : "border-slate-200 shadow-md"
        }`}
      >
        {/* Search Icon */}
        <div className="pl-4 pr-3">
          <Search
            className={`h-5 w-5 transition-all duration-300 ${
              isFocused ? "text-blue-500 scale-110" : "text-slate-400"
            }`}
          />
        </div>

        {/* Input Field */}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="flex-1 bg-transparent py-3 pr-3 font-sans text-base text-slate-900 placeholder-slate-400 outline-none"
        />

        {/* Clear Button */}
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="mr-3 rounded-full bg-slate-100 p-1.5 transition-all duration-200 hover:bg-slate-200 active:scale-95"
          >
            <X className="h-4 w-4 text-slate-600" />
          </button>
        )}
      </div>

      {/* Active Search Indicator */}
      {value && (
        <div className="mt-2 flex items-center justify-center">
          <div className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
            Filtering results...
          </div>
        </div>
      )}
    </div>
  );
};
