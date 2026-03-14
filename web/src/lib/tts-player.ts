/**
 * TTS Player Logic — Pure, testable utility for Groq Orpheus TTS playback.
 * Handles fetching audio from /api/tts, caching blob URLs, and Web Audio API visualization.
 * 
 * SSR-safe: all browser APIs guarded.
 */

export type TTSState = 'idle' | 'loading' | 'speaking' | 'paused';

export interface TTSPlayerCallbacks {
	onStateChange: (state: TTSState) => void;
	onError: (msg: string) => void;
	onBarsUpdate: (heights: number[]) => void;
}

const BAR_COUNT = 32;

/** Generate idle wave shape */
export function idleBars(): number[] {
	return Array.from({ length: BAR_COUNT }, (_, i) => 4 + Math.sin(i * 0.6) * 3);
}

/**
 * Fetch TTS audio from the server. Pure fetch wrapper — easily mockable.
 */
export async function fetchTTSAudio(
	text: string,
	voice?: string,
	fetchFn: typeof fetch = fetch
): Promise<{ blobUrl: string } | { error: string }> {
	try {
		const res = await fetchFn('/api/tts', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ text, voice })
		});
		if (!res.ok) {
			const j = await res.json().catch(() => ({})) as any;
			return { error: j.error || 'TTS generation failed' };
		}
		const blob = await res.blob();
		const blobUrl = URL.createObjectURL(blob);
		return { blobUrl };
	} catch (e: any) {
		return { error: `Lỗi kết nối: ${e.message}` };
	}
}

/**
 * Create a TTS player instance with audio visualization.
 * Returns control methods: toggle, stop, destroy.
 */
export function createTTSPlayer(callbacks: TTSPlayerCallbacks) {
	let state: TTSState = 'idle';
	let audio: HTMLAudioElement | null = null;
	let audioCtx: AudioContext | null = null;
	let analyser: AnalyserNode | null = null;
	let sourceNode: MediaElementAudioSourceNode | null = null;
	let animFrameId: number | null = null;
	const cache = new Map<string, string>();

	function setState(s: TTSState) {
		state = s;
		callbacks.onStateChange(s);
	}

	function startVisualizer() {
		if (!audio || typeof window === 'undefined') return;
		try {
			if (!audioCtx) audioCtx = new AudioContext();
			if (!analyser) {
				analyser = audioCtx.createAnalyser();
				analyser.fftSize = 128;
				analyser.smoothingTimeConstant = 0.75;
			}
			if (!sourceNode) {
				sourceNode = audioCtx.createMediaElementSource(audio);
				sourceNode.connect(analyser);
				analyser.connect(audioCtx.destination);
			}
			const dataArray = new Uint8Array(analyser.frequencyBinCount);
			function tick() {
				if (!analyser) return;
				analyser.getByteFrequencyData(dataArray);
				const step = Math.floor(dataArray.length / BAR_COUNT);
				const heights: number[] = [];
				for (let i = 0; i < BAR_COUNT; i++) {
					const val = dataArray[i * step] || 0;
					heights.push(3 + (val / 255) * 29);
				}
				callbacks.onBarsUpdate(heights);
				animFrameId = requestAnimationFrame(tick);
			}
			tick();
		} catch {
			// Fallback: keep bars static if Web Audio unavailable
		}
	}

	function stopVisualizer() {
		if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
		callbacks.onBarsUpdate(idleBars());
	}

	async function toggle(text: string, voice?: string) {
		if (typeof window === 'undefined') return;

		if (state === 'speaking' && audio) {
			audio.pause();
			stopVisualizer();
			setState('paused');
			return;
		}
		if (state === 'paused' && audio) {
			audio.play();
			startVisualizer();
			setState('speaking');
			return;
		}
		if (state === 'loading') return; // prevent double-click

		if (!text) return;

		const cacheKey = text.slice(0, 100);
		let blobUrl = cache.get(cacheKey);

		if (!blobUrl) {
			setState('loading');
			const result = await fetchTTSAudio(text, voice);
			if ('error' in result) {
				callbacks.onError(result.error);
				setState('idle');
				return;
			}
			blobUrl = result.blobUrl;
			cache.set(cacheKey, blobUrl);
		}

		// Clean up previous playback
		if (audio) { audio.pause(); }
		sourceNode = null;

		audio = new Audio(blobUrl);
		audio.crossOrigin = 'anonymous';
		audio.onended = () => { stopVisualizer(); setState('idle'); };
		audio.onerror = () => { stopVisualizer(); setState('idle'); callbacks.onError('Lỗi phát âm thanh'); };
		audio.play();
		startVisualizer();
		setState('speaking');
	}

	function stop() {
		if (audio) {
			audio.pause();
			audio.currentTime = 0;
			audio = null;
		}
		sourceNode = null;
		stopVisualizer();
		setState('idle');
	}

	function destroy() {
		stop();
		if (audioCtx) {
			audioCtx.close().catch(() => {});
			audioCtx = null;
			analyser = null;
		}
	}

	function getState() { return state; }

	return { toggle, stop, destroy, getState };
}
