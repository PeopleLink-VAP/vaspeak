<script lang="ts">
    import { enhance } from '$app/forms';
    import { invalidateAll } from '$app/navigation';
    import { Download, Check, X } from 'lucide-svelte';
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
        <button class="btn btn-primary" onclick={exportCSV}><Download size={14} /> Export CSV</button>
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
                                        <button type="submit" class="btn-icon btn-icon-success" title="Confirm"><Check size={14} /></button>
                                    </form>
                                    <button class="btn-icon" onclick={() => confirmDelete = null} title="Cancel"><X size={14} /></button>
                                </div>
                            {:else}
                                <button class="btn-icon btn-icon-danger" onclick={() => confirmDelete = String(sub.id)} title="Remove"><X size={14} /></button>
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
    .page-title { font-size: 1.6rem; font-weight: 700; color: #1e293b; margin: 0 0 4px; }
    .page-sub { color: #94a3b8; font-size: 0.875rem; margin: 0; }

    .stats-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
    .stat-chip { display: flex; align-items: center; gap: 6px; background: #ffffff; border: 1px solid #e8ecf1; border-radius: 8px; padding: 8px 14px; }
    .stat-src { font-size: 0.78rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
    .stat-count { font-size: 1.1rem; font-weight: 700; color: #b07d04; }

    .alert-error { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; font-size: 0.875rem; }

    .table-wrap { overflow-x: auto; border: 1px solid #e8ecf1; border-radius: 12px; background: #ffffff; }
    .table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    .table th { background: #f8f9fb; color: #94a3b8; font-weight: 600; text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.06em; padding: 10px 14px; text-align: left; border-bottom: 1px solid #e8ecf1; }
    .table td { padding: 12px 14px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; color: #475569; }
    .table tbody tr:last-child td { border-bottom: none; }
    .table tbody tr:hover td { background: #fafbfc; }

    .email-cell { font-family: monospace; font-size: 0.875rem; }

    .badge { display: inline-block; padding: 3px 9px; border-radius: 999px; font-size: 0.72rem; font-weight: 600; background: #f1f5f9; color: #64748b; }
    .badge-landing { background: #fef8e7; color: #b07d04; }
    .badge-app { background: #ecfdf5; color: #16a34a; }

    .muted { color: #94a3b8; font-size: 0.8rem; }
    .empty { text-align: center; color: #94a3b8; padding: 40px; }

    .confirm-row { display: flex; gap: 4px; }
    .btn-icon { background: transparent; border: 1px solid #e8ecf1; color: #94a3b8; border-radius: 6px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.8rem; transition: all 0.15s; }
    .btn-icon:hover { border-color: #cbd5e1; color: #475569; }
    .btn-icon-danger:hover { border-color: #ef4444 !important; color: #dc2626 !important; }
    .btn-icon-success:hover { border-color: #22c55e !important; color: #16a34a !important; }

    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 8px; font-size: 0.875rem; font-weight: 600; cursor: pointer; border: none; transition: all 0.15s; }
    .btn-primary { background: #f2a906; color: #1B365D; }
    .btn-primary:hover { opacity: 0.88; }

    .pagination { display: flex; gap: 4px; margin-top: 16px; }
    .page-btn { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 6px; background: #ffffff; border: 1px solid #e8ecf1; color: #64748b; font-size: 0.8rem; text-decoration: none; transition: all 0.15s; }
    .page-btn.active { background: #fef8e7; border-color: #f2a906; color: #b07d04; }
</style>
