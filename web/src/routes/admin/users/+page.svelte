<script lang="ts">
    import { enhance } from '$app/forms';
    import { invalidateAll } from '$app/navigation';
    import { BookOpen, Flame, BookText, Coins, User, ChevronUp, ChevronDown, MessageCircle, Zap, Clock, TrendingUp, Award, Send, Brain } from 'lucide-svelte';
    let { data, form } = $props();

    let searchVal = $derived(data.search);
    let confirmDelete = $state<string | null>(null);
    let expandedUser = $state<string | null>(null);

    // Profile popup state
    let profilePopup = $state<any>(null);
    let profileLoading = $state(false);
    let activeTab = $state<'activity' | 'progress' | 'credits'>('activity');

    function fmt(dateStr: unknown) {
        if (!dateStr) return '—';
        return new Date(String(dateStr)).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    function fmtTime(dateStr: unknown) {
        if (!dateStr) return '—';
        const d = new Date(String(dateStr));
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    function fmtRelative(dateStr: unknown) {
        if (!dateStr) return '—';
        const now = Date.now();
        const then = new Date(String(dateStr)).getTime();
        const diff = now - then;
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        if (days < 7) return `${days}d ago`;
        return fmt(dateStr);
    }
    function credits(used: unknown, allowance: unknown) {
        return `${Number(allowance ?? 100) - Number(used ?? 0)} / ${allowance ?? 100}`;
    }
    function closePopup() { profilePopup = null; activeTab = 'activity'; }

    function getActivityIcon(type: string) {
        return type;
    }
    function stressLabel(s: number | null) {
        if (s === null || s === undefined) return '—';
        if (s <= 1.5) return 'Low';
        if (s <= 2.5) return 'Mid';
        return 'High';
    }
    function stressColor(s: number | null) {
        if (s === null || s === undefined) return '';
        if (s <= 1.5) return 'stress-low';
        if (s <= 2.5) return 'stress-mid';
        return 'stress-high';
    }
</script>

<svelte:head><title>Users — VASpeak Admin</title></svelte:head>

<!-- Profile Popup Modal -->
{#if profilePopup}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="modal-overlay" onclick={closePopup} data-testid="profile-popup-overlay">
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="modal" onclick={(e) => e.stopPropagation()} data-testid="profile-popup">
            <!-- Header with user info + compact stats -->
            <div class="modal-header">
                <div class="modal-avatar">{String(profilePopup.display_name ?? profilePopup.email)[0].toUpperCase()}</div>
                <div class="modal-user-info">
                    <h2 class="modal-name">{profilePopup.display_name ?? '—'}</h2>
                    <p class="modal-email">{profilePopup.email}</p>
                    <div class="modal-meta">
                        <span class="badge" class:badge-pro={profilePopup.subscription_status === 'pro'}>{profilePopup.subscription_status ?? 'free'}</span>
                        <span class="meta-dot">·</span>
                        <span class="meta-text">{profilePopup.current_level ?? 'Beginner'}</span>
                        <span class="meta-dot">·</span>
                        <span class="meta-text">{profilePopup.niche ?? 'general'}</span>
                        {#if profilePopup.telegram}
                            <span class="meta-dot">·</span>
                            <span class="badge badge-telegram"><Send size={10} /> Telegram</span>
                        {/if}
                    </div>
                </div>
                <button class="modal-close" onclick={closePopup} data-testid="profile-popup-close">✕</button>
            </div>

            <!-- Compact Stat Bar -->
            <div class="stat-bar" data-testid="profile-stats">
                <div class="stat-pill">
                    <Flame size={13} class="pill-icon pill-icon-red" />
                    <span class="pill-val">{profilePopup.streak_count ?? 0}</span>
                    <span class="pill-lbl">streak</span>
                </div>
                <div class="stat-pill">
                    <BookOpen size={13} class="pill-icon pill-icon-amber" />
                    <span class="pill-val">{profilePopup.lessonsCompleted}</span>
                    <span class="pill-lbl">lessons</span>
                </div>
                <div class="stat-pill">
                    <BookText size={13} class="pill-icon pill-icon-emerald" />
                    <span class="pill-val">{profilePopup.vocabMastered}/{profilePopup.vocabTotal}</span>
                    <span class="pill-lbl">vocab</span>
                </div>
                <div class="stat-pill">
                    <Coins size={13} class="pill-icon pill-icon-purple" />
                    <span class="pill-val">{credits(profilePopup.credits_used, profilePopup.monthly_allowance)}</span>
                    <span class="pill-lbl">credits</span>
                </div>
            </div>

            <!-- Progress Bar -->
            <div class="progress-section">
                <div class="progress-header">
                    <span class="progress-title">Course Progress</span>
                    <span class="progress-pct">{profilePopup.completionPct}%</span>
                </div>
                <div class="progress-track">
                    <div class="progress-fill" style="width: {profilePopup.completionPct}%"></div>
                </div>
                <div class="progress-footer">
                    <span>{profilePopup.lessonsCompleted} / {profilePopup.totalLessons} lessons</span>
                    {#if profilePopup.avgStress !== null}
                        <span class="stress-badge {stressColor(profilePopup.avgStress)}">Avg Stress: {stressLabel(profilePopup.avgStress)}</span>
                    {/if}
                </div>
            </div>

            <!-- Profile Details Compact -->
            <div class="detail-strip">
                <div class="detail-chip">
                    <Clock size={11} />
                    <span>Joined {fmt(profilePopup.created_at)}</span>
                </div>
                <div class="detail-chip">
                    <TrendingUp size={11} />
                    <span>Last active {fmtRelative(profilePopup.updated_at)}</span>
                </div>
                {#if profilePopup.lastLessonDate}
                    <div class="detail-chip">
                        <BookOpen size={11} />
                        <span>Last lesson {fmtRelative(profilePopup.lastLessonDate)}</span>
                    </div>
                {/if}
                {#if profilePopup.telegram}
                    <div class="detail-chip">
                        <Send size={11} />
                        <span>@{profilePopup.telegram.telegram_username ?? 'linked'}</span>
                    </div>
                {/if}
            </div>

            <!-- Tabs -->
            <div class="tab-bar">
                <button class="tab-btn" class:tab-active={activeTab === 'activity'} onclick={() => activeTab = 'activity'}>
                    <Zap size={13} /> Activity
                </button>
                <button class="tab-btn" class:tab-active={activeTab === 'progress'} onclick={() => activeTab = 'progress'}>
                    <TrendingUp size={13} /> Progress
                </button>
                <button class="tab-btn" class:tab-active={activeTab === 'credits'} onclick={() => activeTab = 'credits'}>
                    <Coins size={13} /> Credits
                </button>
            </div>

            <!-- Tab Content -->
            <div class="tab-content">
                {#if activeTab === 'activity'}
                    <!-- Activity Timeline -->
                    {#if profilePopup.activityTimeline?.length}
                        <div class="timeline">
                            {#each profilePopup.activityTimeline as ev}
                                <div class="timeline-item">
                                    <div class="timeline-dot timeline-dot-{ev.type}">
                                        {#if ev.type === 'lesson'}
                                            <BookOpen size={10} />
                                        {:else if ev.type === 'credit'}
                                            <Coins size={10} />
                                        {:else if ev.type === 'vocab'}
                                            <BookText size={10} />
                                        {:else if ev.type === 'telegram'}
                                            <Send size={10} />
                                        {:else}
                                            <Zap size={10} />
                                        {/if}
                                    </div>
                                    <div class="timeline-body">
                                        <span class="timeline-desc">{ev.description}</span>
                                        {#if ev.detail}
                                            <span class="timeline-detail">{ev.detail}</span>
                                        {/if}
                                    </div>
                                    <span class="timeline-time">{fmtRelative(ev.timestamp)}</span>
                                </div>
                            {/each}
                        </div>
                    {:else}
                        <div class="empty-tab">No activity recorded yet</div>
                    {/if}

                {:else if activeTab === 'progress'}
                    <!-- Recent Lessons Progress -->
                    {#if profilePopup.recentProgress?.length}
                        <div class="progress-list">
                            {#each profilePopup.recentProgress as p}
                                <div class="progress-item">
                                    <div class="progress-item-icon">
                                        <BookOpen size={12} />
                                    </div>
                                    <div class="progress-item-body">
                                        <span class="progress-item-title">
                                            {p.lesson_title ?? `Lesson #${p.lesson_id}`}
                                        </span>
                                        <span class="progress-item-meta">
                                            {#if p.week_number}Week {p.week_number}, Day {p.day_number}{/if}
                                            {#if p.block_completions}
                                                — {(() => { try { const b = JSON.parse(String(p.block_completions)); return Object.values(b).filter(Boolean).length + '/4 blocks'; } catch { return ''; } })()}
                                            {/if}
                                        </span>
                                    </div>
                                    <div class="progress-item-right">
                                        <span class="stress-badge {stressColor(Number(p.stress_level))}">
                                            {stressLabel(Number(p.stress_level))}
                                        </span>
                                        <span class="progress-item-date">{fmtRelative(p.completed_at)}</span>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {:else}
                        <div class="empty-tab">No lessons completed yet</div>
                    {/if}

                    <!-- Telegram Challenge Stats -->
                    {#if profilePopup.telegramStats && Number(profilePopup.telegramStats.total_challenges) > 0}
                        <div class="sub-section-header">Telegram Challenges</div>
                        <div class="tg-stats-row">
                            <div class="tg-stat">
                                <span class="tg-stat-val">{profilePopup.telegramStats.total_challenges}</span>
                                <span class="tg-stat-lbl">Sent</span>
                            </div>
                            <div class="tg-stat">
                                <span class="tg-stat-val">{profilePopup.telegramStats.answered}</span>
                                <span class="tg-stat-lbl">Answered</span>
                            </div>
                            <div class="tg-stat">
                                <span class="tg-stat-val">{profilePopup.telegramStats.correct}</span>
                                <span class="tg-stat-lbl">Correct</span>
                            </div>
                            <div class="tg-stat">
                                <span class="tg-stat-val">+{profilePopup.telegramStats.total_credits_earned ?? 0}</span>
                                <span class="tg-stat-lbl">Earned</span>
                            </div>
                        </div>
                    {/if}

                {:else if activeTab === 'credits'}
                    <!-- Credit Events -->
                    {#if profilePopup.recentCredits?.length}
                        <div class="credit-list">
                            {#each profilePopup.recentCredits as ev}
                                <div class="credit-item">
                                    <div class="credit-icon" class:credit-icon-spent={Number(ev.delta) < 0} class:credit-icon-earned={Number(ev.delta) > 0}>
                                        {#if Number(ev.delta) > 0}
                                            <TrendingUp size={11} />
                                        {:else}
                                            <Zap size={11} />
                                        {/if}
                                    </div>
                                    <span class="credit-reason">{ev.reason}</span>
                                    <span class="credit-delta" class:credit-spent={Number(ev.delta) < 0} class:credit-earned={Number(ev.delta) > 0}>
                                        {Number(ev.delta) > 0 ? '+' : ''}{ev.delta}
                                    </span>
                                    <span class="credit-date">{fmtRelative(ev.created_at)}</span>
                                </div>
                            {/each}
                        </div>
                    {:else}
                        <div class="empty-tab">No credit activity yet</div>
                    {/if}
                {/if}
            </div>
        </div>
    </div>
{/if}

<div class="page">
    <div class="page-header">
        <div>
            <h1 class="page-title">Users</h1>
            <p class="page-sub">{data.total} total accounts</p>
        </div>
    </div>

    {#if form?.error}
        <div class="alert-error">{form.error}</div>
    {/if}

    <!-- Search -->
    <form method="GET" class="search-bar">
        <input name="q" type="search" value={searchVal} placeholder="Search by email or name…" class="search-input" />
        <button type="submit" class="btn btn-primary">Search</button>
        {#if data.search}
            <a href="/admin/users" class="btn btn-ghost">Clear</a>
        {/if}
    </form>

    <!-- Table -->
    <div class="table-wrap">
        <table class="table">
            <thead>
                <tr>
                    <th>User</th>
                    <th>Progress</th>
                    <th>Role</th>
                    <th>Verified</th>
                    <th>Plan</th>
                    <th>Joined</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {#each data.users as u}
                    {@const isExpanded = expandedUser === String(u.id)}
                    <tr class:expanded={isExpanded}>
                        <td>
                            <div class="user-cell">
                                <div class="avatar">{String(u.display_name ?? u.email)[0].toUpperCase()}</div>
                                <div>
                                    <div class="user-name">{u.display_name ?? '—'}</div>
                                    <div class="user-email">{u.email}</div>
                                </div>
                            </div>
                        </td>
                        <td>
                            <div class="mini-stats">
                                <span class="mini-stat" title="Lessons completed">
                                    <BookOpen size={12} class="ms-icon ms-icon-amber" />
                                    {u.lessons_done ?? 0}
                                </span>
                                <span class="mini-stat" title="Streak">
                                    <Flame size={12} class="ms-icon ms-icon-red" />
                                    {u.streak_count ?? 0}
                                </span>
                                <span class="mini-stat" title="Vocab words">
                                    <BookText size={12} class="ms-icon ms-icon-emerald" />
                                    {u.vocab_count ?? 0}
                                </span>
                                <span class="mini-stat" title="Credits remaining">
                                    <Coins size={12} class="ms-icon ms-icon-purple" />
                                    {credits(u.credits_used, u.monthly_allowance)}
                                </span>
                            </div>
                        </td>
                        <td>
                            <span class="badge" class:badge-admin={u.role === 'admin'}>{u.role}</span>
                        </td>
                        <td>
                            <form method="POST" action="?/verify" use:enhance={() => () => invalidateAll()}>
                                <input type="hidden" name="userId" value={u.id} />
                                <input type="hidden" name="current" value={u.email_verified ? '1' : '0'} />
                                <button type="submit" class="badge badge-clickable"
                                    class:badge-green={u.email_verified}
                                    class:badge-red={!u.email_verified}
                                    title="Click to toggle">
                                    {u.email_verified ? '✓ Verified' : '✗ Unverified'}
                                </button>
                            </form>
                        </td>
                        <td>
                            <span class="badge" class:badge-pro={u.subscription_status === 'pro'}>
                                {u.subscription_status ?? 'free'}
                            </span>
                        </td>
                        <td class="muted">{fmt(u.created_at)}</td>
                        <td>
                            <div class="action-row">
                                <!-- Profile popup button -->
                                <form method="POST" action="?/getUserProfile" use:enhance={() => {
                                    profileLoading = true;
                                    return async ({ result }) => {
                                        profileLoading = false;
                                        if (result.type === 'success' && result.data?.userProfile) {
                                            profilePopup = result.data.userProfile;
                                        }
                                    };
                                }}>
                                    <input type="hidden" name="userId" value={u.id} />
                                    <button class="btn-icon" title="View Profile" type="submit" data-testid="view-profile-{u.id}">
                                        <User size={14} />
                                    </button>
                                </form>
                                <button class="btn-icon" title="Expand" onclick={() => expandedUser = isExpanded ? null : String(u.id)}>
                                    {#if isExpanded}
                                        <ChevronUp size={14} />
                                    {:else}
                                        <ChevronDown size={14} />
                                    {/if}
                                </button>
                            </div>
                        </td>
                    </tr>

                    {#if isExpanded}
                        <tr class="detail-row">
                            <td colspan="7">
                                <div class="detail-panel">
                                    <div class="detail-info">
                                        <span class="detail-label">User ID</span>
                                        <span class="mono muted">{u.id}</span>
                                    </div>
                                    <div class="detail-actions">
                                        <!-- Toggle role -->
                                        <form method="POST" action="?/setRole" use:enhance={() => () => invalidateAll()}>
                                            <input type="hidden" name="userId" value={u.id} />
                                            <input type="hidden" name="role" value={u.role === 'admin' ? 'user' : 'admin'} />
                                            <button class="btn btn-ghost btn-sm" type="submit">
                                                {u.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                                            </button>
                                        </form>

                                        <!-- Reset credits -->
                                        <form method="POST" action="?/resetCredits" use:enhance={() => () => invalidateAll()}>
                                            <input type="hidden" name="userId" value={u.id} />
                                            <button class="btn btn-ghost btn-sm" type="submit">Reset Credits</button>
                                        </form>

                                        <!-- Delete -->
                                        {#if confirmDelete === String(u.id)}
                                            <form method="POST" action="?/deleteUser" use:enhance={() => () => { confirmDelete = null; invalidateAll(); }}>
                                                <input type="hidden" name="userId" value={u.id} />
                                                <button class="btn btn-danger btn-sm" type="submit">Confirm Delete</button>
                                            </form>
                                            <button class="btn btn-ghost btn-sm" onclick={() => confirmDelete = null}>Cancel</button>
                                        {:else}
                                            <button class="btn btn-danger-ghost btn-sm" onclick={() => confirmDelete = String(u.id)}>Delete User</button>
                                        {/if}
                                    </div>
                                </div>
                            </td>
                        </tr>
                    {/if}
                {:else}
                    <tr>
                        <td colspan="7" class="empty">No users found{data.search ? ` for "${data.search}"` : ''}.</td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>

    <!-- Pagination -->
    {#if data.pages > 1}
        <div class="pagination">
            {#each Array.from({length: data.pages}, (_, i) => i + 1) as p}
                <a href="?page={p}&q={data.search}" class="page-btn" class:active={p === data.page}>{p}</a>
            {/each}
        </div>
    {/if}
</div>

<style>
    /* ── Modal ── */
    .modal-overlay { position: fixed; inset: 0; background: rgba(26,26,26,0.5); backdrop-filter: blur(4px); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 16px; }
    .modal { background: #FFFFFF; border: 1px solid #E8E8E8; border-radius: 16px; width: 100%; max-width: 560px; max-height: 88vh; overflow-y: auto; }
    .modal-header { display: flex; align-items: flex-start; gap: 12px; padding: 20px 20px 0; }
    .modal-avatar { width: 44px; height: 44px; border-radius: 50%; background: #F5F0E6; color: #D4960A; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.1rem; flex-shrink: 0; font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif; }
    .modal-user-info { flex: 1; min-width: 0; }
    .modal-name { font-size: 1rem; font-weight: 700; color: #1A1A1A; margin: 0 0 1px; font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif; letter-spacing: -0.01em; }
    .modal-email { font-size: 0.75rem; color: #A3A3A3; margin: 0 0 4px; }
    .modal-meta { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
    .meta-dot { color: #E8E8E8; font-size: 0.6rem; }
    .meta-text { font-size: 0.7rem; color: #6B6B6B; text-transform: capitalize; }
    .modal-close { background: #F5F5F5; border: none; color: #A3A3A3; border-radius: 50%; width: 28px; height: 28px; cursor: pointer; font-size: 0.8rem; transition: all 0.15s; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .modal-close:hover { background: #E8E8E8; color: #1A1A1A; }

    /* ── Stat Bar (compact horizontal pills) ── */
    .stat-bar { display: flex; gap: 6px; padding: 12px 20px; flex-wrap: wrap; }
    .stat-pill { display: flex; align-items: center; gap: 4px; background: #FAFAF8; border: 1px solid #E8E8E8; border-radius: 8px; padding: 5px 10px; flex: 1; min-width: 80px; }
    :global(.pill-icon) { flex-shrink: 0; }
    :global(.pill-icon-red) { color: #ef4444; }
    :global(.pill-icon-amber) { color: #D4960A; }
    :global(.pill-icon-emerald) { color: #10B981; }
    :global(.pill-icon-purple) { color: #8b5cf6; }
    .pill-val { font-size: 0.82rem; font-weight: 700; color: #1A1A1A; font-family: 'Plus Jakarta Sans', monospace; }
    .pill-lbl { font-size: 0.62rem; color: #A3A3A3; text-transform: uppercase; letter-spacing: 0.05em; }

    /* ── Progress Bar ── */
    .progress-section { padding: 0 20px 12px; }
    .progress-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
    .progress-title { font-size: 0.68rem; color: #A3A3A3; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }
    .progress-pct { font-size: 0.82rem; font-weight: 700; color: #1A1A1A; font-family: 'Plus Jakarta Sans', monospace; }
    .progress-track { height: 4px; background: #E8E8E8; border-radius: 2px; overflow: hidden; }
    .progress-fill { height: 100%; background: #D4960A; border-radius: 2px; transition: width 0.4s ease; min-width: 2px; }
    .progress-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; font-size: 0.68rem; color: #A3A3A3; }
    .stress-badge { font-size: 0.65rem; font-weight: 600; padding: 1px 6px; border-radius: 4px; }
    .stress-low { background: #10B981/10; color: #10B981; background: rgba(16,185,129,0.1); }
    .stress-mid { background: rgba(212,150,10,0.1); color: #D4960A; }
    .stress-high { background: #fef2f2; color: #dc2626; }

    /* ── Detail Strip ── */
    .detail-strip { display: flex; gap: 6px; padding: 0 20px 12px; flex-wrap: wrap; }
    .detail-chip { display: flex; align-items: center; gap: 4px; font-size: 0.68rem; color: #6B6B6B; background: #FAFAF8; border: 1px solid #F5F5F5; padding: 3px 8px; border-radius: 6px; }

    /* ── Tabs ── */
    .tab-bar { display: flex; border-bottom: 1px solid #E8E8E8; padding: 0 20px; gap: 0; }
    .tab-btn { display: flex; align-items: center; gap: 4px; padding: 8px 12px; font-size: 0.75rem; font-weight: 600; color: #A3A3A3; background: transparent; border: none; border-bottom: 2px solid transparent; cursor: pointer; transition: color 0.15s; }
    .tab-btn:hover { color: #6B6B6B; }
    .tab-active { color: #1A1A1A; border-bottom-color: #D4960A; }
    .tab-content { padding: 14px 20px 20px; min-height: 120px; }

    /* ── Activity Timeline ── */
    .timeline { display: flex; flex-direction: column; gap: 0; }
    .timeline-item { display: flex; align-items: flex-start; gap: 10px; padding: 8px 0; border-bottom: 1px solid #F5F5F5; }
    .timeline-item:last-child { border-bottom: none; }
    .timeline-dot { width: 24px; height: 24px; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .timeline-dot-lesson { background: #F5F0E6; color: #D4960A; }
    .timeline-dot-credit { background: #f5f3ff; color: #8b5cf6; }
    .timeline-dot-vocab { background: rgba(16,185,129,0.1); color: #10B981; }
    .timeline-dot-telegram { background: rgba(0,136,204,0.1); color: #0088cc; }
    .timeline-body { flex: 1; min-width: 0; }
    .timeline-desc { font-size: 0.78rem; color: #1A1A1A; display: block; font-weight: 500; }
    .timeline-detail { font-size: 0.68rem; color: #A3A3A3; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .timeline-time { font-size: 0.65rem; color: #A3A3A3; white-space: nowrap; flex-shrink: 0; padding-top: 2px; }

    /* ── Progress List ── */
    .progress-list { display: flex; flex-direction: column; gap: 0; }
    .progress-item { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid #F5F5F5; }
    .progress-item:last-child { border-bottom: none; }
    .progress-item-icon { width: 28px; height: 28px; border-radius: 8px; background: #F5F0E6; color: #D4960A; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .progress-item-body { flex: 1; min-width: 0; }
    .progress-item-title { font-size: 0.78rem; color: #1A1A1A; font-weight: 600; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .progress-item-meta { font-size: 0.65rem; color: #A3A3A3; display: block; }
    .progress-item-right { text-align: right; flex-shrink: 0; }
    .progress-item-date { font-size: 0.62rem; color: #A3A3A3; display: block; margin-top: 2px; }

    .sub-section-header { font-size: 0.68rem; color: #A3A3A3; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; margin: 14px 0 8px; }
    .tg-stats-row { display: flex; gap: 8px; }
    .tg-stat { flex: 1; text-align: center; background: #FAFAF8; border: 1px solid #E8E8E8; border-radius: 8px; padding: 8px 4px; }
    .tg-stat-val { display: block; font-size: 0.9rem; font-weight: 700; color: #1A1A1A; font-family: 'Plus Jakarta Sans', monospace; }
    .tg-stat-lbl { display: block; font-size: 0.58rem; color: #A3A3A3; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 1px; }

    /* ── Credit List ── */
    .credit-list { display: flex; flex-direction: column; gap: 0; }
    .credit-item { display: flex; align-items: center; gap: 8px; padding: 7px 0; border-bottom: 1px solid #F5F5F5; font-size: 0.78rem; }
    .credit-item:last-child { border-bottom: none; }
    .credit-icon { width: 24px; height: 24px; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .credit-icon-earned { background: rgba(16,185,129,0.1); color: #10B981; }
    .credit-icon-spent { background: #fef2f2; color: #ef4444; }
    .credit-reason { flex: 1; color: #6B6B6B; text-transform: capitalize; }
    .credit-delta { font-family: monospace; font-weight: 700; min-width: 36px; text-align: right; }
    .credit-spent { color: #ef4444; }
    .credit-earned { color: #10B981; }
    .credit-date { color: #A3A3A3; font-size: 0.65rem; min-width: 50px; text-align: right; }

    .empty-tab { text-align: center; color: #A3A3A3; font-size: 0.82rem; padding: 28px 0; }

    .badge-telegram { background: rgba(0,136,204,0.1); color: #0088cc; display: inline-flex; align-items: center; gap: 3px; }

    /* ── Mini Stats in Table ── */
    .mini-stats { display: flex; gap: 8px; flex-wrap: wrap; }
    .mini-stat { display: inline-flex; align-items: center; gap: 3px; font-size: 0.78rem; color: #6B6B6B; font-family: monospace; white-space: nowrap; }
    :global(.ms-icon) { flex-shrink: 0; vertical-align: -1px; }
    :global(.ms-icon-amber) { color: #D4960A; }
    :global(.ms-icon-red) { color: #ef4444; }
    :global(.ms-icon-emerald) { color: #10B981; }
    :global(.ms-icon-purple) { color: #8b5cf6; }

    /* ── Page Layout ── */
    .page { max-width: 1200px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .page-title { font-size: 1.6rem; font-weight: 700; color: #1A1A1A; margin: 0 0 4px; font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif; letter-spacing: -0.02em; }
    .page-sub { color: #A3A3A3; font-size: 0.875rem; margin: 0; }

    .alert-error { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; font-size: 0.875rem; }

    .search-bar { display: flex; gap: 8px; margin-bottom: 20px; }
    .search-input { flex: 1; max-width: 360px; background: transparent; border: none; border-bottom: 1px solid #E8E8E8; color: #1A1A1A; padding: 8px 0; font-size: 0.875rem; outline: none; border-radius: 0; transition: border-color 0.15s; }
    .search-input:focus { border-bottom-color: #D4960A; }

    .table-wrap { overflow-x: auto; border: 1px solid #E8E8E8; border-radius: 12px; background: #FFFFFF; }
    .table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    .table th { background: #FAFAF8; color: #A3A3A3; font-weight: 600; text-transform: uppercase; font-size: 0.68rem; letter-spacing: 0.06em; padding: 10px 14px; text-align: left; border-bottom: 1px solid #E8E8E8; }
    .table td { padding: 12px 14px; border-bottom: 1px solid #E8E8E8; vertical-align: middle; color: #6B6B6B; }
    .table tbody tr:last-child td { border-bottom: none; }
    .table tbody tr:hover td { background: #FAFAF8; }
    .table tbody tr.expanded td { background: #FAFAF8; }

    .user-cell { display: flex; align-items: center; gap: 10px; }
    .avatar { width: 32px; height: 32px; border-radius: 50%; background: #F5F0E6; color: #D4960A; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem; flex-shrink: 0; }
    .user-name { font-weight: 600; color: #1A1A1A; font-size: 0.875rem; }
    .user-email { font-size: 0.75rem; color: #A3A3A3; }

    .badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 999px; font-size: 0.72rem; font-weight: 600; background: #F5F5F5; color: #6B6B6B; }
    .badge.badge-admin { background: #f5f3ff; color: #7c3aed; }
    .badge.badge-pro { background: #F5F0E6; color: #D4960A; }
    .badge.badge-green { background: rgba(16,185,129,0.1); color: #10B981; }
    .badge.badge-red { background: #fef2f2; color: #dc2626; }
    .badge-clickable { cursor: pointer; border: none; transition: opacity 0.15s; }
    .badge-clickable:hover { opacity: 0.7; }

    .mono { font-family: monospace; font-size: 0.82rem; }
    .muted { color: #A3A3A3; font-size: 0.8rem; }
    .empty { text-align: center; color: #A3A3A3; padding: 40px; }

    .action-row { display: flex; gap: 6px; }
    .btn-icon { background: transparent; border: 1px solid #E8E8E8; color: #A3A3A3; border-radius: 6px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.7rem; transition: all 0.15s; }
    .btn-icon:hover { border-color: #D4960A; color: #D4960A; }

    .detail-row td { padding: 0; background: #FAFAF8 !important; }
    .detail-panel { padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; gap: 16px; border-top: 1px solid #E8E8E8; }
    .detail-info { display: flex; align-items: center; gap: 8px; }
    .detail-label { font-size: 0.68rem; color: #A3A3A3; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }
    .detail-actions { display: flex; gap: 8px; flex-wrap: wrap; }

    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 8px; font-size: 0.875rem; font-weight: 600; cursor: pointer; border: none; transition: all 0.15s; text-decoration: none; }
    .btn-sm { padding: 5px 10px; font-size: 0.78rem; }
    .btn-primary { background: #D4960A; color: #1A1A1A; }
    .btn-primary:hover { background: #b07d08; }
    .btn-ghost { background: transparent; border: 1px solid #E8E8E8; color: #6B6B6B; }
    .btn-ghost:hover { border-color: #A3A3A3; color: #1A1A1A; }
    .btn-danger { background: #ef4444; color: #fff; }
    .btn-danger:hover { opacity: 0.85; }
    .btn-danger-ghost { background: transparent; border: 1px solid #fecaca; color: #dc2626; }
    .btn-danger-ghost:hover { border-color: #ef4444; }

    .pagination { display: flex; gap: 4px; margin-top: 16px; }
    .page-btn { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 6px; background: #FFFFFF; border: 1px solid #E8E8E8; color: #6B6B6B; font-size: 0.8rem; text-decoration: none; transition: all 0.15s; }
    .page-btn.active { background: #F5F0E6; border-color: #D4960A; color: #D4960A; }
    .page-btn:hover:not(.active) { border-color: #A3A3A3; }
</style>
