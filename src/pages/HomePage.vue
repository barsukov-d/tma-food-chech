<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import AppPage from "@/components/AppPage.vue";
import { useCamera } from "@/composables/useCamera";

// Используем composable для камеры
const {
	videoRef,
	canvasRef,
	photoRef,
	errorMessage,
	hasPhoto,
	cameraReady,
	takePhoto,
	clearPhoto,
	savePhotoAsFile,
	initialize,
	cleanup,
} = useCamera();

// Инициализируем камеру при монтировании компонента
onMounted(() => {
	initialize();
});

// Очищаем ресурсы при размонтировании компонента
onUnmounted(() => {
	cleanup();
});
</script>

<template>
	<AppPage title="Food Photo Capture" :back="false">
		<div class="camera-container">
			<div v-if="errorMessage" class="error-message">
				{{ errorMessage }}
			</div>

			<div v-if="!hasPhoto" class="camera-view">
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
					ref="photoRef"
					class="captured-photo"
					alt="Captured food"
				/>
				<div class="photo-actions">
					<button
						@click="clearPhoto"
						class="action-btn action-btn-danger"
					>
						Retake
					</button>
					<button
						@click="savePhotoAsFile('my-food.jpg')"
						class="action-btn action-btn-success"
					>
						Save Photo
					</button>
				</div>
			</div>

			<!-- Hidden canvas used for processing -->
			<canvas ref="canvasRef" class="hidden-canvas"></canvas>
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
