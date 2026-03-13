<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { onInstallPrompt, onAppInstalled, triggerInstall, type BeforeInstallPromptEvent } from '$lib/pwa';

	let { children } = $props();

	// ── Install prompt state (browser-only) ──────────────────────────────────
	let installPrompt = $state<BeforeInstallPromptEvent | null>(null);
	let dismissed     = $state(true); // default true until we check localStorage

	const STORAGE_KEY = 'pwa-install-dismissed';

	// ── Service Worker + install prompt listeners ─────────────────────────────
	onMount(() => {
		// Check if user has already dismissed the banner
		if (localStorage.getItem(STORAGE_KEY) !== '1') {
			dismissed = false;
		}

		// Register service worker
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.register('/service-worker.js', { type: 'module' })
				.catch((err) => console.warn('[SW] Registration failed:', err));
		}

		// Listen for install prompt
		const offPrompt    = onInstallPrompt((e) => { installPrompt = e; });
		// When installed, mark dismissed permanently so banner never returns
		const offInstalled = onAppInstalled(() => {
			installPrompt = null;
			dismissed = true;
			localStorage.setItem(STORAGE_KEY, '1');
		});

		return () => { offPrompt(); offInstalled(); };
	});

	function handleDismiss() {
		dismissed = true;
		localStorage.setItem(STORAGE_KEY, '1'); // never show again
	}

	async function handleInstall() {
		const accepted = await triggerInstall(installPrompt);
		if (accepted) {
			installPrompt = null;
			localStorage.setItem(STORAGE_KEY, '1');
		}
	}
</script>

<!-- ── Install prompt banner ─────────────────────────────────────────────── -->
{#if installPrompt && !dismissed}
	<div id="pwa-install-banner" role="banner" class="pwa-banner">
		<div class="pwa-banner-inner">
			<img src="/icon-192.png" alt="VASpeak" class="pwa-banner-icon" />
			<div class="pwa-banner-text">
				<strong>Cài VASpeak lên màn hình</strong>
				<span>Học mọi lúc, không cần mở trình duyệt</span>
			</div>
		</div>
		<div class="pwa-banner-actions">
			<button class="pwa-btn-install" onclick={handleInstall}>
				Cài đặt
			</button>
			<button class="pwa-btn-dismiss" onclick={handleDismiss} aria-label="Đóng">
				✕
			</button>
		</div>
	</div>
{/if}

{@render children()}


<style>
	.pwa-banner {
		position: fixed;
		bottom: 0;
		left: 0; right: 0;
		background: #1B365D;
		color: #fff;
		padding: 12px 16px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		z-index: 9999;
		box-shadow: 0 -4px 20px rgba(27, 54, 93, 0.25);
		padding-bottom: max(12px, calc(env(safe-area-inset-bottom) + 76px));
	}
	.pwa-banner-inner {
		display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0;
	}
	.pwa-banner-icon {
		width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
	}
	.pwa-banner-text {
		display: flex; flex-direction: column; gap: 1px; min-width: 0;
	}
	.pwa-banner-text strong {
		font-size: 0.875rem; font-weight: 700; color: #fff;
		white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
	}
	.pwa-banner-text span {
		font-size: 0.75rem; color: rgba(255,255,255,0.6);
		white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
	}
	.pwa-banner-actions {
		display: flex; align-items: center; gap: 8px; flex-shrink: 0;
	}
	.pwa-btn-install {
		background: #F2A906; color: #1B365D; border: none; border-radius: 8px;
		padding: 8px 16px; font-weight: 700; font-size: 0.83rem; cursor: pointer;
		transition: opacity 0.15s; white-space: nowrap;
	}
	.pwa-btn-install:hover   { opacity: 0.88; }
	.pwa-btn-install:active  { transform: scale(0.96); }
	.pwa-btn-dismiss {
		background: transparent; border: 1px solid rgba(255,255,255,0.2);
		color: rgba(255,255,255,0.6); border-radius: 6px; width: 32px; height: 32px;
		display: flex; align-items: center; justify-content: center;
		cursor: pointer; font-size: 0.8rem; transition: border-color 0.15s, color 0.15s;
	}
	.pwa-btn-dismiss:hover { border-color: rgba(255,255,255,0.5); color: #fff; }
</style>
