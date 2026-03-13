/**
 * Audio Recorder Utility for VASpeak
 * 
 * Shared recording logic for Drilling (Block 2) and Roleplay (Block 3).
 * Uses MediaRecorder API with proper cleanup, timer, and visual feedback state.
 * 
 * SSR-safe: all browser APIs are guarded behind typeof checks.
 */

export type RecorderState = 'idle' | 'recording' | 'processing';

export interface AudioRecorderOptions {
	/** Max recording time in seconds (default: 30) */
	maxDuration?: number;
	/** MIME type preference (default: audio/webm) */
	mimeType?: string;
	/** Called when recording starts */
	onStart?: () => void;
	/** Called when recording stops and blob is ready */
	onStop?: (blob: Blob) => void;
	/** Called on error */
	onError?: (error: string) => void;
	/** Called every second with elapsed seconds */
	onTick?: (seconds: number) => void;
}

export function createAudioRecorder(opts: AudioRecorderOptions = {}) {
	const maxDuration = opts.maxDuration ?? 30;

	let mediaRecorder: MediaRecorder | null = null;
	let audioChunks: Blob[] = [];
	let stream: MediaStream | null = null;
	let timerInterval: ReturnType<typeof setInterval> | null = null;
	let elapsed = 0;

	function getMimeType(): string {
		if (typeof MediaRecorder === 'undefined') return 'audio/webm';
		// Prefer webm/opus, fallback to mp4/aac for Safari
		const types = [
			opts.mimeType,
			'audio/webm;codecs=opus',
			'audio/webm',
			'audio/mp4',
			'audio/ogg;codecs=opus',
		].filter(Boolean) as string[];
		return types.find(t => MediaRecorder.isTypeSupported(t)) || 'audio/webm';
	}

	async function start() {
		if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
			opts.onError?.('Trình duyệt không hỗ trợ ghi âm');
			return;
		}

		try {
			audioChunks = [];
			elapsed = 0;
			stream = await navigator.mediaDevices.getUserMedia({
				audio: {
					echoCancellation: true,
					noiseSuppression: true,
					autoGainControl: true,
				}
			});

			const mimeType = getMimeType();
			mediaRecorder = new MediaRecorder(stream, { mimeType });

			mediaRecorder.ondataavailable = (e) => {
				if (e.data.size > 0) audioChunks.push(e.data);
			};

			mediaRecorder.onstop = () => {
				cleanup();
				const blob = new Blob(audioChunks, { type: mimeType });
				opts.onStop?.(blob);
			};

			mediaRecorder.onerror = () => {
				cleanup();
				opts.onError?.('Ghi âm bị lỗi, vui lòng thử lại');
			};

			// Request data every 250ms for smoother processing
			mediaRecorder.start(250);

			// Start timer
			timerInterval = setInterval(() => {
				elapsed++;
				opts.onTick?.(elapsed);
				if (elapsed >= maxDuration) {
					stop();
				}
			}, 1000);

			opts.onStart?.();
		} catch (e: any) {
			cleanup();
			if (e.name === 'NotAllowedError') {
				opts.onError?.('Bạn chưa cấp quyền sử dụng micro. Vui lòng cho phép trong cài đặt trình duyệt.');
			} else if (e.name === 'NotFoundError') {
				opts.onError?.('Không tìm thấy microphone. Vui lòng kết nối mic và thử lại.');
			} else {
				opts.onError?.(`Lỗi microphone: ${e.message}`);
			}
		}
	}

	function stop() {
		if (mediaRecorder && mediaRecorder.state !== 'inactive') {
			mediaRecorder.stop();
		}
	}

	function cleanup() {
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}
		if (stream) {
			stream.getTracks().forEach(t => t.stop());
			stream = null;
		}
		mediaRecorder = null;
	}

	function destroy() {
		stop();
		cleanup();
	}

	return { start, stop, destroy };
}

/**
 * Format seconds as MM:SS
 */
export function formatRecordTime(seconds: number): string {
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Send audio blob to /api/transcribe and return transcription text.
 */
export async function transcribeAudio(
	blob: Blob,
	contextPrompt?: string,
	filename = 'recording.webm'
): Promise<{ text: string } | { error: string }> {
	const formData = new FormData();
	formData.append('audio', blob, filename);
	if (contextPrompt) {
		formData.append('prompt', contextPrompt.slice(-500));
	}

	try {
		const res = await fetch('/api/transcribe', { method: 'POST', body: formData });
		const j = await res.json();
		if (!res.ok) return { error: j.error || 'Lỗi nhận diện giọng nói' };
		return { text: j.text };
	} catch (e: any) {
		return { error: `Lỗi kết nối: ${e.message}` };
	}
}
