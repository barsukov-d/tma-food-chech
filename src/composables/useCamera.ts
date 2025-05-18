import { ref } from "vue";
import { usePhotoCapture } from "./usePhotoCapture";

export function useCamera() {
	const videoRef = ref<HTMLVideoElement | null>(null);
	const errorMessage = ref<string>("");
	const streamRef = ref<MediaStream | null>(null);
	const cameraReady = ref<boolean>(false);

	// Используем композицию для работы с фото
	const {
		canvasRef,
		photoRef,
		hasPhoto,
		captureFromVideo,
		clearPhoto,
		savePhotoAsFile,
	} = usePhotoCapture();

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

		return captureFromVideo(videoRef.value);
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
