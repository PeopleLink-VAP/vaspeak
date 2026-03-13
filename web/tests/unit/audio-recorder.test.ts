import { describe, it, expect, vi, beforeEach } from 'vitest';
import { formatRecordTime } from '$lib/audio-recorder';

// We can't fully test createAudioRecorder in Node (needs MediaRecorder / navigator),
// but we CAN test the pure utility functions and the transcribeAudio fetch wrapper.

describe('formatRecordTime', () => {
	it('formats 0 seconds as 0:00', () => {
		expect(formatRecordTime(0)).toBe('0:00');
	});

	it('formats single-digit seconds with leading zero', () => {
		expect(formatRecordTime(5)).toBe('0:05');
	});

	it('formats 60 seconds as 1:00', () => {
		expect(formatRecordTime(60)).toBe('1:00');
	});

	it('formats 90 seconds as 1:30', () => {
		expect(formatRecordTime(90)).toBe('1:30');
	});

	it('formats 125 seconds as 2:05', () => {
		expect(formatRecordTime(125)).toBe('2:05');
	});
});

describe('transcribeAudio', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it('sends audio blob to /api/transcribe and returns text', async () => {
		const { transcribeAudio } = await import('$lib/audio-recorder');
		const mockBlob = new Blob(['audio-data'], { type: 'audio/webm' });

		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ text: 'hello world' })
		});

		const result = await transcribeAudio(mockBlob, 'context hint');
		expect(result).toEqual({ text: 'hello world' });

		const call = (global.fetch as any).mock.calls[0];
		expect(call[0]).toBe('/api/transcribe');
		expect(call[1].method).toBe('POST');

		const formData = call[1].body as FormData;
		expect(formData.get('audio')).toBeTruthy();
		expect(formData.get('prompt')).toBe('context hint');
	});

	it('returns error when API responds with error', async () => {
		const { transcribeAudio } = await import('$lib/audio-recorder');
		const mockBlob = new Blob(['audio-data'], { type: 'audio/webm' });

		global.fetch = vi.fn().mockResolvedValue({
			ok: false,
			json: () => Promise.resolve({ error: 'Transcription failed' })
		});

		const result = await transcribeAudio(mockBlob);
		expect(result).toEqual({ error: 'Transcription failed' });
	});

	it('returns error when fetch throws', async () => {
		const { transcribeAudio } = await import('$lib/audio-recorder');
		const mockBlob = new Blob(['audio-data'], { type: 'audio/webm' });

		global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

		const result = await transcribeAudio(mockBlob);
		expect(result).toEqual({ error: 'Lỗi kết nối: Network error' });
	});

	it('truncates context prompt to 500 chars', async () => {
		const { transcribeAudio } = await import('$lib/audio-recorder');
		const mockBlob = new Blob(['audio-data'], { type: 'audio/webm' });
		const longPrompt = 'A'.repeat(1000);

		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ text: 'ok' })
		});

		await transcribeAudio(mockBlob, longPrompt);
		const formData = (global.fetch as any).mock.calls[0][1].body as FormData;
		expect((formData.get('prompt') as string).length).toBe(500);
	});
});
