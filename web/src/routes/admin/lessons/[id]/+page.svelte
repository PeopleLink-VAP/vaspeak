<script lang="ts">
    import { enhance } from '$app/forms';
    import { invalidateAll } from '$app/navigation';
    import { Headphones, RefreshCw, Bot, MessageCircle, Save, ExternalLink, ArrowLeft } from 'lucide-svelte';

    let { data, form } = $props();

    const lesson = $derived(data.lesson);

    // Local mutable copies of each block's fields
    type BlockType = 'listening' | 'drilling' | 'roleplay' | 'reflection';

    let blocks = $state<Record<BlockType, Record<string, unknown>>>({
        listening: {},
        drilling: {},
        roleplay: {},
        reflection: {}
    });

    // Initialise from server data
    $effect(() => {
        if (!lesson?.content) return;
        for (const b of lesson.content as any[]) {
            if (b.type in blocks) {
                blocks[b.type as BlockType] = { ...b };
            }
        }
    });

    // Helpers
    function getStr(type: BlockType, key: string): string {
        return String(blocks[type]?.[key] ?? '');
    }
    function setStr(type: BlockType, key: string, val: string) {
        blocks[type] = { ...blocks[type], [key]: val };
    }
    function getArr(type: BlockType, key: string): string[] {
        const raw = blocks[type]?.[key];
        return Array.isArray(raw) ? raw.map(String) : [];
    }
    function setArr(type: BlockType, key: string, val: string) {
        // Textarea with one item per line → array
        blocks[type] = { ...blocks[type], [key]: val.split('\n').map(s => s.trimEnd()).filter(Boolean) };
    }
    function arrToText(type: BlockType, key: string): string {
        return getArr(type, key).join('\n');
    }

    // Serialize all blocks to JSON for the form
    function blockJson(type: BlockType): string {
        return JSON.stringify({ ...blocks[type], type });
    }

    let saving = $state(false);
    let saveMsg = $state('');

    // Active tab
    let activeTab = $state<BlockType>('listening');
    const TABS: { type: BlockType; icon: typeof Headphones; label: string }[] = [
        { type: 'listening',  icon: Headphones, label: 'Block 1 — Listening' },
        { type: 'drilling',   icon: RefreshCw, label: 'Block 2 — Drilling' },
        { type: 'roleplay',   icon: Bot, label: 'Block 3 — Roleplay' },
        { type: 'reflection', icon: MessageCircle, label: 'Block 4 — Reflection' }
    ];
</script>

<svelte:head><title>{lesson?.title ?? 'Lesson'} — VASpeak Admin</title></svelte:head>

{#if !lesson}
    <div class="not-found">
        <p>Lesson not found.</p>
        <a href="/admin/lessons" class="btn btn-ghost"><ArrowLeft size={14} /> Back to Lessons</a>
    </div>
{:else}
<div class="page">
    <!-- Header -->
    <div class="page-header">
        <div class="header-left">
            <a href="/admin/lessons" class="back-link"><ArrowLeft size={14} /> Lessons</a>
            <div>
                <h1 class="page-title">{lesson.title}</h1>
                <div class="page-meta">
                    Day {lesson.day_number} · Week {lesson.week_number}
                    {#if lesson.week_theme}<span class="sep">·</span>{lesson.week_theme}{/if}
                    <span class="sep">·</span>
                    <span class="niche-badge">{lesson.niche}</span>
                    <span class="sep">·</span>
                    <span class="status-badge" class:published={lesson.is_published}>
                        {lesson.is_published ? '● Published' : '○ Draft'}
                    </span>
                </div>
            </div>
        </div>
        <div class="header-actions">
            <a href="/lesson/{lesson.day_number}" target="_blank" class="btn btn-ghost"><ExternalLink size={14} /> Preview</a>
            <form method="POST" action="?/togglePublish" use:enhance={() => () => invalidateAll()}>
                <button class="btn btn-ghost" type="submit">
                    {lesson.is_published ? 'Unpublish' : 'Publish'}
                </button>
            </form>
        </div>
    </div>

    {#if form?.error}
        <div class="alert-error">{form.error}</div>
    {/if}
    {#if saveMsg}
        <div class="alert-success">{saveMsg}</div>
    {/if}

    <!-- Block tabs -->
    <div class="tabs">
        {#each TABS as tab}
            <button
                class="tab"
                class:active={activeTab === tab.type}
                onclick={() => activeTab = tab.type}
                type="button"
            >
                <span class="tab-icon"><tab.icon size={16} /></span>
                <span class="tab-label">{tab.label}</span>
            </button>
        {/each}
    </div>

    <!-- Shared save form — all blocks serialized as hidden inputs -->
    <form method="POST" action="?/save" use:enhance={({ formData }) => {
        saving = true;
        saveMsg = '';
        // Inject current block JSON before submit
        for (const t of ['listening', 'drilling', 'roleplay', 'reflection'] as const) {
            formData.set(`block_${t}`, blockJson(t));
        }
        return async ({ result }) => {
            saving = false;
            if (result.type === 'success') {
                saveMsg = '✓ Saved successfully';
                setTimeout(() => saveMsg = '', 3000);
            }
            await invalidateAll();
        };
    }}>
        <!-- Block editors -->
        <div class="block-panel" class:visible={activeTab === 'listening'}>
            <div class="block-header">
                <span class="block-icon"><Headphones size={22} /></span>
                <h2 class="block-title">Block 1 — Listening Practice</h2>
            </div>
            <p class="block-hint">Provide a transcript or key dialogue the user will listen to. Used for comprehension and shadowing.</p>

            <div class="field">
                <label class="field-label" for="listening-script">Audio Script / Dialogue</label>
                <textarea
                    id="listening-script"
                    class="field-textarea field-textarea-tall"
                    placeholder="e.g. Client: Hi! I'd like to order 500 units of product XY-102..."
                    value={getStr('listening', 'audio_script')}
                    oninput={(e) => setStr('listening', 'audio_script', (e.target as HTMLTextAreaElement).value)}
                ></textarea>
            </div>

            <div class="field">
                <label class="field-label" for="listening-questions">
                    Comprehension Questions
                    <span class="field-hint">One per line</span>
                </label>
                <textarea
                    id="listening-questions"
                    class="field-textarea"
                    placeholder="What did the client order?&#10;What was the main concern?"
                    value={arrToText('listening', 'comprehension_questions')}
                    oninput={(e) => setArr('listening', 'comprehension_questions', (e.target as HTMLTextAreaElement).value)}
                ></textarea>
            </div>

            <div class="field">
                <label class="field-label" for="listening-vocab">
                    Key Vocabulary
                    <span class="field-hint">One word or phrase per line</span>
                </label>
                <textarea
                    id="listening-vocab"
                    class="field-textarea field-textarea-sm"
                    placeholder="place an order&#10;bulk discount&#10;lead time"
                    value={arrToText('listening', 'key_vocabulary')}
                    oninput={(e) => setArr('listening', 'key_vocabulary', (e.target as HTMLTextAreaElement).value)}
                ></textarea>
            </div>
        </div>

        <div class="block-panel" class:visible={activeTab === 'drilling'}>
            <div class="block-header">
                <span class="block-icon"><RefreshCw size={22} /></span>
                <h2 class="block-title">Block 2 — Pattern Drilling</h2>
            </div>
            <p class="block-hint">Provide sentence patterns for the user to practise saying aloud. The app will prompt them to repeat each one.</p>

            <div class="field">
                <label class="field-label" for="drilling-instructions">Instructions / Context</label>
                <textarea
                    id="drilling-instructions"
                    class="field-textarea field-textarea-sm"
                    placeholder="e.g. Practice these polite phrases with your client..."
                    value={getStr('drilling', 'instructions')}
                    oninput={(e) => setStr('drilling', 'instructions', (e.target as HTMLTextAreaElement).value)}
                ></textarea>
            </div>

            <div class="field">
                <label class="field-label" for="drilling-patterns">
                    Sentence Patterns
                    <span class="field-hint">One pattern per line. Use [BLANK] for substitution slots.</span>
                </label>
                <textarea
                    id="drilling-patterns"
                    class="field-textarea field-textarea-tall"
                    placeholder="I'd like to place an order for [QUANTITY] units of [PRODUCT].&#10;Could you give me a discount if I order [QUANTITY]?&#10;When can I expect delivery?"
                    value={arrToText('drilling', 'patterns')}
                    oninput={(e) => setArr('drilling', 'patterns', (e.target as HTMLTextAreaElement).value)}
                ></textarea>
            </div>

            <div class="field">
                <label class="field-label" for="drilling-tips">
                    Pronunciation Tips
                    <span class="field-hint">One tip per line</span>
                </label>
                <textarea
                    id="drilling-tips"
                    class="field-textarea field-textarea-sm"
                    placeholder="Stress the verb: I'd LIKE to...&#10;Rise in pitch for questions"
                    value={arrToText('drilling', 'pronunciation_tips')}
                    oninput={(e) => setArr('drilling', 'pronunciation_tips', (e.target as HTMLTextAreaElement).value)}
                ></textarea>
            </div>
        </div>

        <div class="block-panel" class:visible={activeTab === 'roleplay'}>
            <div class="block-header">
                <span class="block-icon"><Bot size={22} /></span>
                <h2 class="block-title">Block 3 — AI Guided Simulation</h2>
            </div>
            <p class="block-hint">Configure the Groq AI roleplay. The system prompt shapes how the AI behaves as the client character.</p>

            <div class="field">
                <label class="field-label" for="roleplay-scenario">Scenario Description</label>
                <textarea
                    id="roleplay-scenario"
                    class="field-textarea field-textarea-sm"
                    placeholder="e.g. You are a VA handling an e-commerce client who wants to place a bulk order. Be professional and helpful."
                    value={getStr('roleplay', 'scenario')}
                    oninput={(e) => setStr('roleplay', 'scenario', (e.target as HTMLTextAreaElement).value)}
                ></textarea>
            </div>

            <div class="field">
                <label class="field-label" for="roleplay-persona">Client Persona</label>
                <input
                    id="roleplay-persona"
                    type="text"
                    class="field-input"
                    placeholder="e.g. Sarah, a busy US e-commerce store owner"
                    value={getStr('roleplay', 'client_persona')}
                    oninput={(e) => setStr('roleplay', 'client_persona', (e.target as HTMLInputElement).value)}
                />
            </div>

            <div class="field">
                <label class="field-label" for="roleplay-system">
                    System Prompt
                    <span class="field-hint">Sent to Groq as the system message. Role-play the client persona here.</span>
                </label>
                <textarea
                    id="roleplay-system"
                    class="field-textarea field-textarea-tall"
                    placeholder="You are Sarah, a US e-commerce store owner. You're looking to place a bulk order and want professional assistance. Ask about pricing, lead times, and minimum order quantities. Push for discounts. Be friendly but business-focused. Keep replies under 3 sentences."
                    value={getStr('roleplay', 'system_prompt')}
                    oninput={(e) => setStr('roleplay', 'system_prompt', (e.target as HTMLTextAreaElement).value)}
                ></textarea>
            </div>

            <div class="field">
                <label class="field-label" for="roleplay-opening">Opening Message</label>
                <input
                    id="roleplay-opening"
                    type="text"
                    class="field-input"
                    placeholder="e.g. Hi! I saw your store online and I'm interested in placing a large order."
                    value={getStr('roleplay', 'opening_message')}
                    oninput={(e) => setStr('roleplay', 'opening_message', (e.target as HTMLInputElement).value)}
                />
            </div>

            <div class="field">
                <label class="field-label" for="roleplay-goals">
                    Learning Goals
                    <span class="field-hint">One per line — shown to user before the simulation</span>
                </label>
                <textarea
                    id="roleplay-goals"
                    class="field-textarea field-textarea-sm"
                    placeholder="Use polite request phrases&#10;Confirm quantities clearly&#10;Handle client pushback calmly"
                    value={arrToText('roleplay', 'learning_goals')}
                    oninput={(e) => setArr('roleplay', 'learning_goals', (e.target as HTMLTextAreaElement).value)}
                ></textarea>
            </div>
        </div>

        <div class="block-panel" class:visible={activeTab === 'reflection'}>
            <div class="block-header">
                <span class="block-icon"><MessageCircle size={22} /></span>
                <h2 class="block-title">Block 4 — Emotional Reflection</h2>
            </div>
            <p class="block-hint">A journaling prompt for the user to reflect on how the session felt. Helps build speaking confidence over time.</p>

            <div class="field">
                <label class="field-label" for="reflection-prompt">Main Reflection Prompt</label>
                <textarea
                    id="reflection-prompt"
                    class="field-textarea"
                    placeholder="e.g. How did you feel communicating with the client today? What would you do differently?"
                    value={getStr('reflection', 'prompt')}
                    oninput={(e) => setStr('reflection', 'prompt', (e.target as HTMLTextAreaElement).value)}
                ></textarea>
            </div>

            <div class="field">
                <label class="field-label" for="reflection-followups">
                    Follow-up Prompts (optional)
                    <span class="field-hint">One per line — shown if user wants to explore more</span>
                </label>
                <textarea
                    id="reflection-followups"
                    class="field-textarea"
                    placeholder="What word or phrase felt most natural to say?&#10;Which moment made you feel confident?&#10;What will you practise tomorrow?"
                    value={arrToText('reflection', 'follow_up_prompts')}
                    oninput={(e) => setArr('reflection', 'follow_up_prompts', (e.target as HTMLTextAreaElement).value)}
                ></textarea>
            </div>

            <div class="field">
                <label class="field-label" for="reflection-affirmation">Closing Affirmation</label>
                <input
                    id="reflection-affirmation"
                    type="text"
                    class="field-input"
                    placeholder="e.g. Every conversation makes you stronger. Keep going!"
                    value={getStr('reflection', 'affirmation')}
                    oninput={(e) => setStr('reflection', 'affirmation', (e.target as HTMLInputElement).value)}
                />
            </div>
        </div>

        <!-- Sticky save bar -->
        <div class="save-bar">
            <span class="save-msg" class:visible={!!saveMsg}>{saveMsg}</span>
            <button type="submit" class="btn btn-primary" disabled={saving}>
                {#if saving}
                    Saving…
                {:else}
                    <Save size={14} /> Save All Blocks
                {/if}
            </button>
        </div>
    </form>
</div>
{/if}

<style>
    .page { max-width: 860px; }
    .not-found { padding: 60px; text-align: center; color: #94a3b8; }

    .page-header {
        display: flex; justify-content: space-between; align-items: flex-start;
        gap: 16px; margin-bottom: 24px;
    }
    .header-left { display: flex; flex-direction: column; gap: 4px; }
    .back-link { font-size: 0.8rem; color: #94a3b8; text-decoration: none; margin-bottom: 4px; display: inline-flex; align-items: center; gap: 4px; }
    .back-link:hover { color: #64748b; }
    .page-title { font-size: 1.4rem; font-weight: 700; color: #1e293b; margin: 0; }
    .page-meta { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: #94a3b8; flex-wrap: wrap; margin-top: 4px; }
    .sep { color: #e8ecf1; }
    .niche-badge { background: #eff6ff; color: #3b82f6; padding: 1px 7px; border-radius: 999px; font-size: 0.72rem; font-weight: 600; }
    .status-badge { font-size: 0.72rem; font-weight: 600; color: #94a3b8; }
    .status-badge.published { color: #16a34a; }
    .header-actions { display: flex; gap: 8px; flex-shrink: 0; }

    .alert-error { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; font-size: 0.875rem; }
    .alert-success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #16a34a; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; font-size: 0.875rem; }

    .tabs {
        display: flex; gap: 0; margin-bottom: 0;
        border-bottom: 1px solid #e8ecf1;
        overflow-x: auto;
    }
    .tab {
        display: flex; align-items: center; gap: 8px;
        padding: 10px 18px; border: none; background: transparent;
        color: #94a3b8; font-size: 0.83rem; font-weight: 600;
        cursor: pointer; border-bottom: 2px solid transparent;
        margin-bottom: -1px; white-space: nowrap; transition: all 0.15s;
    }
    .tab:hover { color: #64748b; }
    .tab.active { color: #b07d04; border-bottom-color: #f2a906; }
    .tab-icon { display: flex; align-items: center; }

    .block-panel { display: none; padding-top: 24px; }
    .block-panel.visible { display: block; }

    .block-header { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
    .block-icon { color: #b07d04; display: flex; align-items: center; }
    .block-title { font-size: 1.1rem; font-weight: 700; color: #1e293b; margin: 0; }
    .block-hint { font-size: 0.82rem; color: #94a3b8; margin: 0 0 20px; line-height: 1.5; }

    .field { margin-bottom: 20px; }
    .field-label {
        display: flex; align-items: center; gap: 8px;
        font-size: 0.78rem; font-weight: 600; text-transform: uppercase;
        letter-spacing: 0.05em; color: #64748b; margin-bottom: 6px;
    }
    .field-hint { font-size: 0.72rem; color: #cbd5e1; text-transform: none; letter-spacing: 0; font-weight: 400; }
    .field-input, .field-textarea {
        width: 100%; box-sizing: border-box;
        background: #ffffff; border: 1px solid #e8ecf1;
        color: #1e293b; border-radius: 8px;
        font-size: 0.875rem; font-family: inherit;
        padding: 10px 14px; outline: none;
        transition: border-color 0.15s;
        resize: vertical;
    }
    .field-input:focus, .field-textarea:focus { border-color: #f2a906; }
    .field-textarea { min-height: 120px; }
    .field-textarea-sm { min-height: 80px; }
    .field-textarea-tall { min-height: 200px; font-family: 'JetBrains Mono', monospace; font-size: 0.83rem; line-height: 1.6; }

    .save-bar {
        position: sticky; bottom: 0;
        display: flex; justify-content: flex-end; align-items: center; gap: 16px;
        padding: 14px 0; margin-top: 24px;
        border-top: 1px solid #e8ecf1;
        background: #f8f9fb;
    }
    .save-msg { font-size: 0.82rem; color: #16a34a; opacity: 0; transition: opacity 0.3s; }
    .save-msg.visible { opacity: 1; }

    .btn {
        display: inline-flex; align-items: center; gap: 6px;
        padding: 8px 14px; border-radius: 8px; font-size: 0.875rem; font-weight: 600;
        cursor: pointer; border: none; transition: all 0.15s; text-decoration: none;
    }
    .btn-primary { background: #f2a906; color: #1B365D; }
    .btn-primary:hover:not(:disabled) { opacity: 0.88; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-ghost { background: transparent; border: 1px solid #e8ecf1; color: #64748b; }
    .btn-ghost:hover { border-color: #cbd5e1; color: #1e293b; }

    @media (max-width: 600px) {
        .page-header { flex-direction: column; }
        .tab-label { display: none; }
        .tab { padding: 10px 14px; }
    }
</style>
