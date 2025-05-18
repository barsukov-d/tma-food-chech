<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import AppPage from "@/components/AppPage.vue";
import { useCamera } from "@/composables/useCamera";

// Локальное состояние для отображения фото
const localHasPhoto = ref(false);
const capturedPhotoSrc = ref("");

// Используем composable для камеры
const {
	videoRef,
	canvasRef,
	photoRef,
	errorMessage,
	cameraReady,
	initialize,
	cleanup,
	savePhotoAsFile,
	clearPhoto,
	startCamera,
} = useCamera();

// Инициализируем камеру при монтировании компонента
onMounted(() => {
	initialize();
});

// Очищаем ресурсы при размонтировании компонента
onUnmounted(() => {
	cleanup();
});

// Собственная функция для захвата фото
const takePhoto = () => {
	if (!videoRef.value || !cameraReady.value || !canvasRef.value) {
		console.error("Camera or canvas not ready");
		return;
	}

	try {
		const canvas = canvasRef.value;
		const video = videoRef.value;

		console.log(
			"Taking photo with dimensions:",
			video.videoWidth,
			"x",
			video.videoHeight,
		);

		// Установка размеров canvas
		canvas.width = video.videoWidth || 320;
		canvas.height = video.videoHeight || 240;

		// Рисуем текущий кадр видео на canvas
		const context = canvas.getContext("2d");
		if (context) {
			context.drawImage(video, 0, 0, canvas.width, canvas.height);

			// Преобразуем canvas в URL
			const imageDataUrl = canvas.toDataURL("image/jpeg", 0.8);

			// Сохраняем URL и меняем состояние
			capturedPhotoSrc.value = imageDataUrl;
			localHasPhoto.value = true;

			if (photoRef.value) {
				photoRef.value.src = imageDataUrl;
			}

			console.log("Photo captured successfully, hasPhoto set to true");
		}
	} catch (error) {
		console.error("Error taking photo:", error);
	}
};

// Сброс фото и перезапуск камеры
const resetPhoto = async () => {
	localHasPhoto.value = false;
	capturedPhotoSrc.value = "";
	clearPhoto();

	// Перезапускаем камеру чтобы избежать черного экрана
	console.log("Restarting camera after reset");
	await startCamera();
};

// Сохранение фото в файл
const savePhoto = (fileName: string) => {
	savePhotoAsFile(fileName);
};
</script>

<template>
	<AppPage title="Food Photo Capture" :back="false">
		<div class="camera-container">
			<div v-if="errorMessage" class="error-message">
				{{ errorMessage }}
			</div>

			<div v-if="!localHasPhoto" class="camera-view">
				<video
					ref="videoRef"
					autoplay
					muted
					playsinline
					webkit-playsinline="true"
					class="video-preview"
				></video>
				<button
					@click="takePhoto"
					class="capture-btn"
					:disabled="!cameraReady"
				>
					{{ cameraReady ? "Take Photo" : "Preparing Camera..." }}
				</button>
			</div>

			<div v-else class="photo-view">
				<img
					:src="capturedPhotoSrc"
					ref="photoRef"
					class="captured-photo"
					alt="Captured food"
				/>
				<div class="photo-actions">
					<button
						@click="resetPhoto"
						class="action-btn action-btn-danger"
					>
						Retake
					</button>
					<button
						@click="savePhoto('my-food.jpg')"
						class="action-btn action-btn-success"
					>
						Save Photo
					</button>
				</div>
			</div>

			<!-- Hidden canvas used for processing -->
			<canvas ref="canvasRef" class="hidden-canvas"></canvas>

			<!-- Для отладки -->
			<div
				class="debug-info"
				style="
					margin-top: 15px;
					padding: 10px;
					background: #f5f5f5;
					border-radius: 8px;
				"
			>
				<div>
					Status: {{ localHasPhoto ? "Photo captured" : "No photo" }}
				</div>
				<div v-if="capturedPhotoSrc">
					Photo URL length: {{ capturedPhotoSrc.length }}
				</div>
				<button
					@click="localHasPhoto = true"
					style="
						margin-top: 5px;
						padding: 5px 10px;
						background: #007aff;
						color: white;
						border: none;
						border-radius: 4px;
					"
				>
					Force hasPhoto=true
				</button>
				<button
					@click="localHasPhoto = false"
					style="
						margin-top: 5px;
						padding: 5px 10px;
						background: #ff3b30;
						color: white;
						border: none;
						border-radius: 4px;
						margin-left: 5px;
					"
				>
					Force hasPhoto=false
				</button>
			</div>
		</div>
	</AppPage>
</template>

<style>
.camera-container {
	display: flex;
	flex-direction: column;
	align-items: center;
	width: 100%;
}

.error-message {
	color: red;
	margin-bottom: 15px;
	text-align: center;
	padding: 10px;
	background-color: rgba(255, 0, 0, 0.1);
	border-radius: 8px;
	width: 100%;
}

.camera-view,
.photo-view {
	width: 100%;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.video-preview {
	width: 100%;
	max-width: 100%;
	max-height: 70vh;
	object-fit: cover;
	margin-bottom: 15px;
	background-color: #000;
	border-radius: 8px;
}

.captured-photo {
	width: 100%;
	max-width: 100%;
	max-height: 70vh;
	object-fit: contain;
	margin-bottom: 15px;
	background-color: #000;
	border-radius: 8px;
}

.capture-btn {
	background-color: #007aff;
	color: white;
	padding: 12px 24px;
	border-radius: 8px;
	border: none;
	font-size: 16px;
	margin-top: 10px;
	cursor: pointer;
}

.capture-btn:disabled {
	background-color: #999;
	cursor: not-allowed;
}

.photo-actions {
	display: flex;
	justify-content: center;
	gap: 15px;
	margin-top: 15px;
}

.action-btn {
	padding: 10px 20px;
	border-radius: 8px;
	border: none;
	font-size: 14px;
	cursor: pointer;
	color: white;
}

.action-btn-danger {
	background-color: #ff3b30;
}

.action-btn-success {
	background-color: #34c759;
}

.hidden-canvas {
	display: none;
}
</style>
