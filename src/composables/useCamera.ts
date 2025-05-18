import { ref } from "vue";
import { usePhotoCapture } from "./usePhotoCapture";

export function useCamera() {
	const videoRef = ref<HTMLVideoElement | null>(null);
	const errorMessage = ref<string>("");
	const streamRef = ref<MediaStream | null>(null);
	const cameraReady = ref<boolean>(false);

	// Используем композицию для работы с фото
	const { canvasRef, photoRef, hasPhoto, clearPhoto, savePhotoAsFile } =
		usePhotoCapture();

	// Start the camera stream
	const startCamera = async () => {
		try {
			// Reset states
			errorMessage.value = "";
			clearPhoto();
			cameraReady.value = false;

			// Access the camera with video only (no audio)
			const constraints = {
				video: {
					facingMode: "environment", // Use back camera if available
					width: { ideal: 1280 },
					height: { ideal: 720 },
				},
				audio: false,
			};

			console.log(
				"Requesting camera access with constraints:",
				constraints,
			);
			const stream =
				await navigator.mediaDevices.getUserMedia(constraints);

			streamRef.value = stream;

			// Connect the stream to the video element
			if (videoRef.value) {
				videoRef.value.srcObject = stream;
				// Ensure we have a valid video by waiting for metadata
				videoRef.value.onloadedmetadata = () => {
					console.log("Video metadata loaded");
					if (videoRef.value) {
						videoRef.value
							.play()
							.then(() => {
								console.log("Video playback started");
								cameraReady.value = true;
							})
							.catch((err) => {
								console.error(
									"Error starting video playback:",
									err,
								);
								errorMessage.value =
									"Could not start camera playback.";
							});
					}
				};
			}
		} catch (err) {
			console.error("Error accessing camera:", err);
			errorMessage.value =
				"Camera access denied or not available: " +
				(err instanceof Error ? err.message : String(err));
		}
	};

	// Take a photo from the video stream
	const takePhoto = () => {
		if (!videoRef.value || !cameraReady.value) {
			console.log("Cannot take photo yet - video not ready");
			return null;
		}

		if (!canvasRef.value) {
			console.error("Canvas is not available");
			return null;
		}

		const canvas = canvasRef.value;
		const video = videoRef.value;

		console.log(
			"Taking photo with dimensions:",
			video.videoWidth,
			"x",
			video.videoHeight,
		);

		// Set canvas dimensions to match video
		canvas.width = video.videoWidth || 320;
		canvas.height = video.videoHeight || 240;

		// Draw the current video frame to the canvas
		const context = canvas.getContext("2d");
		if (context) {
			context.drawImage(video, 0, 0, canvas.width, canvas.height);

			// Convert canvas to data URL
			const imageDataUrl = canvas.toDataURL("image/jpeg", 0.8);

			// Display the photo
			if (photoRef.value) {
				photoRef.value.src = imageDataUrl;
				hasPhoto.value = true;
				console.log(
					"Photo captured and hasPhoto set to:",
					hasPhoto.value,
				);
			}

			return imageDataUrl;
		}

		return null;
	};

	// Stop all media streams
	const stopCamera = () => {
		if (streamRef.value) {
			streamRef.value.getTracks().forEach((track) => {
				console.log("Stopping track:", track.kind);
				track.stop();
			});
			streamRef.value = null;
		}

		if (videoRef.value) {
			videoRef.value.srcObject = null;
		}

		cameraReady.value = false;
	};

	// Restart camera if visibility changes (helps with mobile browsers)
	const handleVisibilityChange = () => {
		if (document.visibilityState === "visible") {
			if (!streamRef.value) {
				console.log("Document became visible, restarting camera");
				startCamera();
			}
		} else {
			console.log("Document hidden, stopping camera");
			stopCamera();
		}
	};

	// Setup visibility change handler
	const setupVisibilityHandling = () => {
		document.addEventListener("visibilitychange", handleVisibilityChange);
	};

	// Cleanup visibility change handler
	const cleanupVisibilityHandling = () => {
		document.removeEventListener(
			"visibilitychange",
			handleVisibilityChange,
		);
	};

	// Initialize camera on component mount
	const initialize = () => {
		console.log("Initializing camera");
		startCamera();
		setupVisibilityHandling();
	};

	// Cleanup on component unmount
	const cleanup = () => {
		console.log("Cleaning up camera");
		stopCamera();
		cleanupVisibilityHandling();
	};

	return {
		// Refs
		videoRef,
		canvasRef,
		photoRef,
		errorMessage,
		hasPhoto,
		cameraReady,

		// Methods
		startCamera,
		stopCamera,
		takePhoto,
		clearPhoto,
		savePhotoAsFile,
		initialize,
		cleanup,
	};
}
