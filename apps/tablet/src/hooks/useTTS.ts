import { useEffect, useRef, useState } from "react"

interface UseTTSReturn {
  speak: (text: string) => void
  stop: () => void
  isSpeaking: boolean
}

/**
 * Hook to handle Text-to-Speech using Web Speech API
 */
export const useTTS = (): UseTTSReturn => {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const speak = (text: string) => {
    if (!window.speechSynthesis) {
      console.error("[v0] Speech synthesis not supported")
      return
    }

    stop()

    const utterance = new SpeechSynthesisUtterance(text)
    utteranceRef.current = utterance

    utterance.rate = 1.0
    utterance.pitch = 1.0
    utterance.volume = 1.0

    utterance.onstart = () => {
      console.log("[v0] TTS started")
      setIsSpeaking(true)
    }

    utterance.onend = () => {
      console.log("[v0] TTS ended")
      setIsSpeaking(false)
    }

    utterance.onerror = (error) => {
      console.error("[v0] TTS error:", error)
      setIsSpeaking(false)
    }

    window.speechSynthesis.speak(utterance)
  }

  const stop = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setIsSpeaking(false)
  }

  useEffect(() => {
    return () => {
      stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { speak, stop, isSpeaking }
}

