"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mic, Download, Sparkles, Zap, Grid3x3, X } from "lucide-react"
import { toast } from "sonner"
import { useSessionStore } from "@/lib/sessionStore"

const suggestions = [
  { text: "Transform to Ghibli Style", icon: Sparkles },
  { text: "Add Cyberpunk Neon", icon: Zap },
  { text: "Convert to Pixel Art", icon: Grid3x3 },
]

const loadingMessages = ["Analyzing your image…", "Applying artistic magic…", "Finalizing details…"]

export default function AIImageEditor() {
  // Session store
  const sendWs = useSessionStore((s) => s.sendWs)
  const aiEditSessionId = useSessionStore((s) => s.aiEditSessionId)
  const aiEditImage = useSessionStore((s) => s.aiEditImage)
  const aiEditCurrentImage = useSessionStore((s) => s.aiEditCurrentImage)
  const setAiEditActive = useSessionStore((s) => s.setAiEditActive)
  const setAiEditSessionId = useSessionStore((s) => s.setAiEditSessionId)
  const setAiEditImage = useSessionStore((s) => s.setAiEditImage)
  const setAiEditCurrentImage = useSessionStore((s) => s.setAiEditCurrentImage)
  const setShowMainApp = useSessionStore((s) => s.setShowMainApp)

  // Local state
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentMessage, setCurrentMessage] = useState(0)
  const [isListening, setIsListening] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  
  // Voice recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  // Listen for processing status from backend
  useEffect(() => {
    // Processing status is handled by sessionStore
    // We just need to manage local UI state
  }, [])

  const handleEdit = (prompt: string) => {
    if (!prompt.trim() || !aiEditSessionId) {
      toast.error("Please enter a prompt")
      return
    }

    setIsProcessing(true)
    setCurrentMessage(0)
    setInputValue("") // Clear input after sending

    // Cycle through loading messages
    const interval = setInterval(() => {
      setCurrentMessage((prev) => {
        if (prev < loadingMessages.length - 1) {
          return prev + 1
        }
        return prev
      })
    }, 1500)

    // Send edit prompt to backend
    sendWs({
      type: "ai_edit_prompt",
      sessionId: aiEditSessionId,
      prompt: prompt.trim(),
      image: aiEditCurrentImage || aiEditImage,
    })

    // Stop loading messages after result (handled by sessionStore update)
    const checkInterval = setInterval(() => {
      if (!isProcessing) {
        clearInterval(interval)
        clearInterval(checkInterval)
      }
    }, 100)

    // Timeout after 2 minutes
    setTimeout(() => {
      clearInterval(interval)
      clearInterval(checkInterval)
      if (isProcessing) {
        setIsProcessing(false)
        toast.error("Request timed out. Please try again.")
      }
    }, 120000)
  }

  const handleMicClick = async () => {
    if (isRecording) {
      // Stop recording
      stopRecording()
    } else {
      // Start recording
      await startRecording()
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        await processVoiceInput(audioBlob)
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setIsListening(true)
      toast.info("Listening... Speak your editing instruction")
    } catch (error) {
      console.error("Error starting recording:", error)
      toast.error("Could not access microphone")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsListening(false)
    }
  }

  const processVoiceInput = async (audioBlob: Blob) => {
    try {
      // Convert blob to base64
      const reader = new FileReader()
      reader.readAsDataURL(audioBlob)
      
      reader.onloadend = () => {
        const base64Audio = reader.result as string
        
        // Send to backend for STT
        sendWs({
          type: "voice_query",
          data: base64Audio,
          format: "webm",
        })
        
        toast.info("Processing voice input...")
      }
    } catch (error) {
      console.error("Error processing voice:", error)
      toast.error("Failed to process voice input")
    }
  }

  // Listen for STT result
  useEffect(() => {
    const ws = useSessionStore.getState().ws
    if (!ws) return

    const handleMessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data)
        
        if (msg.type === "stt_done" && msg.text) {
          // Set the transcribed text as input
          setInputValue(msg.text)
          toast.success(`Heard: "${msg.text}"`)
        }
      } catch (error) {
        // Ignore parse errors
      }
    }

    ws.addEventListener("message", handleMessage)
    return () => ws.removeEventListener("message", handleMessage)
  }, [])

  // Stop processing when result arrives
  useEffect(() => {
    if (aiEditCurrentImage && isProcessing) {
      setIsProcessing(false)
      toast.success("Image edited successfully!")
    }
  }, [aiEditCurrentImage, isProcessing])

  const handleDownload = () => {
    if (!aiEditSessionId || !aiEditCurrentImage) {
      toast.error("No edited image to download")
      return
    }

    // Send finalize message to backend
    sendWs({
      type: "ai_edit_finalize",
      sessionId: aiEditSessionId,
      finalImage: aiEditCurrentImage,
    })

    toast.success("✨ Sending edited image to your phone!")
    
    // Close editor after a delay
    setTimeout(() => {
      handleClose()
    }, 2000)
  }

  const handleClose = () => {
    // Cancel the editing session
    if (aiEditSessionId) {
      sendWs({
        type: "ai_edit_cancel",
        sessionId: aiEditSessionId,
      })
    }

    // Reset state
    setAiEditActive(false)
    setAiEditSessionId(null)
    setAiEditImage(null)
    setAiEditCurrentImage(null)
    setShowMainApp(true)
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl mx-auto space-y-6"
      >
        {/* Animated Background */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-300 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 10,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-400 rounded-full blur-3xl"
          />
        </div>

        {/* Header */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-bold text-center text-blue-600"
          style={{ fontFamily: "Orbitron, sans-serif" }}
        >
          AI Image Editor
        </motion.h1>

        {/* Image Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="relative aspect-square w-full max-w-md mx-auto rounded-2xl overflow-hidden shadow-lg border border-blue-100"
        >
          {/* Base Image */}
          <img
            src={aiEditCurrentImage || aiEditImage || "/placeholder.svg"}
            alt="Editable content"
            className="w-full h-full object-cover"
          />

          {/* Close Button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={handleClose}
            className="absolute top-4 right-4 bg-red-500/80 backdrop-blur-sm text-white p-2 rounded-full hover:bg-red-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </motion.button>

          {/* Edited Badge */}
          <AnimatePresence>
            {aiEditCurrentImage && aiEditCurrentImage !== aiEditImage && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="absolute top-4 left-4 bg-blue-500/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm"
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                ✨ Edited
              </motion.div>
            )}
          </AnimatePresence>

          {/* AI Processing Overlay */}
          <AnimatePresence>
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 backdrop-blur-md bg-gradient-to-br from-blue-400/40 via-blue-300/30 to-blue-500/40 flex items-center justify-center"
              >
                <motion.div
                  animate={{
                    background: [
                      "linear-gradient(45deg, rgba(59, 130, 246, 0.5), rgba(147, 197, 253, 0.5))",
                      "linear-gradient(90deg, rgba(147, 197, 253, 0.5), rgba(59, 130, 246, 0.5))",
                      "linear-gradient(135deg, rgba(59, 130, 246, 0.5), rgba(147, 197, 253, 0.5))",
                    ],
                  }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                  className="absolute inset-0"
                />
                <motion.div
                  key={currentMessage}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="relative z-10 text-white text-xl font-semibold text-center px-6"
                  style={{ fontFamily: "Outfit, sans-serif" }}
                >
                  {loadingMessages[currentMessage]}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Download Button */}
        <AnimatePresence>
          {aiEditCurrentImage && aiEditCurrentImage !== aiEditImage && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex justify-center"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDownload}
                className="bg-blue-500 text-white rounded-full px-6 py-2 shadow-md hover:bg-blue-600 transition-colors flex items-center gap-2"
                style={{ fontFamily: "Outfit, sans-serif" }}
              >
                <Download className="w-4 h-4" />
                Download Image
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap justify-center gap-3"
        >
          {suggestions.map((suggestion, index) => {
            const Icon = suggestion.icon
            return (
              <motion.button
                key={suggestion.text}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                whileHover={{
                  scale: 1.02,
                  backgroundColor: "rgba(59, 130, 246, 0.1)",
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleEdit(suggestion.text)}
                disabled={isProcessing}
                className="px-5 py-3 rounded-xl border border-blue-300 text-blue-700 bg-white hover:border-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] flex items-center gap-2.5 font-medium shadow-sm hover:shadow-md cursor-pointer"
                style={{ fontFamily: "Outfit, sans-serif" }}
              >
                <Icon className="w-4 h-4" />
                <span>{suggestion.text}</span>
              </motion.button>
            )
          })}
        </motion.div>

        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center gap-3 max-w-xl mx-auto"
        >
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Describe how you want to edit the image…"
              className="w-full px-6 py-4 rounded-2xl border-2 border-blue-200 focus:border-blue-400 focus:outline-none shadow-inner bg-white/80 backdrop-blur-sm text-blue-900 placeholder:text-blue-400"
              style={{ fontFamily: "Outfit, sans-serif" }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && inputValue.trim()) {
                  handleEdit(inputValue)
                }
              }}
              disabled={isProcessing}
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleMicClick}
            className={`p-4 rounded-full bg-blue-500 text-white shadow-lg hover:bg-blue-600 transition-all min-w-[56px] min-h-[56px] flex items-center justify-center ${
              isListening ? "ring-4 ring-blue-300 animate-pulse bg-red-500" : ""
            }`}
            disabled={isProcessing}
          >
            <Mic className="w-6 h-6" />
          </motion.button>
        </motion.div>
      </motion.div>
    </>
  )
}
