import { ref } from "vue";

// Типы для Telegram WebApp
declare global {
	interface Window {
		Telegram?: {
			WebApp?: {
				DeviceStorage?: {
					saveFile: (fileName: string, blob: Blob) => Promise<void>;
				};
			};
		};
	}
}

/**
 * Composable для захвата и обработки фотографий через canvas
 */
export function usePhotoCapture() {
	const canvasRef = ref<HTMLCanvasElement | null>(null);
	const photoRef = ref<HTMLImageElement | null>(null);
	const hasPhoto = ref<boolean>(false);

	/**
	 * Захват изображения из видеоэлемента
	 * @param videoElement Видеоэлемент, из которого нужно сделать снимок
	 * @returns URL данных изображения или null, если захват не удался
	 */
	const captureFromVideo = (videoElement: HTMLVideoElement) => {
		if (!canvasRef.value) {
			console.error("Canvas is not available");
			return null;
		}

		const canvas = canvasRef.value;

		console.log(
			"Taking photo with dimensions:",
			videoElement.videoWidth,
			"x",
			videoElement.videoHeight,
		);

		// Set canvas dimensions to match video
		canvas.width = videoElement.videoWidth || 320;
		canvas.height = videoElement.videoHeight || 240;

		// Draw the current video frame to the canvas
		const context = canvas.getContext("2d");
		if (context) {
			context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

			// Convert canvas to data URL
			const imageDataUrl = canvas.toDataURL("image/jpeg", 0.8);

			// Display the photo
			if (photoRef.value) {
				photoRef.value.src = imageDataUrl;
				hasPhoto.value = true;
			}

			return imageDataUrl;
		}

		return null;
	};

	/**
	 * Очистить захваченное фото
	 */
	const clearPhoto = () => {
		hasPhoto.value = false;
		if (photoRef.value) {
			photoRef.value.src = "";
		}
	};

	/**
	 * Сохранить фото как файл
	 * @param fileName Имя файла
	 */
	const savePhotoAsFile = async (fileName: string = "food-photo.jpg") => {
		if (!photoRef.value || !photoRef.value.src) {
			console.error("No photo available to save");
			return null;
		}

		try {
			// Проверяем доступность DeviceStorage
			if (window.Telegram?.WebApp?.DeviceStorage) {
				// Конвертируем base64 в Blob
				const response = await fetch(photoRef.value.src);
				const blob = await response.blob();

				// Сохраняем в DeviceStorage
				await window.Telegram.WebApp.DeviceStorage.saveFile(
					fileName,
					blob,
				);
				return true;
			} else {
				// Fallback на стандартное сохранение через браузер
				const link = document.createElement("a");
				link.href = photoRef.value.src;
				link.download = fileName;
				link.click();
				return true;
			}
		} catch (error) {
			console.error("Error saving photo:", error);
			return false;
		}
	};

	return {
		canvasRef,
		photoRef,
		hasPhoto,
		captureFromVideo,
		clearPhoto,
		savePhotoAsFile,
	};
}
