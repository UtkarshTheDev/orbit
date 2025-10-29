import { HUGGINGFACE_API_TOKEN, IMAGE_EDIT_TIMEOUT } from "../config";

const QWEN_IMAGE_EDIT_API_URL =
	"https://api-inference.huggingface.co/models/Qwen/Qwen-Image-Edit";

interface ImageEditRequest {
	image: string; // Base64 encoded image (with or without data URL prefix)
	prompt: string; // Natural language editing instruction
	negativePrompt?: string; // Optional: what to avoid in the edit
}

interface ImageEditResponse {
	success: boolean;
	editedImage?: string; // Base64 encoded edited image
	error?: string;
}

/**
 * Converts a data URL to base64 string without the prefix
 */
function extractBase64FromDataUrl(dataUrl: string): string {
	if (dataUrl.startsWith("data:")) {
		const base64Index = dataUrl.indexOf("base64,");
		if (base64Index !== -1) {
			return dataUrl.substring(base64Index + 7);
		}
	}
	return dataUrl;
}

/**
 * Converts base64 string to Blob for API request
 */
function base64ToBlob(base64: string, mimeType = "image/png"): Blob {
	const cleanBase64 = extractBase64FromDataUrl(base64);
	const byteCharacters = atob(cleanBase64);
	const byteNumbers = new Array(byteCharacters.length);

	for (let i = 0; i < byteCharacters.length; i++) {
		byteNumbers[i] = byteCharacters.charCodeAt(i);
	}

	const byteArray = new Uint8Array(byteNumbers);
	return new Blob([byteArray], { type: mimeType });
}

/**
 * Converts Blob to base64 data URL
 */
async function blobToBase64(blob: Blob): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => resolve(reader.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(blob);
	});
}

/**
 * Edit an image using Qwen-Image-Edit model via Hugging Face Inference API
 */
export async function editImageWithQwen(
	request: ImageEditRequest,
): Promise<ImageEditResponse> {
	console.log("[ImageEditService] Starting image edit with Qwen-Image-Edit");
	console.log(`[ImageEditService] Prompt: "${request.prompt}"`);

	// Validate API token
	if (!HUGGINGFACE_API_TOKEN) {
		console.error(
			"[ImageEditService] HUGGINGFACE_API_TOKEN is not configured",
		);
		return {
			success: false,
			error:
				"Hugging Face API token is not configured. Please set HUGGINGFACE_API_TOKEN in .env",
		};
	}

	try {
		// Convert base64 image to Blob
		const imageBlob = base64ToBlob(request.image);
		console.log(
			`[ImageEditService] Image blob size: ${(imageBlob.size / 1024).toFixed(2)} KB`,
		);

		// Prepare request payload
		const payload = {
			inputs: request.image, // Send base64 directly
			parameters: {
				prompt: request.prompt,
				...(request.negativePrompt && {
					negative_prompt: request.negativePrompt,
				}),
			},
		};

		console.log("[ImageEditService] Sending request to Hugging Face API...");

		// Create abort controller for timeout
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), IMAGE_EDIT_TIMEOUT);

		// Make API request
		const response = await fetch(QWEN_IMAGE_EDIT_API_URL, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${HUGGINGFACE_API_TOKEN}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
			signal: controller.signal,
		});

		clearTimeout(timeoutId);

		// Check response status
		if (!response.ok) {
			const errorText = await response.text();
			console.error(
				`[ImageEditService] API error: ${response.status} - ${errorText}`,
			);

			// Handle specific error cases
			if (response.status === 503) {
				return {
					success: false,
					error:
						"Model is loading. Please try again in a few moments. (This is common for the first request)",
				};
			}

			if (response.status === 401) {
				return {
					success: false,
					error: "Invalid Hugging Face API token. Please check your configuration.",
				};
			}

			return {
				success: false,
				error: `API request failed: ${response.status} - ${errorText}`,
			};
		}

		// Parse response
		const contentType = response.headers.get("content-type");

		if (contentType?.includes("application/json")) {
			// Response is JSON (might contain base64 or URL)
			const jsonResponse = await response.json();
			console.log("[ImageEditService] Received JSON response");

			// Handle different response formats
			if (jsonResponse.images && jsonResponse.images[0]) {
				// Format: { images: ["data:image/png;base64,..."] }
				return {
					success: true,
					editedImage: jsonResponse.images[0],
				};
			}

			if (jsonResponse[0] && typeof jsonResponse[0] === "string") {
				// Format: ["data:image/png;base64,..."]
				return {
					success: true,
					editedImage: jsonResponse[0],
				};
			}

			console.error(
				"[ImageEditService] Unexpected JSON response format:",
				jsonResponse,
			);
			return {
				success: false,
				error: "Unexpected response format from API",
			};
		}

		if (contentType?.includes("image/")) {
			// Response is raw image blob
			console.log("[ImageEditService] Received image blob response");
			const imageBlob = await response.blob();
			const base64Image = await blobToBase64(imageBlob);

			return {
				success: true,
				editedImage: base64Image,
			};
		}

		// Unknown content type
		console.error(
			`[ImageEditService] Unexpected content type: ${contentType}`,
		);
		return {
			success: false,
			error: `Unexpected response content type: ${contentType}`,
		};
	} catch (error) {
		if (error instanceof Error) {
			if (error.name === "AbortError") {
				console.error("[ImageEditService] Request timeout");
				return {
					success: false,
					error: "Image editing request timed out. Please try again.",
				};
			}

			console.error("[ImageEditService] Error:", error.message);
			return {
				success: false,
				error: `Image editing failed: ${error.message}`,
			};
		}

		console.error("[ImageEditService] Unknown error:", error);
		return {
			success: false,
			error: "An unknown error occurred during image editing",
		};
	}
}
