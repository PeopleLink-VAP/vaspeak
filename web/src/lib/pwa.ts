/**
 * PWA install prompt helper.
 * Captures the `beforeinstallprompt` event so we can show a custom banner
 * rather than the browser's default prompt at an arbitrary time.
 *
 * Usage (in a Svelte component):
 *   import { installPrompt, triggerInstall, dismissInstall } from '$lib/pwa';
 */

// The deferred prompt event — null until the browser fires it
export let installPrompt = $state<BeforeInstallPromptEvent | null>(null);
export let installDismissed = $state(false);

// Capture and defer the native install prompt
if (typeof window !== 'undefined') {
	window.addEventListener('beforeinstallprompt', (e) => {
		e.preventDefault();
		installPrompt = e as BeforeInstallPromptEvent;
	});

	// Once installed, hide the banner
	window.addEventListener('appinstalled', () => {
		installPrompt = null;
	});
}

/** Trigger the deferred native install prompt. */
export async function triggerInstall(): Promise<void> {
	if (!installPrompt) return;
	await installPrompt.prompt();
	const result = await installPrompt.userChoice;
	if (result.outcome === 'accepted') {
		installPrompt = null;
	}
}

/** Dismiss the install banner for this session. */
export function dismissInstall(): void {
	installDismissed = true;
}

// ── Types ─────────────────────────────────────────────────────────────────────
// BeforeInstallPromptEvent is not yet in lib.dom.d.ts
interface BeforeInstallPromptEvent extends Event {
	prompt(): Promise<void>;
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
