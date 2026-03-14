/**
 * seed-niches.js — Seeds specialized niche tracks using Groq AI.
 * Usage: node scripts/seed-niches.js
 * Safe to re-run: skips existing days.
 */
import { createClient } from '@libsql/client';
import { randomBytes } from 'crypto';
import 'dotenv/config';

const db = createClient({ url: process.env.LIBSQL_DB_URL ?? 'file:../db/local.db', authToken: process.env.LIBSQL_AUTH_TOKEN });
const GROQ_API_KEY = process.env.GROQ_API_KEY;
function uid() { return randomBytes(8).toString('hex'); }

const NICHES = {
  ecommerce: {
    label: 'E-commerce & Shopify',
    weeks: [
      { week: 1, theme: 'Store Management & Product Listings', days: [
        'Writing Product Descriptions', 'Handling Inventory Updates', 'Responding to Shipping Inquiries',
        'Processing Refunds and Returns', 'Setting Up Discount Codes', 'Communicating with Suppliers', 'Week 1 Challenge: Full Order Issue Resolution'
      ]},
      { week: 2, theme: 'Customer Support & Sales', days: [
        'Handling "Where is my order?" (WISMO)', 'Dealing with Angry Customers', 'Upselling and Cross-selling',
        'Managing Shopify Abandoned Carts', 'Writing Review Responses', 'Handling Fraud/Chargebacks', 'Week 2 Challenge: Live Chat Simulation'
      ]}
    ]
  },
  video_editor: {
    label: 'Video Editing & YouTube Management',
    weeks: [
      { week: 1, theme: 'Understanding Client Briefs', days: [
        'Clarifying Editing Instructions', 'Discussing Pacing and Tone', 'Asking for Missing Assets',
        'Explaining Render Times', 'Suggesting B-Roll and Transitions', 'Sending First Drafts', 'Week 1 Challenge: Kickoff Call Simulation'
      ]},
      { week: 2, theme: 'Revisions & Feedback', days: [
        'Handling Revision Requests', 'Defending Creative Choices', 'Explaining Technical Limitations',
        'Discussing Background Music & Copyright', 'Finalizing Video Delivery', 'YouTube Upload & Metadata Hand-off', 'Week 2 Challenge: Heavy Revisions Scenario'
      ]}
    ]
  }
};

async function generateLesson(nicheId, nicheLabel, dayNum, weekNum, theme, title) {
  const prompt = `Generate a VASpeak English lesson for Vietnamese Virtual Assistants specializing in the ${nicheLabel} niche.
Week ${weekNum} theme: "${theme}". Day ${dayNum}: "${title}".

Return ONLY valid JSON (no markdown fences) with this exact structure:
[
  {"type":"listening","instruction":"Listen instruction","audio_script":"A 3-4 sentence professional dialogue or monologue","question":"Comprehension question","options":["A","B","C","D"],"answer":1},
  {"type":"drilling","instruction":"Practice instruction","patterns":[{"prompt":"Situation prompt","target":"Model response sentence"},{"prompt":"P2","target":"T2"},{"prompt":"P3","target":"T3"},{"prompt":"P4","target":"T4"}]},
  {"type":"roleplay","instruction":"Roleplay instruction","scenario":"Scenario description","client_persona":"Name, background","client_opening":"Client's first message","scoring_criteria":["C1","C2","C3","C4"],"credit_cost":${dayNum % 7 === 0 ? 3 : 2}},
  {"type":"reflection","instruction":"Reflection question","emotion_options":["😰 Option 1","😐 Option 2","😎 Option 3"],"text_prompt":"Open-ended question"}
]
Make content highly practical and specific to the ${nicheLabel} niche. Audio scripts should be 3-5 sentences. All content in English except instructions/prompts which should be in Vietnamese. Focus heavily on terminology relevant to this niche.`;

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
  console.log('🌱  Seeding Niche Tracks via AI…\n');
  let inserted = 0, skipped = 0, errors = 0;

  for (const [nicheId, nicheData] of Object.entries(NICHES)) {
    console.log(`\n================================`);
    console.log(`🛍️  Niche: ${nicheData.label} (${nicheId})`);
    console.log(`================================`);

    for (const week of nicheData.weeks) {
      console.log(`\n📅 Week ${week.week}: ${week.theme}`);
      for (let i = 0; i < week.days.length; i++) {
        const dayNum = (week.week - 1) * 7 + i + 1; // 1-28 for niche tracks
        const title = week.days[i];

        const existing = await db.execute({ sql: 'SELECT id FROM lessons WHERE day_number = ? AND niche = ?', args: [dayNum, nicheId] });
        if (existing.rows.length > 0) { console.log(`  ⏭️  Day ${dayNum}: exists`); skipped++; continue; }

        try {
          console.log(`  ⏳ Day ${dayNum}: ${title}…`);
          const content = await generateLesson(nicheId, nicheData.label, dayNum, week.week, week.theme, title);
          await db.execute({
            sql: 'INSERT INTO lessons (id, day_number, week_number, week_theme, niche, title, content, is_published) VALUES (?,?,?,?,?,?,?,1)',
            args: [uid(), dayNum, week.week, week.theme, nicheId, title, JSON.stringify(content)]
          });
          console.log(`  ✅ Day ${dayNum}: ${title}`);
          inserted++;
          await new Promise(r => setTimeout(r, 2000)); // slightly longer rate limit delay for safety
        } catch (err) {
          console.error(`  ❌ Day ${dayNum}: ${err.message}`);
          errors++;
        }
      }
    }
  }

  const total = await db.execute('SELECT COUNT(*) as count FROM lessons WHERE niche != \'general\'');
  console.log(`\n🎉 Done. ${inserted} inserted, ${skipped} skipped, ${errors} errors.`);
  console.log(`📊 Total niche lessons: ${total.rows[0].count}`);
}

seed().catch(e => { console.error('❌ Failed:', e); process.exit(1); });
