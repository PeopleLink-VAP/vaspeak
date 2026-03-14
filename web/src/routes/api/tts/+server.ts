import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { groq, TTS_MODEL, TTS_VOICE } from '$lib/server/groq';

/**
 * POST /api/tts
 * Body: { text: string, voice?: string }
 * Returns: audio/wav binary stream
 */
export const POST: RequestHandler = async ({ request, locals }) => {
    if (!locals.user) {
        return json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        const { text, voice } = await request.json();

        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            return json({ error: 'No text provided' }, { status: 400 });
        }

        // Cap input length to prevent abuse (Orpheus handles up to ~4096 chars well)
        const input = text.slice(0, 4000);

        const response = await groq.audio.speech.create({
            model: TTS_MODEL,
            voice: voice || TTS_VOICE,
            input,
            response_format: 'wav'
        });

        const buffer = Buffer.from(await response.arrayBuffer());

        return new Response(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'audio/wav',
                'Content-Length': buffer.length.toString(),
                'Cache-Control': 'private, max-age=3600' // cache for 1hr per user
            }
        });
    } catch (err: any) {
        console.error('[TTS error]', err?.message || err);
        return json({ error: err?.message || 'TTS generation failed' }, { status: 500 });
    }
};
