/**
 * seed-weeks-2-3.js — Seeds Week 2 and Week 3 (Days 8–21) lesson content.
 * Usage: node scripts/seed-weeks-2-3.js
 * Safe to re-run: uses INSERT OR IGNORE + checks for existing days.
 */

import { createClient } from '@libsql/client';
import { randomBytes } from 'crypto';

const dbUrl = process.env.LIBSQL_DB_URL ?? 'file:../db/local.db';
const db = createClient({ url: dbUrl, authToken: process.env.LIBSQL_AUTH_TOKEN });

function uid() {
    return randomBytes(8).toString('hex');
}

const LESSONS = [
    // ═══════════  WEEK 2: Handling Problems & Difficult Situations  ═══════════
    {
        day: 8, week: 2, theme: 'Handling Problems',
        title: 'Apologizing Professionally',
        content: [
            {
                type: 'listening',
                instruction: 'Listen to a VA apologizing to a client for a missed deadline.',
                audio_script: `"I sincerely apologize for the delay on the product descriptions. I underestimated the time needed and should have flagged this earlier. I've already completed 80% and will deliver the rest by 10 AM tomorrow. To prevent this from happening again, I'll be setting intermediate check-ins for larger tasks."`,
                question: 'What action does the VA take to prevent future delays?',
                options: ['Hiring an assistant', 'Setting intermediate check-ins', 'Reducing workload', 'Changing work hours'],
                answer: 1
            },
            {
                type: 'drilling',
                instruction: 'Practice apologizing and taking responsibility professionally.',
                patterns: [
                    { prompt: "Apologize for a missed deadline", target: "I sincerely apologize for the delay. I should have flagged this earlier." },
                    { prompt: "Take responsibility for a mistake", target: "This was my oversight, and I take full responsibility." },
                    { prompt: "Explain how you'll fix it", target: "I've already started fixing this and will have it done by tomorrow." },
                    { prompt: "Prevent it from happening again", target: "To prevent this in the future, I'll set up check-in reminders." }
                ]
            },
            {
                type: 'roleplay',
                instruction: 'You missed a deadline on social media posts. Apologize to your client and explain your plan.',
                scenario: 'You were supposed to schedule 10 posts by Thursday but only finished 6. Own the mistake and recover.',
                client_persona: 'Rachel, US-based lifestyle brand. She\'s understanding but values honesty.',
                client_opening: "Hey, I noticed the posts aren't all up yet. What happened?",
                scoring_criteria: ['Apologizes sincerely', 'Takes responsibility', 'Gives specific fix plan', 'Mentions prevention strategy'],
                credit_cost: 1
            },
            {
                type: 'reflection',
                instruction: 'How did you feel apologizing professionally in English?',
                emotion_options: ['😰 Very uncomfortable', '😐 A bit uneasy', '😎 Handled it well'],
                text_prompt: 'Is apologizing in English harder than in Vietnamese? Why?'
            }
        ]
    },
    {
        day: 9, week: 2, theme: 'Handling Problems',
        title: 'Saying No Politely',
        content: [
            {
                type: 'listening',
                instruction: 'Listen to a VA declining an out-of-scope request professionally.',
                audio_script: `"I appreciate you thinking of me for this! However, graphic design isn't something I'm trained in, and I wouldn't want to deliver subpar work. I'd suggest using a freelancer on Fiverr for the logo — I can actually help you find and brief them. Would that work for you?"`,
                question: 'What does the VA offer instead of doing the design work?',
                options: ['A discount on future work', 'Help finding and briefing a freelancer', 'Free extra hours', 'Taking a design course'],
                answer: 1
            },
            {
                type: 'drilling',
                instruction: 'Practice declining requests while being helpful.',
                patterns: [
                    { prompt: "Decline politely", target: "I appreciate the offer, but that falls outside my area of expertise." },
                    { prompt: "Explain why you decline", target: "I wouldn't want to deliver subpar work on something I'm not trained in." },
                    { prompt: "Offer an alternative", target: "I'd suggest using a specialist for this — I can help you find one." },
                    { prompt: "Check if your alternative works", target: "Would that work for you?" }
                ]
            },
            {
                type: 'roleplay',
                instruction: 'Your client asks you to edit a promotional video. You don\'t do video editing. Decline and suggest an alternative.',
                scenario: 'Out-of-scope request. Be appreciative, honest, and offer a helpful alternative.',
                client_persona: 'David, Australian online coach. Easy-going but persistent.',
                client_opening: "Hey, can you edit this 2-minute promo video for me? I need it by Friday.",
                scoring_criteria: ['Declines gracefully', 'Gives honest reason', 'Offers alternative solution', 'Keeps positive tone'],
                credit_cost: 1
            },
            {
                type: 'reflection',
                instruction: 'How do you feel about saying no in English?',
                emotion_options: ['😰 Hard to do', '😐 Awkward but managed', '😎 Natural and polite'],
                text_prompt: 'Is it harder to say no in a work context or a personal context?'
            }
        ]
    },
    {
        day: 10, week: 2, theme: 'Handling Problems',
        title: 'Dealing with Unhappy Customers',
        content: [
            {
                type: 'listening',
                instruction: 'Listen to a VA handling an angry customer email on behalf of the client.',
                audio_script: `"Hi Mark, I'm sorry to hear about your experience with your recent order. I completely understand your frustration — receiving the wrong item is unacceptable. I've already initiated a return label for you, and your correct item will ship within 24 hours. As a gesture of goodwill, we're also adding a 15% discount to your next order. Please don't hesitate to reach out if you need anything else."`,
                question: 'What compensation does the VA offer the customer?',
                options: ['A full refund', 'A 15% discount on next order', 'Free shipping for life', 'A gift card'],
                answer: 1
            },
            {
                type: 'drilling',
                instruction: 'Practice customer de-escalation phrases.',
                patterns: [
                    { prompt: "Acknowledge frustration", target: "I completely understand your frustration, and I'm sorry for the inconvenience." },
                    { prompt: "Say the situation is unacceptable", target: "Receiving the wrong item is absolutely unacceptable, and we apologize." },
                    { prompt: "Explain what you've already done", target: "I've already initiated a return label and your correct item will ship within 24 hours." },
                    { prompt: "Offer goodwill gesture", target: "As a gesture of goodwill, we're adding a 15% discount to your next order." }
                ]
            },
            {
                type: 'roleplay',
                instruction: 'A customer received a damaged product and left a 1-star review. Reply on behalf of the brand.',
                scenario: 'Customer de-escalation. Be empathetic, solution-oriented, and professional.',
                client_persona: 'You are replying on behalf of "GreenLeaf Store". The customer, Amy, is very upset.',
                client_opening: "I received a broken item! This is terrible customer service! I want a refund NOW!",
                scoring_criteria: ['Empathizes with customer', 'Apologizes without excuses', 'Provides clear solution', 'Offers compensation', 'Professional tone'],
                credit_cost: 1
            },
            {
                type: 'reflection',
                instruction: 'How did you feel handling an angry customer in English?',
                emotion_options: ['😰 Stressful', '😐 Manageable', '😎 Confident'],
                text_prompt: 'What phrases helped you stay calm and professional?'
            }
        ]
    },
    {
        day: 11, week: 2, theme: 'Handling Problems',
        title: 'Reporting Problems to Your Client',
        content: [
            {
                type: 'listening',
                instruction: 'Listen to a VA reporting a technical problem to their client.',
                audio_script: `"Hi! I wanted to let you know about an issue I discovered this morning. Your Shopify store's checkout page is showing a 404 error for customers trying to use PayPal. I tested it multiple times and the issue is consistent. I've already contacted Shopify support and submitted a ticket — reference number #45821. I'll follow up with them this afternoon and keep you posted on the resolution."`,
                question: 'What did the VA do before reporting the issue?',
                options: ['Asked a coworker', 'Contacted Shopify support', 'Ignored it', 'Fixed it herself'],
                answer: 1
            },
            {
                type: 'drilling',
                instruction: 'Practice reporting issues clearly and proactively.',
                patterns: [
                    { prompt: "Alert client about an issue", target: "I wanted to let you know about an issue I discovered this morning." },
                    { prompt: "Describe the problem specifically", target: "The checkout page is showing a 404 error for PayPal users." },
                    { prompt: "Say you've already taken action", target: "I've already contacted support and submitted a ticket." },
                    { prompt: "Promise to follow up", target: "I'll follow up this afternoon and keep you posted." }
                ]
            },
            {
                type: 'roleplay',
                instruction: 'You found that your client\'s email campaign sent the wrong discount code. Report it with a solution.',
                scenario: 'Proactive problem reporting. Describe the issue, what you\'ve done, and your fix plan.',
                client_persona: 'Priya, Indian-American e-com founder. She panics easily — be calm and solution-focused.',
                client_opening: "What's up? You said something urgent?",
                scoring_criteria: ['Reports issue clearly', 'Stays calm', 'Already has an action plan', 'Offers next steps'],
                credit_cost: 1
            },
            {
                type: 'reflection',
                instruction: 'How comfortable were you reporting bad news in English?',
                emotion_options: ['😰 Dreaded it', '😐 It was okay', '😎 Felt professional'],
                text_prompt: 'What was the hardest part: finding the words, or the tone?'
            }
        ]
    },
    {
        day: 12, week: 2, theme: 'Handling Problems',
        title: 'Negotiating Deadlines and Workload',
        content: [
            {
                type: 'listening',
                instruction: 'A VA negotiates a more realistic deadline with their client.',
                audio_script: `"I've looked at the list of tasks for this week, and I want to be transparent. With the current workload, completing all 15 product listings plus the email campaign by Friday would mean rushing the quality. I'd suggest prioritizing the email campaign for Wednesday, then the product listings by next Monday. That way everything gets the attention it deserves. What do you think?"`,
                question: 'Why does the VA suggest extending the deadline?',
                options: ['She wants more pay', 'To avoid rushing and maintain quality', 'She\'s not available', 'The tasks are too hard'],
                answer: 1
            },
            {
                type: 'drilling',
                instruction: 'Practice negotiating timelines professionally.',
                patterns: [
                    { prompt: "Be transparent about workload", target: "I want to be transparent about the current workload." },
                    { prompt: "Explain rushing would hurt quality", target: "Completing everything by Friday would mean rushing the quality." },
                    { prompt: "Suggest a priority order", target: "I'd suggest prioritizing the email campaign first, then the listings." },
                    { prompt: "Ask for client's input", target: "That way everything gets the attention it deserves. What do you think?" }
                ]
            },
            {
                type: 'roleplay',
                instruction: 'Your client just added 3 more tasks on top of your existing workload. Negotiate a realistic timeline.',
                scenario: 'Workload negotiation. Don\'t just accept — prioritize, suggest, and get agreement.',
                client_persona: 'Kevin, US tech startup founder. Moves fast, piles on tasks, but respects pushback.',
                client_opening: "Hey, I need you to also handle these 3 new things by Friday on top of everything else. Cool?",
                scoring_criteria: ['Doesn\'t just accept', 'Explains impact on quality', 'Suggests prioritization', 'Gets client agreement'],
                credit_cost: 1
            },
            {
                type: 'reflection',
                instruction: 'How confident were you negotiating in English?',
                emotion_options: ['😰 Really hard', '😐 Managed okay', '😎 Felt empowered'],
                text_prompt: 'Do you usually just accept extra work? How can you improve?'
            }
        ]
    },
    {
        day: 13, week: 2, theme: 'Handling Problems',
        title: 'Following Up Without Being Annoying',
        content: [
            {
                type: 'listening',
                instruction: 'Listen to a VA following up with a client who hasn\'t responded.',
                audio_script: `"Hi Sarah! Just circling back on my message from Tuesday regarding the social media calendar approval. I know you're busy, so no rush — but I wanted to make sure it didn't get buried in your inbox. Once I have your approval, I can start scheduling the posts. Let me know if you'd like any changes! Have a great day."`,
                question: 'How does the VA make the follow-up feel non-pushy?',
                options: ['She demands an answer', 'She says "no rush" and acknowledges the client is busy', 'She sends it multiple times', 'She CC\'s the boss'],
                answer: 1
            },
            {
                type: 'drilling',
                instruction: 'Practice polite follow-up messages.',
                patterns: [
                    { prompt: "Follow up on a previous message", target: "Just circling back on my message from Tuesday." },
                    { prompt: "Acknowledge the client is busy", target: "I know you're busy, so no rush!" },
                    { prompt: "Make sure it wasn't missed", target: "I wanted to make sure it didn't get buried in your inbox." },
                    { prompt: "State what happens next", target: "Once I have your approval, I can start scheduling the posts." }
                ]
            },
            {
                type: 'roleplay',
                instruction: 'Your client hasn\'t replied to an important question for 3 days. Send a friendly follow-up.',
                scenario: 'Polite follow-up. Be warm, understanding, and keep momentum without pressure.',
                client_persona: 'Emma, UK blogger. Lovely but easily overwhelmed and forgets to reply.',
                client_opening: "(Emma hasn't replied to your message from 3 days ago about the newsletter theme.)",
                scoring_criteria: ['References original message', 'Keeps friendly tone', 'Doesn\'t add pressure', 'Makes it easy to respond'],
                credit_cost: 1
            },
            {
                type: 'reflection',
                instruction: 'How do you feel about following up in English?',
                emotion_options: ['😰 Worried about annoying', '😐 Getting the hang of it', '😎 Professional and natural'],
                text_prompt: 'How many days do you usually wait before following up?'
            }
        ]
    },
    {
        day: 14, week: 2, theme: 'Handling Problems',
        title: 'Week 2 Challenge: Full Problem Resolution',
        content: [
            {
                type: 'listening',
                instruction: 'Listen to a VA handling a complex problem from discovery to resolution.',
                audio_script: `Client: "I just got 5 angry emails from customers saying their discount codes don't work!"\nVA: "I see this is urgent. Let me look into it right away. [pause] I found the issue — the discount codes were set to expire yesterday instead of next week. Here's my plan: I'll correct the codes now, then personally reply to all 5 customers with an apology and a working code. I'll also add a small bonus discount as a gesture of goodwill. I'll have this resolved within the hour and send you a full report."\nClient: "Okay that sounds good. Thank you for being on top of it."`,
                question: 'What was the root cause of the problem?',
                options: ['Wrong products were listed', 'Discount codes expired too early', 'Customers had wrong emails', 'Website was down'],
                answer: 1
            },
            {
                type: 'drilling',
                instruction: 'Week 2 review — master problem-handling phrases.',
                patterns: [
                    { prompt: "Acknowledge urgency", target: "I see this is urgent. Let me look into it right away." },
                    { prompt: "Report your findings", target: "I found the issue — the discount codes were set to expire too early." },
                    { prompt: "Present your action plan", target: "Here's my plan: I'll correct the codes and reply to all affected customers." },
                    { prompt: "Commit to a timeline", target: "I'll have this resolved within the hour and send you a full report." },
                    { prompt: "Apologize and offer goodwill", target: "I sincerely apologize. As a gesture of goodwill, here's an extra discount." }
                ]
            },
            {
                type: 'roleplay',
                instruction: 'Week 2 Challenge: Your client\'s online store just went down during a flash sale. Handle the situation from discovery to resolution.',
                scenario: 'Full crisis management exercise. Investigate, communicate, resolve, and prevent.',
                client_persona: 'Nina, German e-commerce owner. Very structured, expects detailed updates.',
                client_opening: "My store is DOWN! Customers are messaging me on Instagram saying they can't buy! What's going on?!",
                scoring_criteria: [
                    'Stays calm under pressure',
                    'Investigates before responding',
                    'Provides clear action plan',
                    'Sets realistic timeline',
                    'Follows up with prevention strategy'
                ],
                credit_cost: 2
            },
            {
                type: 'reflection',
                instruction: "🎉 Week 2 Complete! How do you feel about handling problems in English now?",
                emotion_options: ['😰 Still nervous', '😐 Getting better', '😎 Much more confident!'],
                text_prompt: 'What was your biggest Week 2 breakthrough?'
            }
        ]
    },

    // ═══════════  WEEK 3: Building Client Relationships  ═══════════
    {
        day: 15, week: 3, theme: 'Client Relationships',
        title: 'Small Talk with Clients',
        content: [
            {
                type: 'listening',
                instruction: 'Listen to a VA engaging in professional small talk at the start of a meeting.',
                audio_script: `"Good morning, Jessica! How was your weekend? I saw on Instagram your family went camping — that looks amazing! Before we dive in, I just wanted to mention that I finished the email templates you asked about. Ready whenever you are to review them."`,
                question: 'What does the VA do before talking about work?',
                options: ['Complains about workload', 'Mentions something personal about the client', 'Asks for a raise', 'Apologizes for being late'],
                answer: 1
            },
            {
                type: 'drilling',
                instruction: 'Practice professional small talk openers.',
                patterns: [
                    { prompt: "Ask about client's weekend", target: "How was your weekend? Did you do anything fun?" },
                    { prompt: "Comment on something they shared", target: "I saw your post about the camping trip — that looked amazing!" },
                    { prompt: "Transition to work naturally", target: "Before we dive in, I wanted to mention I finished the templates." },
                    { prompt: "Show genuine interest", target: "That sounds really cool! How long have you been into hiking?" }
                ]
            },
            {
                type: 'roleplay',
                instruction: 'Start a Monday check-in with your client. Do some small talk before discussing the tasks.',
                scenario: 'Weekly check-in. Build rapport with casual conversation before jumping into work.',
                client_persona: 'Sofia, Brazilian store owner living in Miami. Very warm and social.',
                client_opening: "Hey! How are you today? I had the most amazing brunch yesterday!",
                scoring_criteria: ['Engages in small talk naturally', 'Shows genuine interest', 'Transitions smoothly to work', 'Warm but professional'],
                credit_cost: 1
            },
            {
                type: 'reflection',
                instruction: 'How comfortable are you with small talk in English?',
                emotion_options: ['😰 Very awkward', '😐 Getting used to it', '😎 Natural and fun'],
                text_prompt: 'What topics feel easiest for small talk?'
            }
        ]
    },
    {
        day: 16, week: 3, theme: 'Client Relationships',
        title: 'Giving Suggestions and Recommendations',
        content: [
            {
                type: 'listening',
                instruction: 'A VA proactively suggests improvements to a client\'s process.',
                audio_script: `"I've been reviewing your customer support workflow, and I noticed we're spending about 40% of our time on repetitive questions — things like shipping times and return policies. I have a suggestion: we could create a FAQ section on the website and set up canned responses for the most common questions. This could save us about 3 hours per week. Would you like me to draft something?"`,
                question: 'What does the VA suggest to save time?',
                options: ['Hiring more staff', 'Creating a FAQ and canned responses', 'Ignoring repetitive questions', 'Reducing customer support hours'],
                answer: 1
            },
            {
                type: 'drilling',
                instruction: 'Practice making professional suggestions.',
                patterns: [
                    { prompt: "Share an observation", target: "I've noticed we're spending 40% of our time on repetitive questions." },
                    { prompt: "Introduce a suggestion", target: "I have a suggestion that could save us about 3 hours per week." },
                    { prompt: "Explain the benefit", target: "This would free up time for more important tasks." },
                    { prompt: "Offer to take action", target: "Would you like me to draft something for your review?" }
                ]
            },
            {
                type: 'roleplay',
                instruction: 'You noticed your client\'s social media posts get low engagement. Suggest a strategy improvement.',
                scenario: 'Proactive suggestion. Share data, propose a solution, and offer to implement it.',
                client_persona: 'Marcus, US fitness brand. Open to ideas, values data-driven suggestions.',
                client_opening: "I feel like our social media isn't working. What do you think we should change?",
                scoring_criteria: ['Shares specific observation', 'Proposes clear solution', 'Explains benefits', 'Offers to implement'],
                credit_cost: 1
            },
            {
                type: 'reflection',
                instruction: 'How did you feel giving suggestions to a client in English?',
                emotion_options: ['😰 Scared to suggest', '😐 Okay once I started', '😎 Felt like a consultant'],
                text_prompt: 'Do you usually wait to be asked, or do you suggest proactively?'
            }
        ]
    },
    {
        day: 17, week: 3, theme: 'Client Relationships',
        title: 'Handling Feedback and Criticism',
        content: [
            {
                type: 'listening',
                instruction: 'Listen to how a VA receives critical feedback gracefully.',
                audio_script: `"Thank you for sharing that feedback — I really appreciate your honesty. You're right that the email subject lines could be more engaging. I'll review some best practices and rewrite the last batch. Could I send you 3 options for each so you can choose the style you prefer? That way I'll get a better sense of your brand voice going forward."`,
                question: 'How does the VA respond to criticism?',
                options: ['Gets defensive', 'Thanks the client and proposes a fix', 'Ignores the feedback', 'Apologizes excessively'],
                answer: 1
            },
            {
                type: 'drilling',
                instruction: 'Practice accepting and responding to feedback.',
                patterns: [
                    { prompt: "Thank client for feedback", target: "Thank you for sharing that feedback — I really appreciate your honesty." },
                    { prompt: "Acknowledge the point", target: "You're right, the subject lines could definitely be more engaging." },
                    { prompt: "Propose a fix", target: "I'll rewrite them and send you 3 options to choose from." },
                    { prompt: "Show you'll learn from it", target: "This will help me understand your brand voice better going forward." }
                ]
            },
            {
                type: 'roleplay',
                instruction: 'Your client says the content you wrote is "too formal and boring." Respond professionally.',
                scenario: 'Receiving creative criticism. Don\'t take it personally — learn and adapt.',
                client_persona: 'Zara, Gen-Z brand founder. Direct and trendy, wants casual, fun copy.',
                client_opening: "Hey, I love your work ethic, but the blog posts feel really formal and boring. Our audience is young — can we make it more fun?",
                scoring_criteria: ['Accepts feedback gracefully', 'Doesn\'t get defensive', 'Asks clarifying questions', 'Shows willingness to adapt'],
                credit_cost: 1
            },
            {
                type: 'reflection',
                instruction: 'How did you feel receiving criticism in English?',
                emotion_options: ['😰 Took it personally', '😐 Processed it okay', '😎 Saw it as growth'],
                text_prompt: 'What\'s the hardest part: understanding the feedback or responding to it?'
            }
        ]
    },
    {
        day: 18, week: 3, theme: 'Client Relationships',
        title: 'Sharing Wins and Celebrating Milestones',
        content: [
            {
                type: 'listening',
                instruction: 'A VA shares a positive result with their client.',
                audio_script: `"Great news! Remember the email campaign we set up last week? The open rate was 42%, which is almost double the industry average! We also got 28 new subscribers from that single blast. I think the personalized subject lines and the timing made a huge difference. Should we replicate this strategy for next week's campaign?"`,
                question: 'What was the email campaign\'s open rate?',
                options: ['21%', '28%', '42%', '56%'],
                answer: 2
            },
            {
                type: 'drilling',
                instruction: 'Practice sharing wins with specific data.',
                patterns: [
                    { prompt: "Share a positive result", target: "Great news! The email campaign had a 42% open rate — almost double the average!" },
                    { prompt: "Highlight what worked", target: "I think the personalized subject lines made a huge difference." },
                    { prompt: "Share specific numbers", target: "We gained 28 new subscribers from that single campaign." },
                    { prompt: "Suggest repeating success", target: "Should we replicate this strategy for next week?" }
                ]
            },
            {
                type: 'roleplay',
                instruction: 'You just achieved a great customer satisfaction score. Share the win with your client.',
                scenario: 'Sharing success. Use data, highlight your contribution, and suggest next steps.',
                client_persona: 'Oliver, UK online retailer. Loves metrics and celebrating wins.',
                client_opening: "How did last week go? Any updates?",
                scoring_criteria: ['Leads with positive news', 'Includes specific data', 'Explains why it worked', 'Suggests next steps'],
                credit_cost: 1
            },
            {
                type: 'reflection',
                instruction: 'How did it feel sharing good news in English?',
                emotion_options: ['😰 Felt like bragging', '😐 Okay', '😎 Natural and confident'],
                text_prompt: 'Do you usually share wins with clients, or do you wait to be asked?'
            }
        ]
    },
    {
        day: 19, week: 3, theme: 'Client Relationships',
        title: 'Asking for Feedback and Reviews',
        content: [
            {
                type: 'listening',
                instruction: 'A VA asks their client for feedback after completing a large project.',
                audio_script: `"Now that we've wrapped up the store migration, I'd love to get your feedback on how everything went. Were there any areas where I could improve? Also, if you're happy with the work, would you mind leaving a short review on my profile? It really helps me get more clients. No pressure at all — only if you're comfortable!"`,
                question: 'How does the VA ask for a review?',
                options: ['Demands it', 'Asks politely and says no pressure', 'Offers a discount for it', 'Doesn\'t ask at all'],
                answer: 1
            },
            {
                type: 'drilling',
                instruction: 'Practice asking for feedback and testimonials.',
                patterns: [
                    { prompt: "Ask for feedback after a project", target: "I'd love to get your feedback on how everything went." },
                    { prompt: "Ask about areas to improve", target: "Were there any areas where I could improve?" },
                    { prompt: "Request a review politely", target: "Would you mind leaving a short review on my profile?" },
                    { prompt: "Remove pressure", target: "No pressure at all — only if you're comfortable!" }
                ]
            },
            {
                type: 'roleplay',
                instruction: 'You\'ve been working with a client for a month. Ask for feedback and a testimonial.',
                scenario: 'End-of-month check-in. Be genuine, value-driven, and low-pressure.',
                client_persona: 'Hannah, Canadian shopkeeper. Very appreciative and loves giving positive feedback.',
                client_opening: "Hey! Another great month. What's on the agenda today?",
                scoring_criteria: ['Asks for honest feedback', 'Requests review politely', 'No pressure language', 'Shows gratitude'],
                credit_cost: 1
            },
            {
                type: 'reflection',
                instruction: 'How comfortable are you asking for reviews in English?',
                emotion_options: ['😰 Very awkward', '😐 Doable', '😎 Confident'],
                text_prompt: 'Have you ever asked a client for a review before?'
            }
        ]
    },
    {
        day: 20, week: 3, theme: 'Client Relationships',
        title: 'Professional Sign-offs and End-of-Day Messages',
        content: [
            {
                type: 'listening',
                instruction: 'Listen to different professional sign-off messages from a VA.',
                audio_script: `"Signing off for today! Here's a quick summary of what I accomplished: processed 12 orders, responded to 8 customer emails, and updated the inventory sheet. Tomorrow I'll focus on the new product listings and the social media calendar. If anything urgent comes up, feel free to message me — I'll check first thing in the morning. Have a wonderful evening!"`,
                question: 'What will the VA work on tomorrow?',
                options: ['Processing orders', 'Customer emails', 'Product listings and social media calendar', 'Inventory updates'],
                answer: 2
            },
            {
                type: 'drilling',
                instruction: 'Practice writing professional end-of-day messages.',
                patterns: [
                    { prompt: "Sign off for the day", target: "Signing off for today! Here's a quick summary of what I accomplished." },
                    { prompt: "Summarize what you did", target: "Today I processed 12 orders and responded to 8 customer emails." },
                    { prompt: "Preview tomorrow's tasks", target: "Tomorrow I'll focus on the new product listings." },
                    { prompt: "End warmly", target: "Have a wonderful evening! I'll check messages first thing in the morning." }
                ]
            },
            {
                type: 'roleplay',
                instruction: 'Write your end-of-day sign-off message after a productive workday.',
                scenario: 'Daily sign-off. Be concise, organized, and warm.',
                client_persona: 'Carlos, Mexican-American entrepreneur. Appreciates structured updates.',
                client_opening: "Hey, wrapping up for the day?",
                scoring_criteria: ['Clear summary of accomplishments', 'Preview of next day', 'Mentions availability for urgent items', 'Professional and warm closing'],
                credit_cost: 1
            },
            {
                type: 'reflection',
                instruction: 'How natural do your sign-off messages feel in English?',
                emotion_options: ['😰 Still templated', '😐 Getting more natural', '😎 Feels like my own voice'],
                text_prompt: 'What\'s your favorite sign-off phrase to use?'
            }
        ]
    },
    {
        day: 21, week: 3, theme: 'Client Relationships',
        title: 'Week 3 Challenge: Full Client Relationship Scenario',
        content: [
            {
                type: 'listening',
                instruction: 'Listen to a complete client relationship scenario involving small talk, suggestion, and wrap-up.',
                audio_script: `VA: "Good morning, Jason! Hope you had a great weekend. I saw you went to that food festival — any recommendations?"\nClient: "Ha! Yeah, the Thai food stall was amazing. Anyway, how are things going?"\nVA: "Everything's on track! I actually had an idea I wanted to run by you. I noticed our response time for customer emails has improved by 30% since we started using templates. What if we also created short video responses for the most complex questions? I saw that competitors are doing it. I could set up a pilot with 5 videos."\nClient: "That's a great idea! Let's try it."\nVA: "Awesome! I'll draft a plan by Wednesday. And just a heads-up — could I get your feedback on my first month next week? I'd love to hear how I can keep improving."`,
                question: 'What new idea does the VA propose?',
                options: ['Email templates', 'Video responses for complex questions', 'A chatbot', 'Social media stories'],
                answer: 1
            },
            {
                type: 'drilling',
                instruction: 'Week 3 review — master relationship-building phrases.',
                patterns: [
                    { prompt: "Start with small talk", target: "Hope you had a great weekend! I saw you went to that food festival." },
                    { prompt: "Share an observation with data", target: "I noticed our response time improved by 30% since using templates." },
                    { prompt: "Pitch a new idea", target: "What if we also created short video responses for complex questions?" },
                    { prompt: "Ask for feedback positively", target: "I'd love to hear how I can keep improving — any areas to focus on?" },
                    { prompt: "Sign off warmly", target: "Thanks for a great first month! Looking forward to growing together." }
                ]
            },
            {
                type: 'roleplay',
                instruction: 'Week 3 Challenge: Full relationship scenario — small talk, share a win, make a suggestion, and ask for feedback.',
                scenario: 'This is your Week 3 final challenge. Build rapport, share results, propose improvements, and request feedback.',
                client_persona: 'Amanda, US wellness brand founder. Values trust, initiative, and personality.',
                client_opening: "Hey! Happy Friday! Let's do our weekly sync. How's everything going?",
                scoring_criteria: [
                    'Natural small talk opening',
                    'Shares specific wins/data',
                    'Makes proactive suggestion',
                    'Asks for feedback genuinely',
                    'Professional but personable throughout'
                ],
                credit_cost: 2
            },
            {
                type: 'reflection',
                instruction: "🎉 Week 3 Complete! You've built real client communication skills. How do you feel?",
                emotion_options: ['😰 Still growing', '😐 Improving steadily', '😎 Feeling like a pro!'],
                text_prompt: 'If you could give one tip to a new VA about client communication, what would it be?'
            }
        ]
    }
];

async function seed() {
    console.log('🌱  Seeding Weeks 2–3 lessons (Days 8–21)…');
    let inserted = 0;
    let skipped = 0;

    for (const lesson of LESSONS) {
        // Check if already exists
        const existing = await db.execute({
            sql: 'SELECT id FROM lessons WHERE day_number = ? AND niche = ?',
            args: [lesson.day, 'general']
        });
        if (existing.rows.length > 0) {
            console.log(`  ⏭️  Day ${lesson.day}: already exists, skipping`);
            skipped++;
            continue;
        }

        try {
            await db.execute({
                sql: `INSERT INTO lessons (id, day_number, week_number, week_theme, niche, title, content, is_published)
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
            console.log(`  ✅  Day ${lesson.day}: ${lesson.title}`);
            inserted++;
        } catch (err) {
            console.warn(`  ⚠️  Day ${lesson.day} error: ${err.message}`);
            skipped++;
        }
    }

    const total = await db.execute('SELECT COUNT(*) as count FROM lessons');
    console.log(`\n🎉  Seed complete. ${inserted} lessons inserted, ${skipped} skipped.`);
    console.log(`📊  Total lessons in DB: ${total.rows[0].count}`);
}

seed().catch(err => {
    console.error('❌  Seed failed:', err);
    process.exit(1);
});
