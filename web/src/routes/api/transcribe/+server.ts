import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { groq, STT_MODEL } from '$lib/server/groq';

export const POST: RequestHandler = async ({ request, locals }) => {
    if (!locals.user) {
        return json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const audioFile = formData.get('audio') as File;
        const prompt = formData.get('prompt') as string;

        if (!audioFile) {
            return json({ error: 'No audio file provided' }, { status: 400 });
        }

        const response = await groq.audio.transcriptions.create({
            file: audioFile,
            model: STT_MODEL,
            prompt: prompt || undefined,
            response_format: 'json',
            language: 'en'
        });

        return json({ text: response.text });
    } catch (err: any) {
        console.error('[transcribe error]', err);
        return json({ error: err.message || 'Transcription failed' }, { status: 500 });
    }
};
