import { useEffect, useRef } from "react"
import { Response } from "@/components/ui/response"

interface TranscriptBoxProps {
  transcript: string
  userQuery: string
  isAISpeaking: boolean
  state: string
}

const TranscriptBox = ({ transcript, userQuery, isAISpeaking, state }: TranscriptBoxProps) => {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [transcript])

  const showStatusInBox = state === "analyzing" || state === "thinking"

  return (
    <div className="w-full max-w-4xl">
      <div
        className="bg-white rounded-2xl shadow-md p-6 md:p-8 relative overflow-hidden"
        style={{ height: "35vh", minHeight: "200px" }}
      >
        {isAISpeaking && state === "responding" && (
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-1 h-4 bg-blue-500 rounded-full dot-pulse-1" />
              <div className="w-1 h-4 bg-blue-500 rounded-full dot-pulse-2" />
              <div className="w-1 h-4 bg-blue-500 rounded-full dot-pulse-3" />
            </div>
            <span className="text-xs font-outfit text-gray-500">AI speaking</span>
          </div>
        )}

        {showStatusInBox ? (
          <div className="h-full flex flex-col items-center justify-center gap-6">
            {userQuery && (
              <div className="w-full mb-4 pb-4 border-b border-gray-200">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-outfit font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      You asked
                    </p>
                    <p className="text-sm md:text-base font-outfit text-gray-700">{userQuery}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-2 h-8 bg-blue-500 rounded-full animate-pulse-bar-1" />
                <div className="w-2 h-8 bg-blue-400 rounded-full animate-pulse-bar-2" />
                <div className="w-2 h-8 bg-blue-300 rounded-full animate-pulse-bar-3" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-orbitron font-semibold text-blue-600 tracking-wider mb-2 animate-pulse">
                {state === "analyzing" ? "ANALYZING" : "THINKING"}
              </p>
              <p className="text-sm md:text-base font-outfit text-gray-500">
                {state === "analyzing" ? "Processing your voice input..." : "Generating response..."}
              </p>
            </div>
          </div>
        ) : (
          <div ref={scrollRef} className="h-full overflow-y-auto pr-2 transcript-scroll">
            {userQuery && (
              <div className="mb-6 pb-4 border-b-2 border-gray-100">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-outfit font-bold text-gray-500 uppercase tracking-wide mb-2">
                      Your Question
                    </p>
                    <p className="text-base md:text-lg font-outfit text-gray-800 font-medium">{userQuery}</p>
                  </div>
                </div>
              </div>
            )}

            {transcript ? (
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-outfit font-bold text-blue-600 uppercase tracking-wide mb-2">
                    AI Response
                  </p>
                  <div className="prose prose-sm md:prose-base max-w-none font-outfit text-gray-800 text-left">
                    <Response>{transcript}</Response>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-400 font-outfit text-center py-8">Waiting for response...</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default TranscriptBox
