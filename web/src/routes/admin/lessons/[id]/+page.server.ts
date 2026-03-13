import { db } from '$lib/server/db';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
    const { id } = params;

    const result = await db.execute({
        sql: `SELECT id, day_number, week_number, week_theme, niche, title, content, is_published
              FROM lessons WHERE id = ?`,
        args: [id]
    });

    const lesson = result.rows[0];
    if (!lesson) {
        return { lesson: null };
    }

    // Parse content JSON — always return an array of 4 blocks
    let blocks: Block[] = [];
    try {
        blocks = JSON.parse(String(lesson.content ?? '[]'));
    } catch {
        blocks = [];
    }

    // Ensure all 4 block types exist with correct defaults
    const defaultBlocks: Block[] = [
        {
            type: 'listening',
            title: 'Block 1 — Listening Practice',
            audio_script: '',
            comprehension_questions: []
        },
        {
            type: 'drilling',
            title: 'Block 2 — Pattern Drilling',
            patterns: [],
            instructions: ''
        },
        {
            type: 'roleplay',
            title: 'Block 3 — Guided Simulation',
            scenario: '',
            client_persona: '',
            system_prompt: '',
            opening_message: ''
        },
        {
            type: 'reflection',
            title: 'Block 4 — Emotional Reflection',
            prompt: '',
            follow_up_prompts: []
        }
    ];

    // Merge saved blocks with defaults (preserve saved data, fill missing blocks)
    const mergedBlocks = defaultBlocks.map((def) => {
        const saved = blocks.find((b) => b.type === def.type);
        return saved ? { ...def, ...saved } : def;
    });

    return {
        lesson: {
            id: String(lesson.id),
            day_number: Number(lesson.day_number),
            week_number: Number(lesson.week_number),
            week_theme: lesson.week_theme ? String(lesson.week_theme) : null,
            niche: String(lesson.niche),
            title: String(lesson.title),
            is_published: Boolean(lesson.is_published),
            content: mergedBlocks
        }
    };
};

// Block type for type-safety
interface Block {
    type: 'listening' | 'drilling' | 'roleplay' | 'reflection';
    title?: string;
    [key: string]: unknown;
}

export const actions: Actions = {
    // Save all 4 blocks at once
    save: async ({ request, params }) => {
        const { id } = params;
        const data = await request.formData();

        try {
            // Read each block's JSON from the form
            const blocks: Block[] = [];
            for (const type of ['listening', 'drilling', 'roleplay', 'reflection'] as const) {
                const raw = data.get(`block_${type}`);
                if (!raw) continue;
                try {
                    blocks.push(JSON.parse(String(raw)));
                } catch {
                    return fail(400, { error: `Invalid JSON for ${type} block` });
                }
            }

            await db.execute({
                sql: `UPDATE lessons
                      SET content = ?, updated_at = CURRENT_TIMESTAMP
                      WHERE id = ?`,
                args: [JSON.stringify(blocks), id]
            });

            return { success: true };
        } catch (err) {
            console.error('[admin/lessons/[id]] save error:', err);
            return fail(500, { error: 'Failed to save lesson content' });
        }
    },

    // Toggle publish status
    togglePublish: async ({ params }) => {
        const { id } = params;
        try {
            await db.execute({
                sql: `UPDATE lessons
                      SET is_published = CASE WHEN is_published = 1 THEN 0 ELSE 1 END,
                          updated_at = CURRENT_TIMESTAMP
                      WHERE id = ?`,
                args: [id]
            });
        } catch (err) {
            console.error('[admin/lessons/[id]] togglePublish error:', err);
            return fail(500, { error: 'Failed to update publish status' });
        }
        return { success: true };
    }
};
