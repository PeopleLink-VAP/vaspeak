import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { groq, SCORE_MODEL, buildScoringPrompt, parseScoreResponse } from '$lib/server/groq';

export const POST: RequestHandler = async ({ request, locals }) => {
    if (!locals.user) {
        return json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userId = locals.user.id;

    let body: {
        scenario: string;
        scoringCriteria: string[];
        vaResponse: string;
        conversationHistory: string;
    };

    try {
        body = await request.json();
    } catch {
        return json({ error: 'Invalid JSON' }, { status: 400 });
    }

    if (!body.vaResponse?.trim()) {
        return json({ error: 'Missing vaResponse' }, { status: 400 });
    }

    const prompt = buildScoringPrompt({
        scenario: body.scenario ?? '',
        scoringCriteria: body.scoringCriteria ?? [],
        vaResponse: body.vaResponse,
        conversationHistory: body.conversationHistory ?? ''
    });

    try {
        const completion = await groq.chat.completions.create({
            model: SCORE_MODEL,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 300,
            temperature: 0.2 // low temp for consistent JSON output
        });

        const raw = completion.choices[0]?.message?.content ?? '';
        const score = parseScoreResponse(raw);

        if (!score) {
            return json({ error: 'Scoring model returned invalid JSON', raw }, { status: 502 });
        }

        return json({ ok: true, score });
    } catch (err) {
        console.error('[roleplay/score]', err);
        return json({ error: 'Groq API error' }, { status: 502 });
    }
};
