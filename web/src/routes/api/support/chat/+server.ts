import { json } from '@sveltejs/kit';
import { groq, SCORE_MODEL } from '$lib/server/groq';

export async function POST({ request, locals }) {
    if (!locals.user) return json({ success: false, error: 'Unauthorized' }, { status: 401 });

    try {
        const { messages } = await request.json();

        if (!Array.isArray(messages)) {
            return json({ success: false, error: 'Invalid messages array' }, { status: 400 });
        }

        // Prevent abuse, max 20 messages history
        const recentMessages = messages.slice(-20);

        const systemPrompt = `You are a helpful customer support AI for VASpeak, an English communication training app for Vietnamese Virtual Assistants. 
Keep your answers concise, friendly, and in Vietnamese. 
VASpeak features: 
- 4-block daily lessons: Listening, Pronunciation Drill, AI Roleplay, Emotional Reflection.
- Settings: Users can update Name, Niche (ecommerce, video editor, etc) and Avatar in Profile page.
- In-app mini games (Word of the Day) with push notifications for daily vocab reminders. Enable via Profile > Thông Báo.
- AI Credits: Each AI roleplay or grammar check costs credits. Free users get 100/mo. Daily challenges earn credits.
- Feedback: Users can submit feedback or bugs via the Help Center.

If the question is too complex, suggest them to submit a detailed feedback form in the "Phản Hồi & Báo Lỗi" tab.`;

        const completion = await groq.chat.completions.create({
            model: SCORE_MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                ...recentMessages
            ],
            temperature: 0.5,
            max_tokens: 400
        });

        const reply = completion.choices[0]?.message?.content || 'Xin lỗi, hệ thống AI đang bận. Bạn vui lòng gửi Phản hồi nhé.';

        return json({ success: true, reply });
    } catch (err) {
        console.error('[support chat error]', err);
        return json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
