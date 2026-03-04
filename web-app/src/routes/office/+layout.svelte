<script lang="ts">
    import type { LayoutData } from './$types';

    interface Props {
        data: LayoutData;
        children: import('svelte').Snippet;
    }

    let { data, children }: Props = $props();
</script>

<svelte:head>
    <title>Admin Portal — VASpeak</title>
</svelte:head>

{#if data.authenticated}
    <div class="min-h-screen bg-background">
        <nav class="bg-navy text-warm-white px-6 py-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <span class="text-xl font-heading font-bold">VASpeak Admin</span>
                <span class="text-xs bg-sunflower text-navy px-2 py-0.5 rounded">Office</span>
            </div>
            <div class="flex items-center gap-4">
                <a href="/" class="text-warm-white/70 hover:text-sunflower text-sm transition-colors">
                    ← Back to Site
                </a>
                <a href="/office/logout" class="text-warm-white/70 hover:text-sunflower text-sm transition-colors">
                    Logout
                </a>
            </div>
        </nav>
        <main class="p-6">
            {@render children()}
        </main>
    </div>
{:else}
    {@render children()}
{/if}
