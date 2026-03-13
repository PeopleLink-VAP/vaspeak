<script lang="ts">
    let { data } = $props();

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

    let showNewTaskForm = $state(false);
    let newTitle = $state('');
    let newDescription = $state('');
    let newStatus = $state('todo');
    let newAssignee = $state('');
    let newWorkstream = $state('');
    let isCreating = $state(false);

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
                    status: newStatus,
                    assignee: newAssignee.trim(),
                    workstream: newWorkstream.trim()
                })
            });
            if (res.ok) {
                newTitle = '';
                newDescription = '';
                newAssignee = '';
                newWorkstream = '';
                showNewTaskForm = false;
                location.reload();
            }
        } finally {
            isCreating = false;
        }
    }

    async function updateStatus(taskId: string, newStatus: string) {
        await fetch(`/admin/api/kanban/tasks/${taskId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        location.reload();
    }

    async function deleteTask(taskId: string) {
        if (!confirm('Delete this task?')) return;
        await fetch(`/admin/api/kanban/tasks/${taskId}`, { method: 'DELETE' });
        location.reload();
    }

    function getInitials(name: string): string {
        return name.slice(0, 2).toUpperCase();
    }
</script>

<svelte:head>
    <title>Kanban Board — VASpeak Admin</title>
</svelte:head>

<div class="kanban-page">
    <div class="kanban-header">
        <div>
            <h1 class="page-title">Kanban Board</h1>
            <p class="page-subtitle">Task tracking powered by Turso</p>
        </div>
        <button class="btn-new" onclick={() => (showNewTaskForm = !showNewTaskForm)}>
            {showNewTaskForm ? '✕ Cancel' : '+ New Task'}
        </button>
    </div>

    <!-- New Task Form -->
    {#if showNewTaskForm}
        <div class="new-task-form">
            <div class="form-row">
                <input
                    type="text"
                    placeholder="Task title..."
                    bind:value={newTitle}
                    class="input"
                />
                <select bind:value={newStatus} class="input select">
                    <option value="backlog">Backlog</option>
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                </select>
            </div>
            <div class="form-row">
                <input type="text" placeholder="Assignee" bind:value={newAssignee} class="input" />
                <input type="text" placeholder="Workstream" bind:value={newWorkstream} class="input" />
            </div>
            <textarea placeholder="Description..." bind:value={newDescription} class="input textarea" rows="2"></textarea>
            <button class="btn-create" onclick={createTask} disabled={isCreating || !newTitle.trim()}>
                {isCreating ? 'Creating...' : 'Create Task'}
            </button>
        </div>
    {/if}

    <!-- Board Columns -->
    <div class="board">
        {#each data.columns as col}
            {@const tasks = data.grouped[col] ?? []}
            <div class="column">
                <div class="column-header">
                    <span class="column-dot" style="background: {columnColors[col]}"></span>
                    <span class="column-title">{columnLabels[col]}</span>
                    <span class="column-count">{tasks.length}</span>
                </div>
                <div class="column-body">
                    {#each tasks as task}
                        <div class="task-card">
                            <div class="task-top">
                                <span class="task-title">{task.title}</span>
                                <button class="task-delete" onclick={() => deleteTask(task.id)} title="Delete">×</button>
                            </div>
                            {#if task.description}
                                <p class="task-desc">{task.description}</p>
                            {/if}
                            {#if task.expected_outcome}
                                <p class="task-outcome">🎯 {task.expected_outcome}</p>
                            {/if}
                            <div class="task-footer">
                                {#if task.assignee}
                                    <span class="task-assignee" title={task.assignee}>
                                        {getInitials(task.assignee)}
                                    </span>
                                {/if}
                                {#if task.workstream}
                                    <span class="task-tag">{task.workstream}</span>
                                {/if}
                                <select
                                    class="status-select"
                                    value={task.status}
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

<style>
    .kanban-page {
        max-width: 100%;
        overflow-x: auto;
    }

    .kanban-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 20px;
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
        font-size: 0.875rem;
        margin: 0;
    }

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

    .btn-new:hover {
        opacity: 0.9;
    }

    /* New task form */
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
    }

    .input:focus {
        border-color: #f2a906;
    }

    .select {
        max-width: 160px;
    }

    .textarea {
        resize: vertical;
    }

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

    .btn-create:hover {
        opacity: 0.9;
    }

    .btn-create:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    /* Board */
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

    .task-card {
        background: #0f1729;
        border: 1px solid #2d3a4d;
        border-radius: 8px;
        padding: 12px;
        transition: border-color 0.15s;
    }

    .task-card:hover {
        border-color: #475569;
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
    }

    .task-delete:hover {
        color: #ef4444;
    }

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
    }

    .task-tag {
        font-size: 0.68rem;
        background: #243044;
        color: #94a3b8;
        padding: 2px 8px;
        border-radius: 4px;
    }

    .status-select {
        margin-left: auto;
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
</style>
