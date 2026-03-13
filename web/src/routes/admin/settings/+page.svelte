<script lang="ts">
    import { formatUptime } from '$lib/utils';

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
                    actionStatus = `❌ Backup failed: ${j.error}`;
                    return;
                }
                const blob = await res.blob();
                const url  = URL.createObjectURL(blob);
                const a    = document.createElement('a');
                a.href     = url;
                a.download = `vaspeak-${new Date().toISOString().slice(0, 10)}.db`;
                a.click();
                URL.revokeObjectURL(url);
                actionStatus = '✅ Backup downloaded.';
            } else if (action === 'git_pull') {
                const res = await fetch('/admin/api/settings/action', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'git_pull' })
                });
                const j = await res.json();
                actionStatus = res.ok ? `✅ ${j.output?.trim() || 'Already up to date.'}` : `❌ ${j.error}`;
            }
        } catch (e) {
            actionStatus = `❌ Error: ${String(e)}`;
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
            {env.groqConfigured ? '✓' : '✗'} Groq API
        </span>
        <span class="badge" class:badge-ok={env.tursoConfigured} class:badge-err={!env.tursoConfigured}>
            {env.tursoConfigured ? '✓' : '✗'} Turso DB
        </span>
        <span class="badge" class:badge-ok={env.resendConfigured} class:badge-err={!env.resendConfigured}>
            {env.resendConfigured ? '✓' : '✗'} Resend Email
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
                {actionRunning ? '⏳ Working…' : '⬇ Download Backup'}
            </button>
        </div>

        {#if actionStatus}
            <p class="action-status">{actionStatus}</p>
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
                {actionRunning ? '⏳ Pulling…' : '↑ git pull'}
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

    .page-title { font-size: 1.6rem; font-weight: 700; color: #f1f5f9; margin: 0 0 4px; }
    .page-subtitle { color: #64748b; font-size: 0.875rem; margin: 0 0 20px; }

    /* Badges */
    .badge-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 22px; }
    .badge {
        font-size: 0.75rem; font-weight: 600; padding: 4px 12px;
        border-radius: 20px; border: 1px solid transparent;
    }
    .badge-ok  { background: #22c55e18; color: #22c55e; border-color: #22c55e40; }
    .badge-err { background: #ef444418; color: #ef4444; border-color: #ef444440; }
    .badge-neutral { background: #0f1729; color: #94a3b8; border-color: #2d3a4d; }

    /* Card */
    .card { background: #1a2332; border: 1px solid #2d3a4d; border-radius: 12px; padding: 20px; margin-bottom: 16px; }
    .card-title { font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #94a3b8; margin: 0 0 14px; }

    /* Info grid */
    .info-grid { display: flex; flex-direction: column; gap: 0; }
    .info-row { display: flex; justify-content: space-between; align-items: center; padding: 7px 0; border-bottom: 1px solid #2d3a4d30; }
    .key  { font-size: 0.8rem; color: #64748b; }
    .val  { font-size: 0.82rem; color: #cbd5e1; text-align: right; max-width: 60%; word-break: break-all; }
    .mono { font-family: 'JetBrains Mono', 'Fira Code', monospace; }

    /* Memory */
    .mem-block { margin-top: 14px; }
    .mem-header { display: flex; justify-content: space-between; margin-bottom: 6px; }
    .bar-bg { height: 8px; background: #0f1729; border-radius: 4px; overflow: hidden; }
    .bar-fill { height: 100%; background: #22c55e; border-radius: 4px; transition: width 0.4s; }
    .bar-warn { background: #f2a906; }
    .bar-crit { background: #ef4444; }

    /* DB table */
    .db-size { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .db-table { width: 100%; border-collapse: collapse; font-size: 0.83rem; }
    .db-table th { text-align: left; color: #475569; font-weight: 600; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; padding: 6px 0; border-bottom: 1px solid #2d3a4d; }
    .db-table td { padding: 6px 0; border-bottom: 1px solid #2d3a4d20; color: #cbd5e1; }
    .db-table td.zero { color: #475569; }
    .db-table th:last-child, .db-table td:last-child { text-align: right; }

    /* Actions */
    .actions { display: flex; gap: 10px; margin-top: 16px; flex-wrap: wrap; }
    .btn { padding: 8px 18px; border-radius: 6px; font-size: 0.83rem; font-weight: 600; cursor: pointer; border: none; transition: opacity 0.15s; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary   { background: #f2a906; color: #1b365d; }
    .btn-secondary { background: #243044; color: #94a3b8; border: 1px solid #2d3a4d; }
    .btn-primary:hover:not(:disabled)   { opacity: 0.88; }
    .btn-secondary:hover:not(:disabled) { border-color: #475569; color: #e2e8f0; }

    .action-status { margin-top: 10px; font-size: 0.82rem; color: #94a3b8; }

    /* Services */
    .services { display: flex; flex-direction: column; gap: 2px; }
    .service-row { display: flex; align-items: center; gap: 12px; padding: 9px 0; border-bottom: 1px solid #2d3a4d20; flex-wrap: wrap; }
    .service-name  { font-size: 0.85rem; color: #e2e8f0; flex: 1; font-weight: 500; }
    .service-model { font-size: 0.75rem; color: #475569; font-family: monospace; }
    .chip { font-size: 0.7rem; font-weight: 600; padding: 2px 10px; border-radius: 4px; }
    .chip-ok  { background: #22c55e18; color: #22c55e; }
    .chip-err { background: #ef444418; color: #ef4444; }

    /* Commit hash pill in deployment */
    .commit-hash { background: #f2a90618; color: #f2a906; padding: 2px 8px; border-radius: 4px; font-size: 0.78rem; }
    .deploy-time { background: #22c55e18; color: #22c55e; padding: 2px 8px; border-radius: 4px; font-size: 0.78rem; font-weight: 600; }
</style>
