"use client";

import { useEffect, useRef, useState } from "react";
import { BarVisualizer } from "@/components/ui/bar-visualizer";
import { LiveWaveform } from "@/components/ui/live-waveform";
import { useTTS } from "@/hooks/useTTS";
import { mockTimingEngine } from "@/utils/mockTimingEngine";
import AnimatedGrid from "./AnimatedGrid";
import CornerBrackets from "./CornerBrackets";
import PillSuggestions from "./PillSuggestions";
import ScanLine from "./ScanLine";
import StatusText from "./StatusText";
import TranscriptBox from "./TranscriptBox";

type AppState =
  | "idle"
  | "listening"
  | "analyzing"
  | "thinking"
  | "responding"
  | "done"
  | "error";

function VoiceApp() {
  const [state, setState] = useState<AppState>("idle");
  const [transcript, setTranscript] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [previousTranscript, setPreviousTranscript] = useState(
    "Welcome! Tap the waveform to start a conversation."
  );
  const [previousUserQuery, setPreviousUserQuery] = useState("");
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [ariaLiveMessage, setAriaLiveMessage] = useState("");
  const [hasInteracted, setHasInteracted] = useState(false);
  const engineRef = useRef<NodeJS.Timeout | null>(null);
  const pendingDoneRef = useRef<{ transcript: string; query: string } | null>(null);

  const { speak, stop: stopTts, isSpeaking: isTtsSpeaking } = useTTS();

  useEffect(() => {
    setIsAiSpeaking(isTtsSpeaking);
    
    // When TTS finishes and we have a pending done state, transition to done
    if (!isTtsSpeaking && pendingDoneRef.current && state === "responding") {
      const { transcript: finalTranscript, query } = pendingDoneRef.current;
      setState("done");
      setPreviousTranscript(finalTranscript);
      setPreviousUserQuery(query);
      setAriaLiveMessage("Response complete. Tap waveform to start again");
      pendingDoneRef.current = null;
    }
  }, [isTtsSpeaking, state]);

  useEffect(() => {
    setTranscript(previousTranscript);
  }, []);

  const handleWaveformClick = () => {
    console.log("[v0] Waveform clicked, current state:", state);
    if (state === "idle" || state === "done") {
      startListening();
    } else if (state === "listening") {
      stopListening();
    }
  };

  const startListening = () => {
    setState("listening");
    setTranscript("");
    setAriaLiveMessage("Listening to your voice");
    setHasInteracted(true);

    const recordingDuration = 3000 + Math.random() * 5000;
    engineRef.current = setTimeout(() => {
      stopListening();
    }, recordingDuration);
  };

  const stopListening = () => {
    if (engineRef.current) {
      clearTimeout(engineRef.current);
    }

    setState("analyzing");
    setAriaLiveMessage("Analyzing your voice");

    const simulatedSttResult = "How does photosynthesis work?";

    mockTimingEngine({
      onAnalyzing: () => {
        setState("analyzing");
        setTimeout(() => {
          setUserQuery(simulatedSttResult);
        }, 400);
      },
      onThinking: () => {
        setState("thinking");
        setAriaLiveMessage("Thinking about your query");
      },
      onStreamChunk: (chunk: string) => {
        setTranscript((prev) => prev + chunk);
      },
      onResponding: (fullText: string) => {
        setState("responding");
        setAriaLiveMessage("AI is responding");
        speak(fullText);
      },
      onDone: (finalTranscript: string) => {
        setTranscript(finalTranscript);
        // Store the final state but don't transition to done until TTS finishes
        pendingDoneRef.current = {
          transcript: finalTranscript,
          query: simulatedSttResult,
        };
      },
      onError: () => {
        setState("error");
        setAriaLiveMessage("Could not hear you. Please try again");
      },
    });
  };

  const handlePillClick = (question: string) => {
    setState("listening");
    setTranscript("");
    setAriaLiveMessage(`Processing question: ${question}`);
    setHasInteracted(true);

    setTimeout(() => {
      setState("analyzing");
      setAriaLiveMessage("Analyzing your question");

      setTimeout(() => {
        setUserQuery(question);
      }, 400);

      mockTimingEngine({
        question,
        onAnalyzing: () => setState("analyzing"),
        onThinking: () => {
          setState("thinking");
          setAriaLiveMessage("Thinking about your query");
        },
        onStreamChunk: (chunk: string) => {
          setTranscript(chunk);
        },
        onResponding: (fullText: string) => {
          setState("responding");
          setAriaLiveMessage("AI is responding");
          speak(fullText);
        },
        onDone: (finalTranscript: string) => {
          setTranscript(finalTranscript);
          // Store the final state but don't transition to done until TTS finishes
          pendingDoneRef.current = {
            transcript: finalTranscript,
            query: question,
          };
        },
        onError: () => {
          setState("error");
          setAriaLiveMessage("An error occurred");
        },
      });
    }, 500);
  };

  const handleRetry = () => {
    setState("idle");
    setTranscript(previousTranscript);
    setUserQuery(previousUserQuery);
    setAriaLiveMessage("Ready to listen");
  };

  const shouldCenterContent = state === "idle" && !hasInteracted;

  return (
    <div
      className="relative h-screen w-full overflow-hidden"
      style={{
        background:
          "radial-gradient(closest-corner at 50% 40%, rgba(59,130,246,0.08), rgba(99,102,241,0.03), #fafafa 70%)",
      }}
    >
      <AnimatedGrid />
      <ScanLine />

      <div
        aria-atomic="true"
        aria-live="polite"
        className="sr-only"
        role="status"
      >
        {ariaLiveMessage}
      </div>

      <div
        className={`flex h-full w-full flex-col items-center transition-all duration-500 ease-in-out ${shouldCenterContent ? "justify-center" : "justify-start pt-8 md:pt-12"} relative z-10 px-6 md:px-12 lg:px-16`}
      >
        <div className="flex w-full max-w-5xl flex-col items-center gap-6 md:gap-8">
          <div
            className="relative flex w-full animate-scale-in flex-col items-center gap-4 transition-all duration-500 ease-in-out"
            style={{ minHeight: "45vh" }}
          >
            <div className="relative h-full w-full rounded-2xl border border-blue-100/50 bg-white/40 p-8 shadow-xl backdrop-blur-sm">
              <CornerBrackets className="opacity-60" />
              <div
                className={`absolute inset-0 flex items-center justify-center rounded-2xl ${state === "listening" || state === "responding" ? "glow-active" : ""}`}
              >
                {state === "listening" && (
                  <div
                    className="absolute inset-0 flex items-center"
                    onClick={handleWaveformClick}
                  >
                    <LiveWaveform
                      active={true}
                      barGap={2}
                      barWidth={4}
                      className="w-full"
                      height="100%"
                    />
                  </div>
                )}
                {(state === "analyzing" ||
                  state === "thinking" ||
                  state === "responding") && (
                  <BarVisualizer
                    barCount={30}
                    centerAlign={true}
                    className="absolute inset-0 h-full w-full bg-transparent"
                    demo={true}
                    maxHeight={60}
                    state={
                      state === "responding" && isAiSpeaking
                        ? "speaking"
                        : state
                    }
                  />
                )}
              </div>

              {(state === "listening" ||
                state === "analyzing" ||
                state === "thinking") && <StatusText state={state} />}

              {(state === "idle" || state === "done") && (
                <button
                  aria-label="Start listening"
                  className="group absolute inset-0 flex cursor-pointer items-center justify-center rounded-2xl transition-all focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50"
                  onClick={handleWaveformClick}
                >
                  <div
                    className="animate-fade-in rounded-xl border border-blue-200/60 px-8 py-4 shadow-lg transition-transform group-hover:scale-105 group-active:scale-95"
                    style={{
                      backdropFilter: "blur(8px)",
                      backgroundColor: "rgba(255, 255, 255, 0.6)",
                    }}
                  >
                    <p className="font-outfit font-semibold text-base text-gray-700 md:text-lg">
                      Click to start listening
                    </p>
                  </div>
                </button>
              )}

              {state === "error" && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="flex animate-scale-in flex-col items-center gap-4 rounded-xl border border-red-100/50 px-8 py-6 shadow-lg"
                    style={{
                      backdropFilter: "blur(8px)",
                      backgroundColor: "rgba(255, 255, 255, 0.5)",
                    }}
                  >
                    <p className="font-medium font-outfit text-base text-gray-800 md:text-lg">
                      Couldn't hear you
                    </p>
                    <button
                      className="rounded-lg bg-blue-500 px-6 py-2 font-medium font-outfit text-white shadow-md transition-all hover:scale-105 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-95"
                      onClick={handleRetry}
                    >
                      Try again
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {state === "listening" && (
            <div className="flex w-full max-w-2xl animate-slide-up flex-col items-center gap-3 transition-opacity duration-300">
              <div className="flex items-center gap-2 text-gray-500">
                <div className="flex gap-1">
                  <span
                    className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
                <p className="font-outfit text-sm md:text-base">
                  Speak now or tap to stop
                </p>
              </div>
            </div>
          )}

          {state === "idle" && !hasInteracted && (
            <div className="animate-slide-up transition-opacity duration-300">
              <PillSuggestions onPillClick={handlePillClick} />
            </div>
          )}

          {(state === "analyzing" ||
            state === "thinking" ||
            state === "responding" ||
            state === "done") && (
            <div className="w-full animate-slide-up transition-opacity duration-300 flex justify-center">
              <TranscriptBox
                isAISpeaking={isAiSpeaking}
                state={state}
                transcript={transcript}
                userQuery={userQuery}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VoiceApp;
