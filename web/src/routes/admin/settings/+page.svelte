<script lang="ts">
    import { formatUptime } from '$lib/utils';
    import { Download, GitBranch, Loader, CheckCircle, XCircle } from 'lucide-svelte';

    const { data } = $props();
    const { system, db, git, env, lastDeployISO } = data;

    function timeAgo(iso: string): string {
        if (!iso) return '—';
        const diff = Date.now() - new Date(iso).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ${mins % 60}m ago`;
        const days = Math.floor(hrs / 24);
        return `${days}d ${hrs % 24}h ago`;
    }

    let actionStatus = $state('');
    let actionStatusType = $state<'ok' | 'err' | 'info'>('info');
    let actionRunning = $state(false);

    async function runAction(action: string) {
        actionRunning = true;
        actionStatus = '';
        try {
            if (action === 'backup') {
                const res = await fetch('/admin/api/settings/action', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'backup' })
                });
                if (!res.ok) {
                    const j = await res.json();
                    actionStatus = `Backup failed: ${j.error}`;
                    actionStatusType = 'err';
                    return;
                }
                const blob = await res.blob();
                const url  = URL.createObjectURL(blob);
                const a    = document.createElement('a');
                a.href     = url;
                a.download = `vaspeak-${new Date().toISOString().slice(0, 10)}.db`;
                a.click();
                URL.revokeObjectURL(url);
                actionStatus = 'Backup downloaded.';
                actionStatusType = 'ok';
            } else if (action === 'git_pull') {
                const res = await fetch('/admin/api/settings/action', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'git_pull' })
                });
                const j = await res.json();
                if (res.ok) {
                    actionStatus = j.output?.trim() || 'Already up to date.';
                    actionStatusType = 'ok';
                } else {
                    actionStatus = j.error;
                    actionStatusType = 'err';
                }
            }
        } catch (e) {
            actionStatus = `Error: ${String(e)}`;
            actionStatusType = 'err';
        } finally {
            actionRunning = false;
        }
    }

    function fmtBytes(b: number): string {
        if (b === 0) return 'N/A';
        if (b < 1024) return `${b} B`;
        if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
        return `${(b / 1048576).toFixed(2)} MB`;
    }
</script>

<svelte:head>
    <title>Settings — VASpeak Admin</title>
</svelte:head>

<div class="settings-page">
    <h1 class="page-title">Server Settings</h1>
    <p class="page-subtitle">System health, database management & deployment</p>

    <!-- ── Environment Badges ─────────────────────────────────────────── -->
    <div class="badge-row">
        <span class="badge" class:badge-ok={env.groqConfigured} class:badge-err={!env.groqConfigured}>
            {#if env.groqConfigured}<CheckCircle size={12} />{:else}<XCircle size={12} />{/if} Groq API
        </span>
        <span class="badge" class:badge-ok={env.tursoConfigured} class:badge-err={!env.tursoConfigured}>
            {#if env.tursoConfigured}<CheckCircle size={12} />{:else}<XCircle size={12} />{/if} Turso DB
        </span>
        <span class="badge" class:badge-ok={env.resendConfigured} class:badge-err={!env.resendConfigured}>
            {#if env.resendConfigured}<CheckCircle size={12} />{:else}<XCircle size={12} />{/if} Resend Email
        </span>
        <span class="badge badge-neutral">
            {env.NODE_ENV}
        </span>
        <span class="badge badge-neutral">
            Node {system.nodeVersion}
        </span>
    </div>

    <!-- ── System ──────────────────────────────────────────────────────── -->
    <section class="card">
        <h2 class="card-title">System</h2>
        <div class="info-grid">
            <div class="info-row"><span class="key">Hostname</span><span class="val">{system.hostname}</span></div>
            <div class="info-row"><span class="key">Platform</span><span class="val">{system.platform} ({system.arch})</span></div>
            <div class="info-row"><span class="key">CPU</span><span class="val">{system.cpuCount}× {system.cpuModel}</span></div>
            <div class="info-row"><span class="key">Load avg</span><span class="val">{system.loadAvg1} / {system.loadAvg5} / {system.loadAvg15}</span></div>
            <div class="info-row"><span class="key">Uptime</span><span class="val">{formatUptime(system.uptimeS)}</span></div>
        </div>

        <!-- Memory bar -->
        <div class="mem-block">
            <div class="mem-header">
                <span class="key">Memory</span>
                <span class="val">{system.usedMemGB} / {system.totalMemGB} GB ({system.memPercent}%)</span>
            </div>
            <div class="bar-bg">
                <div
                    class="bar-fill"
                    class:bar-warn={system.memPercent > 75}
                    class:bar-crit={system.memPercent > 90}
                    style="width: {system.memPercent}%"
                ></div>
            </div>
        </div>
    </section>

    <!-- ── Database ────────────────────────────────────────────────────── -->
    <section class="card">
        <h2 class="card-title">Database</h2>

        <div class="db-size">
            <span class="key">File size</span>
            <span class="val mono">{fmtBytes(db.sizeBytes)}</span>
        </div>

        <table class="db-table">
            <thead>
                <tr>
                    <th>Table</th>
                    <th>Rows</th>
                </tr>
            </thead>
            <tbody>
                {#each Object.entries(db.counts) as [table, count]}
                    <tr>
                        <td class="mono">{table}</td>
                        <td class:zero={count === 0}>{count === -1 ? '—' : count.toLocaleString()}</td>
                    </tr>
                {/each}
            </tbody>
        </table>

        <!-- Actions -->
        <div class="actions">
            <button
                class="btn btn-primary"
                onclick={() => runAction('backup')}
                disabled={actionRunning}
            >
                {#if actionRunning}
                    <Loader size={14} class="spin-icon" /> Working…
                {:else}
                    <Download size={14} /> Download Backup
                {/if}
            </button>
        </div>

        {#if actionStatus}
            <p class="action-status" class:status-ok={actionStatusType === 'ok'} class:status-err={actionStatusType === 'err'}>
                {#if actionStatusType === 'ok'}<CheckCircle size={14} />{:else if actionStatusType === 'err'}<XCircle size={14} />{/if}
                {actionStatus}
            </p>
        {/if}
    </section>

    <!-- ── Deployment ─────────────────────────────────────────────────── -->
    <section class="card">
        <h2 class="card-title">Deployment</h2>

        <div class="info-grid">
            <div class="info-row">
                <span class="key">Last Deploy</span>
                <span class="val deploy-time">{timeAgo(lastDeployISO)}</span>
            </div>
            <div class="info-row">
                <span class="key">Last commit</span>
                <span class="val mono commit-hash">{git.hash}</span>
            </div>
            <div class="info-row">
                <span class="key">Message</span>
                <span class="val">{git.message || '—'}</span>
            </div>
            <div class="info-row">
                <span class="key">Author</span>
                <span class="val">{git.author || '—'}</span>
            </div>
            <div class="info-row">
                <span class="key">Date</span>
                <span class="val">{git.date || '—'}</span>
            </div>
        </div>

        <div class="actions">
            <button
                class="btn btn-secondary"
                onclick={() => runAction('git_pull')}
                disabled={actionRunning}
            >
                {#if actionRunning}
                    <Loader size={14} class="spin-icon" /> Pulling…
                {:else}
                    <GitBranch size={14} /> git pull
                {/if}
            </button>
        </div>
    </section>

    <!-- ── Services ────────────────────────────────────────────────────── -->
    <section class="card">
        <h2 class="card-title">External Services</h2>
        <div class="services">
            <div class="service-row">
                <span class="service-name">Groq AI (Roleplay + Scoring)</span>
                <span class="service-model">llama-3.3-70b-versatile</span>
                <span class="chip" class:chip-ok={env.groqConfigured} class:chip-err={!env.groqConfigured}>
                    {env.groqConfigured ? 'Configured' : 'Missing key'}
                </span>
            </div>
            <div class="service-row">
                <span class="service-name">Turso (Kanban)</span>
                <span class="service-model">libSQL cloud</span>
                <span class="chip" class:chip-ok={env.tursoConfigured} class:chip-err={!env.tursoConfigured}>
                    {env.tursoConfigured ? 'Configured' : 'Missing key'}
                </span>
            </div>
            <div class="service-row">
                <span class="service-name">Resend (Email / Magic Links)</span>
                <span class="service-model">transactional email</span>
                <span class="chip" class:chip-ok={env.resendConfigured} class:chip-err={!env.resendConfigured}>
                    {env.resendConfigured ? 'Configured' : 'Missing key'}
                </span>
            </div>
        </div>
    </section>
</div>

<style>
    .settings-page { max-width: 860px; }

    .page-title { font-size: 1.6rem; font-weight: 700; color: #1e293b; margin: 0 0 4px; }
    .page-subtitle { color: #94a3b8; font-size: 0.875rem; margin: 0 0 20px; }

    /* Badges */
    .badge-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 22px; }
    .badge {
        font-size: 0.75rem; font-weight: 600; padding: 4px 12px;
        border-radius: 20px; border: 1px solid transparent;
        display: inline-flex; align-items: center; gap: 5px;
    }
    .badge-ok  { background: #ecfdf5; color: #16a34a; border-color: #bbf7d0; }
    .badge-err { background: #fef2f2; color: #dc2626; border-color: #fecaca; }
    .badge-neutral { background: #f8f9fb; color: #64748b; border-color: #e8ecf1; }

    /* Card */
    .card { background: #ffffff; border: 1px solid #e8ecf1; border-radius: 12px; padding: 20px; margin-bottom: 16px; }
    .card-title { font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #94a3b8; margin: 0 0 14px; }

    /* Info grid */
    .info-grid { display: flex; flex-direction: column; gap: 0; }
    .info-row { display: flex; justify-content: space-between; align-items: center; padding: 7px 0; border-bottom: 1px solid #f1f5f9; }
    .key  { font-size: 0.8rem; color: #94a3b8; }
    .val  { font-size: 0.82rem; color: #475569; text-align: right; max-width: 60%; word-break: break-all; }
    .mono { font-family: 'JetBrains Mono', 'Fira Code', monospace; }

    /* Memory */
    .mem-block { margin-top: 14px; }
    .mem-header { display: flex; justify-content: space-between; margin-bottom: 6px; }
    .bar-bg { height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; }
    .bar-fill { height: 100%; background: #22c55e; border-radius: 4px; transition: width 0.4s; }
    .bar-warn { background: #f2a906; }
    .bar-crit { background: #ef4444; }

    /* DB table */
    .db-size { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .db-table { width: 100%; border-collapse: collapse; font-size: 0.83rem; }
    .db-table th { text-align: left; color: #94a3b8; font-weight: 600; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; padding: 6px 0; border-bottom: 1px solid #e8ecf1; }
    .db-table td { padding: 6px 0; border-bottom: 1px solid #f1f5f9; color: #475569; }
    .db-table td.zero { color: #cbd5e1; }
    .db-table th:last-child, .db-table td:last-child { text-align: right; }

    /* Actions */
    .actions { display: flex; gap: 10px; margin-top: 16px; flex-wrap: wrap; }
    .btn { padding: 8px 18px; border-radius: 6px; font-size: 0.83rem; font-weight: 600; cursor: pointer; border: none; transition: opacity 0.15s; display: inline-flex; align-items: center; gap: 6px; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary   { background: #f2a906; color: #1b365d; }
    .btn-secondary { background: #ffffff; color: #64748b; border: 1px solid #e8ecf1; }
    .btn-primary:hover:not(:disabled)   { opacity: 0.88; }
    .btn-secondary:hover:not(:disabled) { border-color: #cbd5e1; color: #1e293b; }

    :global(.spin-icon) {
        animation: spin 1s linear infinite;
    }
    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    .action-status { margin-top: 10px; font-size: 0.82rem; color: #64748b; display: flex; align-items: center; gap: 6px; }
    .action-status.status-ok { color: #16a34a; }
    .action-status.status-err { color: #dc2626; }

    /* Services */
    .services { display: flex; flex-direction: column; gap: 2px; }
    .service-row { display: flex; align-items: center; gap: 12px; padding: 9px 0; border-bottom: 1px solid #f1f5f9; flex-wrap: wrap; }
    .service-name  { font-size: 0.85rem; color: #1e293b; flex: 1; font-weight: 500; }
    .service-model { font-size: 0.75rem; color: #cbd5e1; font-family: monospace; }
    .chip { font-size: 0.7rem; font-weight: 600; padding: 2px 10px; border-radius: 4px; }
    .chip-ok  { background: #ecfdf5; color: #16a34a; }
    .chip-err { background: #fef2f2; color: #dc2626; }

    /* Commit hash pill in deployment */
    .commit-hash { background: #fef8e7; color: #b07d04; padding: 2px 8px; border-radius: 4px; font-size: 0.78rem; }
    .deploy-time { background: #ecfdf5; color: #16a34a; padding: 2px 8px; border-radius: 4px; font-size: 0.78rem; font-weight: 600; }
</style>
