<script lang="ts">
    import { enhance } from '$app/forms';
    import { invalidateAll } from '$app/navigation';
    let { data, form } = $props();

    let confirmDelete = $state<string | null>(null);

    function fmt(dateStr: unknown) {
        if (!dateStr) return '—';
        return new Date(String(dateStr)).toLocaleString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    }

    function exportCSV() {
        const header = ['email', 'source', 'subscribed_at'];
        const rows = data.subscribers.map((s: any) => [
            String(s.email), String(s.source), String(s.subscribed_at ?? '')
        ]);
        const csv = [header, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = Object.assign(document.createElement('a'), { href: url, download: 'vaspeak-waitlist.csv' });
        a.click();
        URL.revokeObjectURL(url);
    }
</script>

<svelte:head><title>Waitlist — VASpeak Admin</title></svelte:head>

<div class="page">
    <div class="page-header">
        <div>
            <h1 class="page-title">Waitlist</h1>
            <p class="page-sub">{data.total} subscribers</p>
        </div>
        <button class="btn btn-primary" onclick={exportCSV}>↓ Export CSV</button>
    </div>

    <!-- Source breakdown -->
    <div class="stats-row">
        {#each Object.entries(data.bySource) as [src, count]}
            <div class="stat-chip">
                <span class="stat-src">{src}</span>
                <span class="stat-count">{count}</span>
            </div>
        {/each}
        {#if Object.keys(data.bySource).length === 0}
            <span class="muted">No data yet</span>
        {/if}
    </div>

    {#if form?.error}
        <div class="alert-error">{form.error}</div>
    {/if}

    <!-- Table -->
    <div class="table-wrap">
        <table class="table">
            <thead>
                <tr>
                    <th>Email</th>
                    <th>Source</th>
                    <th>Subscribed</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                {#each data.subscribers as sub}
                    <tr>
                        <td class="email-cell">{sub.email}</td>
                        <td>
                            <span class="badge" class:badge-landing={sub.source === 'landing'} class:badge-app={sub.source === 'app'}>
                                {sub.source}
                            </span>
                        </td>
                        <td class="muted">{fmt(sub.subscribed_at)}</td>
                        <td>
                            {#if confirmDelete === String(sub.id)}
                                <div class="confirm-row">
                                    <form method="POST" action="?/delete" use:enhance={() => () => { confirmDelete = null; invalidateAll(); }}>
                                        <input type="hidden" name="id" value={sub.id} />
                                        <button type="submit" class="btn-icon btn-icon-danger" title="Confirm">✓</button>
                                    </form>
                                    <button class="btn-icon" onclick={() => confirmDelete = null} title="Cancel">✕</button>
                                </div>
                            {:else}
                                <button class="btn-icon btn-icon-danger" onclick={() => confirmDelete = String(sub.id)} title="Remove">✕</button>
                            {/if}
                        </td>
                    </tr>
                {:else}
                    <tr><td colspan="4" class="empty">No subscribers yet.</td></tr>
                {/each}
            </tbody>
        </table>
    </div>

    {#if data.pages > 1}
        <div class="pagination">
            {#each Array.from({length: data.pages}, (_, i) => i + 1) as p}
                <a href="?page={p}" class="page-btn" class:active={p === data.page}>{p}</a>
            {/each}
        </div>
    {/if}
</div>

<style>
    .page { max-width: 900px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
    .page-title { font-size: 1.6rem; font-weight: 700; color: #f1f5f9; margin: 0 0 4px; }
    .page-sub { color: #64748b; font-size: 0.875rem; margin: 0; }

    .stats-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
    .stat-chip { display: flex; align-items: center; gap: 6px; background: #1a2332; border: 1px solid #2d3a4d; border-radius: 8px; padding: 8px 14px; }
    .stat-src { font-size: 0.78rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
    .stat-count { font-size: 1.1rem; font-weight: 700; color: #f2a906; }

    .alert-error { background: #ef44441a; border: 1px solid #ef4444; color: #fca5a5; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; font-size: 0.875rem; }

    .table-wrap { overflow-x: auto; border: 1px solid #2d3a4d; border-radius: 12px; }
    .table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    .table th { background: #1a2332; color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.06em; padding: 10px 14px; text-align: left; border-bottom: 1px solid #2d3a4d; }
    .table td { padding: 12px 14px; border-bottom: 1px solid #2d3a4d20; vertical-align: middle; color: #cbd5e1; }
    .table tbody tr:last-child td { border-bottom: none; }
    .table tbody tr:hover td { background: #1a233210; }

    .email-cell { font-family: monospace; font-size: 0.875rem; }

    .badge { display: inline-block; padding: 3px 9px; border-radius: 999px; font-size: 0.72rem; font-weight: 600; background: #2d3a4d; color: #94a3b8; }
    .badge-landing { background: #f2a90620; color: #f2a906; }
    .badge-app { background: #22c55e20; color: #4ade80; }

    .muted { color: #64748b; font-size: 0.8rem; }
    .empty { text-align: center; color: #64748b; padding: 40px; }

    .confirm-row { display: flex; gap: 4px; }
    .btn-icon { background: transparent; border: 1px solid #2d3a4d; color: #64748b; border-radius: 6px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.8rem; transition: all 0.15s; }
    .btn-icon:hover { border-color: #94a3b8; color: #e2e8f0; }
    .btn-icon-danger:hover { border-color: #ef4444 !important; color: #f87171 !important; }

    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 8px; font-size: 0.875rem; font-weight: 600; cursor: pointer; border: none; transition: all 0.15s; }
    .btn-primary { background: #f2a906; color: #1B365D; }
    .btn-primary:hover { opacity: 0.88; }

    .pagination { display: flex; gap: 4px; margin-top: 16px; }
    .page-btn { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 6px; background: #1a2332; border: 1px solid #2d3a4d; color: #94a3b8; font-size: 0.8rem; text-decoration: none; transition: all 0.15s; }
    .page-btn.active { background: #f2a90620; border-color: #f2a906; color: #f2a906; }
</style>
