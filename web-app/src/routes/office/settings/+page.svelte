<script lang="ts">
</script>

<svelte:head>
    <title>Settings — Office</title>
</svelte:head>

<div class="space-y-6">
    <div>
        <h1 class="text-2xl font-semibold text-[var(--office-text)]">Settings</h1>
        <p class="text-sm text-[var(--office-text-muted)] mt-1">Manage your admin preferences</p>
    </div>

    <div class="rounded-xl bg-[var(--office-surface)] border border-[var(--office-border)] overflow-hidden">
        <div class="px-4 py-3 border-b border-[var(--office-border)]">
            <h3 class="text-sm font-medium">Admin Settings</h3>
        </div>
        <div class="p-6">
            <div class="space-y-6">
                <div>
                    <h4 class="text-sm font-medium text-[var(--office-text)] mb-2">About</h4>
                    <p class="text-sm text-[var(--office-text-muted)]">
                        VASpeak Admin Portal v1.0
                    </p>
                </div>

                <div class="border-t border-[var(--office-border)] pt-6">
                    <h4 class="text-sm font-medium text-[var(--office-text)] mb-2">Keyboard Shortcuts</h4>
                    <div class="space-y-2 text-sm text-[var(--office-text-muted)]">
                        <div class="flex items-center justify-between">
                            <span>Open command palette</span>
                            <kbd class="px-2 py-1 rounded bg-[var(--office-bg)] text-xs">⌘K</kbd>
                        </div>
                        <div class="flex items-center justify-between">
                            <span>Close dialog</span>
                            <kbd class="px-2 py-1 rounded bg-[var(--office-bg)] text-xs">ESC</kbd>
                        </div>
                    </div>
                </div>

                <div class="border-t border-[var(--office-border)] pt-6">
                    <h4 class="text-sm font-medium text-[var(--office-text)] mb-2">Theme</h4>
                    <p class="text-sm text-[var(--office-text-muted)]">
                        Toggle between light and dark mode using the sun/moon icon in the header.
                    </p>
                </div>
            </div>
        </div>
    </div>
</div>
