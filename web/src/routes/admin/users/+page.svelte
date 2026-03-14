<script lang="ts">
    import { enhance } from '$app/forms';
    import { invalidateAll } from '$app/navigation';
    let { data, form } = $props();

    let searchVal = $derived(data.search);
    let confirmDelete = $state<string | null>(null);
    let expandedUser = $state<string | null>(null);

    // Profile popup state
    let profilePopup = $state<any>(null);
    let profileLoading = $state(false);

    function fmt(dateStr: unknown) {
        if (!dateStr) return '—';
        return new Date(String(dateStr)).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    function fmtTime(dateStr: unknown) {
        if (!dateStr) return '—';
        const d = new Date(String(dateStr));
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    function credits(used: unknown, allowance: unknown) {
        return `${Number(allowance ?? 100) - Number(used ?? 0)} / ${allowance ?? 100}`;
    }
    function closePopup() { profilePopup = null; }
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
            <div class="modal-header">
                <div class="modal-avatar">{String(profilePopup.display_name ?? profilePopup.email)[0].toUpperCase()}</div>
                <div class="modal-user-info">
                    <h2 class="modal-name">{profilePopup.display_name ?? '—'}</h2>
                    <p class="modal-email">{profilePopup.email}</p>
                </div>
                <button class="modal-close" onclick={closePopup} data-testid="profile-popup-close">✕</button>
            </div>

            <!-- Mini Stats Grid -->
            <div class="stats-grid" data-testid="profile-stats">
                <div class="stat-card">
                    <span class="stat-icon">📚</span>
                    <span class="stat-value">{profilePopup.lessonsCompleted}</span>
                    <span class="stat-label">Lessons Done</span>
                </div>
                <div class="stat-card">
                    <span class="stat-icon">🔥</span>
                    <span class="stat-value">{profilePopup.streak_count ?? 0}</span>
                    <span class="stat-label">Streak Days</span>
                </div>
                <div class="stat-card">
                    <span class="stat-icon">📖</span>
                    <span class="stat-value">{profilePopup.vocabMastered}/{profilePopup.vocabTotal}</span>
                    <span class="stat-label">Vocab Mastered</span>
                </div>
                <div class="stat-card">
                    <span class="stat-icon">💰</span>
                    <span class="stat-value">{credits(profilePopup.credits_used, profilePopup.monthly_allowance)}</span>
                    <span class="stat-label">Credits Left</span>
                </div>
            </div>

            <!-- Profile Details -->
            <div class="profile-details">
                <div class="detail-row-item">
                    <span class="detail-key">Level</span>
                    <span class="detail-val">{profilePopup.current_level ?? '—'}</span>
                </div>
                <div class="detail-row-item">
                    <span class="detail-key">Niche</span>
                    <span class="detail-val">{profilePopup.niche ?? 'general'}</span>
                </div>
                <div class="detail-row-item">
                    <span class="detail-key">Plan</span>
                    <span class="badge" class:badge-pro={profilePopup.subscription_status === 'pro'}>{profilePopup.subscription_status ?? 'free'}</span>
                </div>
                <div class="detail-row-item">
                    <span class="detail-key">Joined</span>
                    <span class="detail-val">{fmt(profilePopup.created_at)}</span>
                </div>
                <div class="detail-row-item">
                    <span class="detail-key">Last Lesson</span>
                    <span class="detail-val">{fmtTime(profilePopup.lastLessonDate)}</span>
                </div>
                <div class="detail-row-item">
                    <span class="detail-key">Last Active</span>
                    <span class="detail-val">{fmtTime(profilePopup.updated_at)}</span>
                </div>
            </div>

            <!-- Recent Credit Events -->
            {#if profilePopup.recentCredits?.length}
                <div class="section-header">Recent Credit Activity</div>
                <div class="credit-list">
                    {#each profilePopup.recentCredits as ev}
                        <div class="credit-item">
                            <span class="credit-reason">{ev.reason}</span>
                            <span class="credit-delta" class:credit-spent={Number(ev.delta) < 0} class:credit-earned={Number(ev.delta) > 0}>
                                {Number(ev.delta) > 0 ? '+' : ''}{ev.delta}
                            </span>
                            <span class="credit-date">{fmt(ev.created_at)}</span>
                        </div>
                    {/each}
                </div>
            {/if}

            <!-- Recent Progress -->
            {#if profilePopup.recentProgress?.length}
                <div class="section-header">Recent Progress</div>
                <div class="credit-list">
                    {#each profilePopup.recentProgress as p}
                        <div class="credit-item">
                            <span class="credit-reason">Lesson #{p.lesson_id}</span>
                            <span class="badge">{p.stress_level === 1 ? '😰' : p.stress_level === 2 ? '😐' : '😎'}</span>
                            <span class="credit-date">{fmtTime(p.completed_at)}</span>
                        </div>
                    {/each}
                </div>
            {/if}
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
                    <th>Role</th>
                    <th>Verified</th>
                    <th>Streak</th>
                    <th>Credits left</th>
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
                        <td class="mono">{u.streak_count ?? 0}🔥</td>
                        <td class="mono">{credits(u.credits_used, u.monthly_allowance)}</td>
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
                                        {profileLoading ? '…' : '👤'}
                                    </button>
                                </form>
                                <button class="btn-icon" title="Expand" onclick={() => expandedUser = isExpanded ? null : String(u.id)}>
                                    {isExpanded ? '▲' : '▼'}
                                </button>
                            </div>
                        </td>
                    </tr>

                    {#if isExpanded}
                        <tr class="detail-row">
                            <td colspan="8">
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
                        <td colspan="8" class="empty">No users found{data.search ? ` for "${data.search}"` : ''}.</td>
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
    /* Modal */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .modal { background: #0f172a; border: 1px solid #2d3a4d; border-radius: 16px; width: 100%; max-width: 520px; max-height: 85vh; overflow-y: auto; padding: 24px; }
    .modal-header { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }
    .modal-avatar { width: 48px; height: 48px; border-radius: 50%; background: #f2a90620; color: #f2a906; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.2rem; flex-shrink: 0; }
    .modal-user-info { flex: 1; }
    .modal-name { font-size: 1.1rem; font-weight: 700; color: #e2e8f0; margin: 0 0 2px; }
    .modal-email { font-size: 0.8rem; color: #64748b; margin: 0; }
    .modal-close { background: transparent; border: 1px solid #2d3a4d; color: #64748b; border-radius: 8px; width: 32px; height: 32px; cursor: pointer; font-size: 0.9rem; transition: all 0.15s; display: flex; align-items: center; justify-content: center; }
    .modal-close:hover { border-color: #ef4444; color: #ef4444; }

    /* Stats Grid */
    .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
    .stat-card { background: #1a2332; border: 1px solid #2d3a4d; border-radius: 12px; padding: 14px; display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .stat-icon { font-size: 1.4rem; }
    .stat-value { font-size: 1.1rem; font-weight: 700; color: #e2e8f0; font-family: monospace; }
    .stat-label { font-size: 0.68rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }

    /* Profile details */
    .profile-details { background: #1a2332; border: 1px solid #2d3a4d; border-radius: 12px; padding: 14px; margin-bottom: 16px; }
    .detail-row-item { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #2d3a4d20; }
    .detail-row-item:last-child { border-bottom: none; }
    .detail-key { font-size: 0.78rem; color: #64748b; }
    .detail-val { font-size: 0.82rem; color: #cbd5e1; font-weight: 500; }

    /* Sections */
    .section-header { font-size: 0.72rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; margin-bottom: 8px; }
    .credit-list { background: #1a2332; border: 1px solid #2d3a4d; border-radius: 12px; padding: 8px 14px; margin-bottom: 16px; }
    .credit-item { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid #2d3a4d20; font-size: 0.8rem; }
    .credit-item:last-child { border-bottom: none; }
    .credit-reason { flex: 1; color: #cbd5e1; }
    .credit-delta { font-family: monospace; font-weight: 700; }
    .credit-spent { color: #f87171; }
    .credit-earned { color: #4ade80; }
    .credit-date { color: #64748b; font-size: 0.72rem; }

    /* Page layout (unchanged) */
    .page { max-width: 1100px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .page-title { font-size: 1.6rem; font-weight: 700; color: #f1f5f9; margin: 0 0 4px; }
    .page-sub { color: #64748b; font-size: 0.875rem; margin: 0; }

    .alert-error { background: #ef44441a; border: 1px solid #ef4444; color: #fca5a5; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; font-size: 0.875rem; }

    .search-bar { display: flex; gap: 8px; margin-bottom: 20px; }
    .search-input { flex: 1; max-width: 360px; background: #1a2332; border: 1px solid #2d3a4d; color: #e2e8f0; padding: 8px 14px; border-radius: 8px; font-size: 0.875rem; outline: none; }
    .search-input:focus { border-color: #f2a906; }

    .table-wrap { overflow-x: auto; border: 1px solid #2d3a4d; border-radius: 12px; }
    .table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    .table th { background: #1a2332; color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.06em; padding: 10px 14px; text-align: left; border-bottom: 1px solid #2d3a4d; }
    .table td { padding: 12px 14px; border-bottom: 1px solid #2d3a4d20; vertical-align: middle; color: #cbd5e1; }
    .table tbody tr:last-child td { border-bottom: none; }
    .table tbody tr:hover td { background: #1a233210; }
    .table tbody tr.expanded td { background: #1a233230; }

    .user-cell { display: flex; align-items: center; gap: 10px; }
    .avatar { width: 32px; height: 32px; border-radius: 50%; background: #f2a90620; color: #f2a906; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem; flex-shrink: 0; }
    .user-name { font-weight: 600; color: #e2e8f0; font-size: 0.875rem; }
    .user-email { font-size: 0.75rem; color: #64748b; }

    .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 0.72rem; font-weight: 600; background: #2d3a4d; color: #94a3b8; }
    .badge.badge-admin { background: #7c3aed20; color: #a78bfa; }
    .badge.badge-pro { background: #f2a90620; color: #f2a906; }
    .badge.badge-green { background: #22c55e20; color: #4ade80; }
    .badge.badge-red { background: #ef444420; color: #f87171; }
    .badge-clickable { cursor: pointer; border: none; transition: opacity 0.15s; }
    .badge-clickable:hover { opacity: 0.7; }

    .mono { font-family: monospace; font-size: 0.82rem; }
    .muted { color: #64748b; font-size: 0.8rem; }
    .empty { text-align: center; color: #64748b; padding: 40px; }

    .action-row { display: flex; gap: 6px; }
    .btn-icon { background: transparent; border: 1px solid #2d3a4d; color: #64748b; border-radius: 6px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.7rem; transition: all 0.15s; }
    .btn-icon:hover { border-color: #f2a906; color: #f2a906; }

    .detail-row td { padding: 0; background: #0f172a !important; }
    .detail-panel { padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; gap: 16px; border-top: 1px solid #2d3a4d; }
    .detail-info { display: flex; align-items: center; gap: 8px; }
    .detail-label { font-size: 0.72rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
    .detail-actions { display: flex; gap: 8px; flex-wrap: wrap; }

    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 8px; font-size: 0.875rem; font-weight: 600; cursor: pointer; border: none; transition: all 0.15s; text-decoration: none; }
    .btn-sm { padding: 5px 10px; font-size: 0.78rem; }
    .btn-primary { background: #f2a906; color: #1B365D; }
    .btn-primary:hover { opacity: 0.88; }
    .btn-ghost { background: transparent; border: 1px solid #2d3a4d; color: #94a3b8; }
    .btn-ghost:hover { border-color: #94a3b8; color: #e2e8f0; }
    .btn-danger { background: #ef4444; color: #fff; }
    .btn-danger:hover { opacity: 0.85; }
    .btn-danger-ghost { background: transparent; border: 1px solid #ef444440; color: #f87171; }
    .btn-danger-ghost:hover { border-color: #ef4444; }

    .pagination { display: flex; gap: 4px; margin-top: 16px; }
    .page-btn { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 6px; background: #1a2332; border: 1px solid #2d3a4d; color: #94a3b8; font-size: 0.8rem; text-decoration: none; transition: all 0.15s; }
    .page-btn.active { background: #f2a90620; border-color: #f2a906; color: #f2a906; }
    .page-btn:hover:not(.active) { border-color: #64748b; }
</style>
