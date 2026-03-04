<script lang="ts">
    interface Subscriber {
        id: number;
        email: string;
        subscribedAt: string;
        subscribed_at: number;
        unsubscribed: boolean;
    }

    interface PageData {
        subscribers: Subscriber[];
    }

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();

    const activeSubscribers = $derived(data.subscribers.filter((s: Subscriber) => !s.unsubscribed));
    const unsubscribedCount = $derived(data.subscribers.filter((s: Subscriber) => s.unsubscribed).length);

    function formatDate(iso: string): string {
        return new Date(iso).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    function formatTime(iso: string): string {
        return new Date(iso).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
</script>

<svelte:head>
    <title>Newsletter — Office</title>
</svelte:head>

<div class="space-y-6">
    <div>
        <h1 class="text-2xl font-semibold text-[var(--office-text)]">Newsletter</h1>
        <p class="text-sm text-[var(--office-text-muted)] mt-1">Manage your newsletter subscribers</p>
    </div>

    <div class="rounded-xl bg-[var(--office-surface)] border border-[var(--office-border)] overflow-hidden">
        <div class="px-4 py-3 border-b border-[var(--office-border)] flex items-center justify-between">
            <h3 class="text-sm font-medium">All Subscribers</h3>
            <span class="text-xs text-[var(--office-text-muted)]">{activeSubscribers.length} active · {unsubscribedCount} unsubscribed</span>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead>
                    <tr class="border-b border-[var(--office-border)]">
                        <th class="px-4 py-3 text-left text-xs font-medium text-[var(--office-text-muted)] uppercase tracking-wider">Email</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-[var(--office-text-muted)] uppercase tracking-wider">Subscribed</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-[var(--office-text-muted)] uppercase tracking-wider">Status</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-[var(--office-border)]">
                    {#each data.subscribers as sub (sub.id)}
                        <tr class="hover:bg-[var(--office-surface-hover)] transition-colors">
                            <td class="px-4 py-3 text-sm">{sub.email}</td>
                            <td class="px-4 py-3 text-sm text-[var(--office-text-muted)]">
                                {formatDate(sub.subscribedAt)} {formatTime(sub.subscribedAt)}
                            </td>
                            <td class="px-4 py-3">
                                {#if sub.unsubscribed}
                                    <span class="text-xs px-2 py-1 rounded-full bg-[var(--office-bg)] text-[var(--office-text-muted)]">Unsubscribed</span>
                                {:else}
                                    <span class="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">Active</span>
                                {/if}
                            </td>
                        </tr>
                    {:else}
                        <tr>
                            <td colspan="3" class="px-4 py-8 text-center text-sm text-[var(--office-text-muted)]">
                                No subscribers yet
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    </div>
</div>
