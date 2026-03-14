<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { page } from '$app/stores';
    import {
        LayoutDashboard, Kanban, Users, BookOpen, Mail,
        Video, Settings, ArrowLeft, Zap,
        Activity, UserPlus, GraduationCap, PlusCircle, RefreshCw, MessageSquare,
        X, PanelRightClose, PanelRightOpen
    } from 'lucide-svelte';
    import TimeAgo from '$lib/components/TimeAgo.svelte';
    import type { ActivityItem } from '$lib/stores/adminActivity';

    let { children } = $props();

    const navGroups = [
        {
            label: 'Overview',
            items: [
                { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
                { href: '/admin/kanban', label: 'Kanban Board', icon: Kanban },
            ]
        },
        {
            label: 'Content',
            items: [
                { href: '/admin/users', label: 'Users', icon: Users },
                { href: '/admin/lessons', label: 'Lessons', icon: BookOpen },
                { href: '/admin/waitlist', label: 'Waitlist', icon: Mail },
            ]
        },
        {
            label: 'System',
            items: [
                { href: '/admin/e2e-testing', label: 'E2E Testing', icon: Video },
                { href: '/admin/settings', label: 'Settings', icon: Settings },
            ]
        }
    ];

    // Reactively track the current path via SvelteKit's page store
    let currentPath = $derived($page.url.pathname);

    // ── Activity panel (third column) — only on /admin/users and /admin/kanban ──

    let showPanel = $derived(
        currentPath.startsWith('/admin/users') || currentPath.startsWith('/admin/kanban')
    );

    let activityItems = $state<ActivityItem[]>([]);
    let activityInterval: ReturnType<typeof setInterval>;
    let panelOpen = $state(true);

    function activityEndpoint(pathname: string): string {
        if (pathname.startsWith('/admin/users')) return '/admin/api/activity';
        return '/admin/api/kanban/activity';
    }

    async function refreshActivity() {
        try {
            const res = await fetch(activityEndpoint(currentPath));
            if (res.ok) activityItems = await res.json();
        } catch { /* silent */ }
    }

    // Re-fetch whenever the page path changes
    $effect(() => {
        const _path = currentPath; // reactive dependency
        refreshActivity();
    });

    onMount(() => {
        activityInterval = setInterval(refreshActivity, 30000);
    });

    onDestroy(() => { if (activityInterval) clearInterval(activityInterval); });

    // Type helpers
    type AType = ActivityItem['type'];

    function iconFor(type: AType) {
        if (type === 'signup')       return UserPlus;
        if (type === 'waitlist')     return Mail;
        if (type === 'progress')     return GraduationCap;
        if (type === 'task_created') return PlusCircle;
        if (type === 'comment')      return MessageSquare;
        return RefreshCw;
    }

    const iconColors: Record<AType, string> = {
        signup: 'icon-blue', waitlist: 'icon-amber', progress: 'icon-green',
        task_created: 'icon-green', task_update: 'icon-grey', comment: 'icon-blue',
    };

    const badgeLabels: Partial<Record<AType, string>> = {
        signup: 'Signed up', waitlist: 'Waitlist',
    };

    const statusLabels: Record<string, string> = {
        backlog: 'Backlog', todo: 'To Do', in_progress: 'In Progress',
        review_blocked: 'Blocked', done: 'Done'
    };
</script>

<div class="admin-shell" class:panel-collapsed={!panelOpen}>
    <!-- Column 1: Left nav sidebar -->
    <aside class="admin-sidebar">
        <div class="sidebar-brand">
            <span class="brand-icon"><Zap size={18} /></span>
            <span class="brand-text">VASpeak Admin</span>
        </div>
        <nav class="sidebar-nav">
            {#each navGroups as group}
                <div class="nav-group-label">{group.label}</div>
                {#each group.items as item}
                    <a
                        href={item.href}
                        class="nav-link"
                        class:active={currentPath === item.href}
                    >
                        <span class="nav-icon"><item.icon size={16} /></span>
                        <span class="nav-label">{item.label}</span>
                    </a>
                {/each}
            {/each}
        </nav>
        <div class="sidebar-footer">
            <a href="/" class="nav-link back-link">
                <span class="nav-icon"><ArrowLeft size={16} /></span>
                <span class="nav-label">Back to Site</span>
            </a>
        </div>
    </aside>

    <!-- Column 2: Main content -->
    <main class="admin-main">
        {@render children()}
    </main>

    <!-- Column 3: Activity panel (only on /admin/users, /admin/kanban) -->
    {#if showPanel}
    <aside class="activity-panel" class:collapsed={!panelOpen} data-testid="activity-sidebar">
        <div class="activity-header">
            <span class="activity-title"><Activity size={14} /> Activity</span>
            <button class="activity-toggle" onclick={() => (panelOpen = !panelOpen)} title={panelOpen ? 'Collapse' : 'Expand'}>
                {#if panelOpen}<PanelRightClose size={14} />{:else}<PanelRightOpen size={14} />{/if}
            </button>
        </div>
        {#if panelOpen}
            <div class="activity-list" data-testid="activity-list">
                {#each activityItems as item (item.id)}
                    {@const Icon = iconFor(item.type)}
                    <div class="activity-row" data-testid="activity-item">
                        <div class="activity-icon {iconColors[item.type] ?? 'icon-grey'}">
                            <Icon size={12} />
                        </div>
                        <div class="activity-content">
                            <div class="activity-top-row">
                                <span class="activity-name">{item.actor || item.title}</span>
                                <TimeAgo timestamp={item.timestamp} class="activity-time" />
                            </div>
                            {#if item.actor}
                                <p class="activity-sub">{item.title}</p>
                            {/if}
                            {#if badgeLabels[item.type]}
                                <span class="activity-badge badge-{item.type}">{badgeLabels[item.type]}</span>
                            {:else if item.type === 'task_update'}
                                <span class="activity-badge badge-status">{statusLabels[item.detail] ?? item.detail}</span>
                            {:else}
                                <p class="activity-detail">{item.detail}</p>
                            {/if}
                        </div>
                    </div>
                {:else}
                    <p class="activity-empty">No activity yet</p>
                {/each}
            </div>
        {/if}
    </aside>
    {/if}
</div>

<style>
    /* ── 3-Column Shell ─────────────────────────────────────────── */
    .admin-shell {
        display: flex;
        min-height: 100vh;
        background: #f8f9fb;
        color: #1e293b;
        font-family: 'Inter', system-ui, sans-serif;
    }

    /* ── Column 1: Left nav ─────────────────────────────────────── */
    .admin-sidebar {
        width: 240px;
        background: #ffffff;
        border-right: 1px solid #e8ecf1;
        display: flex;
        flex-direction: column;
        flex-shrink: 0;
        position: sticky;
        top: 0;
        height: 100vh;
    }

    .sidebar-brand {
        display: flex; align-items: center; gap: 10px;
        padding: 20px 18px;
        border-bottom: 1px solid #e8ecf1;
        font-weight: 700; font-size: 1rem; color: #1B365D;
    }
    .brand-icon { color: #f2a906; display: flex; align-items: center; }

    .sidebar-nav {
        flex: 1; padding: 12px 10px;
        display: flex; flex-direction: column; gap: 2px;
        overflow-y: auto;
    }

    .nav-group-label {
        font-size: 0.65rem; font-weight: 700; text-transform: uppercase;
        letter-spacing: 0.08em; color: #cbd5e1; padding: 10px 8px 4px; margin-top: 4px;
    }

    .nav-link {
        display: flex; align-items: center; gap: 10px; padding: 8px 10px;
        border-radius: 6px; text-decoration: none; color: #64748b;
        font-size: 0.875rem; font-weight: 500; transition: all 0.15s;
    }
    .nav-link:hover { background: #f1f5f9; color: #1e293b; }
    .nav-link.active { background: #fef8e7; color: #b07d04; }
    .nav-icon { display: flex; align-items: center; width: 20px; justify-content: center; }
    .sidebar-footer { padding: 10px; border-top: 1px solid #e8ecf1; }
    .back-link { color: #94a3b8; }

    /* ── Column 2: Main content ─────────────────────────────────── */
    .admin-main {
        flex: 1;
        padding: 28px 32px;
        overflow-y: auto;
        min-width: 0;
    }

    /* ── Column 3: Activity panel ───────────────────────────────── */
    .activity-panel {
        width: 300px;
        background: #ffffff;
        border-left: 1px solid #e8ecf1;
        display: flex;
        flex-direction: column;
        flex-shrink: 0;
        height: 100vh;
        position: sticky;
        top: 0;
        transition: width 0.2s ease;
    }

    .activity-panel.collapsed {
        width: 48px;
        overflow: hidden;
    }

    .activity-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 14px 12px;
        border-bottom: 1px solid #e8ecf1;
        flex-shrink: 0;
    }

    .activity-title {
        font-size: 0.72rem; font-weight: 700; color: #1e293b;
        display: flex; align-items: center; gap: 6px;
        text-transform: uppercase; letter-spacing: 0.06em;
        white-space: nowrap;
    }

    .collapsed .activity-title { display: none; }

    .activity-toggle {
        background: none; border: none; color: #94a3b8;
        cursor: pointer; padding: 4px; border-radius: 4px; line-height: 1;
        flex-shrink: 0;
    }
    .activity-toggle:hover { color: #1e293b; }

    .collapsed .activity-header { justify-content: center; padding: 16px 0 12px; }
    .collapsed .activity-toggle { margin: 0 auto; }

    .activity-list {
        flex: 1;
        overflow-y: auto;
        padding: 4px 0;
    }

    .activity-row {
        display: flex; gap: 10px; padding: 10px 14px;
        border-bottom: 1px solid #f8f9fb;
        transition: background 0.1s;
    }
    .activity-row:hover { background: #fafbfc; }

    .activity-icon {
        width: 24px; height: 24px; border-radius: 6px;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0; margin-top: 1px;
    }
    .icon-blue   { background: #eff6ff; color: #3b82f6; }
    .icon-amber  { background: #fef8e7; color: #d4930a; }
    .icon-green  { background: #ecfdf5; color: #22c55e; }
    .icon-grey   { background: #f1f5f9; color: #94a3b8; }

    .activity-content { flex: 1; min-width: 0; }

    .activity-top-row {
        display: flex; justify-content: space-between;
        align-items: center; gap: 6px;
    }

    .activity-name {
        font-size: 0.75rem; font-weight: 600; color: #1e293b;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }

    :global(.activity-time) {
        font-size: 0.65rem !important;
        color: #cbd5e1 !important;
        flex-shrink: 0;
    }

    .activity-sub {
        font-size: 0.7rem; color: #64748b; margin: 1px 0 2px;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }

    .activity-detail {
        font-size: 0.7rem; color: #94a3b8; margin: 2px 0 0;
        line-height: 1.35;
        display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2;
        -webkit-box-orient: vertical; overflow: hidden;
    }

    .activity-badge {
        display: inline-block; font-size: 0.6rem; font-weight: 700;
        padding: 1px 6px; border-radius: 4px; margin-top: 2px;
        text-transform: uppercase; letter-spacing: 0.04em;
    }
    .badge-signup   { background: #eff6ff; color: #3b82f6; }
    .badge-waitlist { background: #fef8e7; color: #b07d04; }
    .badge-status   { background: #f1f5f9; color: #64748b; }

    .activity-empty {
        text-align: center; color: #cbd5e1; font-size: 0.78rem;
        padding: 32px 14px; font-style: italic;
    }

    /* ── Mobile ──────────────────────────────────────────────────── */
    @media (max-width: 1024px) {
        .activity-panel { display: none; }
    }

    @media (max-width: 768px) {
        .admin-sidebar {
            width: auto; border-right: none; border-bottom: 1px solid #e8ecf1;
            flex-direction: row; height: auto; position: static;
        }
        .sidebar-brand { padding: 12px 14px; }
        .sidebar-nav { flex-direction: row; padding: 4px; overflow-x: auto; flex: 1; }
        .nav-link { padding: 8px; }
        .nav-label { display: none; }
        .nav-group-label { display: none; }
        .admin-main { padding: 20px 16px; }
    }
</style>
