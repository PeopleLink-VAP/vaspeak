<script lang="ts">
    let { data } = $props();
    const { system, gitCommit, dbStats } = data;
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
            <div class="stat-icon">👤</div>
            <div class="stat-body">
                <span class="stat-value">{dbStats.profiles}</span>
                <span class="stat-label">Profiles</span>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">📚</div>
            <div class="stat-body">
                <span class="stat-value">{dbStats.lessons}</span>
                <span class="stat-label">Lessons</span>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">📖</div>
            <div class="stat-body">
                <span class="stat-value">{dbStats.vocab}</span>
                <span class="stat-label">Vocab Words</span>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">⏱️</div>
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

<style>
    .dashboard {
        max-width: 960px;
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
        margin: 0 0 28px;
    }

    .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 14px;
        margin-bottom: 24px;
    }

    .stat-card {
        background: #1a2332;
        border: 1px solid #2d3a4d;
        border-radius: 12px;
        padding: 18px;
        display: flex;
        align-items: center;
        gap: 14px;
    }

    .stat-icon {
        font-size: 1.6rem;
    }

    .stat-body {
        display: flex;
        flex-direction: column;
    }

    .stat-value {
        font-size: 1.4rem;
        font-weight: 700;
        color: #f2a906;
        line-height: 1;
    }

    .stat-label {
        font-size: 0.75rem;
        color: #64748b;
        margin-top: 4px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .card {
        background: #1a2332;
        border: 1px solid #2d3a4d;
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

    .commit-info {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .commit-row {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .commit-hash {
        font-family: 'JetBrains Mono', 'Fira Code', monospace;
        background: #f2a90618;
        color: #f2a906;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.8rem;
        font-weight: 600;
    }

    .commit-message {
        color: #e2e8f0;
        font-size: 0.9rem;
    }

    .commit-meta {
        font-size: 0.78rem;
        color: #64748b;
        display: flex;
        gap: 6px;
        align-items: center;
    }

    .dot {
        color: #475569;
    }

    .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 12px 24px;
    }

    .info-item {
        display: flex;
        justify-content: space-between;
        padding: 6px 0;
        border-bottom: 1px solid #2d3a4d20;
    }

    .info-label {
        font-size: 0.8rem;
        color: #64748b;
    }

    .info-value {
        font-size: 0.8rem;
        color: #cbd5e1;
        text-align: right;
    }

    .mem-section {
        margin-top: 16px;
    }

    .mem-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 6px;
    }

    .mem-bar-bg {
        height: 8px;
        background: #0f1729;
        border-radius: 4px;
        overflow: hidden;
    }

    .mem-bar-fill {
        height: 100%;
        background: #22c55e;
        border-radius: 4px;
        transition: width 0.4s ease;
    }

    .mem-bar-fill.mem-warn {
        background: #ef4444;
    }
</style>
