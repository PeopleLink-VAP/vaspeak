/**
 * seed-weeks-4-7.js — Seeds Weeks 4-7 (Days 22-49) using Groq AI.
 * Usage: node scripts/seed-weeks-4-7.js
 * Safe to re-run: skips existing days.
 */
import { createClient } from '@libsql/client';
import { randomBytes } from 'crypto';
import 'dotenv/config';

const db = createClient({ url: process.env.LIBSQL_DB_URL ?? 'file:../db/local.db', authToken: process.env.LIBSQL_AUTH_TOKEN });
const GROQ_API_KEY = process.env.GROQ_API_KEY;
function uid() { return randomBytes(8).toString('hex'); }

const WEEKS = [
  { week: 4, theme: 'Email & Written Communication', days: [
    'Writing Professional Emails', 'Subject Lines That Get Opened', 'Request and Follow-Up Emails',
    'Reporting Progress in Writing', 'Handling Email Complaints', 'Writing SOPs and Instructions', 'Week 4 Challenge: Full Email Sequence'
  ]},
  { week: 5, theme: 'Meetings & Video Calls', days: [
    'Pre-Meeting Preparation', 'Opening a Meeting Confidently', 'Presenting Updates Clearly',
    'Asking Questions in Meetings', 'Taking and Sharing Meeting Notes', 'Handling Technical Difficulties', 'Week 5 Challenge: Full Meeting Simulation'
  ]},
  { week: 6, theme: 'Specialized VA Skills', days: [
    'E-commerce Product Descriptions', 'Social Media Captions & Engagement', 'Customer Support Chat Scripts',
    'Data Entry & Spreadsheet Communication', 'Project Management Updates', 'Invoicing and Payment Discussions', 'Week 6 Challenge: Multi-Skill Scenario'
  ]},
  { week: 7, theme: 'Advanced Communication & Career Growth', days: [
    'Pitching Yourself to New Clients', 'Negotiating Rates Professionally', 'Handling Scope Creep',
    'Building Long-Term Client Relationships', 'Creating Your VA Portfolio Pitch', 'Networking in English', 'Week 7 Challenge: Full Client Onboarding'
  ]}
];

async function generateLesson(dayNum, weekNum, theme, title) {
  const prompt = `Generate a VASpeak English lesson for Vietnamese Virtual Assistants.
Week ${weekNum} theme: "${theme}". Day ${dayNum}: "${title}".

Return ONLY valid JSON (no markdown fences) with this exact structure:
[
  {"type":"listening","instruction":"Listen instruction","audio_script":"A 3-4 sentence professional dialogue or monologue","question":"Comprehension question","options":["A","B","C","D"],"answer":1},
  {"type":"drilling","instruction":"Practice instruction","patterns":[{"prompt":"Situation prompt","target":"Model response sentence"},{"prompt":"P2","target":"T2"},{"prompt":"P3","target":"T3"},{"prompt":"P4","target":"T4"}]},
  {"type":"roleplay","instruction":"Roleplay instruction","scenario":"Scenario description","client_persona":"Name, background","client_opening":"Client's first message","scoring_criteria":["C1","C2","C3","C4"],"credit_cost":${dayNum % 7 === 0 ? 2 : 1}},
  {"type":"reflection","instruction":"Reflection question","emotion_options":["😰 Option 1","😐 Option 2","😎 Option 3"],"text_prompt":"Open-ended question"}
]
Make content practical for real VA work. Audio scripts should be 3-5 sentences. All in English.`;

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7, max_tokens: 1500
    })
  });
  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content || '';
  const cleaned = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleaned);
}

async function seed() {
  console.log('🌱  Seeding Weeks 4–7 (Days 22–49) via AI…\n');
  let inserted = 0, skipped = 0, errors = 0;

  for (const week of WEEKS) {
    console.log(`\n📅 Week ${week.week}: ${week.theme}`);
    for (let i = 0; i < week.days.length; i++) {
      const dayNum = (week.week - 1) * 7 + i + 1;
      const title = week.days[i];

      const existing = await db.execute({ sql: 'SELECT id FROM lessons WHERE day_number = ? AND niche = ?', args: [dayNum, 'general'] });
      if (existing.rows.length > 0) { console.log(`  ⏭️  Day ${dayNum}: exists`); skipped++; continue; }

      try {
        console.log(`  ⏳ Day ${dayNum}: ${title}…`);
        const content = await generateLesson(dayNum, week.week, week.theme, title);
        await db.execute({
          sql: 'INSERT INTO lessons (id, day_number, week_number, week_theme, niche, title, content, is_published) VALUES (?,?,?,?,?,?,?,1)',
          args: [uid(), dayNum, week.week, week.theme, 'general', title, JSON.stringify(content)]
        });
        console.log(`  ✅ Day ${dayNum}: ${title}`);
        inserted++;
        await new Promise(r => setTimeout(r, 1500)); // rate limit
      } catch (err) {
        console.error(`  ❌ Day ${dayNum}: ${err.message}`);
        errors++;
      }
    }
  }

  const total = await db.execute('SELECT COUNT(*) as count FROM lessons');
  console.log(`\n🎉 Done. ${inserted} inserted, ${skipped} skipped, ${errors} errors.`);
  console.log(`📊 Total lessons: ${total.rows[0].count}`);
}

seed().catch(e => { console.error('❌ Failed:', e); process.exit(1); });
