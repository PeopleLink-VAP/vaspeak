<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { Users, BookOpen, BookText, Clock, UserPlus, Mail, GraduationCap, Activity, PanelRightClose, PanelRightOpen, X } from 'lucide-svelte';
    import TimeAgo from '$lib/components/TimeAgo.svelte';

    let { data } = $props();
    const { system, gitCommit, dbStats } = data;

    // ── Activity sidebar ──────────────────────────────────────────────
    type ActivityItem = {
        id: string;
        type: 'signup' | 'waitlist' | 'progress';
        timestamp: string;
        title: string;
        detail: string;
    };

    let activityOpen = $state(false);
    let activityItems = $state<ActivityItem[]>([]);
    let activityInterval: ReturnType<typeof setInterval>;

    async function refreshActivity() {
        try {
            const res = await fetch('/admin/api/activity');
            if (res.ok) activityItems = await res.json();
        } catch { /* silent */ }
    }

    onMount(async () => {
        await refreshActivity();
        activityInterval = setInterval(refreshActivity, 30000);
    });

    onDestroy(() => {
        if (activityInterval) clearInterval(activityInterval);
    });
</script>

<svelte:head>
    <title>Admin Dashboard — VASpeak</title>
</svelte:head>

<div class="dashboard">
    <h1 class="page-title">Dashboard</h1>
    <p class="page-subtitle">VASpeak project overview and server health</p>

    <!-- Quick Stats -->
    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-icon stat-icon-blue"><Users size={20} /></div>
            <div class="stat-body">
                <span class="stat-value">{dbStats.profiles}</span>
                <span class="stat-label">Profiles</span>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon stat-icon-amber"><BookOpen size={20} /></div>
            <div class="stat-body">
                <span class="stat-value">{dbStats.lessons}</span>
                <span class="stat-label">Lessons</span>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon stat-icon-emerald"><BookText size={20} /></div>
            <div class="stat-body">
                <span class="stat-value">{dbStats.vocab}</span>
                <span class="stat-label">Vocab Words</span>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon stat-icon-purple"><Clock size={20} /></div>
            <div class="stat-body">
                <span class="stat-value">{system.uptimeHours}h</span>
                <span class="stat-label">Server Uptime</span>
            </div>
        </div>
    </div>

    <!-- Latest Git Commit -->
    <section class="card">
        <h2 class="card-title">Latest Commit</h2>
        <div class="commit-info">
            <div class="commit-row">
                <span class="commit-hash">{gitCommit.hash}</span>
                <span class="commit-message">{gitCommit.message}</span>
            </div>
            <div class="commit-meta">
                <span>{gitCommit.author}</span>
                {#if gitCommit.date}
                    <span class="dot">·</span>
                    <span>{gitCommit.date}</span>
                {/if}
            </div>
        </div>
    </section>

    <!-- Server Info -->
    <section class="card">
        <h2 class="card-title">Server Info</h2>
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">Hostname</span>
                <span class="info-value">{system.hostname}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Platform</span>
                <span class="info-value">{system.platform}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Arch</span>
                <span class="info-value">{system.arch}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Node</span>
                <span class="info-value">{system.nodeVersion}</span>
            </div>
            <div class="info-item">
                <span class="info-label">CPU</span>
                <span class="info-value">{system.cpuCount}× {system.cpuModel}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Load (1m)</span>
                <span class="info-value">{system.loadAvg1}</span>
            </div>
        </div>

        <!-- Memory bar -->
        <div class="mem-section">
            <div class="mem-header">
                <span class="info-label">Memory</span>
                <span class="info-value">{system.usedMemGB} / {system.totalMemGB} GB ({system.memPercent}%)</span>
            </div>
            <div class="mem-bar-bg">
                <div
                    class="mem-bar-fill"
                    class:mem-warn={system.memPercent > 80}
                    style="width: {system.memPercent}%"
                ></div>
            </div>
        </div>
    </section>
</div>

<!-- ── Activity Sidebar ──────────────────────────────────────────────── -->
{#if activityOpen}
    <aside class="activity-sidebar" data-testid="dashboard-activity-sidebar">
        <div class="activity-header">
            <span class="activity-title"><Activity size={14} /> Activity</span>
            <button class="activity-close" onclick={() => (activityOpen = false)} data-testid="activity-close"><X size={14} /></button>
        </div>
        <div class="activity-list" data-testid="activity-list">
            {#each activityItems as item (item.id)}
                <div class="activity-row" class:activity-signup={item.type === 'signup'} class:activity-waitlist={item.type === 'waitlist'} class:activity-progress={item.type === 'progress'} data-testid="activity-item">
                    <div class="activity-icon">
                        {#if item.type === 'signup'}
                            <UserPlus size={12} />
                        {:else if item.type === 'waitlist'}
                            <Mail size={12} />
                        {:else}
                            <GraduationCap size={12} />
                        {/if}
                    </div>
                    <div class="activity-content">
                        <div class="activity-top-row">
                            <span class="activity-name">{item.title}</span>
                            <TimeAgo timestamp={item.timestamp} class="activity-time" />
                        </div>
                        {#if item.type === 'signup'}
                            <span class="activity-badge badge-signup">Signed up</span>
                        {:else if item.type === 'waitlist'}
                            <span class="activity-badge badge-waitlist">{item.detail}</span>
                        {:else}
                            <p class="activity-detail">{item.detail}</p>
                        {/if}
                    </div>
                </div>
            {:else}
                <p class="activity-empty">No activity yet</p>
            {/each}
        </div>
    </aside>
{/if}

<style>
    .dashboard {
        max-width: 960px;
    }

    .dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
        margin-bottom: 4px;
    }

    .page-title {
        font-size: 1.6rem;
        font-weight: 700;
        color: #1e293b;
        margin: 0 0 4px;
    }

    .page-subtitle {
        color: #94a3b8;
        font-size: 0.875rem;
        margin: 0 0 28px;
    }

    .btn-activity {
        background: #ffffff;
        border: 1px solid #e8ecf1;
        color: #64748b;
        padding: 8px 14px;
        border-radius: 6px;
        font-weight: 600;
        font-size: 0.83rem;
        cursor: pointer;
        transition: all 0.15s;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        flex-shrink: 0;
    }
    .btn-activity:hover { border-color: #cbd5e1; color: #475569; }
    .btn-activity.active { background: #fef8e7; border-color: #f2a906; color: #b07d04; }

    .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 14px;
        margin-bottom: 24px;
    }

    .stat-card {
        background: #ffffff;
        border: 1px solid #e8ecf1;
        border-radius: 12px;
        padding: 18px;
        display: flex;
        align-items: center;
        gap: 14px;
    }

    .stat-icon {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .stat-icon-blue { background: #eff6ff; color: #3b82f6; }
    .stat-icon-amber { background: #fef8e7; color: #d4930a; }
    .stat-icon-emerald { background: #ecfdf5; color: #10b981; }
    .stat-icon-purple { background: #f5f3ff; color: #8b5cf6; }

    .stat-body {
        display: flex;
        flex-direction: column;
    }

    .stat-value {
        font-size: 1.4rem;
        font-weight: 700;
        color: #1e293b;
        line-height: 1;
    }

    .stat-label {
        font-size: 0.75rem;
        color: #94a3b8;
        margin-top: 4px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .card {
        background: #ffffff;
        border: 1px solid #e8ecf1;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 16px;
    }

    .card-title {
        font-size: 0.85rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #94a3b8;
        margin: 0 0 14px;
    }

    .commit-info { display: flex; flex-direction: column; gap: 6px; }
    .commit-row { display: flex; align-items: center; gap: 10px; }
    .commit-hash {
        font-family: 'JetBrains Mono', 'Fira Code', monospace;
        background: #fef8e7; color: #b07d04; padding: 2px 8px;
        border-radius: 4px; font-size: 0.8rem; font-weight: 600;
    }
    .commit-message { color: #1e293b; font-size: 0.9rem; }
    .commit-meta { font-size: 0.78rem; color: #94a3b8; display: flex; gap: 6px; align-items: center; }
    .dot { color: #cbd5e1; }

    .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 12px 24px;
    }
    .info-item { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9; }
    .info-label { font-size: 0.8rem; color: #94a3b8; }
    .info-value { font-size: 0.8rem; color: #475569; text-align: right; }

    .mem-section { margin-top: 16px; }
    .mem-header { display: flex; justify-content: space-between; margin-bottom: 6px; }
    .mem-bar-bg { height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; }
    .mem-bar-fill { height: 100%; background: #22c55e; border-radius: 4px; transition: width 0.4s ease; }
    .mem-bar-fill.mem-warn { background: #ef4444; }

    /* ── Activity Sidebar ──────────────────────────────────────────── */
    .activity-sidebar {
        position: fixed;
        top: 0;
        right: 0;
        height: 100vh;
        width: min(340px, 100vw);
        background: #ffffff;
        border-left: 1px solid #e8ecf1;
        z-index: 150;
        display: flex;
        flex-direction: column;
        box-shadow: -4px 0 16px rgba(0,0,0,0.04);
        animation: slide-in 0.2s ease-out;
    }

    @keyframes slide-in {
        from { transform: translateX(100%); opacity: 0; }
        to   { transform: translateX(0); opacity: 1; }
    }

    .activity-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 16px 12px;
        border-bottom: 1px solid #e8ecf1;
        flex-shrink: 0;
    }

    .activity-title {
        font-size: 0.82rem;
        font-weight: 700;
        color: #1e293b;
        display: flex;
        align-items: center;
        gap: 6px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .activity-close {
        background: none;
        border: none;
        color: #94a3b8;
        cursor: pointer;
        padding: 4px;
        line-height: 1;
        border-radius: 4px;
    }
    .activity-close:hover { color: #1e293b; }

    .activity-list {
        flex: 1;
        overflow-y: auto;
        padding: 8px 0;
    }

    .activity-row {
        display: flex;
        gap: 10px;
        padding: 10px 16px;
        border-bottom: 1px solid #f8f9fb;
        transition: background 0.1s;
    }
    .activity-row:hover { background: #fafbfc; }

    .activity-icon {
        width: 24px;
        height: 24px;
        border-radius: 6px;
        background: #f1f5f9;
        color: #94a3b8;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        margin-top: 1px;
    }

    .activity-row.activity-signup .activity-icon   { background: #eff6ff; color: #3b82f6; }
    .activity-row.activity-waitlist .activity-icon  { background: #fef8e7; color: #d4930a; }
    .activity-row.activity-progress .activity-icon  { background: #ecfdf5; color: #22c55e; }

    .activity-content { flex: 1; min-width: 0; }

    .activity-top-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        margin-bottom: 2px;
    }

    .activity-name {
        font-size: 0.78rem;
        font-weight: 600;
        color: #1e293b;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    :global(.activity-time) {
        font-size: 0.68rem !important;
        color: #cbd5e1 !important;
        flex-shrink: 0;
    }

    .activity-badge {
        display: inline-block;
        font-size: 0.65rem;
        font-weight: 600;
        padding: 1px 7px;
        border-radius: 4px;
        margin-top: 2px;
    }

    .badge-signup  { background: #eff6ff; color: #3b82f6; }
    .badge-waitlist { background: #fef8e7; color: #b07d04; }

    .activity-detail {
        font-size: 0.72rem;
        color: #94a3b8;
        margin: 2px 0 0;
        line-height: 1.35;
    }

    .activity-empty {
        text-align: center;
        color: #cbd5e1;
        font-size: 0.8rem;
        padding: 32px 16px;
        font-style: italic;
    }
</style>
