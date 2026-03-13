/**
 * seed-lessons.js — Seeds Week 1 (Days 1–7) lesson content into the DB.
 * Usage: node scripts/seed-lessons.js
 * Safe to re-run: uses INSERT OR IGNORE.
 */

import { createClient } from '@libsql/client';
import { randomBytes } from 'crypto';

const dbUrl = process.env.LIBSQL_DB_URL ?? 'file:../db/local.db';
const db = createClient({ url: dbUrl, authToken: process.env.LIBSQL_AUTH_TOKEN });

function uid() {
    return randomBytes(8).toString('hex');
}

/**
 * Each lesson has 4 blocks:
 *   block_1: listening  — audio_script + comprehension questions
 *   block_2: drilling   — patterns (prompt → target sentence)
 *   block_3: roleplay   — scenario + AI client persona + scoring criteria
 *   block_4: reflection — emotion options + optional prompt
 */
const WEEK_1_LESSONS = [
    {
        day: 1,
        week: 1,
        theme: 'First Impressions',
        title: 'Introducing Yourself Professionally',
        content: [
            {
                type: 'listening',
                instruction: 'Listen to Mai introduce herself to a new client. Answer the question.',
                audio_script: `"Hi! I'm Mai Linh, your Virtual Assistant. I'll be handling your customer support inbox and social media replies. I'm available Monday to Friday, 9 AM to 6 PM Vietnam time. Please don't hesitate to reach out if you have any questions!"`,
                question: 'What tasks will Mai Linh be handling?',
                options: [
                    'Customer support inbox and social media',
                    'Accounting and payroll',
                    'Video editing and design',
                    'Product sourcing and supplier contact'
                ],
                answer: 0
            },
            {
                type: 'drilling',
                instruction: 'Read the prompt. Say the complete professional sentence.',
                patterns: [
                    { prompt: "Your name is Lan. You handle scheduling.", target: "Hi, I'm Lan — I'll be handling your scheduling." },
                    { prompt: "Your name is Hoa. You work on email management.", target: "Hi, I'm Hoa — I'll be taking care of your email management." },
                    { prompt: "You are available Mon–Fri, 8 AM–5 PM.", target: "I'm available Monday to Friday, 8 AM to 5 PM Vietnam time." },
                    { prompt: "Tell client to reach out with questions.", target: "Please don't hesitate to reach out if you have any questions!" }
                ]
            },
            {
                type: 'roleplay',
                instruction: 'Introduce yourself to Alex, a new US-based client who just onboarded.',
                scenario: 'Your first message to a new e-commerce client. Be warm, professional, and mention your duties.',
                client_persona: 'Alex Chen, busy US e-commerce entrepreneur. Friendly but expects clear communication.',
                client_opening: "Hi! I just set up access for you. Can you introduce yourself and let me know what you'll be handling?",
                scoring_criteria: ['Introduces by name', 'States responsibilities clearly', 'Mentions availability', 'Polite closing'],
                credit_cost: 1
            },
            {
                type: 'reflection',
                instruction: 'How did you feel introducing yourself in English today?',
                emotion_options: ['😰 Anxious', '😐 Okay', '😎 Confident'],
                text_prompt: 'Any words or phrases you found difficult? (Optional)'
            }
        ]
    },
    {
        day: 2,
        week: 1,
        theme: 'First Impressions',
        title: 'Confirming Tasks and Deadlines',
        content: [
            {
                type: 'listening',
                instruction: 'Listen to a VA confirming tasks with their client after a meeting.',
                audio_script: `"Just to confirm, you'd like me to schedule 5 Instagram posts by Thursday, and reply to all pending customer emails by end of day tomorrow. Is that correct? I'll send you a progress update on Wednesday morning."`,
                question: 'What will the VA send on Wednesday?',
                options: [
                    'The Instagram posts for approval',
                    'A progress update',
                    'A list of pending emails',
                    'An invoice'
                ],
                answer: 1
            },
            {
                type: 'drilling',
                instruction: 'Practice confirming tasks using professional check-in language.',
                patterns: [
                    { prompt: "Confirm: schedule 5 posts by Thursday", target: "Just to confirm, you'd like me to schedule 5 posts by Thursday." },
                    { prompt: "Ask if your understanding is correct", target: "Is that correct?" },
                    { prompt: "Promise to send update on Friday", target: "I'll send you a progress update on Friday." },
                    { prompt: "Confirm: reply to emails by EOD tomorrow", target: "I'll reply to all pending emails by end of day tomorrow." }
                ]
            },
            {
                type: 'roleplay',
                instruction: 'You just had a kickoff call with Sarah. Confirm the tasks she assigned via message.',
                scenario: 'Post-meeting task confirmation. Be precise — restate tasks, deadlines, and your plan.',
                client_persona: 'Sarah, a UK-based Etsy store owner. She values organization and hates surprises.',
                client_opening: "Great meeting! Can you summarize what you'll be doing this week?",
                scoring_criteria: ['Restates tasks accurately', 'Includes deadlines', 'States when they will update client', 'Professional tone'],
                credit_cost: 1
            },
            {
                type: 'reflection',
                instruction: 'How confident were you confirming tasks in English?',
                emotion_options: ['😰 Anxious', '😐 Okay', '😎 Confident'],
                text_prompt: 'Was there a structure or phrase you want to remember?'
            }
        ]
    },
    {
        day: 3,
        week: 1,
        theme: 'First Impressions',
        title: 'Handling Basic Questions from Clients',
        content: [
            {
                type: 'listening',
                instruction: 'A client asks a VA about their experience. Listen to the response.',
                audio_script: `"That's a great question! I've been working as a VA for two years, mostly with e-commerce businesses. I'm experienced in Shopify order management, customer email handling, and product listing. I'm confident I can help your business run smoothly."`,
                question: 'What platform experience does the VA mention?',
                options: ['WordPress', 'Shopify', 'WooCommerce', 'Magento'],
                answer: 1
            },
            {
                type: 'drilling',
                instruction: 'Practice answering client questions about your experience.',
                patterns: [
                    { prompt: "Say you've worked as VA for 2 years", target: "I've been working as a Virtual Assistant for two years." },
                    { prompt: "Acknowledge it's a good question", target: "That's a great question!" },
                    { prompt: "Say you're confident you can help", target: "I'm confident I can help your business run smoothly." },
                    { prompt: "Mention you handle customer emails", target: "I handle customer email management and order support." }
                ]
            },
            {
                type: 'roleplay',
                instruction: 'A new client asks: "Do you have experience with e-commerce?" Answer professionally.',
                scenario: 'First interview / onboarding Q&A. Sell your skills without bragging.',
                client_persona: 'James, Australian dropshipper. Direct and no-nonsense, wants results.',
                client_opening: "Before we start, do you have experience with e-commerce? What tools do you know?",
                scoring_criteria: ['Answers directly', 'Mentions relevant tools/platforms', 'Sells experience confidently', 'Avoids filler words'],
                credit_cost: 1
            },
            {
                type: 'reflection',
                instruction: 'How did you feel talking about your experience in English?',
                emotion_options: ['😰 Anxious', '😐 Okay', '😎 Confident'],
                text_prompt: 'Any tools or skills you weren\'t sure how to say in English?'
            }
        ]
    },
    {
        day: 4,
        week: 1,
        theme: 'First Impressions',
        title: 'Setting Expectations: Working Hours & Communication',
        content: [
            {
                type: 'listening',
                instruction: 'Listen to a VA explaining her working style and availability.',
                audio_script: `"I want to be upfront about my working hours. I'm based in Vietnam, so I work from 8 AM to 5 PM ICT, which is about 8 to 9 hours behind US Eastern time. I'll typically respond to messages within 2 hours during my working hours. For urgent issues, please mark your message as urgent and I'll prioritize it."`,
                question: 'How quickly does the VA typically respond?',
                options: ['Within 30 minutes', 'Within 2 hours', 'Within 24 hours', 'Same day only'],
                answer: 1
            },
            {
                type: 'drilling',
                instruction: 'Practice setting boundaries and expectations professionally.',
                patterns: [
                    { prompt: "Tell client your timezone", target: "I'm based in Vietnam, so I work in ICT — UTC+7." },
                    { prompt: "State you respond within 2 hours", target: "I typically respond within 2 hours during working hours." },
                    { prompt: "Ask client to mark urgent issues", target: "For urgent matters, please mark your message as urgent." },
                    { prompt: "Be upfront about something", target: "I want to be upfront about my working hours." }
                ]
            },
            {
                type: 'roleplay',
                instruction: 'Set expectations with a new client about your work schedule and response time.',
                scenario: 'Onboarding conversation. Be clear and professional about when you work and how to contact you.',
                client_persona: 'Michelle, Canadian business owner in EST. First time hiring a VA overseas.',
                client_opening: "So what are your working hours? And how quickly do you usually reply to messages?",
                scoring_criteria: ['Mentions timezone clearly', 'States response time', 'Explains urgent process', 'Professional and warm tone'],
                credit_cost: 1
            },
            {
                type: 'reflection',
                instruction: 'How comfortable were you discussing your availability in English?',
                emotion_options: ['😰 Anxious', '😐 Okay', '😎 Confident'],
                text_prompt: 'Any phrases you want to memorize for future clients?'
            }
        ]
    },
    {
        day: 5,
        week: 1,
        theme: 'First Impressions',
        title: 'Politely Asking for Clarification',
        content: [
            {
                type: 'listening',
                instruction: 'A client gave vague instructions. Listen to how the VA asks for clarification.',
                audio_script: `"Thank you for the instructions! Just to make sure I understand correctly — when you say 'clean up the product listings', do you mean updating the descriptions, fixing the images, or both? I want to make sure I do exactly what you need before I start."`,
                question: 'Why does the VA ask for clarification before starting?',
                options: [
                    'She doesn\'t understand product listings',
                    'She wants to do exactly what the client needs',
                    'She disagrees with the client\'s instructions',
                    'She wants to delay the work'
                ],
                answer: 1
            },
            {
                type: 'drilling',
                instruction: 'Practice asking clarifying questions politely.',
                patterns: [
                    { prompt: "Ask if you understand correctly", target: "Just to make sure I understand correctly…" },
                    { prompt: "Ask which option the client means", target: "Do you mean option A, option B, or both?" },
                    { prompt: "Say you want to do it right", target: "I want to make sure I do exactly what you need." },
                    { prompt: "Politely ask for more detail", target: "Could you clarify what you mean by that?" }
                ]
            },
            {
                type: 'roleplay',
                instruction: 'Your client said: "Handle the social media stuff." Ask what they mean before you start.',
                scenario: 'Unclear task from client. Ask smart clarifying questions before taking action.',
                client_persona: 'Tom, US-based fashion brand owner. Quick communicator, appreciates proactiveness.',
                client_opening: "Hey, can you handle the social media stuff this week? Thanks!",
                scoring_criteria: ['Doesn\'t assume', 'Asks 1–2 specific clarifying questions', 'Uses polite language', 'Confirms before acting'],
                credit_cost: 1
            },
            {
                type: 'reflection',
                instruction: 'How confident were you asking for clarification in English?',
                emotion_options: ['😰 Anxious', '😐 Okay', '😎 Confident'],
                text_prompt: 'Was there a moment you weren\'t sure how to phrase your question?'
            }
        ]
    },
    {
        day: 6,
        week: 1,
        theme: 'First Impressions',
        title: 'Delivering Updates and Progress Reports',
        content: [
            {
                type: 'listening',
                instruction: 'Listen to a VA delivering a daily update message to their client.',
                audio_script: `"Hi! Here's your daily update: I've responded to 23 customer emails today, and processed 8 refund requests. I'm 80% done with the product description edits — I'll finish the remaining 5 by tomorrow morning. One thing to flag: we received 3 complaints about delayed shipping. I've responded to all of them, but wanted you to be aware. Let me know if you need anything!"`,
                question: 'What issue does the VA flag for the client?',
                options: [
                    'Missing product images',
                    'Delayed shipping complaints',
                    'Unpaid invoices',
                    'Low email response rate'
                ],
                answer: 1
            },
            {
                type: 'drilling',
                instruction: 'Practice writing professional status updates.',
                patterns: [
                    { prompt: "Say you've replied to 15 emails today", target: "I've responded to 15 customer emails today." },
                    { prompt: "Say you're 70% done with a task", target: "I'm 70% done with the task — I'll finish by EOD tomorrow." },
                    { prompt: "Flag an issue politely", target: "One thing to flag: we received several complaints about…" },
                    { prompt: "End with an offer to help", target: "Let me know if you need anything else!" }
                ]
            },
            {
                type: 'roleplay',
                instruction: 'Send your end-of-day update to client Ben after a day of customer support work.',
                scenario: 'Daily report via message. Be specific with numbers, flag issues, and close professionally.',
                client_persona: 'Ben, Australian e-commerce seller. Loves data and specific numbers.',
                client_opening: "Hey, can you send me your end-of-day update?",
                scoring_criteria: ['Includes specific numbers', 'Mentions progress %', 'Flags any issues', 'Professional sign-off'],
                credit_cost: 1
            },
            {
                type: 'reflection',
                instruction: 'How did you feel sending a professional update in English?',
                emotion_options: ['😰 Anxious', '😐 Okay', '😎 Confident'],
                text_prompt: 'What format or phrases will you use for future updates?'
            }
        ]
    },
    {
        day: 7,
        week: 1,
        theme: 'First Impressions',
        title: 'Week 1 Challenge: Full Client Interaction',
        content: [
            {
                type: 'listening',
                instruction: 'Listen to a complete client–VA exchange from introduction to task confirmation.',
                audio_script: `Client: "Hi, I just hired you through the agency. Can you walk me through what you do?"
VA: "Of course! I'm Linh, your new VA. I specialize in e-commerce support — customer emails, order processing, and product management. I work Monday to Friday, 9 to 6 Vietnam time, and I typically respond within 2 hours. I'll send you a daily update at 5 PM each day."
Client: "Perfect. Can you start by cleaning up our Shopify product listings?"
VA: "Absolutely! Just to clarify — when you say clean up, do you mean updating descriptions, fixing photos, or both? I want to make sure I prioritize correctly."
Client: "Both, but start with descriptions first."
VA: "Got it! I'll start on descriptions today and send you a progress update by 5 PM."`,
                question: 'What will the VA prioritize first according to the client?',
                options: ['Fixing product photos', 'Updating descriptions', 'Replying to emails', 'Processing orders'],
                answer: 1
            },
            {
                type: 'drilling',
                instruction: 'Review the best phrases from Week 1. Say each one naturally.',
                patterns: [
                    { prompt: "Introduce yourself as a VA", target: "Hi, I'm [Name], your Virtual Assistant. I'll be handling [tasks]." },
                    { prompt: "Confirm a task with a deadline", target: "Just to confirm, you'd like me to [task] by [date]." },
                    { prompt: "Ask for clarification", target: "Just to make sure — do you mean [option A] or [option B]?" },
                    { prompt: "Give a progress update", target: "Quick update: I'm [X]% done and will finish by [time]." },
                    { prompt: "Flag an issue professionally", target: "One thing to flag: [issue]. I've already [action taken]." }
                ]
            },
            {
                type: 'roleplay',
                instruction: 'Full Week 1 Challenge. Handle a complete client interaction from intro to task confirmation.',
                scenario: 'This is your Week 1 final challenge. Use everything you learned: introduce yourself, confirm tasks, clarify instructions, and send a professional update.',
                client_persona: 'Lisa, UK-based online boutique owner. Professional, expects initiative and clarity.',
                client_opening: "Hi there! I'm Lisa. The agency says you're my new VA — can you introduce yourself, and then I'll explain what I need help with this week?",
                scoring_criteria: [
                    'Clear, warm self-introduction',
                    'Asks clarifying questions on tasks',
                    'Confirms deadlines and deliverables',
                    'Maintains professional tone throughout',
                    'Ends with next step or assurance'
                ],
                credit_cost: 2
            },
            {
                type: 'reflection',
                instruction: "🎉 Week 1 Complete! How did you feel overall about this week's speaking practice?",
                emotion_options: ['😰 Still nervous', '😐 Getting better', '😎 Much more confident!'],
                text_prompt: 'What was your biggest win this week? What do you want to improve in Week 2?'
            }
        ]
    }
];

async function seed() {
    console.log('🌱  Seeding Week 1 lessons…');
    let inserted = 0;
    let skipped = 0;

    for (const lesson of WEEK_1_LESSONS) {
        try {
            await db.execute({
                sql: `INSERT OR IGNORE INTO lessons (id, day_number, week_number, week_theme, niche, title, content, is_published)
                      VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
                args: [
                    uid(),
                    lesson.day,
                    lesson.week,
                    lesson.theme,
                    'general',
                    lesson.title,
                    JSON.stringify(lesson.content)
                ]
            });
            // Check if it was actually inserted (rowsAffected > 0)
            const check = await db.execute({
                sql: 'SELECT id FROM lessons WHERE day_number = ? AND niche = ?',
                args: [lesson.day, 'general']
            });
            if (check.rows.length > 0) {
                console.log(`  ✅  Day ${lesson.day}: ${lesson.title}`);
                inserted++;
            }
        } catch (err) {
            console.warn(`  ⚠️  Day ${lesson.day} skipped: ${err.message}`);
            skipped++;
        }
    }

    // Verify final count
    const total = await db.execute('SELECT COUNT(*) as count FROM lessons');
    console.log(`\n🎉  Seed complete. ${inserted} lessons inserted, ${skipped} skipped.`);
    console.log(`📊  Total lessons in DB: ${total.rows[0].count}`);
}

seed().catch(err => {
    console.error('❌  Seed failed:', err);
    process.exit(1);
});
