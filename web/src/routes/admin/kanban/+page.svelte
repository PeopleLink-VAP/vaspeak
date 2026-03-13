<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { isAgent, formatElapsed, getInitials, parseJsonArray } from '$lib/utils';


    let { data } = $props();

    // ─── State ────────────────────────────────────────────────────────────────


    const columnLabels: Record<string, string> = {
        backlog: 'Backlog',
        todo: 'To Do',
        in_progress: 'In Progress',
        review_blocked: 'Blocked',
        done: 'Done'
    };

    const columnColors: Record<string, string> = {
        backlog: '#64748b',
        todo: '#3b82f6',
        in_progress: '#f2a906',
        review_blocked: '#ef4444',
        done: '#22c55e'
    };

    type Task = {
        id: string;
        title: string;
        description: string;
        expected_outcome: string;
        status: string;
        assignee: string;
        workstream: string;
        priority: string;
        commit_url: string;
        commit_message: string;
        work_summary: string;
        follow_up_steps: string;
        files_changed: string;
        lessons_learnt: string;
        created_at: string;
        updated_at: string;
    };

    type Comment = {
        id: string;
        task_id: string;
        author: string;
        body: string;
        created_at: string;
    };

    // svelte-ignore state_referenced_locally -- intentional seed; board refreshes via polling
    let allTasks = $state<Task[]>(data.allTasks as Task[]);
    // svelte-ignore state_referenced_locally -- static initial value; columns never change
    const columns = data.columns as string[];
    let grouped = $derived((() => {
        const g: Record<string, Task[]> = {};
        for (const col of columns) {
            g[col] = allTasks.filter((t) => t.status === col);
        }
        return g;
    })());

    // Focus
    let weeklyFocus = $state('');
    let editingFocus = $state(false);
    let focusDraft = $state('');
    let savingFocus = $state(false);

    // New task form
    let showNewTaskForm = $state(false);
    let newTitle = $state('');
    let newDescription = $state('');
    let newExpectedOutcome = $state('');
    let newStatus = $state('todo');
    let newAssignee = $state('');
    let newWorkstream = $state('');
    let isCreating = $state(false);

    // Task detail panel
    let selectedTask = $state<Task | null>(null);
    let taskComments = $state<Comment[]>([]);
    let loadingComments = $state(false);
    let newComment = $state('');
    let commentAuthor = $state('human');
    let addingComment = $state(false);

    // Upload
    let uploadFile = $state<File | null>(null);
    let uploading = $state(false);

    // Ticks for elapsed time
    let now = $state(Date.now());
    let refreshInterval: ReturnType<typeof setInterval>;
    let tickInterval: ReturnType<typeof setInterval>;



    // ─── Helpers ──────────────────────────────────────────────────────────────

    // formatElapsed wraps util fn, passing reactive `now` as clock source
    function elapsed(updatedAt: string): string {
        return formatElapsed(updatedAt, now);
    }


    function formatDateTime(iso: string): string {
        return new Date(iso).toLocaleTimeString('en-US', {
            month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }

    // ─── Auto-refresh polling ─────────────────────────────────────────────────

    async function refreshBoard() {
        try {
            const res = await fetch('/admin/api/kanban/tasks');
            if (!res.ok) return;
            const rows = await res.json();
            allTasks = rows.map((r: Record<string, unknown>) => ({
                id: r.id as string,
                title: r.title as string,
                description: (r.description ?? '') as string,
                expected_outcome: (r.expected_outcome ?? '') as string,
                status: r.status as string,
                assignee: (r.assignee ?? '') as string,
                workstream: (r.workstream ?? '') as string,
                priority: (r.priority ?? 'medium') as string,
                commit_url: (r.commit_url ?? '') as string,
                commit_message: (r.commit_message ?? '') as string,
                work_summary: (r.work_summary ?? '') as string,
                follow_up_steps: (r.follow_up_steps ?? '') as string,
                files_changed: (r.files_changed ?? '') as string,
                lessons_learnt: (r.lessons_learnt ?? '') as string,
                created_at: r.created_at as string,
                updated_at: r.updated_at as string
            }));
            // Refresh selected task data too
            if (selectedTask) {
                const updated = allTasks.find((t) => t.id === selectedTask!.id);
                if (updated) selectedTask = updated;
            }
        } catch { /* silent */ }
    }

    onMount(async () => {
        // Load focus from API (not in server load yet)
        try {
            const r = await fetch('/admin/api/kanban/focus');
            if (r.ok) { const j = await r.json(); weeklyFocus = j.focus ?? ''; }
        } catch { /* silent */ }
        refreshInterval = setInterval(refreshBoard, 15000);
        tickInterval = setInterval(() => { now = Date.now(); }, 1000);
    });

    onDestroy(() => {
        clearInterval(refreshInterval);
        clearInterval(tickInterval);
    });

    // ─── Weekly Focus ─────────────────────────────────────────────────────────

    async function saveFocus() {
        savingFocus = true;
        try {
            await fetch('/admin/api/kanban/focus', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ focus: focusDraft })
            });
            weeklyFocus = focusDraft;
            editingFocus = false;
        } finally {
            savingFocus = false;
        }
    }

    function startEditFocus() {
        focusDraft = weeklyFocus;
        editingFocus = true;
    }

    // ─── Task CRUD ────────────────────────────────────────────────────────────

    async function createTask() {
        if (!newTitle.trim()) return;
        isCreating = true;
        try {
            const res = await fetch('/admin/api/kanban/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newTitle.trim(),
                    description: newDescription.trim(),
                    expected_outcome: newExpectedOutcome.trim(),
                    status: newStatus,
                    assignee: newAssignee.trim(),
                    workstream: newWorkstream.trim()
                })
            });
            if (res.ok) {
                newTitle = '';
                newDescription = '';
                newExpectedOutcome = '';
                newAssignee = '';
                newWorkstream = '';
                showNewTaskForm = false;
                await refreshBoard();
            }
        } finally {
            isCreating = false;
        }
    }

    async function updateStatus(taskId: string, status: string) {
        await fetch(`/admin/api/kanban/tasks/${taskId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        await refreshBoard();
    }

    async function deleteTask(taskId: string) {
        if (!confirm('Delete this task?')) return;
        await fetch(`/admin/api/kanban/tasks/${taskId}`, { method: 'DELETE' });
        if (selectedTask?.id === taskId) selectedTask = null;
        await refreshBoard();
    }

    // ─── Task Detail Panel ────────────────────────────────────────────────────

    async function openTask(task: Task) {
        selectedTask = task;
        await loadComments(task.id);
    }

    function closePanel() {
        selectedTask = null;
        taskComments = [];
    }

    async function loadComments(taskId: string) {
        loadingComments = true;
        try {
            const res = await fetch(`/admin/api/kanban/tasks/${taskId}/comments`);
            if (res.ok) taskComments = await res.json();
        } finally {
            loadingComments = false;
        }
    }

    async function addComment() {
        if (!newComment.trim() || !selectedTask) return;
        addingComment = true;
        try {
            const res = await fetch(`/admin/api/kanban/tasks/${selectedTask.id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ author: commentAuthor.trim() || 'human', body: newComment.trim() })
            });
            if (res.ok) {
                newComment = '';
                await loadComments(selectedTask.id);
            }
        } finally {
            addingComment = false;
        }
    }

    async function uploadAttachment() {
        if (!uploadFile || !selectedTask) return;
        uploading = true;
        try {
            const fd = new FormData();
            fd.append('file', uploadFile);
            await fetch(`/admin/api/kanban/tasks/${selectedTask.id}/attachments`, {
                method: 'POST',
                body: fd
            });
            uploadFile = null;
            const inp = document.getElementById('attach-input') as HTMLInputElement;
            if (inp) inp.value = '';
            await loadComments(selectedTask.id);
        } finally {
            uploading = false;
        }
    }
</script>

<svelte:head>
    <title>Kanban Board — VASpeak Admin</title>
</svelte:head>

<div class="kanban-page">
    <!-- ── Header ──────────────────────────────────────────────────────── -->
    <div class="kanban-header">
        <div>
            <h1 class="page-title">Kanban Board</h1>
            <p class="page-subtitle">Live · auto-refreshes every 15 s · backed by Turso</p>
        </div>
        <button class="btn-new" onclick={() => (showNewTaskForm = !showNewTaskForm)}>
            {showNewTaskForm ? '✕ Cancel' : '+ New Task'}
        </button>
    </div>

    <!-- ── Weekly Focus Banner ────────────────────────────────────────── -->
    <div class="focus-banner">
        <span class="focus-icon">🎯</span>
        {#if editingFocus}
            <input
                class="focus-input"
                bind:value={focusDraft}
                placeholder="Set this week's focus..."
                onkeydown={(e) => e.key === 'Enter' && saveFocus()}
            />
            <button class="focus-save" onclick={saveFocus} disabled={savingFocus}>
                {savingFocus ? 'Saving…' : 'Save'}
            </button>
            <button class="focus-cancel" onclick={() => (editingFocus = false)}>Cancel</button>
        {:else}
            <span class="focus-text">{weeklyFocus || 'No weekly focus set'}</span>
            <button class="focus-edit" onclick={startEditFocus}>Edit</button>
        {/if}
    </div>

    <!-- ── New Task Form ──────────────────────────────────────────────── -->
    {#if showNewTaskForm}
        <div class="new-task-form">
            <div class="form-row">
                <input type="text" placeholder="Task title *" bind:value={newTitle} class="input" />
                <select bind:value={newStatus} class="input select">
                    <option value="backlog">Backlog</option>
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                </select>
            </div>
            <div class="form-row">
                <input type="text" placeholder="Assignee (e.g. gemini, human)" bind:value={newAssignee} class="input" />
                <input type="text" placeholder="Workstream" bind:value={newWorkstream} class="input" />
            </div>
            <textarea placeholder="Description…" bind:value={newDescription} class="input textarea" rows="2"></textarea>
            <input type="text" placeholder="🎯 Expected outcome (what success looks like)" bind:value={newExpectedOutcome} class="input" />
            <button class="btn-create" onclick={createTask} disabled={isCreating || !newTitle.trim()}>
                {isCreating ? 'Creating…' : 'Create Task'}
            </button>
        </div>
    {/if}

    <!-- ── Board ──────────────────────────────────────────────────────── -->
    <div class="board">
        {#each columns as col}
            {@const tasks = grouped[col] ?? []}
            <div class="column">
                <div class="column-header">
                    <span class="column-dot" style="background: {columnColors[col]}"></span>
                    <span class="column-title">{columnLabels[col]}</span>
                    <span class="column-count">{tasks.length}</span>
                </div>
                <div class="column-body">
                    {#each tasks as task (task.id)}
                        {@const agentTask = isAgent(task.assignee)}
                        <div
                            class="task-card"
                            class:agent-card={agentTask}
                            class:in-progress-card={task.status === 'in_progress'}
                            onclick={() => openTask(task)}
                            role="button"
                            tabindex="0"
                            onkeydown={(e) => e.key === 'Enter' && openTask(task)}
                        >
                            <div class="task-top">
                                <span class="task-title">{task.title}</span>
                                <button class="task-delete" onclick={(e) => { e.stopPropagation(); deleteTask(task.id); }} title="Delete">×</button>
                            </div>

                            {#if task.description}
                                <p class="task-desc">{task.description}</p>
                            {/if}

                            {#if task.expected_outcome}
                                <p class="task-outcome">🎯 {task.expected_outcome}</p>
                            {/if}

                            <div class="task-footer">
                                {#if task.assignee}
                                    <span class="task-assignee" class:agent-badge={agentTask} title={task.assignee}>
                                        {#if agentTask}
                                            <span class="agent-dot"></span>
                                        {/if}
                                        {getInitials(task.assignee)}
                                    </span>
                                {/if}
                                {#if task.workstream}
                                    <span class="task-tag">{task.workstream}</span>
                                {/if}
                                {#if task.status === 'in_progress'}
                                    <span class="elapsed">{elapsed(task.updated_at)}</span>
                                {/if}
                                <select
                                    class="status-select"
                                    value={task.status}
                                    onclick={(e) => e.stopPropagation()}
                                    onchange={(e) => updateStatus(task.id, (e.target as HTMLSelectElement).value)}
                                >
                                    <option value="backlog">Backlog</option>
                                    <option value="todo">To Do</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="review_blocked">Blocked</option>
                                    <option value="done">Done</option>
                                </select>
                            </div>
                        </div>
                    {:else}
                        <div class="empty-col">No tasks</div>
                    {/each}
                </div>
            </div>
        {/each}
    </div>
</div>

<!-- ── Task Detail Panel ───────────────────────────────────────────────── -->
{#if selectedTask}
    <div class="panel-backdrop" role="presentation" onclick={closePanel} onkeydown={(e) => e.key === 'Escape' && closePanel()}></div>
    <div class="detail-panel">
        <div class="panel-header">
            <div class="panel-title-row">
                <h2 class="panel-title">{selectedTask.title}</h2>
                <button class="panel-close" onclick={closePanel}>✕</button>
            </div>
            <div class="panel-meta">
                {#if selectedTask.assignee}
                    <span class="meta-chip" class:meta-agent={isAgent(selectedTask.assignee)}>
                        {#if isAgent(selectedTask.assignee)}🤖{:else}👤{/if}
                        {selectedTask.assignee}
                    </span>
                {/if}
                {#if selectedTask.workstream}
                    <span class="meta-chip">{selectedTask.workstream}</span>
                {/if}
                <span class="meta-chip status-chip" style="background: {columnColors[selectedTask.status]}22; color: {columnColors[selectedTask.status]}">
                    {columnLabels[selectedTask.status]}
                </span>
                {#if selectedTask.status === 'in_progress'}
                    <span class="meta-chip elapsed-chip">⏱ {elapsed(selectedTask.updated_at)}</span>
                {/if}
            </div>
        </div>

        <div class="panel-body">
            {#if selectedTask.description}
                <div class="panel-section">
                    <p class="section-label">Description</p>
                    <p class="section-text">{selectedTask.description}</p>
                </div>
            {/if}

            {#if selectedTask.expected_outcome}
                <div class="panel-section outcome-section">
                    <p class="section-label">🎯 Expected Outcome</p>
                    <p class="section-text">{selectedTask.expected_outcome}</p>
                </div>
            {/if}

            {#if selectedTask.work_summary}
                <div class="panel-section">
                    <p class="section-label">📋 Work Summary</p>
                    <p class="section-text">{selectedTask.work_summary}</p>
                </div>
            {/if}

            {#if selectedTask.commit_url}
                <div class="panel-section">
                    <p class="section-label">🔗 Commit</p>
                    <a href={selectedTask.commit_url} target="_blank" class="commit-link">
                        {selectedTask.commit_message || selectedTask.commit_url}
                    </a>
                </div>
            {/if}

            {#if selectedTask.lessons_learnt}
                <div class="panel-section">
                    <p class="section-label">💡 Lessons Learnt</p>
                    <p class="section-text">{selectedTask.lessons_learnt}</p>
                </div>
            {/if}

            {#if parseJsonArray(selectedTask.files_changed).length > 0}
                <div class="panel-section">
                    <p class="section-label">📁 Files Changed</p>
                    <ul class="files-list">
                        {#each parseJsonArray(selectedTask.files_changed) as f}
                            <li><code>{f}</code></li>
                        {/each}
                    </ul>
                </div>
            {/if}

            {#if parseJsonArray(selectedTask.follow_up_steps).length > 0}
                <div class="panel-section">
                    <p class="section-label">➡️ Follow-up Steps</p>
                    <ul class="files-list">
                        {#each parseJsonArray(selectedTask.follow_up_steps) as step}
                            <li>{step}</li>
                        {/each}
                    </ul>
                </div>
            {/if}

            <!-- Status quick-change -->
            <div class="panel-section">
                <p class="section-label">Status</p>
                <select
                    class="input select full-select"
                    value={selectedTask.status}
                    onchange={async (e) => {
                        await updateStatus(selectedTask!.id, (e.target as HTMLSelectElement).value);
                    }}
                >
                    <option value="backlog">Backlog</option>
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review_blocked">Blocked</option>
                    <option value="done">Done</option>
                </select>
            </div>

            <!-- Comments -->
            <div class="panel-section">
                <p class="section-label">💬 Comments</p>
                {#if loadingComments}
                    <p class="loading-text">Loading…</p>
                {:else if taskComments.length === 0}
                    <p class="no-comments">No comments yet.</p>
                {:else}
                    <div class="comments-list">
                        {#each taskComments as c (c.id)}
                            <div class="comment" class:agent-comment={isAgent(c.author)} class:attachment-comment={c.author === 'attachment'}>
                                <span class="comment-author">{c.author}</span>
                                <span class="comment-time">{formatDateTime(c.created_at)}</span>
                                <p class="comment-body">{@html c.body.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')}</p>
                            </div>
                        {/each}
                    </div>
                {/if}

                <div class="add-comment">
                    <div class="comment-row">
                        <input
                            type="text"
                            placeholder="Author"
                            bind:value={commentAuthor}
                            class="input author-input"
                        />
                        <textarea
                            placeholder="Add a comment…"
                            bind:value={newComment}
                            class="input comment-textarea"
                            rows="2"
                            onkeydown={(e) => { if (e.key === 'Enter' && e.ctrlKey) addComment(); }}
                        ></textarea>
                    </div>
                    <button class="btn-comment" onclick={addComment} disabled={addingComment || !newComment.trim()}>
                        {addingComment ? 'Posting…' : 'Add Comment'}
                    </button>
                </div>
            </div>

            <!-- Attachment upload -->
            <div class="panel-section">
                <p class="section-label">📎 Attach Screenshot / File</p>
                <div class="attach-row">
                    <input
                        id="attach-input"
                        type="file"
                        accept="image/*,.png,.jpg,.gif,.webp,.pdf"
                        class="file-input"
                        onchange={(e) => { uploadFile = (e.target as HTMLInputElement).files?.[0] ?? null; }}
                    />
                    <button class="btn-upload" onclick={uploadAttachment} disabled={uploading || !uploadFile}>
                        {uploading ? 'Uploading…' : 'Upload'}
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    /* ── Layout ──────────────────────────────────────────────────────── */
    .kanban-page {
        max-width: 100%;
        overflow-x: auto;
    }

    .kanban-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 16px;
        gap: 16px;
        flex-wrap: wrap;
    }

    .page-title {
        font-size: 1.6rem;
        font-weight: 700;
        color: #f1f5f9;
        margin: 0 0 4px;
    }

    .page-subtitle {
        color: #64748b;
        font-size: 0.82rem;
        margin: 0;
    }

    /* ── Weekly Focus Banner ─────────────────────────────────────────── */
    .focus-banner {
        display: flex;
        align-items: center;
        gap: 10px;
        background: #0f1729;
        border: 1px solid #2d3a4d;
        border-left: 3px solid #f2a906;
        border-radius: 8px;
        padding: 10px 16px;
        margin-bottom: 18px;
        flex-wrap: wrap;
    }

    .focus-icon {
        font-size: 1rem;
        flex-shrink: 0;
    }

    .focus-text {
        flex: 1;
        font-size: 0.85rem;
        color: #cbd5e1;
        font-style: italic;
    }

    .focus-input {
        flex: 1;
        background: #1a2332;
        border: 1px solid #f2a906;
        color: #f1f5f9;
        padding: 6px 10px;
        border-radius: 6px;
        font-size: 0.85rem;
        outline: none;
        min-width: 200px;
    }

    .focus-edit, .focus-save, .focus-cancel {
        background: none;
        border: 1px solid #2d3a4d;
        color: #94a3b8;
        padding: 4px 10px;
        border-radius: 5px;
        font-size: 0.78rem;
        cursor: pointer;
        transition: all 0.15s;
    }

    .focus-save {
        border-color: #f2a906;
        color: #f2a906;
    }

    .focus-save:hover { background: #f2a90620; }
    .focus-edit:hover, .focus-cancel:hover { border-color: #475569; color: #cbd5e1; }

    /* ── Buttons ─────────────────────────────────────────────────────── */
    .btn-new {
        background: #f2a906;
        color: #1b365d;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        font-weight: 600;
        font-size: 0.85rem;
        cursor: pointer;
        transition: opacity 0.15s;
    }
    .btn-new:hover { opacity: 0.9; }

    /* ── New task form ────────────────────────────────────────────────── */
    .new-task-form {
        background: #1a2332;
        border: 1px solid #2d3a4d;
        border-radius: 12px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-bottom: 20px;
    }

    .form-row {
        display: flex;
        gap: 10px;
    }

    .input {
        flex: 1;
        background: #0f1729;
        border: 1px solid #2d3a4d;
        color: #e2e8f0;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 0.85rem;
        outline: none;
        font-family: inherit;
    }
    .input:focus { border-color: #f2a906; }

    .select { max-width: 160px; }
    .textarea { resize: vertical; }

    .btn-create {
        background: #22c55e;
        color: #fff;
        border: none;
        padding: 8px 20px;
        border-radius: 6px;
        font-weight: 600;
        font-size: 0.85rem;
        cursor: pointer;
        align-self: flex-end;
        transition: opacity 0.15s;
    }
    .btn-create:hover { opacity: 0.9; }
    .btn-create:disabled { opacity: 0.5; cursor: not-allowed; }

    /* ── Board ────────────────────────────────────────────────────────── */
    .board {
        display: flex;
        gap: 14px;
        overflow-x: auto;
        padding-bottom: 16px;
    }

    .column {
        min-width: 250px;
        flex: 1;
        background: #1a2332;
        border: 1px solid #2d3a4d;
        border-radius: 12px;
        display: flex;
        flex-direction: column;
    }

    .column-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 14px 14px 10px;
        border-bottom: 1px solid #2d3a4d;
    }

    .column-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        flex-shrink: 0;
    }

    .column-title {
        font-size: 0.8rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #94a3b8;
    }

    .column-count {
        margin-left: auto;
        font-size: 0.72rem;
        background: #0f1729;
        padding: 2px 8px;
        border-radius: 10px;
        color: #64748b;
        font-weight: 600;
    }

    .column-body {
        padding: 10px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        flex: 1;
    }

    /* ── Task Cards ───────────────────────────────────────────────────── */
    .task-card {
        background: #0f1729;
        border: 1px solid #2d3a4d;
        border-radius: 8px;
        padding: 12px;
        transition: border-color 0.15s, box-shadow 0.15s;
        cursor: pointer;
    }

    .task-card:hover { border-color: #475569; box-shadow: 0 2px 8px #00000040; }

    /* Agent-assigned tasks get a gold accent */
    .agent-card {
        border-left: 2px solid #f2a906;
    }
    .agent-card.in-progress-card {
        animation: pulse-gold 2s ease-in-out infinite;
    }

    @keyframes pulse-gold {
        0%, 100% { box-shadow: 0 0 0 0 #f2a90600; }
        50% { box-shadow: 0 0 0 3px #f2a90630; }
    }

    .task-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 6px;
    }

    .task-title {
        font-size: 0.85rem;
        font-weight: 600;
        color: #e2e8f0;
        line-height: 1.3;
    }

    .task-delete {
        background: none;
        border: none;
        color: #475569;
        cursor: pointer;
        font-size: 1.1rem;
        padding: 0 2px;
        line-height: 1;
        flex-shrink: 0;
    }
    .task-delete:hover { color: #ef4444; }

    .task-desc {
        font-size: 0.78rem;
        color: #64748b;
        margin: 6px 0 0;
        line-height: 1.4;
    }

    .task-outcome {
        font-size: 0.75rem;
        color: #94a3b8;
        margin: 6px 0 0;
        line-height: 1.4;
    }

    .task-footer {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-top: 10px;
        flex-wrap: wrap;
    }

    .task-assignee {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: #f2a90625;
        color: #f2a906;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.65rem;
        font-weight: 700;
        position: relative;
    }

    .agent-badge {
        background: #f2a90630;
        border: 1px solid #f2a90660;
    }

    .agent-dot {
        position: absolute;
        top: -2px;
        right: -2px;
        width: 7px;
        height: 7px;
        background: #22c55e;
        border: 1px solid #0f1729;
        border-radius: 50%;
    }

    .task-tag {
        font-size: 0.68rem;
        background: #243044;
        color: #94a3b8;
        padding: 2px 8px;
        border-radius: 4px;
    }

    .elapsed {
        font-size: 0.68rem;
        color: #f2a906;
        margin-left: auto;
    }

    .status-select {
        background: #1a2332;
        color: #94a3b8;
        border: 1px solid #2d3a4d;
        border-radius: 4px;
        font-size: 0.7rem;
        padding: 2px 4px;
        cursor: pointer;
        outline: none;
    }

    .empty-col {
        text-align: center;
        color: #475569;
        font-size: 0.78rem;
        padding: 24px 0;
    }

    /* ── Detail Panel ─────────────────────────────────────────────────── */
    .panel-backdrop {
        position: fixed;
        inset: 0;
        background: #00000070;
        z-index: 200;
    }

    .detail-panel {
        position: fixed;
        top: 0;
        right: 0;
        height: 100vh;
        width: min(520px, 100vw);
        background: #0f1729;
        border-left: 1px solid #2d3a4d;
        z-index: 201;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .panel-header {
        padding: 20px 20px 14px;
        border-bottom: 1px solid #2d3a4d;
        background: #1a2332;
        flex-shrink: 0;
    }

    .panel-title-row {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        margin-bottom: 10px;
    }

    .panel-title {
        flex: 1;
        font-size: 1rem;
        font-weight: 700;
        color: #f1f5f9;
        margin: 0;
        line-height: 1.4;
    }

    .panel-close {
        background: none;
        border: none;
        color: #64748b;
        cursor: pointer;
        font-size: 1.1rem;
        padding: 2px;
        flex-shrink: 0;
        line-height: 1;
    }
    .panel-close:hover { color: #e2e8f0; }

    .panel-meta {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
    }

    .meta-chip {
        font-size: 0.72rem;
        background: #243044;
        color: #94a3b8;
        padding: 3px 10px;
        border-radius: 20px;
        display: inline-flex;
        align-items: center;
        gap: 4px;
    }

    .meta-agent {
        background: #f2a90618;
        color: #f2a906;
        border: 1px solid #f2a90640;
    }

    .status-chip { font-weight: 600; }

    .elapsed-chip {
        color: #f2a906;
        background: #f2a90618;
    }

    .panel-body {
        flex: 1;
        overflow-y: auto;
        padding: 16px 20px;
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .panel-section {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .section-label {
        font-size: 0.72rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #475569;
        margin: 0;
    }

    .section-text {
        font-size: 0.85rem;
        color: #cbd5e1;
        margin: 0;
        line-height: 1.5;
    }

    .outcome-section {
        background: #f2a90608;
        border: 1px solid #f2a90625;
        border-radius: 8px;
        padding: 10px 12px;
    }

    .commit-link {
        font-size: 0.82rem;
        color: #60a5fa;
        text-decoration: none;
        word-break: break-all;
    }
    .commit-link:hover { text-decoration: underline; }

    .files-list {
        margin: 0;
        padding: 0 0 0 16px;
        list-style: disc;
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .files-list li { font-size: 0.8rem; color: #94a3b8; }
    .files-list code { font-size: 0.78rem; background: #1a2332; padding: 1px 5px; border-radius: 3px; color: #e2e8f0; }

    .full-select {
        max-width: 200px;
    }

    /* Comments */
    .comments-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-height: 300px;
        overflow-y: auto;
    }

    .comment {
        background: #1a2332;
        border: 1px solid #2d3a4d;
        border-radius: 8px;
        padding: 8px 12px;
    }

    .agent-comment { border-left: 2px solid #f2a906; }
    .attachment-comment { border-left: 2px solid #60a5fa; }

    .comment-author {
        font-size: 0.72rem;
        font-weight: 700;
        color: #94a3b8;
        margin-right: 8px;
    }

    .comment-time {
        font-size: 0.68rem;
        color: #475569;
    }

    .comment-body {
        font-size: 0.82rem;
        color: #cbd5e1;
        margin: 4px 0 0;
        line-height: 1.4;
        word-break: break-word;
    }

    .comment-body :global(a) {
        color: #60a5fa;
        text-decoration: none;
    }
    .comment-body :global(a:hover) { text-decoration: underline; }

    .loading-text, .no-comments {
        font-size: 0.8rem;
        color: #475569;
        font-style: italic;
    }

    .add-comment {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 8px;
    }

    .comment-row {
        display: flex;
        gap: 8px;
        align-items: flex-start;
    }

    .author-input { max-width: 110px; flex-shrink: 0; }
    .comment-textarea { resize: vertical; }

    .btn-comment {
        background: #f2a906;
        color: #1b365d;
        border: none;
        padding: 6px 14px;
        border-radius: 6px;
        font-weight: 600;
        font-size: 0.8rem;
        cursor: pointer;
        align-self: flex-end;
        transition: opacity 0.15s;
    }
    .btn-comment:hover { opacity: 0.9; }
    .btn-comment:disabled { opacity: 0.4; cursor: not-allowed; }

    /* Attachments */
    .attach-row {
        display: flex;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
    }

    .file-input {
        font-size: 0.8rem;
        color: #94a3b8;
        flex: 1;
    }

    .btn-upload {
        background: #243044;
        color: #94a3b8;
        border: 1px solid #2d3a4d;
        padding: 6px 14px;
        border-radius: 6px;
        font-size: 0.8rem;
        cursor: pointer;
        transition: all 0.15s;
        white-space: nowrap;
    }
    .btn-upload:hover:not(:disabled) { border-color: #f2a906; color: #f2a906; }
    .btn-upload:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
