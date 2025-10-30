export function compressImage(
	base64Str: string,
	maxWidth = 1280,
	quality = 0.9,
): Promise<string> {
	if (maxWidth <= 0) {
		return Promise.reject(new Error("maxWidth must be positive"));
	}
	if (quality < 0 || quality > 1) {
		return Promise.reject(new Error("quality must be between 0 and 1"));
	}
	if (!base64Str.startsWith("data:image/")) {
		return Promise.reject(new Error("Invalid image data URL"));
	}
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.src = base64Str;
		img.onload = () => {
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");

			if (!ctx) {
				return reject(new Error("Failed to get canvas context"));
			}

			let { width, height } = img;

			if (width > height) {
				if (width > maxWidth) {
					height *= maxWidth / width;
					width = maxWidth;
				}
			} else {
				if (height > maxWidth) {
					width *= maxWidth / height;
					height = maxWidth;
				}
			}

			canvas.width = width;
			canvas.height = height;

			ctx.drawImage(img, 0, 0, width, height);

			resolve(canvas.toDataURL("image/jpeg", quality));
		};
		img.onerror = (error) => {
			reject(error);
		};
	});
}
