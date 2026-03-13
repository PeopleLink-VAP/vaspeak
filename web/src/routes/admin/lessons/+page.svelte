<script lang="ts">
    import { enhance } from '$app/forms';
    import { invalidateAll } from '$app/navigation';
    let { data, form } = $props();

    let showCreate = $state(false);
    let confirmDelete = $state<string | null>(null);
    let editLesson = $state<string | null>(null);
    let editTitle = $state('');
    let editTheme = $state('');

    const NICHE_LABELS: Record<string, string> = {
        general: 'General',
        ecommerce: 'E-Commerce',
        video_editor: 'Video Editor',
        operations: 'Operations',
        social_media: 'Social Media',
        customer_service: 'Customer Service',
        data_entry: 'Data Entry',
        real_estate: 'Real Estate'
    };

    function startEdit(lesson: any) {
        editLesson = String(lesson.id);
        editTitle = String(lesson.title);
        editTheme = String(lesson.week_theme ?? '');
    }
</script>

<svelte:head><title>Lessons — VASpeak Admin</title></svelte:head>

<div class="page">
    <div class="page-header">
        <div>
            <h1 class="page-title">Lessons</h1>
            <p class="page-sub">{data.total} total lessons</p>
        </div>
        <button class="btn btn-primary" onclick={() => showCreate = !showCreate}>
            {showCreate ? '✕ Cancel' : '＋ New Lesson'}
        </button>
    </div>

    {#if form?.error}
        <div class="alert-error">{form.error}</div>
    {/if}

    <!-- Create form -->
    {#if showCreate}
        <form method="POST" action="?/create" use:enhance={() => () => { showCreate = false; invalidateAll(); }} class="create-panel">
            <h3 class="panel-title">New Lesson</h3>
            <div class="form-grid">
                <div class="form-row">
                    <label class="form-label" for="new-title">Title *</label>
                    <input id="new-title" type="text" name="title" required placeholder="e.g. Greeting Clients Professionally" class="form-input" />
                </div>
                <div class="form-row">
                    <label class="form-label" for="new-theme">Week Theme</label>
                    <input id="new-theme" type="text" name="week_theme" placeholder="e.g. Building First Impressions" class="form-input" />
                </div>
                <div class="form-row">
                    <label class="form-label" for="new-day">Day Number *</label>
                    <input id="new-day" type="number" name="day_number" required min="1" value="1" class="form-input form-input-sm" />
                </div>
                <div class="form-row">
                    <label class="form-label" for="new-niche">Niche</label>
                    <select id="new-niche" name="niche" class="form-input">
                        {#each data.niches as n}
                            <option value={n}>{NICHE_LABELS[n] ?? n}</option>
                        {/each}
                    </select>
                </div>
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">Create Lesson</button>
                <button type="button" class="btn btn-ghost" onclick={() => showCreate = false}>Cancel</button>
            </div>
        </form>
    {/if}

    <!-- Niche filter tabs -->
    <div class="tabs">
        <a href="?niche=all" class="tab" class:active={data.currentNiche === 'all'}>All</a>
        {#each data.niches as n}
            <a href="?niche={n}" class="tab" class:active={data.currentNiche === n}>
                {NICHE_LABELS[n] ?? n}
            </a>
        {/each}
    </div>

    <!-- Lessons table -->
    <div class="table-wrap">
        <table class="table">
            <thead>
                <tr>
                    <th>Day</th>
                    <th>Week</th>
                    <th>Title</th>
                    <th>Niche</th>
                    <th>Status</th>
                    <th>Updated</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {#each data.lessons as lesson}
                    <tr>
                        <td class="mono">{lesson.day_number}</td>
                        <td class="mono muted">W{lesson.week_number}</td>
                        <td>
                            {#if editLesson === String(lesson.id)}
                                <form method="POST" action="?/update" use:enhance={() => () => { editLesson = null; invalidateAll(); }}>
                                    <input type="hidden" name="lessonId" value={lesson.id} />
                                    <input type="text" name="title" bind:value={editTitle} class="inline-input" required />
                                    <input type="text" name="week_theme" bind:value={editTheme} placeholder="Week theme" class="inline-input" />
                                    <button type="submit" class="btn-inline btn-save">Save</button>
                                    <button type="button" class="btn-inline btn-cancel" onclick={() => editLesson = null}>✕</button>
                                </form>
                            {:else}
                                <div class="lesson-title">{lesson.title}</div>
                                {#if lesson.week_theme}
                                    <div class="lesson-theme">{lesson.week_theme}</div>
                                {/if}
                            {/if}
                        </td>
                        <td>
                            <span class="badge badge-niche">{NICHE_LABELS[String(lesson.niche)] ?? lesson.niche}</span>
                        </td>
                        <td>
                            <form method="POST" action="?/togglePublish" use:enhance={() => () => invalidateAll()}>
                                <input type="hidden" name="lessonId" value={lesson.id} />
                                <input type="hidden" name="current" value={lesson.is_published ? '1' : '0'} />
                                <button type="submit" class="badge badge-clickable"
                                    class:badge-published={lesson.is_published}
                                    class:badge-draft={!lesson.is_published}>
                                    {lesson.is_published ? '● Published' : '○ Draft'}
                                </button>
                            </form>
                        </td>
                        <td class="muted">{String(lesson.updated_at ?? '').slice(0, 10)}</td>
                        <td>
                            <div class="action-row">
                                <button class="btn-icon" title="Edit" onclick={() => startEdit(lesson)}>✏</button>
                                <a href="/lesson/{lesson.day_number}" target="_blank" class="btn-icon" title="Preview">↗</a>
                                {#if confirmDelete === String(lesson.id)}
                                    <form method="POST" action="?/delete" use:enhance={() => () => { confirmDelete = null; invalidateAll(); }}>
                                        <input type="hidden" name="lessonId" value={lesson.id} />
                                        <button type="submit" class="btn-icon btn-icon-danger" title="Confirm delete">✓</button>
                                    </form>
                                    <button class="btn-icon" onclick={() => confirmDelete = null} title="Cancel">✕</button>
                                {:else}
                                    <button class="btn-icon btn-icon-danger" title="Delete" onclick={() => confirmDelete = String(lesson.id)}>🗑</button>
                                {/if}
                            </div>
                        </td>
                    </tr>
                {:else}
                    <tr><td colspan="7" class="empty">No lessons found.</td></tr>
                {/each}
            </tbody>
        </table>
    </div>

    {#if data.pages > 1}
        <div class="pagination">
            {#each Array.from({length: data.pages}, (_, i) => i + 1) as p}
                <a href="?page={p}&niche={data.currentNiche}" class="page-btn" class:active={p === data.page}>{p}</a>
            {/each}
        </div>
    {/if}
</div>

<style>
    .page { max-width: 1100px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .page-title { font-size: 1.6rem; font-weight: 700; color: #f1f5f9; margin: 0 0 4px; }
    .page-sub { color: #64748b; font-size: 0.875rem; margin: 0; }

    .alert-error { background: #ef44441a; border: 1px solid #ef4444; color: #fca5a5; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; font-size: 0.875rem; }

    .create-panel { background: #1a2332; border: 1px solid #2d3a4d; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
    .panel-title { color: #f1f5f9; font-size: 0.95rem; font-weight: 700; margin: 0 0 16px; }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; }
    .form-row { display: flex; flex-direction: column; gap: 5px; }
    .form-label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 600; }
    .form-input { background: #0f1729; border: 1px solid #2d3a4d; color: #e2e8f0; padding: 8px 12px; border-radius: 8px; font-size: 0.875rem; outline: none; }
    .form-input:focus { border-color: #f2a906; }
    .form-input-sm { max-width: 120px; }
    .form-actions { display: flex; gap: 8px; margin-top: 16px; }

    .tabs { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 16px; }
    .tab { padding: 5px 12px; border-radius: 999px; font-size: 0.78rem; font-weight: 600; text-decoration: none; color: #64748b; background: #1a2332; border: 1px solid #2d3a4d; transition: all 0.15s; }
    .tab.active { border-color: #f2a906; color: #f2a906; background: #f2a90610; }
    .tab:hover:not(.active) { color: #94a3b8; }

    .table-wrap { overflow-x: auto; border: 1px solid #2d3a4d; border-radius: 12px; }
    .table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    .table th { background: #1a2332; color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.06em; padding: 10px 14px; text-align: left; border-bottom: 1px solid #2d3a4d; }
    .table td { padding: 12px 14px; border-bottom: 1px solid #2d3a4d20; vertical-align: middle; color: #cbd5e1; }
    .table tbody tr:last-child td { border-bottom: none; }
    .table tbody tr:hover td { background: #1a233210; }

    .lesson-title { font-weight: 600; color: #e2e8f0; }
    .lesson-theme { font-size: 0.75rem; color: #64748b; margin-top: 2px; }

    .inline-input { background: #0f1729; border: 1px solid #2d3a4d; color: #e2e8f0; padding: 4px 8px; border-radius: 6px; font-size: 0.8rem; margin-bottom: 4px; width: 100%; box-sizing: border-box; }
    .inline-input:focus { outline: none; border-color: #f2a906; }
    .btn-inline { border: none; cursor: pointer; border-radius: 4px; padding: 3px 8px; font-size: 0.75rem; font-weight: 600; }
    .btn-save { background: #f2a906; color: #1B365D; }
    .btn-cancel { background: #2d3a4d; color: #94a3b8; margin-left: 4px; }

    .badge { display: inline-block; padding: 3px 8px; border-radius: 999px; font-size: 0.72rem; font-weight: 600; background: #2d3a4d; color: #94a3b8; }
    .badge-niche { background: #1B365D30; color: #60a5fa; }
    .badge-published { background: #22c55e20; color: #4ade80; }
    .badge-draft { background: #64748b20; color: #64748b; }
    .badge-clickable { cursor: pointer; border: none; transition: opacity 0.15s; }
    .badge-clickable:hover { opacity: 0.7; }

    .mono { font-family: monospace; font-size: 0.82rem; }
    .muted { color: #64748b; font-size: 0.8rem; }
    .empty { text-align: center; color: #64748b; padding: 40px; }

    .action-row { display: flex; gap: 4px; }
    .btn-icon { background: transparent; border: 1px solid #2d3a4d; color: #64748b; border-radius: 6px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.8rem; transition: all 0.15s; text-decoration: none; }
    .btn-icon:hover { border-color: #f2a906; color: #f2a906; }
    .btn-icon-danger:hover { border-color: #ef4444 !important; color: #f87171 !important; }

    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 8px; font-size: 0.875rem; font-weight: 600; cursor: pointer; border: none; transition: all 0.15s; text-decoration: none; }
    .btn-primary { background: #f2a906; color: #1B365D; }
    .btn-primary:hover { opacity: 0.88; }
    .btn-ghost { background: transparent; border: 1px solid #2d3a4d; color: #94a3b8; }
    .btn-ghost:hover { border-color: #94a3b8; }

    .pagination { display: flex; gap: 4px; margin-top: 16px; }
    .page-btn { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 6px; background: #1a2332; border: 1px solid #2d3a4d; color: #94a3b8; font-size: 0.8rem; text-decoration: none; transition: all 0.15s; }
    .page-btn.active { background: #f2a90620; border-color: #f2a906; color: #f2a906; }
</style>
