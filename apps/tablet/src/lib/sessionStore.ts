import { create } from "zustand";
import { playSound } from "./basicAudioPlayer";

// Define sound file paths
const QR_SCANNED_SOUND = "/audio/qr-scanned.mp3";
const DOWNLOAD_POLAROID_SOUND = "/audio/download-polaroid.mp3";

type SessionState = {
	isTablet: boolean;
	photoBoothActive: boolean;
	showMainApp: boolean;
	isRetakeRequested: boolean;
	aiEditActive: boolean;
	aiEditSessionId: string | null;
	aiEditImage: string | null;
	aiEditCurrentImage: string | null;
	showGreeting: boolean;
	showRobotFace: boolean;
	userPresent: boolean;
	lastActivityTime: number;
	ws: WebSocket | null;
	wsReady: boolean;
	wsReconnecting: boolean;
	reconnectAttempts: number;
	messageQueue: unknown[];
	connectWs: () => void;
	disconnectWs: () => void;
	sendWs: (msg: unknown) => void;
	setPhotoBoothActive: (val: boolean) => void;
	setShowMainApp: (val: boolean) => void;
	setIsRetakeRequested: (val: boolean) => void;
	setAiEditActive: (val: boolean) => void;
	setAiEditSessionId: (val: string | null) => void;
	setAiEditImage: (val: string | null) => void;
	setAiEditCurrentImage: (val: string | null) => void;
	setShowGreeting: (val: boolean) => void;
	setShowRobotFace: (val: boolean) => void;
	setUserPresent: (val: boolean) => void;
	updateActivity: () => void;
	greetingStage: "detecting" | "greeting" | "complete" | null;
	setGreetingStage: (val: "detecting" | "greeting" | "complete" | null) => void;
};

// Connection configuration
const getWebSocketUrl = () => {
	// Use environment variable if set
	if (import.meta.env.VITE_WS_URL) {
		return import.meta.env.VITE_WS_URL;
	}

	// Auto-detect protocol based on current page protocol
	const isDev =
		window.location.hostname === "localhost" ||
		window.location.hostname === "127.0.0.1";

	if (isDev) {
		return "ws://localhost:3001/ws";
	}

	// Production: use wss with backend domain
	return "wss://orbit-194b.onrender.com/ws";
};

const WS_CONFIG = {
	url: getWebSocketUrl(),
	maxReconnectAttempts: 10,
	reconnectDelay: 1000, // Start with 1 second
	maxReconnectDelay: 30_000, // Max 30 seconds
	heartbeatInterval: 30_000, // 30 seconds
	connectionTimeout: 10_000, // 10 seconds connection timeout
};

// Helper function to create WebSocket connection
function createWebSocketConnection(): Promise<WebSocket> {
	return new Promise<WebSocket>((resolve, reject) => {
		// Close existing connection if any
		if (globalWsInstance) {
			console.log("[Frontend] Closing existing global WebSocket connection");
			globalWsInstance.close();
			globalWsInstance = null;
			globalWsReady = false;
		}

		const ws = new WebSocket(WS_CONFIG.url);
		globalWsInstance = ws;

		// Set connection timeout
		const connectionTimeout = setTimeout(() => {
			if (ws.readyState === WebSocket.CONNECTING) {
				console.error("[Frontend] WebSocket connection timeout");
				ws.close();
				connectionLock = false;
				connectionPromise = null;
				reject(new Error("Connection timeout"));
			}
		}, WS_CONFIG.connectionTimeout);

		ws.onopen = () => {
			console.log("[Frontend] WebSocket connected successfully");
			clearTimeout(connectionTimeout);
			globalWsReady = true;
			resolve(ws);
		};

		ws.onerror = (error) => {
			console.error("[Frontend] WebSocket error:", error);
			clearTimeout(connectionTimeout);
			globalWsReady = false;
			connectionLock = false;
			connectionPromise = null;
			reject(error);
		};
	});
}

// Singleton WebSocket instance to prevent multiple connections
let globalWsInstance: WebSocket | null = null;
let globalWsReady = false;
let connectionLock = false; // Prevent race conditions
let connectionPromise: Promise<WebSocket> | null = null; // Track ongoing connection

function detectTabletRole(): boolean {
	if (typeof window === "undefined") {
		return false;
	}
	const params = new URLSearchParams(window.location.search);
	const isTablet = params.get("tablet") === "1";
	console.log("[Frontend] Role:", isTablet ? "tablet" : "phone");
	return isTablet;
}

export const useSessionStore = create<SessionState>((set, get) => ({
	isTablet: detectTabletRole(),
	photoBoothActive: false,
	showMainApp: false,
	isRetakeRequested: false,
	aiEditActive: false,
	aiEditSessionId: null,
	aiEditImage: null,
	aiEditCurrentImage: null,
	showGreeting: false,
	showRobotFace: true,
	userPresent: false,
	lastActivityTime: Date.now(),
	greetingStage: null,
	ws: null,
	wsReady: false,
	wsReconnecting: false,
	reconnectAttempts: 0,
	messageQueue: [],
	connectWs: () => {
		const state = get();

		// Return existing connection if already open
		if (globalWsInstance && globalWsInstance.readyState === WebSocket.OPEN) {
			console.log("[Frontend] Using existing global WebSocket connection");
			set({ ws: globalWsInstance, wsReady: globalWsReady });
			return;
		}

		// Return existing promise if connection is in progress
		if (connectionPromise) {
			console.log("[Frontend] Connection already in progress, waiting...");
			connectionPromise.then((ws) => {
				set({ ws, wsReady: globalWsReady });
			});
			return;
		}

		// Prevent multiple simultaneous connection attempts
		if (connectionLock) {
			console.log("[Frontend] Connection lock active, skipping");
			return;
		}

		if (state.wsReconnecting) {
			console.log("[Frontend] Already reconnecting, skipping");
			return;
		}

		// Set connection lock and create promise
		connectionLock = true;
		console.log(
			`[Frontend] Creating new global WebSocket connection: ${WS_CONFIG.url}`,
		);

		connectionPromise = createWebSocketConnection()
			.then((ws) => {
				const role = get().isTablet ? "tablet" : "phone";

				set({
					wsReady: true,
					wsReconnecting: false,
					reconnectAttempts: 0,
					ws,
				});

				// Send identification
				ws.send(JSON.stringify({ type: "identify", role }));
				console.log("[Frontend] WS connected, identified as:", role);

				// Send queued messages
				const queuedMessages = get().messageQueue;
				if (queuedMessages.length > 0) {
					console.log(
						`[Frontend] Sending ${queuedMessages.length} queued messages`,
					);
					for (const msg of queuedMessages) {
						ws.send(JSON.stringify(msg));
					}
					set({ messageQueue: [] });
				}

				// Set up message handler
				ws.onmessage = (event) => {
					try {
						const msg = JSON.parse(event.data);

						// Handle heartbeat
						if (msg.type === "ping") {
							ws.send(JSON.stringify({ type: "pong" }));
							return;
						}

						// Handle business logic
						if (msg.type === "photo_booth_requested" && get().isTablet) {
							// Only activate photo booth if not already active
							if (!get().photoBoothActive) {
								set({ photoBoothActive: true });
								console.log("[Frontend] Photo booth activated");

								// Play QR scanned sound with a small delay to ensure component is ready
								setTimeout(() => {
									console.log("[SessionStore] Playing QR scanned sound");
									// Only play if still in photo booth mode
									if (get().photoBoothActive) {
										playSound(QR_SCANNED_SOUND);
									}
								}, 300);
							} else {
								console.log(
									"[Frontend] Photo booth already active, ignoring duplicate request",
								);
							}
						}
						if (msg.type === "photo_captured_sound" && get().isTablet) {
							console.log(
								"[SessionStore] Received photo_captured_sound, playing photo sound",
							);
							// Play photo sound directly
							playSound(DOWNLOAD_POLAROID_SOUND);
						}
						if (msg.type === "polaroid_queue_empty" && get().isTablet) {
							console.log(
								"[Frontend] Polaroid queue empty, scheduling OrbitMain display",
							);
							// Only transition if currently in photo booth mode
							if (get().photoBoothActive) {
								setTimeout(() => {
									set({ photoBoothActive: false, showMainApp: true });
									console.log("[Frontend] Showing OrbitMain after delay");
								}, 4000);
							} else {
								console.log(
									"[Frontend] Not in photo booth mode, ignoring polaroid_queue_empty",
								);
							}
						}
						if (msg.type === "retake_photo" && get().isTablet) {
							console.log(
								"[Frontend] Retake photo requested, resetting to photo booth mode",
							);
							// Reset to photo booth mode and trigger retake
							set({
								isRetakeRequested: true,
								photoBoothActive: true,
								showMainApp: false,
							});
							// Reset retake flag after a delay to allow the animation to complete
							setTimeout(() => {
								set({ isRetakeRequested: false });
							}, 3000);
						}
						if (msg.type === "ai_edit_request" && get().isTablet) {
							console.log(
								"[Frontend] AI edit request received",
								msg.sessionId,
							);
							// Auto-accept and show editor
							set({
								aiEditActive: true,
								aiEditSessionId: msg.sessionId,
								aiEditImage: msg.image,
								aiEditCurrentImage: msg.image,
								photoBoothActive: false,
								showMainApp: false,
							});
							// Send accept message
							get().sendWs({
								type: "ai_edit_accept",
								sessionId: msg.sessionId,
							});
						}
						if (msg.type === "ai_edit_result" && get().isTablet) {
							console.log(
								"[Frontend] AI edit result received",
								msg.sessionId,
							);
							if (msg.success && msg.image) {
								set({ aiEditCurrentImage: msg.image });
							}
						}
						if (msg.type === "ai_edit_cancelled" && get().isTablet) {
							console.log(
								"[Frontend] AI edit cancelled",
								msg.sessionId,
							);
							set({
								aiEditActive: false,
								aiEditSessionId: null,
								aiEditImage: null,
								aiEditCurrentImage: null,
								showMainApp: true,
							});
						}
						if (msg.type === "user_passed" && get().isTablet) {
							console.log("[Frontend] User passed detected - showing greeting");
							// Immediately show greeting animation regardless of current state
							set({
								showGreeting: true,
								showMainApp: false,
								showRobotFace: false,
								userPresent: true,
								lastActivityTime: Date.now(),
								greetingStage: "detecting",
							});
						}
						if (msg.type === "user_arrived" && get().isTablet) {
							console.log("[Frontend] User arrived - ensuring greeting is shown");
							const state = get();
							
							// Update activity and user presence
							set({
								userPresent: true,
								lastActivityTime: Date.now(),
							});
							
							// If greeting is showing and in complete stage, transition to OrbitMain
							if (state.showGreeting && state.greetingStage === "complete") {
								console.log("[Frontend] Greeting complete, transitioning to OrbitMain");
								set({
									showGreeting: false,
									showMainApp: true,
									showRobotFace: false,
									greetingStage: null,
								});
								return;
							}
							
							// If greeting is already showing but not complete, wait for completion
							if (state.showGreeting) {
								console.log("[Frontend] Greeting in progress, will transition when complete");
								return;
							}
							
							// If OrbitMain is already showing, do nothing (avoid re-render)
							if (state.showMainApp) {
								console.log("[Frontend] OrbitMain already showing, no action needed");
								return;
							}
							
							// If no greeting is showing and OrbitMain is not active, show greeting first
							console.log("[Frontend] Starting greeting animation for direct arrival");
							set({
								showGreeting: true,
								showMainApp: false,
								showRobotFace: false,
								greetingStage: "detecting",
							});
						}
						if (msg.type === "user_leaved" && get().isTablet) {
							console.log("[Frontend] User leaved detected");
							set({ userPresent: false });

							// Start a timer to show RobotFace after 15 seconds if no new user arrives
							// and no other active views are present
							setTimeout(() => {
								const state = get();
								if (
									!state.userPresent &&
									!state.photoBoothActive &&
									!state.aiEditActive &&
									!state.showGreeting &&
									state.showMainApp
								) {
									console.log(
										"[Frontend] 15s after user_leaved, showing RobotFace",
									);
									set({
										showMainApp: false,
										showRobotFace: true,
									});
								}
							}, 15000); // 15 seconds
						}
					} catch {
						// ignore non-JSON
					}
				};

				// Set up close handler
				ws.onclose = (event) => {
					console.log(
						"[Frontend] WebSocket connection closed:",
						event.code,
						event.reason,
					);
					globalWsReady = false;
					globalWsInstance = null;
					connectionLock = false;
					connectionPromise = null;
					set({ wsReady: false, ws: null });

					// Auto-reconnect with exponential backoff
					if (
						!event.wasClean &&
						get().reconnectAttempts < WS_CONFIG.maxReconnectAttempts
					) {
						const attempts = get().reconnectAttempts + 1;
						const delay = Math.min(
							WS_CONFIG.reconnectDelay * 2 ** (attempts - 1),
							WS_CONFIG.maxReconnectDelay,
						);

						console.log(
							`[Frontend] Reconnecting in ${delay}ms (attempt ${attempts}/${WS_CONFIG.maxReconnectAttempts})`,
						);
						set({ wsReconnecting: true, reconnectAttempts: attempts });

						setTimeout(() => {
							set({ wsReconnecting: false });
							get().connectWs();
						}, delay);
					}
				};

				// Clear locks
				connectionLock = false;
				connectionPromise = null;
				return ws;
			})
			.catch((error) => {
				console.error("[Frontend] WebSocket connection failed:", error);
				connectionLock = false;
				connectionPromise = null;
				set({ wsReady: false });
				throw error; // Re-throw to maintain Promise<WebSocket> type
			});

		// Set initial state
		set({ ws: null, wsReady: false });
	},

	// Cleanup function to close global connection
	disconnectWs: () => {
		if (globalWsInstance) {
			console.log("[Frontend] Disconnecting global WebSocket");
			globalWsInstance.close();
			globalWsInstance = null;
			globalWsReady = false;
		}
		connectionLock = false;
		connectionPromise = null;
		set({ ws: null, wsReady: false, wsReconnecting: false });
	},
	sendWs: (msg) => {
		const state = get();
		if (state.ws && state.ws.readyState === WebSocket.OPEN) {
			const messageStr = JSON.stringify(msg);
			console.log("[Frontend] Sending WebSocket message:", messageStr);
			state.ws.send(messageStr);
		} else {
			// Queue message for when connection is restored
			console.log("[Frontend] WebSocket not ready, queuing message:", msg);
			set({ messageQueue: [...state.messageQueue, msg] });

			// Try to reconnect if not already reconnecting
			if (!state.wsReconnecting) {
				get().connectWs();
			}
		}
	},
	setPhotoBoothActive: (val) => {
		set({ photoBoothActive: val });
	},
	setShowMainApp: (val) => {
		set({ showMainApp: val });
	},
	setIsRetakeRequested: (val) => {
		set({ isRetakeRequested: val });
	},
	setAiEditActive: (val) => {
		set({ aiEditActive: val });
	},
	setAiEditSessionId: (val) => {
		set({ aiEditSessionId: val });
	},
	setAiEditImage: (val) => {
		set({ aiEditImage: val });
	},
	setAiEditCurrentImage: (val) => {
		set({ aiEditCurrentImage: val });
	},
	setShowGreeting: (val) => {
		set({ showGreeting: val });
	},
	setShowRobotFace: (val) => {
		set({ showRobotFace: val });
	},
	setUserPresent: (val) => {
		set({ userPresent: val });
	},
	updateActivity: () => {
		set({ lastActivityTime: Date.now() });
	},
	setGreetingStage: (val) => {
		set({ greetingStage: val });
	},
}));
