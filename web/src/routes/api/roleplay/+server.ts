import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { groq, ROLEPLAY_MODEL, buildRoleplaySystemPrompt } from '$lib/server/groq';
import { spendCredits, getCreditsRemaining, ROLEPLAY_CREDIT_COST } from '$lib/server/credits';
import { roleplayLimiter } from '$lib/server/rate-limit';

export const POST: RequestHandler = async ({ request, locals }) => {
    if (!locals.user) {
        return json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userId = locals.user.id;

    // Burst protection — in addition to credit gating
    if (!roleplayLimiter.allow(userId)) {
        return json({ error: 'Too many requests. Slow down.' }, { status: 429 });
    }


    let body: {
        scenario: string;
        clientPersona: string;
        clientOpening: string;
        scoringCriteria: string[];
        messages: { role: 'user' | 'assistant'; content: string }[];
    };

    try {
        body = await request.json();
    } catch {
        return json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { scenario, clientPersona, clientOpening, scoringCriteria, messages } = body;

    if (!scenario || !messages?.length) {
        return json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Credit gate
    const remaining = await getCreditsRemaining(userId);
    if (remaining < ROLEPLAY_CREDIT_COST) {
        return json(
            { error: 'Insufficient credits', remaining, required: ROLEPLAY_CREDIT_COST },
            { status: 402 }
        );
    }

    // Spend credits before calling Groq
    await spendCredits(userId, ROLEPLAY_CREDIT_COST);

    const systemPrompt = buildRoleplaySystemPrompt({
        scenario,
        clientPersona,
        clientOpening,
        scoringCriteria: scoringCriteria ?? []
    });

    // Stream the response back
    const stream = await groq.chat.completions.create({
        model: ROLEPLAY_MODEL,
        messages: [
            { role: 'system', content: systemPrompt },
            ...messages
        ],
        max_tokens: 200,
        temperature: 0.85,
        stream: true
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
        async start(controller) {
            try {
                for await (const chunk of stream) {
                    const text = chunk.choices[0]?.delta?.content ?? '';
                    if (text) {
                        controller.enqueue(encoder.encode(text));
                    }
                }
            } finally {
                controller.close();
            }
        }
    });

    return new Response(readable, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'X-Credits-Remaining': String(remaining - ROLEPLAY_CREDIT_COST),
            'Cache-Control': 'no-cache'
        }
    });
};
