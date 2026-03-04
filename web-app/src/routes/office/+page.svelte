<script lang="ts">
    interface Subscriber {
        id: number;
        email: string;
        subscribedAt: string;
        unsubscribed: boolean;
    }

    interface User {
        id: number;
        email: string;
        email_verified: boolean;
        role: string;
        createdAt: string;
        updatedAt: string;
    }

    interface PageData {
        subscribers: Subscriber[];
        users: User[];
    }

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();

    let activeTab = $state<'newsletter' | 'users'>('newsletter');

    const activeSubscribers = $derived(data.subscribers.filter((s: Subscriber) => !s.unsubscribed));
    const unsubscribedCount = $derived(data.subscribers.filter((s: Subscriber) => s.unsubscribed).length);
    const verifiedUsers = $derived(data.users.filter((u: User) => u.email_verified));
    const unverifiedUsers = $derived(data.users.filter((u: User) => !u.email_verified));

    function formatDate(iso: string): string {
        return new Date(iso).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
</script>

<svelte:head>
    <title>Admin Portal — VASpeak</title>
</svelte:head>

<div class="space-y-6">
    <div class="flex items-center justify-between">
        <h1 class="text-3xl font-heading font-bold text-navy">Dashboard</h1>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="card">
            <div class="text-3xl font-bold text-sunflower">{activeSubscribers.length}</div>
            <div class="text-sm text-navy/60">Newsletter Subscribers</div>
        </div>
        <div class="card">
            <div class="text-3xl font-bold text-sunflower">{data.users.length}</div>
            <div class="text-sm text-navy/60">Total Users</div>
        </div>
        <div class="card">
            <div class="text-3xl font-bold text-success">{verifiedUsers.length}</div>
            <div class="text-sm text-navy/60">Verified Users</div>
        </div>
        <div class="card">
            <div class="text-3xl font-bold text-warning">{unverifiedUsers.length}</div>
            <div class="text-sm text-navy/60">Unverified Users</div>
        </div>
    </div>

    <div class="flex gap-2 border-b border-navy/10 pb-2">
        <button
            class="px-4 py-2 font-medium transition-colors {activeTab === 'newsletter'
                ? 'text-sunflower border-b-2 border-sunflower'
                : 'text-navy/60 hover:text-navy'}"
            onclick={() => (activeTab = 'newsletter')}
        >
            Newsletter ({activeSubscribers.length})
        </button>
        <button
            class="px-4 py-2 font-medium transition-colors {activeTab === 'users'
                ? 'text-sunflower border-b-2 border-sunflower'
                : 'text-navy/60 hover:text-navy'}"
            onclick={() => (activeTab = 'users')}
        >
            Users ({data.users.length})
        </button>
    </div>

    {#if activeTab === 'newsletter'}
        <div class="card overflow-hidden p-0">
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-navy/5">
                        <tr>
                            <th class="px-4 py-3 text-left text-sm font-semibold text-navy">Email</th>
                            <th class="px-4 py-3 text-left text-sm font-semibold text-navy">Subscribed At</th>
                            <th class="px-4 py-3 text-left text-sm font-semibold text-navy">Status</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-navy/10">
                        {#each data.subscribers as subscriber (subscriber.id)}
                            <tr class="hover:bg-navy/5">
                                <td class="px-4 py-3 text-sm text-navy">{subscriber.email}</td>
                                <td class="px-4 py-3 text-sm text-navy/70">{formatDate(subscriber.subscribedAt)}</td>
                                <td class="px-4 py-3">
                                    {#if subscriber.unsubscribed}
                                        <span class="text-xs px-2 py-1 rounded bg-navy/10 text-navy/60">Unsubscribed</span>
                                    {:else}
                                        <span class="text-xs px-2 py-1 rounded bg-success/10 text-success">Active</span>
                                    {/if}
                                </td>
                            </tr>
                        {:else}
                            <tr>
                                <td colspan="3" class="px-4 py-8 text-center text-navy/50">
                                    No newsletter subscribers yet
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>
    {:else}
        <div class="card overflow-hidden p-0">
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-navy/5">
                        <tr>
                            <th class="px-4 py-3 text-left text-sm font-semibold text-navy">ID</th>
                            <th class="px-4 py-3 text-left text-sm font-semibold text-navy">Email</th>
                            <th class="px-4 py-3 text-left text-sm font-semibold text-navy">Email Verified</th>
                            <th class="px-4 py-3 text-left text-sm font-semibold text-navy">Role</th>
                            <th class="px-4 py-3 text-left text-sm font-semibold text-navy">Created At</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-navy/10">
                        {#each data.users as user (user.id)}
                            <tr class="hover:bg-navy/5">
                                <td class="px-4 py-3 text-sm text-navy/70 font-mono">{user.id}</td>
                                <td class="px-4 py-3 text-sm text-navy">{user.email}</td>
                                <td class="px-4 py-3">
                                    {#if user.email_verified}
                                        <span class="text-xs px-2 py-1 rounded bg-success/10 text-success">Verified</span>
                                    {:else}
                                        <span class="text-xs px-2 py-1 rounded bg-warning/10 text-warning">Pending</span>
                                    {/if}
                                </td>
                                <td class="px-4 py-3 text-sm text-navy/70">{user.role}</td>
                                <td class="px-4 py-3 text-sm text-navy/70">{formatDate(user.createdAt)}</td>
                            </tr>
                        {:else}
                            <tr>
                                <td colspan="5" class="px-4 py-8 text-center text-navy/50">
                                    No users registered yet
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>
    {/if}
</div>
