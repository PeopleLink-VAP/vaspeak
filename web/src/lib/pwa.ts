/**
 * PWA install prompt helper — browser-only utilities.
 * NOTE: Do NOT use $state here — this file is imported server-side too.
 * All reactive state lives in the +layout.svelte component.
 */

// ── Types ─────────────────────────────────────────────────────────────────────
export interface BeforeInstallPromptEvent extends Event {
	prompt(): Promise<void>;
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** Register the beforeinstallprompt listener and call back when it fires. */
export function onInstallPrompt(
	cb: (e: BeforeInstallPromptEvent) => void
): () => void {
	if (typeof window === 'undefined') return () => {};
	const handler = (e: Event) => {
		e.preventDefault();
		cb(e as BeforeInstallPromptEvent);
	};
	window.addEventListener('beforeinstallprompt', handler);
	return () => window.removeEventListener('beforeinstallprompt', handler);
}

/** Register the appinstalled listener. */
export function onAppInstalled(cb: () => void): () => void {
	if (typeof window === 'undefined') return () => {};
	window.addEventListener('appinstalled', cb);
	return () => window.removeEventListener('appinstalled', cb);
}

/** Trigger the deferred install prompt and return whether user accepted. */
export async function triggerInstall(
	prompt: BeforeInstallPromptEvent | null
): Promise<boolean> {
	if (!prompt) return false;
	await prompt.prompt();
	const result = await prompt.userChoice;
	return result.outcome === 'accepted';
}
