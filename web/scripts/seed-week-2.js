import { createClient } from '@libsql/client';
import { randomBytes } from 'crypto';

const dbUrl = process.env.LIBSQL_DB_URL ?? 'file:../db/local.db';
const db = createClient({ url: dbUrl, authToken: process.env.LIBSQL_AUTH_TOKEN });

function uid() {
    return randomBytes(8).toString('hex');
}

const WEEK_2_LESSONS = [
    {
        day: 8,
        week: 2,
        theme: 'Daily Operations',
        title: 'Managing the Inbox',
        content: [
            {
                type: 'listening',
                instruction: 'Listen to a VA explaining how they sort a busy inbox.',
                audio_script: `"First thing in the morning, I triage the inbox. I filter out spam, categorize urgent vendor requests into the 'Needs Action' folder, and reply to standard customer inquiries using our email templates. Anything requiring the manager's approval gets starred."`,
                question: 'What does the VA do with urgent vendor requests?',
                options: [
                    'Deletes them immediately',
                    'Replies using a template',
                    'Moves them to Needs Action folder',
                    'Stars them for the manager'
                ],
                answer: 2
            },
            {
                type: 'drilling',
                instruction: 'Practice inbox management vocabulary.',
                patterns: [
                    { prompt: "Say you sort the inbox first thing", target: "First thing in the morning, I triage the inbox." },
                    { prompt: "Say you use templates for standard questions", target: "I reply to standard inquiries using our email templates." },
                    { prompt: "Tell client you starred an email for them", target: "I've starred an email that requires your approval." },
                    { prompt: "Say you categorized the requests", target: "I categorized the urgent vendor requests." }
                ]
            },
            {
                type: 'roleplay',
                instruction: 'Report to your client about the morning inbox status.',
                scenario: 'Morning check-in. Tell the client you sorted the inbox, handled the simple emails, and left 3 urgent ones for them.',
                client_persona: 'David, busy startup founder. Reads emails fast and appreciates brevity.',
                client_opening: "Morning! How's the inbox looking today? Anything on fire?",
                scoring_criteria: ['Addresses the inbox status', 'Mentions handling standard emails', 'Flags the urgent items clearly', 'Professional and brief'],
                credit_cost: 1
            },
            {
                type: 'reflection',
                instruction: 'How did you feel reporting on inbox management?',
                emotion_options: ['😰 Anxious', '😐 Okay', '😎 Confident'],
                text_prompt: 'Are you familiar with the word "triage"?'
            }
        ]
    },
    {
        day: 9,
        week: 2,
        theme: 'Daily Operations',
        title: 'Calendar & Scheduling',
        content: [
            {
                type: 'listening',
                instruction: 'Listen to the VA proposing meeting times to a client.',
                audio_script: `"Hi Sarah. The marketing team requested a 30-minute sync this week. Your Tuesday is fully booked, but I can slot them in on Wednesday at 2 PM or Thursday at 10 AM. Which of those options works best for you? Let me know and I'll send the calendar invites."`,
                question: 'Why can\'t the meeting be on Tuesday?',
                options: [
                    'The VA is off on Tuesday',
                    'The marketing team is busy',
                    'The client\'s Tuesday is fully booked',
                    'The calendar app is down'
                ],
                answer: 2
            },
            {
                type: 'drilling',
                instruction: 'Practice scheduling phrases.',
                patterns: [
                    { prompt: "State that Tuesday is fully booked", target: "Your Tuesday is currently fully booked." },
                    { prompt: "Propose two alternative times", target: "I can slot them in on Wednesday at 2 PM or Thursday at 10 AM." },
                    { prompt: "Ask which option is better", target: "Which of those options works best for you?" },
                    { prompt: "Offer to send the calendar invite", target: "Let me know and I'll send the calendar invite." }
                ]
            },
            {
                type: 'roleplay',
                instruction: 'A client asks you to schedule a meeting, but their calendar is full.',
                scenario: 'Your client asks you to squeeze in an urgent meeting today, but they have back-to-back calls. Propose tomorrow morning instead.',
                client_persona: 'Elena, real estate agent. Constantly moving, relies heavily on her calendar.',
                client_opening: "Hey, I need to talk to the web developer today. Can you squeeze him in at 3 PM?",
                scoring_criteria: ['Politely denies 3 PM', 'Explains the schedule conflict', 'Proposes a realistic alternative', 'Maintains helpful tone'],
                credit_cost: 1
            },
            {
                type: 'reflection',
                instruction: 'Did you find it difficult to say "no" or propose alternatives?',
                emotion_options: ['😰 Anxious', '😐 Okay', '😎 Confident'],
                text_prompt: 'What phrase did you use to propose the alternative time?'
            }
        ]
    },
    {
        day: 10,
        week: 2,
        theme: 'Daily Operations',
        title: 'Handling Meeting Conflicts',
        content: [
            {
                type: 'listening',
                instruction: 'Listen to a VA handling a double-booked calendar.',
                audio_script: `"Hi Mark. It looks like we have a scheduling conflict on Friday at 1 PM. Both the design review and the client catch-up got booked at the same time. Since the client catch-up is high priority, would you like me to reschedule the design review to Monday?"`,
                question: 'Which meeting does the VA suggest moving to Monday?',
                options: [
                    'The client catch-up',
                    'Both meetings',
                    'Neither meeting',
                    'The design review'
                ],
                answer: 3
            },
            {
                type: 'drilling',
                instruction: 'Practice phrases for handling meeting conflicts.',
                patterns: [
                    { prompt: "Alert client to a scheduling conflict", target: "It looks like we have a scheduling conflict on Friday." },
                    { prompt: "Explain what got double-booked", target: "Both meetings got booked at the exact same time." },
                    { prompt: "Suggest moving the lower priority meeting", target: "Would you like me to reschedule the design review?" },
                    { prompt: "Say you will handle the rescheduling", target: "I'll reach out to them and resolve the conflict." }
                ]
            },
            {
                type: 'roleplay',
                instruction: 'Handle a double-booking mistake.',
                scenario: 'You accidentally double-booked your client. Bring the mistake to their attention gracefully and offer a clear solution to fix it.',
                client_persona: 'Jason, impatient but fair tech executive. Likes quick solutions.',
                client_opening: "Just looking at my schedule for tomorrow... do I really have two calls at 11 AM?",
                scoring_criteria: ['Takes accountability gracefully', 'Acknowledges the conflict', 'Suggests a specific fix', 'Acts quickly'],
                credit_cost: 1
            },
            {
                type: 'reflection',
                instruction: 'How confident did you feel handling a mistake?',
                emotion_options: ['😰 Anxious', '😐 Okay', '😎 Confident'],
                text_prompt: 'Owning mistakes professionally is a powerful VA skill.'
            }
        ]
    },
    {
        day: 11,
        week: 2,
        theme: 'Daily Operations',
        title: 'Organizing Google Drive & Files',
        content: [
            {
                type: 'listening',
                instruction: 'Listen to a VA explaining a new folder structure.',
                audio_script: `"I've gone ahead and reorganized the Google Drive. All the loose assets from Q1 are now sorted into subfolders by month within the 'Marketing 2026' main folder. I also ensured all the file naming conventions are consistent so it's much easier to search for what you need."`,
                question: 'How are the files in the Marketing folder sorted now?',
                options: [
                    'By client name',
                    'By month',
                    'By file size',
                    'By priority'
                ],
                answer: 1
            },
            {
                type: 'drilling',
                instruction: 'Practice vocabulary for file management.',
                patterns: [
                    { prompt: "Say you reorganized the messy Drive", target: "I've gone ahead and reorganized the Google Drive." },
                    { prompt: "Explain the sort method", target: "The assets are sorted into subfolders by month." },
                    { prompt: "Talk about file names", target: "I ensured all file naming conventions are consistent." },
                    { prompt: "State the benefit", target: "It will be much easier to search for what you need." }
                ]
            },
            {
                type: 'roleplay',
                instruction: 'Ask the client for permission to clean up their messy cloud storage.',
                scenario: 'The client\'s Dropbox is a mess. Politely suggest creating a folder structure and ask for their preferred way of organizing (by date, or by project).',
                client_persona: 'Sarah, creative agency owner. Brilliant but very disorganized.',
                client_opening: "Ugh, I can never find the logo files when I need them. The Dropbox is a disaster.",
                scoring_criteria: ['Shows empathy for the frustration', 'Proposes specifically taking on the cleanup task', 'Provides 2 organization options (e.g., date or project)', 'Polite and proactive'],
                credit_cost: 1
            },
            {
                type: 'reflection',
                instruction: 'How did you feel being proactive with the client?',
                emotion_options: ['😰 Anxious', '😐 Okay', '😎 Confident'],
                text_prompt: 'Proposing solutions instead of waiting for tasks is top-tier VA behavior.'
            }
        ]
    },
    {
        day: 12,
        week: 2,
        theme: 'Daily Operations',
        title: 'Data Entry and Tracking',
        content: [
            {
                type: 'listening',
                instruction: 'Listen to a VA discussing updating a CRM database.',
                audio_script: `"I spent the afternoon doing data entry for the new leads. I've updated the CRM with their contact info, company size, and lead source. However, there were about five leads missing phone numbers, so I highlighted those rows in yellow on the master spreadsheet for your review."`,
                question: 'What did the VA do with the leads missing phone numbers?',
                options: [
                    'Deleted them from the CRM',
                    'Emailed the leads to ask',
                    'Highlighted them in yellow on the spreadsheet',
                    'Made up fake phone numbers'
                ],
                answer: 2
            },
            {
                type: 'drilling',
                instruction: 'Practice reporting on data entry tasks.',
                patterns: [
                    { prompt: "Say you updated the database", target: "I've updated the CRM with the new contact info." },
                    { prompt: "Mention you spent time on data entry", target: "I spent the afternoon doing data entry for the new leads." },
                    { prompt: "Say some information was missing", target: "There were several leads missing phone numbers." },
                    { prompt: "Explain how you flagged the missing info", target: "I highlighted those rows in yellow for your review." }
                ]
            },
            {
                type: 'roleplay',
                instruction: 'Report a data issue to your client.',
                scenario: 'You were doing data entry from a list of receipts into an expense spreadsheet. Three receipts are completely unreadable. Report this to the client.',
                client_persona: 'Mark, finance consultant. Appreciates accuracy above all.',
                client_opening: "How's the expense spreadsheet coming along? Almost done?",
                scoring_criteria: ['Updates on general progress', 'Clearly states the issue with the 3 receipts', 'Asks for direction on how to handle the unreadable ones', 'Clear and concise'],
                credit_cost: 1
            },
            {
                type: 'reflection',
                instruction: 'How comfortable are you explaining errors or issues in data?',
                emotion_options: ['😰 Anxious', '😐 Okay', '😎 Confident'],
                text_prompt: 'Any specialized words (CRM, spreadsheet, cell, row) you need to review?'
            }
        ]
    },
    {
        day: 13,
        week: 2,
        theme: 'Daily Operations',
        title: 'Drafting a Weekly Report',
        content: [
            {
                type: 'listening',
                instruction: 'Listen to a VA summarizing the week.',
                audio_script: `"Hi team, here is the weekly summary report. This week, we successfully onboarded 3 new clients and resolved 45 support tickets. On the admin side, I've cleared the invoicing backlog. Next week, our main focus will be finalizing the social media calendar for next month. Have a great weekend!"`,
                question: 'What is the main focus for next week?',
                options: [
                    'Onboarding 3 new clients',
                    'Clearing the invoicing backlog',
                    'Resolving more support tickets',
                    'Finalizing the social media calendar'
                ],
                answer: 3
            },
            {
                type: 'drilling',
                instruction: 'Practice phrases for weekly summaries.',
                patterns: [
                    { prompt: "Introduce the weekly report", target: "Hi team, here is the weekly summary report." },
                    { prompt: "Celebrate a metric from the week", target: "This week, we successfully resolved 45 support tickets." },
                    { prompt: "State an accomplishment", target: "I've officially cleared the invoicing backlog." },
                    { prompt: "State next week's goal and wish a good weekend", target: "Next week we'll focus on the social media calendar. Have a great weekend!" }
                ]
            },
            {
                type: 'roleplay',
                instruction: 'Deliver your End-of-Week summary to your client.',
                scenario: 'It is Friday afternoon. Deliver a spoken summary of your week: you cleared the inbox, scheduled all meetings, and organized the messy Google Drive. Wish the client a good weekend.',
                client_persona: 'Anna, friendly e-commerce CEO who values communication and work-life balance.',
                client_opening: "Happy Friday! Before we log off, can you give me a quick recap of what got done this week?",
                scoring_criteria: ['Summarizes the 3 key tasks clearly', 'Uses positive language', 'Maintains a professional pace', 'Includes a warm Friday/weekend sign-off'],
                credit_cost: 1
            },
            {
                type: 'reflection',
                instruction: 'How confident did you feel summarizing multiple tasks?',
                emotion_options: ['😰 Anxious', '😐 Okay', '😎 Confident'],
                text_prompt: 'Summarizing is a great way to prove your value every Friday!'
            }
        ]
    },
    {
        day: 14,
        week: 2,
        theme: 'Daily Operations',
        title: 'Week 2 Challenge: The Monday Morning Rush',
        content: [
            {
                type: 'listening',
                instruction: 'Listen to a VA handling a chaotic Monday morning check-in.',
                audio_script: `"Good morning! I've been reviewing the inbox and your calendar. You have a busy day! First, the 10 AM client rescheduled to tomorrow, so that gives us breathing room. I've flagged 4 urgent vendor emails in your inbox that need your signature today. I'll handle the rest of the customer emails. Should I go ahead and process the payroll data entry now, or focus on the Google Drive cleanup?"`,
                question: 'Why does the client have "breathing room" this morning?',
                options: [
                    'The VA handled all the emails',
                    'The 10 AM client rescheduled',
                    'The Google Drive cleanup is finished',
                    'The vendor signed the emails'
                ],
                answer: 1
            },
            {
                type: 'drilling',
                instruction: 'Review important phrases from Week 2.',
                patterns: [
                    { prompt: "Say you triaged the inbox", target: "First thing in the morning, I triage the inbox." },
                    { prompt: "Propose a meeting time", target: "I can slot them in on Wednesday at 2 PM." },
                    { prompt: "Resolve a meeting conflict", target: "Would you like me to reschedule the design review?" },
                    { prompt: "Explain file organization", target: "I've sorted the assets into subfolders by month." },
                    { prompt: "Flag missing data", target: "I highlighted the rows with missing info in yellow." }
                ]
            },
            {
                type: 'roleplay',
                instruction: 'Your Week 2 Final Challenge. Handle a busy boss.',
                scenario: 'Your boss logs on Monday morning and is stressed. Calmly give them a status update: you sorted 50 emails, fixed a calendar double-booking for tomorrow, and you want to know what priority they want you to focus on next.',
                client_persona: 'Richard, overwhelmed agency director. Easily stressed, needs a VA who brings calm and order.',
                client_opening: "Morning. I'm so stressed, the weekend was a blur. I don't even know what's happening today, my calendar looks double booked for tomorrow, and I'm terrified to look at the inbox.",
                scoring_criteria: ['Uses a calm, reassuring tone', 'Explains that the inbox is already sorted', 'Reassures that the double-booking is handled', 'Asks for directions on the next priority'],
                credit_cost: 2
            },
            {
                type: 'reflection',
                instruction: "🎉 Week 2 Complete! Managing operations is a core VA skill.",
                emotion_options: ['😰 Still nervous', '😐 Getting better', '😎 Much more confident!'],
                text_prompt: 'You are sounding like a true professional. What was your favorite topic this week?'
            }
        ]
    }
];

async function seedWeek2() {
    console.log('🌱  Seeding Week 2 lessons…');
    let inserted = 0;
    let skipped = 0;

    for (const lesson of WEEK_2_LESSONS) {
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

    const total = await db.execute('SELECT COUNT(*) as count FROM lessons');
    console.log(`\n🎉  Seed complete. ${inserted} lessons inserted, ${skipped} skipped.`);
    console.log(`📊  Total lessons in DB: ${total.rows[0].count}`);
}

seedWeek2().catch(err => {
    console.error('❌  Seed failed:', err);
    process.exit(1);
});
