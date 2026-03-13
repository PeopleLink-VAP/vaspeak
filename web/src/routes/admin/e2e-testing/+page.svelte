<script lang="ts">
	const { data } = $props();

	type FileEntry = { name: string; url: string; type: string; sizeBytes: number };
	type Summary   = { total: number; passed: number; failed: number; skipped: number } | null;
	type Run = {
		id: string;
		meta: { timestamp: string; status: string; exitCode: number; baseUrl: string; grepFilter: string };
		files: FileEntry[];
		summary: Summary;
	};

	let runs     = $state<Run[]>(data.runs as Run[]);
	let expanded = $state<string | null>((data.runs as Run[])[0]?.id ?? null);

	// Lightbox state
	let lightboxUrl  = $state<string | null>(null);
	let lightboxType = $state<'video' | 'image' | null>(null);

	function openLightbox(url: string, type: 'video' | 'image') {
		lightboxUrl = url;
		lightboxType = type;
	}

	function closeLightbox() {
		lightboxUrl = null;
		lightboxType = null;
	}

	// Run trigger state
	let triggering  = $state(false);
	let runStatus   = $state('');
	let grepFilter  = $state('@smoke');
	let pollTimer: ReturnType<typeof setInterval> | null = null;

	function fmtBytes(b: number) {
		if (b < 1024)    return `${b}B`;
		if (b < 1048576) return `${(b/1024).toFixed(0)}KB`;
		return `${(b/1048576).toFixed(1)}MB`;
	}

	function videos(run: Run) { return run.files.filter(f => f.type === 'video'); }
	function shots(run: Run)  { return run.files.filter(f => f.type === 'screenshot'); }
	function log(run: Run)    { return run.files.find(f => f.type === 'log') ?? null; }

	function fmtTimestamp(ts: string): string {
		// e.g. "2026-03-13T20-15-00Z" → readable
		const normalized = ts.replace(/T(\d{2})-(\d{2})-(\d{2})Z/, 'T$1:$2:$3Z');
		try {
			return new Date(normalized).toLocaleString('en-GB', {
				day: '2-digit', month: 'short', year: 'numeric',
				hour: '2-digit', minute: '2-digit', second: '2-digit'
			});
		} catch { return ts; }
	}

	async function triggerRun() {
		if (triggering) return;
		triggering = true;
		runStatus  = '⏳ Starting run…';

		try {
			const res = await fetch('/admin/api/e2e/run', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ grep: grepFilter || undefined })
			});

			if (res.status === 409) {
				runStatus = '⚠️ A run is already in progress.';
				triggering = false;
				return;
			}

			runStatus = '▶ Tests running… (this may take 1–3 minutes)';

			// Poll until done
			pollTimer = setInterval(async () => {
				const statusRes = await fetch('/admin/api/e2e/run').catch(() => null);
				if (!statusRes) return;
				const j = await statusRes.json() as { running: boolean };
				if (!j.running) {
					clearInterval(pollTimer!);
					triggering = false;
					// Refresh results
					const r = await fetch('/admin/api/e2e/results');
					const d = await r.json() as { runs: Run[] };
					runs     = d.runs;
					expanded = runs[0]?.id ?? null;
					runStatus = runs[0]?.meta?.status === 'passed'
						? '✅ Run complete — all tests passed'
						: '❌ Run complete — some tests failed';
				}
			}, 5000);

			// Fallback: read the POST response once it resolves (it's synchronous)
			const j = await res.json() as { ok: boolean; exitCode: number; stdout: string };
			if (j.exitCode === 0) runStatus = '✅ Run passed!';
			else runStatus = `❌ Run failed (exit ${j.exitCode})`;
			clearInterval(pollTimer!);
			triggering = false;

			// Refresh
			const r = await fetch('/admin/api/e2e/results');
			const d = await r.json() as { runs: Run[] };
			runs     = d.runs;
			expanded = runs[0]?.id ?? null;
		} catch (e) {
			runStatus  = `❌ Error: ${String(e)}`;
			triggering = false;
		}
	}
</script>

<svelte:window onkeydown={e => e.key === 'Escape' && closeLightbox()} />

<svelte:head>
	<title>E2E Recordings — VASpeak Admin</title>
</svelte:head>

<div class="e2e-page">
	<div class="page-header">
		<div>
			<h1 class="page-title">E2E Test Recordings</h1>
			<p class="page-subtitle">Video recordings of each Playwright run (800×450, low-quality webm)</p>
		</div>

		<!-- Trigger panel -->
		<div class="trigger-box">
			<input
				id="grep-filter"
				bind:value={grepFilter}
				placeholder="Tag filter e.g. @smoke"
				class="grep-input"
				disabled={triggering}
			/>
			<button
				onclick={triggerRun}
				disabled={triggering}
				class="btn-run"
			>
				{triggering ? '⏳ Running…' : '▶ Run Now'}
			</button>
		</div>
	</div>

	{#if runStatus}
		<p class="run-status" class:ok={runStatus.startsWith('✅')} class:err={runStatus.startsWith('❌')}>
			{runStatus}
		</p>
	{/if}

	{#if runs.length === 0}
		<div class="empty-state">
			<div class="empty-icon">🎬</div>
			<h2>No recordings yet</h2>
			<p>Click <strong>▶ Run Now</strong> to execute tests and record the sessions.</p>
			<p class="tip">Or run from terminal: <code>npm run test:e2e:record:smoke</code></p>
		</div>
	{:else}
		<!-- Run list -->
		<div class="run-list">
			{#each runs as run (run.id)}
				<div class="run-card" class:expanded={expanded === run.id}>
					<!-- ── Run header ── -->
					<button class="run-header" onclick={() => expanded = expanded === run.id ? null : run.id}>
						<div class="run-header-left">
							<span class="status-dot" class:dot-pass={run.meta.status === 'passed'} class:dot-fail={run.meta.status === 'failed'}></span>
							<span class="run-timestamp">{fmtTimestamp(run.meta.timestamp)}</span>
							{#if run.meta.grepFilter}
								<span class="filter-chip">{run.meta.grepFilter.replace('--grep=','')}</span>
							{/if}
						</div>
						<div class="run-header-right">
							{#if run.summary}
								<span class="tally pass">{run.summary.passed}✓</span>
								{#if run.summary.failed > 0}
									<span class="tally fail">{run.summary.failed}✗</span>
								{/if}
								{#if run.summary.skipped > 0}
									<span class="tally skip">{run.summary.skipped}–</span>
								{/if}
								<span class="tally total">{run.summary.total} total</span>
							{/if}
							<span class="chevron">{expanded === run.id ? '▲' : '▼'}</span>
						</div>
					</button>

					{#if expanded === run.id}
						<div class="run-body">
							<!-- ── Meta row ── -->
							<div class="meta-row">
								<span><strong>Base URL:</strong> {run.meta.baseUrl || '—'}</span>
								<span><strong>Exit:</strong> {run.meta.exitCode}</span>
								<span><strong>Files:</strong> {run.files.length}</span>
							</div>

							<!-- ── Videos ── -->
							{#if videos(run).length > 0}
								<p class="section-label">🎬 Recordings ({videos(run).length})</p>
								<div class="video-grid">
									{#each videos(run) as v}
										<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
										<div class="video-card" onclick={() => openLightbox(v.url, 'video')} title="Click to view full screen">
											<!-- svelte-ignore a11y_media_has_caption -->
											<video
												src={v.url}
												muted
												preload="metadata"
												class="video-el"
												title={v.name}
											></video>
											<p class="video-name" title={v.name}>{v.name.replace(/__/g, ' › ')}</p>
											<p class="video-size">{fmtBytes(v.sizeBytes)}</p>
										</div>
									{/each}
								</div>
							{/if}

							<!-- ── Screenshots ── -->
							{#if shots(run).length > 0}
								<p class="section-label">📸 Screenshots ({shots(run).length})</p>
								<div class="shot-grid">
									{#each shots(run) as s}
										<button class="shot-link" onclick={() => openLightbox(s.url, 'image')}>
											<img src={s.url} alt={s.name} class="shot-img" />
											<p class="shot-name">{s.name.replace(/__/g, ' › ')}</p>
										</button>
									{/each}
								</div>
							{/if}

							<!-- ── Log ── -->
							{#if log(run)}
								<details class="log-details">
									<summary class="log-summary">📄 Run log ({fmtBytes(log(run)!.sizeBytes)})</summary>
									<iframe src={log(run)!.url} class="log-frame" title="run log"></iframe>
								</details>
							{/if}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

{#if lightboxUrl}
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div class="lightbox-overlay" onclick={closeLightbox}>
		<div class="lightbox-content" onclick={e => e.stopPropagation()}>
			<button class="lightbox-close" onclick={closeLightbox}>✕</button>
			{#if lightboxType === 'video'}
				<!-- svelte-ignore a11y_media_has_caption -->
				<video src={lightboxUrl} controls autoplay class="lightbox-media"></video>
			{:else}
				<img src={lightboxUrl} alt="Screenshot" class="lightbox-media" />
			{/if}
		</div>
	</div>
{/if}

<style>
	.e2e-page { max-width: 1100px; }

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 20px;
		flex-wrap: wrap;
		margin-bottom: 16px;
	}
	.page-title { font-size: 1.6rem; font-weight: 700; color: #f1f5f9; margin: 0 0 4px; }
	.page-subtitle { color: #64748b; font-size: 0.875rem; margin: 0; }

	/* Trigger */
	.trigger-box { display: flex; gap: 8px; align-items: center; flex-shrink: 0; }
	.grep-input {
		background: #0f1729; border: 1px solid #2d3a4d; color: #cbd5e1;
		border-radius: 6px; padding: 7px 12px; font-size: 0.83rem; width: 180px;
	}
	.grep-input:disabled { opacity: 0.5; }
	.btn-run {
		background: #f2a906; color: #1b365d; font-weight: 700; font-size: 0.83rem;
		border: none; border-radius: 6px; padding: 8px 18px; cursor: pointer;
		transition: opacity 0.15s;
	}
	.btn-run:disabled { opacity: 0.5; cursor: not-allowed; }
	.btn-run:hover:not(:disabled) { opacity: 0.88; }

	.run-status {
		font-size: 0.83rem; padding: 8px 14px; border-radius: 6px; margin-bottom: 14px;
		background: #1a2332; color: #94a3b8;
	}
	.run-status.ok  { color: #22c55e; }
	.run-status.err { color: #ef4444; }

	/* Empty */
	.empty-state { text-align: center; padding: 64px 20px; color: #64748b; }
	.empty-icon { font-size: 3rem; margin-bottom: 12px; }
	.empty-state h2 { color: #94a3b8; font-size: 1.2rem; margin-bottom: 8px; }
	.empty-state p { font-size: 0.875rem; margin: 4px 0; }
	.tip { margin-top: 16px !important; }
	.tip code { background: #0f1729; padding: 2px 8px; border-radius: 4px; color: #f2a906; font-size: 0.82rem; }

	/* Run list */
	.run-list { display: flex; flex-direction: column; gap: 10px; }

	.run-card {
		background: #1a2332; border: 1px solid #2d3a4d; border-radius: 10px;
		overflow: hidden;
	}
	.run-card.expanded { border-color: #3d4f66; }

	.run-header {
		width: 100%; display: flex; justify-content: space-between; align-items: center;
		padding: 12px 16px; background: transparent; border: none; cursor: pointer; text-align: left;
		gap: 12px;
	}
	.run-header:hover { background: #1e2c3e; }

	.run-header-left  { display: flex; align-items: center; gap: 10px; }
	.run-header-right { display: flex; align-items: center; gap: 8px; }

	.status-dot { width: 10px; height: 10px; border-radius: 50%; background: #475569; flex-shrink: 0; }
	.dot-pass   { background: #22c55e; box-shadow: 0 0 6px #22c55e60; }
	.dot-fail   { background: #ef4444; box-shadow: 0 0 6px #ef444460; }

	.run-timestamp { font-size: 0.85rem; color: #cbd5e1; font-weight: 500; }
	.filter-chip {
		font-size: 0.72rem; background: #0f1729; color: #94a3b8;
		border: 1px solid #2d3a4d; border-radius: 4px; padding: 1px 7px;
	}

	.tally { font-size: 0.75rem; font-weight: 600; padding: 2px 7px; border-radius: 4px; }
	.tally.pass  { background: #22c55e18; color: #22c55e; }
	.tally.fail  { background: #ef444418; color: #ef4444; }
	.tally.skip  { background: #f2a90618; color: #f2a906; }
	.tally.total { background: #2d3a4d; color: #94a3b8; }

	.chevron { font-size: 0.7rem; color: #475569; margin-left: 4px; }

	/* Body */
	.run-body { padding: 0 16px 16px; }

	.meta-row {
		display: flex; gap: 20px; flex-wrap: wrap;
		font-size: 0.78rem; color: #64748b; margin-bottom: 14px; padding-top: 4px;
	}
	.meta-row strong { color: #94a3b8; }

	.section-label {
		font-size: 0.78rem; font-weight: 600; color: #64748b;
		text-transform: uppercase; letter-spacing: 0.05em; margin: 12px 0 8px;
	}

	/* Video grid */
	.video-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 12px;
	}
	.video-card { background: #0f1729; border-radius: 8px; overflow: hidden; cursor: pointer; transition: opacity 0.2s; }
	.video-card:hover { opacity: 0.85; }
	.video-el { width: 100%; display: block; max-height: 200px; object-fit: contain; background: #000; pointer-events: none; }
	.video-name {
		font-size: 0.72rem; color: #64748b; padding: 4px 8px 0; white-space: nowrap;
		overflow: hidden; text-overflow: ellipsis;
	}
	.video-size { font-size: 0.68rem; color: #475569; padding: 0 8px 6px; }

	/* Screenshot grid */
	.shot-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
		gap: 8px;
	}
	.shot-link { display: block; width: 100%; text-align: left; cursor: pointer; border: none; padding: 0; background: #0f1729; border-radius: 6px; overflow: hidden; text-decoration: none; transition: opacity 0.2s; }
	.shot-link:hover { opacity: 0.85; }
	.shot-img  { width: 100%; display: block; max-height: 140px; object-fit: cover; }
	.shot-name { font-size: 0.68rem; color: #64748b; padding: 4px 6px 6px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }

	/* Log */
	.log-details { margin-top: 10px; }
	.log-summary { font-size: 0.78rem; color: #64748b; cursor: pointer; padding: 4px 0; }
	.log-summary:hover { color: #94a3b8; }
	.log-frame {
		width: 100%; height: 220px; border: none; background: #0a0f1a;
		border-radius: 6px; margin-top: 6px; font-size: 0.78rem;
	}

	/* Lightbox */
	.lightbox-overlay {
		position: fixed; inset: 0; background: rgba(0, 0, 0, 0.85);
		z-index: 10000; display: flex; align-items: center; justify-content: center;
		padding: 20px; backdrop-filter: blur(4px);
	}
	.lightbox-content {
		position: relative; max-width: 90vw; max-height: 90vh;
		background: #000; border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
		display: flex; flex-direction: column; overflow: hidden;
	}
	.lightbox-media {
		max-width: 100%; max-height: 85vh; object-fit: contain; display: block; outline: none;
	}
	.lightbox-close {
		position: absolute; top: 12px; right: 12px;
		background: rgba(0,0,0,0.6); border: none; color: #fff;
		width: 32px; height: 32px; border-radius: 50%; font-size: 14px;
		cursor: pointer; display: flex; align-items: center; justify-content: center;
		z-index: 2; transition: background 0.2s;
	}
	.lightbox-close:hover { background: rgba(255,255,255,0.3); }
</style>
