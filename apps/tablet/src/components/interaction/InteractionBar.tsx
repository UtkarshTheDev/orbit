import { Keyboard, Mic, Send } from "lucide-react";
import { useEffect, useState } from "react";

type InteractionBarProps = {
  mode: "voice" | "text";
  onModeChange: (mode: "voice" | "text") => void;
};

export function InteractionBar({ mode, onModeChange }: InteractionBarProps) {
  const [isListening, setIsListening] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [waveformBars, setWaveformBars] = useState<number[]>(
    new Array(48).fill(20)
  );

  useEffect(() => {
    if (isListening) {
      const interval = setInterval(() => {
        setWaveformBars(
          new Array(48).fill(0).map(() => Math.random() * 36 + 12)
        );
      }, 500);
      return () => clearInterval(interval);
    }
    setWaveformBars(new Array(48).fill(20));
  }, [isListening]);

  const handleVoiceClick = () => {
    setIsListening(!isListening);
  };

  const handleSwitchToText = () => {
    onModeChange("text");
    setIsListening(false);
  };

  const handleSwitchToVoice = () => {
    onModeChange("voice");
    setInputValue("");
  };

  const handleSend = () => {
    if (inputValue.trim()) {
      console.log("Sending:", inputValue);
      setInputValue("");
    }
  };

  if (mode === "voice") {
    return (
      <div className="fade-in slide-in-from-bottom-4 flex animate-in items-center gap-4 duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
        <button
          className={`flex flex-1 items-center justify-center gap-4 rounded-3xl px-8 py-5 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-[0.98] ${
            isListening
              ? "border-2 border-blue-400 bg-gradient-to-br from-blue-600 to-blue-700 shadow-2xl shadow-blue-500/50"
              : "border-2 border-blue-400 bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/40 shadow-xl"
          }`}
          onClick={handleVoiceClick}
          type="button"
        >
          {isListening ? (
            <div className="flex h-[40px] w-full items-center justify-between gap-px px-4">
              {waveformBars.map((height, i) => (
                <div
                  className="w-1.5 rounded-full bg-white/90 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                  key={i}
                  style={{
                    height: `${height}px`,
                  }}
                />
              ))}
            </div>
          ) : (
            <>
              <Mic className="h-7 w-7 text-white" />
              <span
                className="font-bold font-orbitron text-lg text-white md:text-xl"
                style={{ fontFamily: "var(--font-orbitron)" }}
              >
                Talk with Orbit
              </span>
            </>
          )}
        </button>

        {isListening ? (
          <button
            aria-label="Stop listening"
            className="fade-in zoom-in-95 flex h-14 w-14 flex-shrink-0 animate-in items-center justify-center rounded-2xl border-2 border-red-400 bg-red-500 shadow-lg shadow-red-500/30 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-95 md:h-16 md:w-16"
            onClick={handleVoiceClick}
            type="button"
          >
            <div className="h-4 w-4 rounded-sm bg-white md:h-5 md:w-5" />
          </button>
        ) : (
          <button
            aria-label="Switch to text input"
            className="fade-in zoom-in-95 flex h-14 w-14 flex-shrink-0 animate-in items-center justify-center rounded-2xl border-2 border-gray-300 bg-white shadow-md transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-95 md:h-16 md:w-16"
            onClick={handleSwitchToText}
            type="button"
          >
            <Keyboard className="h-6 w-6 text-gray-700 md:h-7 md:w-7" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="fade-in slide-in-from-top-4 flex animate-in items-center gap-4 duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
      <div className="flex flex-1 items-center gap-3 rounded-3xl border-2 border-gray-300 bg-white p-2.5 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] focus-within:border-blue-500 focus-within:shadow-blue-500/20 focus-within:shadow-lg md:p-3.5">
        <input
          autoFocus
          className="flex-1 bg-transparent font-outfit text-base text-gray-900 outline-none placeholder:text-gray-400 md:text-lg"
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask Anything to Orbit"
          style={{ fontFamily: "var(--font-outfit)" }}
          type="text"
          value={inputValue}
        />

        <button
          aria-label="Send message"
          className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full transition-all duration-300 active:scale-95 md:h-12 md:w-12 ${inputValue.trim() ? "bg-blue-500 shadow-blue-500/30 shadow-md" : "cursor-not-allowed bg-gray-200"}`}
          disabled={!inputValue.trim()}
          onClick={handleSend}
          type="button"
        >
          <Send
            className={`h-5 w-5 md:h-6 md:w-6 ${inputValue.trim() ? "text-white" : "text-gray-400"}`}
          />
        </button>
      </div>

      <button
        aria-label="Switch to voice mode"
        className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border-2 border-blue-400 bg-blue-500 shadow-blue-500/30 shadow-md transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-95 md:h-16 md:w-16"
        onClick={handleSwitchToVoice}
        type="button"
      >
        <Mic className="h-6 w-6 text-white md:h-7 md:w-7" />
      </button>
    </div>
  );
}
