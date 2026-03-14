<script lang="ts">
	import { Video, Camera, FileText, Play, Loader, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, X, CheckCircle, XCircle, AlertTriangle } from 'lucide-svelte';
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

	// Carousel indices per run (keyed by run id)
	let videoIndex = $state<Record<string, number>>({});
	let shotIndex  = $state<Record<string, number>>({});

	function getVideoIdx(runId: string): number { return videoIndex[runId] ?? 0; }
	function getShotIdx(runId: string): number  { return shotIndex[runId] ?? 0; }

	function prevVideo(runId: string, total: number) { videoIndex[runId] = ((getVideoIdx(runId) - 1) + total) % total; }
	function nextVideo(runId: string, total: number) { videoIndex[runId] = (getVideoIdx(runId) + 1) % total; }
	function prevShot(runId: string, total: number)  { shotIndex[runId] = ((getShotIdx(runId) - 1) + total) % total; }
	function nextShot(runId: string, total: number)  { shotIndex[runId] = (getShotIdx(runId) + 1) % total; }

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
	let runStatusType = $state<'ok' | 'err' | 'info'>('info');
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
		runStatus  = 'Starting run…';
		runStatusType = 'info';

		try {
			const res = await fetch('/admin/api/e2e/run', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ grep: grepFilter || undefined })
			});

			if (res.status === 409) {
				runStatus = 'A run is already in progress.';
				runStatusType = 'err';
				triggering = false;
				return;
			}

			runStatus = 'Tests running… (this may take 1–3 minutes)';

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
					if (runs[0]?.meta?.status === 'passed') {
						runStatus = 'Run complete — all tests passed';
						runStatusType = 'ok';
					} else {
						runStatus = 'Run complete — some tests failed';
						runStatusType = 'err';
					}
				}
			}, 5000);

			// Fallback: read the POST response once it resolves (it's synchronous)
			const j = await res.json() as { ok: boolean; exitCode: number; stdout: string };
			if (j.exitCode === 0) {
				runStatus = 'Run passed!';
				runStatusType = 'ok';
			} else {
				runStatus = `Run failed (exit ${j.exitCode})`;
				runStatusType = 'err';
			}
			clearInterval(pollTimer!);
			triggering = false;

			// Refresh
			const r = await fetch('/admin/api/e2e/results');
			const d = await r.json() as { runs: Run[] };
			runs     = d.runs;
			expanded = runs[0]?.id ?? null;
		} catch (e) {
			runStatus  = `Error: ${String(e)}`;
			runStatusType = 'err';
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
				{#if triggering}
					<Loader size={14} class="spin-icon" /> Running…
				{:else}
					<Play size={14} /> Run Now
				{/if}
			</button>
		</div>
	</div>

	{#if runStatus}
		<p class="run-status" class:ok={runStatusType === 'ok'} class:err={runStatusType === 'err'}>
			{#if runStatusType === 'ok'}<CheckCircle size={14} />{:else if runStatusType === 'err'}<XCircle size={14} />{:else}<Loader size={14} />{/if}
			{runStatus}
		</p>
	{/if}

	{#if runs.length === 0}
		<div class="empty-state">
			<div class="empty-icon"><Video size={48} /></div>
			<h2>No recordings yet</h2>
			<p>Click <strong>Run Now</strong> to execute tests and record the sessions.</p>
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
								<span class="tally pass">{run.summary.passed} ✓</span>
								{#if run.summary.failed > 0}
									<span class="tally fail">{run.summary.failed} ✗</span>
								{/if}
								{#if run.summary.skipped > 0}
									<span class="tally skip">{run.summary.skipped} –</span>
								{/if}
								<span class="tally total">{run.summary.total} total</span>
							{/if}
							<span class="chevron">
								{#if expanded === run.id}<ChevronUp size={14} />{:else}<ChevronDown size={14} />{/if}
							</span>
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

							<!-- ── Videos Carousel ── -->
							{#if videos(run).length > 0}
								{@const vids = videos(run)}
								{@const vi = getVideoIdx(run.id)}
								{@const currentVid = vids[vi]}
								<p class="section-label"><Video size={14} /> Recordings</p>
								<div class="carousel">
									{#if vids.length > 1}
										<button class="carousel-btn carousel-prev" onclick={(e) => { e.stopPropagation(); prevVideo(run.id, vids.length); }}><ChevronLeft size={18} /></button>
									{/if}
									<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
									<div class="carousel-slide" onclick={() => openLightbox(currentVid.url, 'video')} title="Click to view">
										<!-- svelte-ignore a11y_media_has_caption -->
										<video src={currentVid.url} muted preload="metadata" class="carousel-media" title={currentVid.name}></video>
										<div class="carousel-info">
											<span class="carousel-name">{currentVid.name.replace(/__/g, ' › ')}</span>
											<span class="carousel-meta">{fmtBytes(currentVid.sizeBytes)}</span>
										</div>
									</div>
									{#if vids.length > 1}
										<button class="carousel-btn carousel-next" onclick={(e) => { e.stopPropagation(); nextVideo(run.id, vids.length); }}><ChevronRight size={18} /></button>
									{/if}
								</div>
								{#if vids.length > 1}
									<div class="carousel-counter">{vi + 1} / {vids.length}</div>
								{/if}
							{/if}

							<!-- ── Screenshots Carousel ── -->
							{#if shots(run).length > 0}
								{@const ss = shots(run)}
								{@const si = getShotIdx(run.id)}
								{@const currentShot = ss[si]}
								<p class="section-label"><Camera size={14} /> Screenshots</p>
								<div class="carousel">
									{#if ss.length > 1}
										<button class="carousel-btn carousel-prev" onclick={(e) => { e.stopPropagation(); prevShot(run.id, ss.length); }}><ChevronLeft size={18} /></button>
									{/if}
									<button class="carousel-slide" onclick={() => openLightbox(currentShot.url, 'image')} title="Click to view">
										<img src={currentShot.url} alt={currentShot.name} class="carousel-media" />
										<div class="carousel-info">
											<span class="carousel-name">{currentShot.name.replace(/__/g, ' › ')}</span>
										</div>
									</button>
									{#if ss.length > 1}
										<button class="carousel-btn carousel-next" onclick={(e) => { e.stopPropagation(); nextShot(run.id, ss.length); }}><ChevronRight size={18} /></button>
									{/if}
								</div>
								{#if ss.length > 1}
									<div class="carousel-counter">{si + 1} / {ss.length}</div>
								{/if}
							{/if}

							<!-- ── Log ── -->
							{#if log(run)}
								<details class="log-details">
									<summary class="log-summary"><FileText size={14} /> Run log ({fmtBytes(log(run)!.sizeBytes)})</summary>
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
			<button class="lightbox-close" onclick={closeLightbox}><X size={16} /></button>
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
	.page-title { font-size: 1.6rem; font-weight: 700; color: #1e293b; margin: 0 0 4px; }
	.page-subtitle { color: #94a3b8; font-size: 0.875rem; margin: 0; }

	/* Trigger */
	.trigger-box { display: flex; gap: 8px; align-items: center; flex-shrink: 0; }
	.grep-input {
		background: #ffffff; border: 1px solid #e8ecf1; color: #475569;
		border-radius: 6px; padding: 7px 12px; font-size: 0.83rem; width: 180px;
	}
	.grep-input:disabled { opacity: 0.5; }
	.btn-run {
		background: #f2a906; color: #1b365d; font-weight: 700; font-size: 0.83rem;
		border: none; border-radius: 6px; padding: 8px 18px; cursor: pointer;
		transition: opacity 0.15s; display: inline-flex; align-items: center; gap: 6px;
	}
	.btn-run:disabled { opacity: 0.5; cursor: not-allowed; }
	.btn-run:hover:not(:disabled) { opacity: 0.88; }

	:global(.spin-icon) {
		animation: spin 1s linear infinite;
	}
	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.run-status {
		font-size: 0.83rem; padding: 8px 14px; border-radius: 6px; margin-bottom: 14px;
		background: #ffffff; color: #64748b; border: 1px solid #e8ecf1;
		display: flex; align-items: center; gap: 8px;
	}
	.run-status.ok  { color: #16a34a; background: #f0fdf4; border-color: #bbf7d0; }
	.run-status.err { color: #dc2626; background: #fef2f2; border-color: #fecaca; }

	/* Empty */
	.empty-state { text-align: center; padding: 64px 20px; color: #94a3b8; }
	.empty-icon { margin-bottom: 12px; color: #cbd5e1; }
	.empty-state h2 { color: #64748b; font-size: 1.2rem; margin-bottom: 8px; }
	.empty-state p { font-size: 0.875rem; margin: 4px 0; }
	.tip { margin-top: 16px !important; }
	.tip code { background: #f8f9fb; padding: 2px 8px; border-radius: 4px; color: #b07d04; font-size: 0.82rem; border: 1px solid #e8ecf1; }

	/* Run list */
	.run-list { display: flex; flex-direction: column; gap: 10px; }

	.run-card {
		background: #ffffff; border: 1px solid #e8ecf1; border-radius: 10px;
		overflow: hidden;
	}
	.run-card.expanded { border-color: #cbd5e1; }

	.run-header {
		width: 100%; display: flex; justify-content: space-between; align-items: center;
		padding: 12px 16px; background: transparent; border: none; cursor: pointer; text-align: left;
		gap: 12px; color: inherit;
	}
	.run-header:hover { background: #fafbfc; }

	.run-header-left  { display: flex; align-items: center; gap: 10px; }
	.run-header-right { display: flex; align-items: center; gap: 8px; }

	.status-dot { width: 10px; height: 10px; border-radius: 50%; background: #cbd5e1; flex-shrink: 0; }
	.dot-pass   { background: #22c55e; box-shadow: 0 0 6px #22c55e40; }
	.dot-fail   { background: #ef4444; box-shadow: 0 0 6px #ef444440; }

	.run-timestamp { font-size: 0.85rem; color: #475569; font-weight: 500; }
	.filter-chip {
		font-size: 0.72rem; background: #f8f9fb; color: #64748b;
		border: 1px solid #e8ecf1; border-radius: 4px; padding: 1px 7px;
	}

	.tally { font-size: 0.75rem; font-weight: 600; padding: 2px 7px; border-radius: 4px; }
	.tally.pass  { background: #ecfdf5; color: #16a34a; }
	.tally.fail  { background: #fef2f2; color: #dc2626; }
	.tally.skip  { background: #fef8e7; color: #b07d04; }
	.tally.total { background: #f1f5f9; color: #64748b; }

	.chevron { color: #94a3b8; display: flex; align-items: center; margin-left: 4px; }

	/* Body */
	.run-body { padding: 0 16px 16px; }

	.meta-row {
		display: flex; gap: 20px; flex-wrap: wrap;
		font-size: 0.78rem; color: #94a3b8; margin-bottom: 14px; padding-top: 4px;
	}
	.meta-row strong { color: #64748b; }

	.section-label {
		font-size: 0.78rem; font-weight: 600; color: #64748b;
		text-transform: uppercase; letter-spacing: 0.05em; margin: 12px 0 8px;
		display: flex; align-items: center; gap: 6px;
	}

	/* Carousel */
	.carousel {
		display: flex;
		align-items: center;
		gap: 8px;
		background: #f8f9fb;
		border: 1px solid #e8ecf1;
		border-radius: 10px;
		overflow: hidden;
		padding: 6px;
	}

	.carousel-btn {
		background: #ffffff;
		border: 1px solid #e8ecf1;
		color: #94a3b8;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		flex-shrink: 0;
		transition: all 0.15s;
	}
	.carousel-btn:hover { border-color: #f2a906; color: #b07d04; }

	.carousel-slide {
		flex: 1;
		min-width: 0;
		cursor: pointer;
		border-radius: 6px;
		overflow: hidden;
		background: #1e293b;
		border: none;
		padding: 0;
		text-align: left;
		transition: opacity 0.2s;
	}
	.carousel-slide:hover { opacity: 0.9; }

	.carousel-media {
		width: 100%;
		display: block;
		max-height: 260px;
		object-fit: contain;
		pointer-events: none;
	}

	.carousel-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 6px 10px;
		background: #ffffff;
	}

	.carousel-name {
		font-size: 0.72rem;
		color: #64748b;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		flex: 1;
	}

	.carousel-meta {
		font-size: 0.68rem;
		color: #cbd5e1;
		flex-shrink: 0;
		margin-left: 8px;
	}

	.carousel-counter {
		text-align: center;
		font-size: 0.72rem;
		color: #94a3b8;
		margin-top: 4px;
		font-weight: 600;
	}

	/* Log */
	.log-details { margin-top: 10px; }
	.log-summary { font-size: 0.78rem; color: #64748b; cursor: pointer; padding: 4px 0; display: flex; align-items: center; gap: 6px; }
	.log-summary:hover { color: #475569; }
	.log-frame {
		width: 100%; height: 220px; border: 1px solid #e8ecf1; background: #f8f9fb;
		border-radius: 6px; margin-top: 6px; font-size: 0.78rem;
	}

	/* Lightbox */
	.lightbox-overlay {
		position: fixed; inset: 0; background: rgba(0, 0, 0, 0.6);
		z-index: 10000; display: flex; align-items: center; justify-content: center;
		padding: 20px; backdrop-filter: blur(4px);
	}
	.lightbox-content {
		position: relative; max-width: 90vw; max-height: 90vh;
		background: #000; border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);
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
