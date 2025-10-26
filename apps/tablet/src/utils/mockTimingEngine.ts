export const TIMING_CONFIG = {
  ANALYZING_DURATION: 500, // 300-700ms range
  ANALYZING_TO_THINKING: 900, // 600-1200ms range
  THINKING_INITIAL_CHUNK: 450, // 300-600ms for first chunk
  THINKING_SUBSEQUENT_CHUNKS: 600, // Time between chunks
  THINKING_TO_TTS_DELAY: 1200, // 1.0-1.5s delay before TTS
  TTS_GENERATION: 500, // 300-700ms to generate TTS
  PLAYBACK_DURATION: 6000, // Mock audio playback duration (4-10s)
  TYPEWRITER_SPEED: 30, // Characters per second for typewriter effect
}

interface SampleResponse {
  chunks: string[]
}

// Sample responses for different questions
const SAMPLE_RESPONSES: Record<string, SampleResponse> = {
  "Tell me about AC generators": {
    chunks: [
      "An **AC generator** (alternating current generator) converts mechanical energy into electrical energy through electromagnetic induction. ",
      "The key components include a rotating coil (armature) within a magnetic field, slip rings, and brushes. ",
      "As the coil rotates, it cuts through magnetic field lines, inducing an alternating EMF that produces AC current. ",
      "This principle, discovered by Michael Faraday, is fundamental to modern power generation in power plants worldwide.",
    ],
  },
  "Explain light's wave & particle nature": {
    chunks: [
      "Light exhibits **wave-particle duality**, one of the most fascinating concepts in quantum physics. ",
      "As a **wave**, light shows interference and diffraction patterns, with properties like wavelength and frequency. ",
      "As **particles** (photons), light explains the photoelectric effect—where light ejects electrons from metal surfaces. ",
      "This dual nature means light behaves as waves during propagation but interacts as discrete packets of energy (quanta) with matter.",
    ],
  },
  "How does photosynthesis work?": {
    chunks: [
      "**Photosynthesis** is the process by which plants convert light energy into chemical energy stored in glucose. ",
      "It occurs in two main stages: the **light-dependent reactions** in the thylakoid membranes capture light energy to produce ATP and NADPH. ",
      "The **light-independent reactions** (Calvin cycle) in the stroma use ATP and NADPH to fix CO₂ into glucose. ",
      "Overall equation: 6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂. This process is essential for life on Earth, producing oxygen and organic compounds.",
    ],
  },
  default: {
    chunks: [
      "That's an interesting question! ",
      "Based on current scientific understanding, there are multiple perspectives to consider. ",
      "The fundamental principles involve complex interactions between various factors. ",
      "I'd be happy to explore this topic further with you and provide more specific details if you'd like.",
    ],
  },
}

interface MockTimingEngineProps {
  question?: string | null
  onAnalyzing: () => void
  onThinking: () => void
  onStreamChunk: (chunk: string) => void
  onResponding: (fullText: string) => void
  onDone: (finalTranscript: string) => void
  onError: () => void
}

export const mockTimingEngine = async ({
  question = null,
  onAnalyzing,
  onThinking,
  onStreamChunk,
  onResponding,
  onDone,
  onError,
}: MockTimingEngineProps): Promise<void> => {
  try {
    // Phase 1: Analyzing
    onAnalyzing()
    await sleep(TIMING_CONFIG.ANALYZING_DURATION)

    // Phase 2: Transition to Thinking
    await sleep(TIMING_CONFIG.ANALYZING_TO_THINKING)
    onThinking()

    // Phase 3: Generate full response first
    const response = question && SAMPLE_RESPONSES[question] ? SAMPLE_RESPONSES[question] : SAMPLE_RESPONSES.default
    const fullTranscript = response.chunks.join("")

    // TTS will start speaking the full text
    await sleep(TIMING_CONFIG.THINKING_INITIAL_CHUNK)
    onResponding(fullTranscript)

    const words = fullTranscript.split(" ")
    const wordsPerSecond = TIMING_CONFIG.TYPEWRITER_SPEED / 5
    const delayPerWord = 1000 / wordsPerSecond

    let typewriterTranscript = ""
    for (let i = 0; i < words.length; i++) {
      typewriterTranscript += (i > 0 ? " " : "") + words[i]
      onStreamChunk(typewriterTranscript)
      await sleep(delayPerWord)
    }

    // Phase 7: Playback complete
    await sleep(500)
    onDone(fullTranscript)
  } catch (error) {
    console.error("Mock timing engine error:", error)
    onError()
  }
}

// Helper function
const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))
