/**
 * AI Image Editing Session Management
 * Tracks active editing sessions between phone and tablet
 */

interface EditSession {
	sessionId: string;
	phoneId: string; // Client ID of the phone that initiated editing
	tabletId?: string; // Client ID of the tablet handling the editing
	originalImage: string; // Original image from phone
	currentImage: string; // Current state of the image (updated after each edit)
	createdAt: number; // Timestamp when session was created
	lastActivityAt: number; // Timestamp of last activity
}

// Active editing sessions
const activeSessions = new Map<string, EditSession>();

// Session timeout (30 minutes of inactivity)
const SESSION_TIMEOUT = 30 * 60 * 1000;

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
	return `edit_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Create a new editing session
 */
export function createEditSession(
	phoneId: string,
	originalImage: string,
): EditSession {
	const sessionId = generateSessionId();
	const now = Date.now();

	const session: EditSession = {
		sessionId,
		phoneId,
		originalImage,
		currentImage: originalImage, // Initially same as original
		createdAt: now,
		lastActivityAt: now,
	};

	activeSessions.set(sessionId, session);

	console.log(
		`[ImageEditSession] Created session ${sessionId} for phone ${phoneId}`,
	);
	console.log(`[ImageEditSession] Active sessions: ${activeSessions.size}`);

	return session;
}

/**
 * Get an existing editing session
 */
export function getEditSession(sessionId: string): EditSession | null {
	const session = activeSessions.get(sessionId);

	if (!session) {
		console.warn(
			`[ImageEditSession] Session ${sessionId} not found or expired`,
		);
		return null;
	}

	// Check if session has timed out
	const now = Date.now();
	if (now - session.lastActivityAt > SESSION_TIMEOUT) {
		console.warn(
			`[ImageEditSession] Session ${sessionId} has timed out, removing`,
		);
		activeSessions.delete(sessionId);
		return null;
	}

	return session;
}

/**
 * Assign a tablet to handle the editing session
 */
export function assignTabletToSession(
	sessionId: string,
	tabletId: string,
): boolean {
	const session = activeSessions.get(sessionId);

	if (!session) {
		console.error(
			`[ImageEditSession] Cannot assign tablet: session ${sessionId} not found`,
		);
		return false;
	}

	session.tabletId = tabletId;
	session.lastActivityAt = Date.now();

	console.log(
		`[ImageEditSession] Assigned tablet ${tabletId} to session ${sessionId}`,
	);

	return true;
}

/**
 * Update the current image in the session after an edit
 */
export function updateSessionImage(
	sessionId: string,
	editedImage: string,
): boolean {
	const session = activeSessions.get(sessionId);

	if (!session) {
		console.error(
			`[ImageEditSession] Cannot update image: session ${sessionId} not found`,
		);
		return false;
	}

	session.currentImage = editedImage;
	session.lastActivityAt = Date.now();

	console.log(`[ImageEditSession] Updated image for session ${sessionId}`);

	return true;
}

/**
 * Update last activity timestamp
 */
export function touchSession(sessionId: string): void {
	const session = activeSessions.get(sessionId);
	if (session) {
		session.lastActivityAt = Date.now();
	}
}

/**
 * Finalize and remove an editing session
 */
export function finalizeEditSession(sessionId: string): EditSession | null {
	const session = activeSessions.get(sessionId);

	if (!session) {
		console.warn(
			`[ImageEditSession] Cannot finalize: session ${sessionId} not found`,
		);
		return null;
	}

	activeSessions.delete(sessionId);

	console.log(`[ImageEditSession] Finalized session ${sessionId}`);
	console.log(`[ImageEditSession] Active sessions: ${activeSessions.size}`);

	return session;
}

/**
 * Cancel and remove an editing session
 */
export function cancelEditSession(sessionId: string): boolean {
	const existed = activeSessions.delete(sessionId);

	if (existed) {
		console.log(`[ImageEditSession] Cancelled session ${sessionId}`);
		console.log(`[ImageEditSession] Active sessions: ${activeSessions.size}`);
	} else {
		console.warn(
			`[ImageEditSession] Cannot cancel: session ${sessionId} not found`,
		);
	}

	return existed;
}

/**
 * Get all active sessions for a specific phone
 */
export function getSessionsByPhone(phoneId: string): EditSession[] {
	const sessions: EditSession[] = [];

	for (const session of activeSessions.values()) {
		if (session.phoneId === phoneId) {
			sessions.push(session);
		}
	}

	return sessions;
}

/**
 * Get all active sessions for a specific tablet
 */
export function getSessionsByTablet(tabletId: string): EditSession[] {
	const sessions: EditSession[] = [];

	for (const session of activeSessions.values()) {
		if (session.tabletId === tabletId) {
			sessions.push(session);
		}
	}

	return sessions;
}

/**
 * Clean up expired sessions (run periodically)
 */
export function cleanupExpiredSessions(): number {
	const now = Date.now();
	let cleaned = 0;

	for (const [sessionId, session] of activeSessions.entries()) {
		if (now - session.lastActivityAt > SESSION_TIMEOUT) {
			activeSessions.delete(sessionId);
			cleaned++;
			console.log(
				`[ImageEditSession] Cleaned up expired session ${sessionId}`,
			);
		}
	}

	if (cleaned > 0) {
		console.log(
			`[ImageEditSession] Cleaned up ${cleaned} expired sessions. Active: ${activeSessions.size}`,
		);
	}

	return cleaned;
}

/**
 * Get count of active sessions
 */
export function getActiveSessionCount(): number {
	return activeSessions.size;
}

// Schedule periodic cleanup every 10 minutes
setInterval(() => {
	cleanupExpiredSessions();
}, 10 * 60 * 1000);
