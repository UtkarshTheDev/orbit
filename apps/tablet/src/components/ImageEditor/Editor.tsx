"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Sparkles, Zap, Grid3x3, X, Send } from "lucide-react";
import { toast } from "sonner";
import { useSessionStore } from "@/lib/sessionStore";
import CinematicOverlay from "./CinematicOverlay";

const suggestions = [
  { text: "Transform to Ghibli Style", icon: Sparkles },
  { text: "Add Cyberpunk Neon", icon: Zap },
  { text: "Convert to Pixel Art", icon: Grid3x3 },
];

export default function AIImageEditor() {
  // Session store
  const sendWs = useSessionStore((s) => s.sendWs);
  const aiEditSessionId = useSessionStore((s) => s.aiEditSessionId);
  const aiEditImage = useSessionStore((s) => s.aiEditImage);
  const aiEditCurrentImage = useSessionStore((s) => s.aiEditCurrentImage);
  const setAiEditActive = useSessionStore((s) => s.setAiEditActive);
  const setAiEditSessionId = useSessionStore((s) => s.setAiEditSessionId);
  const setAiEditImage = useSessionStore((s) => s.setAiEditImage);
  const setAiEditCurrentImage = useSessionStore((s) => s.setAiEditCurrentImage);
  const setShowMainApp = useSessionStore((s) => s.setShowMainApp);

  // Local state
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [editingImageSnapshot, setEditingImageSnapshot] = useState<
    string | null
  >(null);

  // Listen for processing status from backend
  useEffect(() => {
    // Processing status is handled by sessionStore
    // We just need to manage local UI state
  }, []);

  const handleEdit = (prompt: string) => {
    if (!prompt.trim() || !aiEditSessionId) {
      toast.error("Please enter a prompt");
      return;
    }

    // Take a snapshot of the current image before editing
    const currentImg = aiEditCurrentImage || aiEditImage;
    setEditingImageSnapshot(currentImg);

    setIsProcessing(true);
    setInputValue(""); // Clear input after sending

    // Send edit prompt to backend
    sendWs({
      type: "ai_edit_prompt",
      sessionId: aiEditSessionId,
      prompt: prompt.trim(),
      image: currentImg,
    });

    // Timeout after 2 minutes
    setTimeout(() => {
      if (isProcessing) {
        setIsProcessing(false);
        setEditingImageSnapshot(null);
        toast.error("Request timed out. Please try again.");
      }
    }, 120000);
  };

  // Stop processing when result arrives - only when we get a NEW image different from what we sent
  useEffect(() => {
    if (isProcessing && editingImageSnapshot && aiEditCurrentImage) {
      // Check if the current image is different from the snapshot we took before editing
      if (aiEditCurrentImage !== editingImageSnapshot) {
        setIsProcessing(false);
        setEditingImageSnapshot(null);
        toast.success("Image edited successfully!");
      }
    }
  }, [aiEditCurrentImage, isProcessing, editingImageSnapshot]);

  const handleDownload = () => {
    if (!aiEditSessionId || !aiEditCurrentImage) {
      toast.error("No edited image to download");
      return;
    }

    // Send finalize message to backend
    sendWs({
      type: "ai_edit_finalize",
      sessionId: aiEditSessionId,
      finalImage: aiEditCurrentImage,
    });

    toast.success("✨ Sending edited image to your phone!");

    // Close editor after a delay
    setTimeout(() => {
      handleClose();
    }, 2000);
  };

  const handleClose = () => {
    // Cancel the editing session
    if (aiEditSessionId) {
      sendWs({
        type: "ai_edit_cancel",
        sessionId: aiEditSessionId,
      });
    }

    // Reset state
    setAiEditActive(false);
    setAiEditSessionId(null);
    setAiEditImage(null);
    setAiEditCurrentImage(null);
    setShowMainApp(true);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full h-screen max-w-5xl mx-auto flex flex-col px-8 py-6"
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
          className="text-3xl md:text-4xl mt-auto font-bold text-center text-blue-600 mb-6 font-orbitron"
        >
          AI Image Editor
        </motion.h1>

        {/* Image Card - Centered and Square */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="relative w-full aspect-square max-w-sm mx-auto rounded-2xl overflow-hidden shadow-xl border border-blue-100 flex-shrink-0"
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
            className="absolute top-3 right-3 bg-red-500/80 backdrop-blur-sm text-white p-2 rounded-full hover:bg-red-600 transition-colors z-20"
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
                className="absolute top-3 left-3 bg-blue-500/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm z-20 font-orbitron"
              >
                ✨ Edited
              </motion.div>
            )}
          </AnimatePresence>

          {/* Download Button Overlay */}
          <AnimatePresence>
            {aiEditCurrentImage && aiEditCurrentImage !== aiEditImage && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute bottom-0 left-0 right-0 flex justify-center pb-4 z-20"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDownload}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full px-6 py-2.5 shadow-2xl hover:shadow-blue-500/50 transition-all flex items-center gap-2 backdrop-blur-sm border border-white/20 font-orbitron"
                >
                  <Download className="w-5 h-5" />
                  <span className="font-semibold">Download</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* AI Processing Overlay - Cinematic */}
          <CinematicOverlay isVisible={isProcessing} duration={12} />
        </motion.div>

        {/* Bottom Section - Pills and Input */}
        <div className="mt-12 space-y-8 pb-4">
          {/* Suggestion Pills - Centered Horizontal Scroll */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="overflow-x-auto scrollbar-hide"
          >
            <div className="flex gap-2.5 justify-center px-2">
              {suggestions.map((suggestion, index) => {
                const Icon = suggestion.icon;
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
                    className="px-4 py-2.5 rounded-lg border-2 border-blue-300 text-blue-700 bg-white hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-sm hover:shadow-md cursor-pointer whitespace-nowrap font-sans"
                  >
                    <Icon className="w-4 h-4" />
                    <span>{suggestion.text}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Input Section with Send Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center gap-3 max-w-4xl mx-auto"
          >
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Describe your edit…"
                className="w-full pl-5 pr-5 py-3.5 rounded-xl border-2 border-blue-200 focus:border-blue-400 focus:outline-none shadow-inner bg-white/80 backdrop-blur-sm text-blue-900 placeholder:text-blue-400 font-sans mb-5"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && inputValue.trim()) {
                    handleEdit(inputValue);
                  }
                }}
                disabled={isProcessing}
              />
            </div>
            {/* Send Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => inputValue.trim() && handleEdit(inputValue)}
              className="p-3.5 rounded-xl bg-blue-500 text-white shadow-lg -mt-6 hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-sans"
              disabled={isProcessing || !inputValue.trim()}
              title="Send prompt"
            >
              <Send className="w-5.5 h-5.5" />
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}
