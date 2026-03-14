import { describe, it, expect, vi, beforeEach } from 'vitest';
import { idleBars, fetchTTSAudio } from '$lib/tts-player';

describe('idleBars', () => {
	it('returns an array of 32 bar heights', () => {
		const bars = idleBars();
		expect(bars).toHaveLength(32);
	});

	it('all bars are positive numbers', () => {
		const bars = idleBars();
		bars.forEach(h => expect(h).toBeGreaterThan(0));
	});

	it('bars follow a sine wave pattern', () => {
		const bars = idleBars();
		// bars should vary (not all the same)
		const uniqueValues = new Set(bars.map(h => Math.round(h * 100)));
		expect(uniqueValues.size).toBeGreaterThan(3);
	});
});

describe('fetchTTSAudio', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		// Mock URL.createObjectURL
		global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
	});

	it('sends text to /api/tts and returns blobUrl on success', async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			blob: () => Promise.resolve(new Blob(['audio'], { type: 'audio/wav' }))
		});

		const result = await fetchTTSAudio('Hello world', undefined, mockFetch);
		expect(result).toEqual({ blobUrl: 'blob:mock-url' });

		expect(mockFetch).toHaveBeenCalledWith('/api/tts', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ text: 'Hello world', voice: undefined })
		});
	});

	it('passes voice parameter when provided', async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			blob: () => Promise.resolve(new Blob(['audio']))
		});

		await fetchTTSAudio('Hi', 'troy', mockFetch);

		const body = JSON.parse(mockFetch.mock.calls[0][1].body);
		expect(body.voice).toBe('troy');
	});

	it('returns error when API response is not ok', async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: false,
			json: () => Promise.resolve({ error: 'Rate limited' })
		});

		const result = await fetchTTSAudio('Test', undefined, mockFetch);
		expect(result).toEqual({ error: 'Rate limited' });
	});

	it('returns error with default message when API has no error field', async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: false,
			json: () => Promise.resolve({})
		});

		const result = await fetchTTSAudio('Test', undefined, mockFetch);
		expect(result).toEqual({ error: 'TTS generation failed' });
	});

	it('returns connection error when fetch throws', async () => {
		const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));

		const result = await fetchTTSAudio('Test', undefined, mockFetch);
		expect(result).toEqual({ error: 'Lỗi kết nối: Network error' });
	});

	it('handles json parse failure gracefully', async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: false,
			json: () => Promise.reject(new Error('not json'))
		});

		const result = await fetchTTSAudio('Test', undefined, mockFetch);
		expect(result).toEqual({ error: 'TTS generation failed' });
	});
});
