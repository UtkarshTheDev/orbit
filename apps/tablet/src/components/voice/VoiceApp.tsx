"use client";

import { useEffect, useRef, useState } from "react";
import { BarVisualizer } from "@/components/ui/bar-visualizer";
import { LiveWaveform } from "@/components/ui/live-waveform";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { useVoiceWebSocket } from "@/hooks/useVoiceWebSocket";
import AnimatedGrid from "./AnimatedGrid";
import CornerBrackets from "./CornerBrackets";
import PillSuggestions from "./PillSuggestions";
import ScanLine from "./ScanLine";
import StatusText from "./StatusText";
import TranscriptBox from "./TranscriptBox";

type AppState =
  | "idle"
  | "listening"
  | "uploading"
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

  // Real hooks for voice functionality
  const {
    startRecording,
    stopRecording,
    error: recorderError,
  } = useVoiceRecorder();
  const { sendVoiceQuery, sendTextQuery, response, resetResponse } = useVoiceWebSocket();
  const { playAudio, stopAudio, isPlaying } = useAudioPlayer();

  // Track if we're waiting for TTS to finish
  const pendingDoneRef = useRef<{ transcript: string; query: string } | null>(
    null
  );
  // Track which audio we've already played to prevent repeats
  const playedAudioRef = useRef<string | null>(null);
  // Track timeout for forcing done state
  const doneTimeoutRef = useRef<number | null>(null);

  // Initialize with welcome message
  useEffect(() => {
    setTranscript(previousTranscript);
  }, [previousTranscript]);

  // Handle recorder errors
  useEffect(() => {
    if (recorderError) {
      setState("error");
      setAriaLiveMessage(recorderError);
    }
  }, [recorderError]);

  // Sync isAiSpeaking with audio player and handle done state
  useEffect(() => {
    console.log(
      "[VoiceApp] isPlaying changed:",
      isPlaying,
      "state:",
      state,
      "hasPendingDone:",
      !!pendingDoneRef.current
    );
    setIsAiSpeaking(isPlaying);

    // Fallback: If audio stops playing and we're in responding state with pending done, transition to done
    if (!isPlaying && state === "responding" && pendingDoneRef.current) {
      console.log("[VoiceApp] Audio stopped, transitioning to done state");
      // Clear any existing timeout
      if (doneTimeoutRef.current) {
        clearTimeout(doneTimeoutRef.current);
        doneTimeoutRef.current = null;
      }
      const { transcript: finalTranscript, query } = pendingDoneRef.current;
      setState("done");
      setPreviousTranscript(finalTranscript);
      setPreviousUserQuery(query);
      setAriaLiveMessage("Response complete. Tap to start again");
      pendingDoneRef.current = null;
    }
  }, [isPlaying, state]);

  // Handle WebSocket response updates
  useEffect(() => {
    const { stage, transcribedText, aiText, aiTextChunk, ttsAudio, error } =
      response;

    // Update state based on backend stage (but don't override done state)
    if (stage !== "idle" && state !== "done") {
      setState(stage);
    }

    // Update transcript when STT completes
    if (transcribedText && transcribedText !== userQuery) {
      setUserQuery(transcribedText);
      setAriaLiveMessage(`You said: ${transcribedText}`);
    }

    // Update transcript as AI streams
    if (aiTextChunk) {
      setTranscript((prev) => prev + aiTextChunk);
    }

    // When AI is done, update full text
    if (aiText && stage === "responding") {
      setTranscript(aiText);
      setAriaLiveMessage("AI is responding");
    }

    // Play TTS audio when ready (only once per audio)
    if (
      ttsAudio &&
      stage === "responding" &&
      !isPlaying &&
      playedAudioRef.current !== ttsAudio
    ) {
      console.log("[VoiceApp] Playing TTS audio");
      playedAudioRef.current = ttsAudio; // Mark this audio as played

      // Store final state BEFORE playing (so it's available when audio ends)
      pendingDoneRef.current = {
        transcript: aiText || "",
        query: transcribedText || userQuery,
      };

      playAudio(ttsAudio)
        .then(() => {
          console.log("[VoiceApp] TTS audio finished playing");
          // Clear any existing timeout
          if (doneTimeoutRef.current) {
            clearTimeout(doneTimeoutRef.current);
            doneTimeoutRef.current = null;
          }
          // When TTS finishes, transition to done
          if (pendingDoneRef.current) {
            const { transcript: finalTranscript, query } =
              pendingDoneRef.current;
            setState("done");
            setPreviousTranscript(finalTranscript);
            setPreviousUserQuery(query);
            setAriaLiveMessage("Response complete. Tap to start again");
            pendingDoneRef.current = null;
          }
        })
        .catch((err) => {
          console.error("[VoiceApp] TTS playback error:", err);
          setState("error");
          setAriaLiveMessage("Failed to play audio response");
        });

      // Fallback timeout: Force transition to done after 30 seconds if audio doesn't end
      doneTimeoutRef.current = setTimeout(() => {
        console.warn("[VoiceApp] Timeout reached, forcing transition to done");
        if (pendingDoneRef.current && state === "responding") {
          const { transcript: finalTranscript, query } = pendingDoneRef.current;
          setState("done");
          setPreviousTranscript(finalTranscript);
          setPreviousUserQuery(query);
          setAriaLiveMessage("Response complete. Tap to start again");
          pendingDoneRef.current = null;
        }
      }, 30_000);
    }

    // Handle errors
    if (error) {
      setState("error");
      setAriaLiveMessage(error);
    }
  }, [response, isPlaying, playAudio, userQuery]);

  const handleWaveformClick = () => {
    console.log("[VoiceApp] Waveform clicked, current state:", state);
    if (state === "idle" || state === "done") {
      startListeningReal();
    } else if (state === "listening") {
      stopListeningReal();
    }
  };

  const startListeningReal = async () => {
    try {
      setState("listening");
      setTranscript("");
      setUserQuery("");
      setAriaLiveMessage("Listening to your voice");
      setHasInteracted(true);
      resetResponse();
      playedAudioRef.current = null; // Reset played audio tracker

      await startRecording();
      console.log("[VoiceApp] Recording started");
    } catch (err) {
      console.error("[VoiceApp] Failed to start recording:", err);
      setState("error");
      setAriaLiveMessage("Failed to access microphone");
    }
  };

  const stopListeningReal = async () => {
    try {
      console.log("[VoiceApp] Stopping recording");
      const result = await stopRecording();

      if (!result) {
        setState("error");
        setAriaLiveMessage("Failed to process audio");
        return;
      }

      const { audioBase64 } = result;
      console.log("[VoiceApp] Sending audio to backend");

      // Send to backend via WebSocket
      sendVoiceQuery(audioBase64, "webm");
      setState("uploading");
      setAriaLiveMessage("Processing your voice");
    } catch (err) {
      console.error("[VoiceApp] Failed to stop recording:", err);
      setState("error");
      setAriaLiveMessage("Failed to process audio");
    }
  };

  const handlePillClick = (question: string) => {
    console.log("[VoiceApp] Pill clicked:", question);
    setHasInteracted(true);
    setTranscript("");
    setUserQuery(question);
    setAriaLiveMessage(`Processing question: ${question}`);
    resetResponse();
    playedAudioRef.current = null; // Reset played audio tracker
    stopAudio(); // Stop any currently playing audio

    // Send text query to backend (TTS enabled)
    sendTextQuery(question, true);
    setState("thinking");
  };

  const handleRetry = () => {
    setState("idle");
    setTranscript(previousTranscript);
    setUserQuery(previousUserQuery);
    setAriaLiveMessage("Ready to listen");
    resetResponse();
    stopAudio();
  };

  const shouldCenterContent = state === "idle" || state === "listening";

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
                  <button
                    aria-label="Stop listening"
                    className="absolute inset-0 flex cursor-pointer items-center border-0 bg-transparent p-0"
                    onClick={handleWaveformClick}
                    type="button"
                  >
                    <LiveWaveform
                      active={true}
                      barGap={2}
                      barWidth={4}
                      className="w-full"
                      height="100%"
                    />
                  </button>
                )}
                {(state === "uploading" ||
                  state === "analyzing" ||
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
                        : state === "uploading"
                          ? "analyzing"
                          : state
                    }
                  />
                )}
              </div>

              {(state === "listening" ||
                state === "uploading" ||
                state === "analyzing" ||
                state === "thinking") && <StatusText state={state} />}

              {state === "responding" && !isAiSpeaking && (
                <div className="-translate-x-1/2 absolute bottom-8 left-1/2 z-20 transform">
                  <button
                    className="rounded-lg bg-gray-600 px-4 py-2 font-medium text-sm text-white shadow-md transition-all hover:bg-gray-700"
                    onClick={() => {
                      console.log("[VoiceApp] Manual done button clicked");
                      if (pendingDoneRef.current) {
                        const { transcript: finalTranscript, query } =
                          pendingDoneRef.current;
                        setState("done");
                        setPreviousTranscript(finalTranscript);
                        setPreviousUserQuery(query);
                        setAriaLiveMessage(
                          "Response complete. Tap to start again"
                        );
                        pendingDoneRef.current = null;
                      }
                      stopAudio();
                    }}
                    type="button"
                  >
                    Continue
                  </button>
                </div>
              )}

              {(state === "idle" || state === "done") && (
                <button
                  aria-label="Start listening"
                  className="group absolute inset-0 flex cursor-pointer items-center justify-center rounded-2xl transition-all focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50"
                  onClick={handleWaveformClick}
                  type="button"
                >
                  <div
                    className="animate-fade-in rounded-xl border border-blue-200/60 px-8 py-4 shadow-lg transition-transform group-hover:scale-105 group-active:scale-95"
                    style={{
                      backdropFilter: "blur(8px)",
                      backgroundColor: "rgba(255, 255, 255, 0.6)",
                    }}
                  >
                    <p className="font-orbitron font-semibold text-base text-gray-700 md:text-lg">
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
                    <p className="font-medium font-sans text-base text-gray-800 md:text-lg">
                      Couldn't hear you
                    </p>
                    <button
                      className="rounded-lg bg-blue-500 px-6 py-2 font-medium font-orbitron text-white shadow-md transition-all hover:scale-105 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-95"
                      onClick={handleRetry}
                      type="button"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {state === "listening" && hasInteracted && (
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
                <p className="font-sans text-sm md:text-base">
                  Speak now or tap to stop
                </p>
              </div>
            </div>
          )}

          {(state === "idle" && !hasInteracted) && (
            <div className="animate-slide-up transition-opacity duration-300">
              <PillSuggestions onPillClick={handlePillClick} />
            </div>
          )}

          {state === "listening" && (
            <div className="animate-slide-up transition-opacity duration-300">
              <PillSuggestions onPillClick={handlePillClick} />
            </div>
          )}

          {(state === "uploading" ||
            state === "analyzing" ||
            state === "thinking" ||
            state === "responding" ||
            state === "done") && (
            <div className="flex w-full animate-slide-up justify-center transition-opacity duration-300">
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
