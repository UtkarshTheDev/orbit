import type { Server } from "bun";
import type { BunWebSocketData } from "hono/bun";
import { editImageWithQwen } from "../../services/imageEditService";
import { broadcastToTablets } from "../broadcast";
import type { WSConnection } from "../connection";
import { clientRoles, connectionsById } from "../connection";
import {
	assignTabletToSession,
	cancelEditSession,
	createEditSession,
	finalizeEditSession,
	getEditSession,
	touchSession,
	updateSessionImage,
} from "../imageEditSession";

/**
 * Handle "start_ai_edit" message from phone
 * Phone initiates AI editing by sending the original image
 */
export async function handleStartAIEdit(
	ws: WSConnection,
	server: Server<BunWebSocketData>,
	msg: any,
) {
	console.log(`[ImageEditHandler] Phone ${ws.id} started AI edit`);

	// Validate that this is a phone client
	const role = clientRoles.get(ws.id);
	if (role !== "phone") {
		console.warn(
			`[ImageEditHandler] Client ${ws.id} is not a phone, rejecting edit request`,
		);
		ws.send(
			JSON.stringify({
				type: "ai_edit_error",
				error: "Only phone clients can initiate image editing",
			}),
		);
		return;
	}

	// Validate image data
	if (!msg.image || typeof msg.image !== "string") {
		console.error(
			`[ImageEditHandler] Invalid image data from phone ${ws.id}`,
		);
		ws.send(
			JSON.stringify({
				type: "ai_edit_error",
				error: "Invalid image data",
			}),
		);
		return;
	}

	// Create editing session
	const session = createEditSession(ws.id, msg.image);

	// Send confirmation to phone
	ws.send(
		JSON.stringify({
			type: "ai_edit_started",
			sessionId: session.sessionId,
		}),
	);

	// Broadcast to all tablets to pick up the editing request
	console.log(
		`[ImageEditHandler] Broadcasting edit request to tablets for session ${session.sessionId}`,
	);
	broadcastToTablets(server, {
		type: "ai_edit_request",
		sessionId: session.sessionId,
		image: msg.image,
		phoneId: ws.id,
	});
}

/**
 * Handle "ai_edit_accept" message from tablet
 * Tablet accepts the editing request
 */
export async function handleAIEditAccept(ws: WSConnection, msg: any) {
	console.log(
		`[ImageEditHandler] Tablet ${ws.id} accepted edit session ${msg.sessionId}`,
	);

	// Validate that this is a tablet client
	const role = clientRoles.get(ws.id);
	if (role !== "tablet") {
		console.warn(
			`[ImageEditHandler] Client ${ws.id} is not a tablet, rejecting accept`,
		);
		ws.send(
			JSON.stringify({
				type: "ai_edit_error",
				sessionId: msg.sessionId,
				error: "Only tablet clients can accept editing requests",
			}),
		);
		return;
	}

	// Validate session exists
	const session = getEditSession(msg.sessionId);
	if (!session) {
		console.error(
			`[ImageEditHandler] Session ${msg.sessionId} not found or expired`,
		);
		ws.send(
			JSON.stringify({
				type: "ai_edit_error",
				sessionId: msg.sessionId,
				error: "Session not found or expired",
			}),
		);
		return;
	}

	// Assign tablet to session
	assignTabletToSession(msg.sessionId, ws.id);

	// Send confirmation to tablet
	ws.send(
		JSON.stringify({
			type: "ai_edit_accepted",
			sessionId: msg.sessionId,
		}),
	);

	console.log(
		`[ImageEditHandler] Session ${msg.sessionId} now handled by tablet ${ws.id}`,
	);
}

/**
 * Handle "ai_edit_prompt" message from tablet
 * Tablet sends editing prompt to process the image
 */
export async function handleAIEditPrompt(ws: WSConnection, msg: any) {
	console.log(
		`[ImageEditHandler] Tablet ${ws.id} sent prompt for session ${msg.sessionId}`,
	);
	console.log(`[ImageEditHandler] Prompt: "${msg.prompt}"`);

	// Validate that this is a tablet client
	const role = clientRoles.get(ws.id);
	if (role !== "tablet") {
		console.warn(
			`[ImageEditHandler] Client ${ws.id} is not a tablet, rejecting prompt`,
		);
		ws.send(
			JSON.stringify({
				type: "ai_edit_error",
				sessionId: msg.sessionId,
				error: "Only tablet clients can send editing prompts",
			}),
		);
		return;
	}

	// Validate session exists
	const session = getEditSession(msg.sessionId);
	if (!session) {
		console.error(
			`[ImageEditHandler] Session ${msg.sessionId} not found or expired`,
		);
		ws.send(
			JSON.stringify({
				type: "ai_edit_error",
				sessionId: msg.sessionId,
				error: "Session not found or expired",
			}),
		);
		return;
	}

	// Validate tablet is assigned to this session
	if (session.tabletId !== ws.id) {
		console.warn(
			`[ImageEditHandler] Tablet ${ws.id} is not assigned to session ${msg.sessionId}`,
		);
		ws.send(
			JSON.stringify({
				type: "ai_edit_error",
				sessionId: msg.sessionId,
				error: "You are not assigned to this editing session",
			}),
		);
		return;
	}

	// Validate prompt
	if (!msg.prompt || typeof msg.prompt !== "string") {
		console.error(
			`[ImageEditHandler] Invalid prompt from tablet ${ws.id}`,
		);
		ws.send(
			JSON.stringify({
				type: "ai_edit_error",
				sessionId: msg.sessionId,
				error: "Invalid prompt",
			}),
		);
		return;
	}

	// Update session activity
	touchSession(msg.sessionId);

	// Send processing status to tablet
	ws.send(
		JSON.stringify({
			type: "ai_edit_processing",
			sessionId: msg.sessionId,
			stage: "processing",
		}),
	);

	try {
		// Call AI service to edit the image
		const result = await editImageWithQwen({
			image: session.currentImage,
			prompt: msg.prompt,
			negativePrompt: msg.negativePrompt,
		});

		if (!result.success || !result.editedImage) {
			console.error(
				`[ImageEditHandler] Image editing failed: ${result.error}`,
			);
			ws.send(
				JSON.stringify({
					type: "ai_edit_error",
					sessionId: msg.sessionId,
					error: result.error || "Image editing failed",
				}),
			);
			return;
		}

		// Update session with edited image
		updateSessionImage(msg.sessionId, result.editedImage);

		// Send edited image back to tablet
		console.log(
			`[ImageEditHandler] Sending edited image to tablet ${ws.id} for session ${msg.sessionId}`,
		);
		ws.send(
			JSON.stringify({
				type: "ai_edit_result",
				sessionId: msg.sessionId,
				image: result.editedImage,
				success: true,
			}),
		);
	} catch (error) {
		console.error(
			`[ImageEditHandler] Error processing edit for session ${msg.sessionId}:`,
			error,
		);
		ws.send(
			JSON.stringify({
				type: "ai_edit_error",
				sessionId: msg.sessionId,
				error:
					error instanceof Error
						? error.message
						: "Unknown error during image editing",
			}),
		);
	}
}

/**
 * Handle "ai_edit_finalize" message from tablet
 * Tablet sends final edited image to be delivered to phone
 */
export async function handleAIEditFinalize(ws: WSConnection, msg: any) {
	console.log(
		`[ImageEditHandler] Tablet ${ws.id} finalized session ${msg.sessionId}`,
	);

	// Validate that this is a tablet client
	const role = clientRoles.get(ws.id);
	if (role !== "tablet") {
		console.warn(
			`[ImageEditHandler] Client ${ws.id} is not a tablet, rejecting finalize`,
		);
		ws.send(
			JSON.stringify({
				type: "ai_edit_error",
				sessionId: msg.sessionId,
				error: "Only tablet clients can finalize editing",
			}),
		);
		return;
	}

	// Get and finalize session
	const session = finalizeEditSession(msg.sessionId);
	if (!session) {
		console.error(
			`[ImageEditHandler] Session ${msg.sessionId} not found or expired`,
		);
		ws.send(
			JSON.stringify({
				type: "ai_edit_error",
				sessionId: msg.sessionId,
				error: "Session not found or expired",
			}),
		);
		return;
	}

	// Validate tablet is assigned to this session
	if (session.tabletId !== ws.id) {
		console.warn(
			`[ImageEditHandler] Tablet ${ws.id} is not assigned to session ${msg.sessionId}`,
		);
		ws.send(
			JSON.stringify({
				type: "ai_edit_error",
				sessionId: msg.sessionId,
				error: "You are not assigned to this editing session",
			}),
		);
		return;
	}

	// Get the final image (either from message or from session)
	const finalImage = msg.finalImage || session.currentImage;

	// Send final edited image to the original phone
	const phoneConnection = connectionsById.get(session.phoneId);
	if (!phoneConnection) {
		console.error(
			`[ImageEditHandler] Phone ${session.phoneId} not found or disconnected`,
		);
		ws.send(
			JSON.stringify({
				type: "ai_edit_error",
				sessionId: msg.sessionId,
				error: "Original phone is no longer connected",
			}),
		);
		return;
	}

	console.log(
		`[ImageEditHandler] Sending final edited image to phone ${session.phoneId}`,
	);
	phoneConnection.send(
		JSON.stringify({
			type: "ai_edit_complete",
			sessionId: msg.sessionId,
			editedImage: finalImage,
		}),
	);

	// Send confirmation to tablet
	ws.send(
		JSON.stringify({
			type: "ai_edit_finalized",
			sessionId: msg.sessionId,
		}),
	);

	console.log(
		`[ImageEditHandler] Session ${msg.sessionId} completed successfully`,
	);
}

/**
 * Handle "ai_edit_cancel" message from phone or tablet
 * Cancel an active editing session
 */
export async function handleAIEditCancel(ws: WSConnection, msg: any) {
	console.log(
		`[ImageEditHandler] Client ${ws.id} cancelled session ${msg.sessionId}`,
	);

	// Get session before canceling
	const session = getEditSession(msg.sessionId);
	if (!session) {
		console.warn(
			`[ImageEditHandler] Session ${msg.sessionId} not found or already cancelled`,
		);
		ws.send(
			JSON.stringify({
				type: "ai_edit_cancelled",
				sessionId: msg.sessionId,
			}),
		);
		return;
	}

	// Validate that the client is part of this session
	const role = clientRoles.get(ws.id);
	const isPhone = role === "phone" && session.phoneId === ws.id;
	const isTablet = role === "tablet" && session.tabletId === ws.id;

	if (!isPhone && !isTablet) {
		console.warn(
			`[ImageEditHandler] Client ${ws.id} is not part of session ${msg.sessionId}`,
		);
		ws.send(
			JSON.stringify({
				type: "ai_edit_error",
				sessionId: msg.sessionId,
				error: "You are not part of this editing session",
			}),
		);
		return;
	}

	// Cancel the session
	cancelEditSession(msg.sessionId);

	// Notify phone if cancellation came from tablet
	if (isTablet && session.phoneId) {
		const phoneConnection = connectionsById.get(session.phoneId);
		if (phoneConnection) {
			phoneConnection.send(
				JSON.stringify({
					type: "ai_edit_cancelled",
					sessionId: msg.sessionId,
				}),
			);
		}
	}

	// Notify tablet if cancellation came from phone
	if (isPhone && session.tabletId) {
		const tabletConnection = connectionsById.get(session.tabletId);
		if (tabletConnection) {
			tabletConnection.send(
				JSON.stringify({
					type: "ai_edit_cancelled",
					sessionId: msg.sessionId,
				}),
			);
		}
	}

	// Send confirmation to requester
	ws.send(
		JSON.stringify({
			type: "ai_edit_cancelled",
			sessionId: msg.sessionId,
		}),
	);

	console.log(`[ImageEditHandler] Session ${msg.sessionId} cancelled`);
}
