import { useEffect, useRef } from "react";
import { Response } from "@/components/ui/response";

interface TranscriptBoxProps {
  transcript: string;
  userQuery: string;
  isAISpeaking: boolean;
  state: string;
}

const TranscriptBox = ({
  transcript,
  userQuery,
  isAISpeaking,
  state,
}: TranscriptBoxProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  const showStatusInBox = state === "analyzing" || state === "thinking";

  return (
    <div className="w-full max-w-4xl">
      <div
        className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-md md:p-8"
        style={{ height: "35vh", minHeight: "200px" }}
      >
        {isAISpeaking && state === "responding" && (
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <div className="flex gap-1">
              <div className="dot-pulse-1 h-4 w-1 rounded-full bg-blue-500" />
              <div className="dot-pulse-2 h-4 w-1 rounded-full bg-blue-500" />
              <div className="dot-pulse-3 h-4 w-1 rounded-full bg-blue-500" />
            </div>
            <span className="font-orbitron text-gray-500 text-xs">AI speaking</span>
          </div>
        )}

        {showStatusInBox ? (
          <div className="flex h-full flex-col items-center justify-center gap-6">
            {userQuery && (
              <div className="mb-4 w-full border-gray-200 border-b pb-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100">
                    <svg
                      className="h-4 w-4 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="mb-1 font-orbitron font-semibold text-gray-500 text-xs uppercase tracking-wide">
                      You asked
                    </p>
                    <p className="font-sans text-gray-700 text-sm md:text-base">
                      {userQuery}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="h-8 w-2 animate-pulse-bar-1 rounded-full bg-blue-500" />
                <div className="h-8 w-2 animate-pulse-bar-2 rounded-full bg-blue-400" />
                <div className="h-8 w-2 animate-pulse-bar-3 rounded-full bg-blue-300" />
              </div>
            </div>
            <div className="text-center">
              <p className="mb-2 animate-pulse font-orbitron font-semibold text-2xl text-blue-600 tracking-wider md:text-3xl">
                {state === "analyzing" ? "ANALYZING" : "THINKING"}
              </p>
              <p className="font-sans text-gray-500 text-sm md:text-base">
                {state === "analyzing"
                  ? "Processing your voice input..."
                  : "Generating response..."}
              </p>
            </div>
          </div>
        ) : (
          <div
            className="transcript-scroll h-full overflow-y-auto pr-2"
            ref={scrollRef}
          >
            {userQuery && (
              <div className="mb-6 border-gray-100 border-b-2 pb-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-100">
                    <svg
                      className="h-5 w-5 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="mb-2 font-bold font-orbitron text-gray-500 text-xs uppercase tracking-wide">
                      Your Question
                    </p>
                    <p className="font-medium font-sans text-base text-gray-800 md:text-lg">
                      {userQuery}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {transcript ? (
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-50">
                  <svg
                    className="h-5 w-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="mb-2 font-bold font-orbitron text-blue-600 text-xs uppercase tracking-wide">
                    AI Response
                  </p>
                  <div className="prose prose-sm md:prose-base max-w-none text-left font-sans text-gray-800">
                    <Response>{transcript}</Response>
                  </div>
                </div>
              </div>
            ) : (
              <p className="py-8 text-center font-sans text-gray-400">
                Waiting for response...
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TranscriptBox;
