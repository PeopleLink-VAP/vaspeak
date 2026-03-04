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

    let activeView = $state<'overview' | 'newsletter' | 'users'>('overview');

    const activeSubscribers = $derived(data.subscribers.filter((s: Subscriber) => !s.unsubscribed));
    const unsubscribedCount = $derived(data.subscribers.filter((s: Subscriber) => s.unsubscribed).length);
    const verifiedUsers = $derived(data.users.filter((u: User) => u.email_verified));
    const unverifiedUsers = $derived(data.users.filter((u: User) => !u.email_verified));

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

    const stats = [
        { label: 'Active Subscribers', value: activeSubscribers.length, change: '+12%', positive: true, icon: 'mail' },
        { label: 'Total Users', value: data.users.length, change: '+8%', positive: true, icon: 'users' },
        { label: 'Verified', value: verifiedUsers.length, change: '+5%', positive: true, icon: 'check' },
        { label: 'Pending', value: unverifiedUsers.length, change: '-2%', positive: false, icon: 'clock' },
    ];
</script>

<svelte:head>
    <title>Dashboard — Office</title>
</svelte:head>

<div class="space-y-6">
    <!-- Page header -->
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-2xl font-semibold text-[var(--office-text)]">Dashboard</h1>
            <p class="text-sm text-[var(--office-text-muted)] mt-1">Overview of your VASpeak community</p>
        </div>
        <div class="flex items-center gap-2">
            <button
                class="px-3 py-1.5 rounded-lg text-sm transition-colors {activeView === 'overview' ? 'bg-[var(--office-accent-muted)] text-[var(--office-accent)]' : 'text-[var(--office-text-muted)] hover:text-[var(--office-text)] hover:bg-[var(--office-surface-hover)]'}"
                onclick={() => (activeView = 'overview')}
            >
                Overview
            </button>
            <button
                class="px-3 py-1.5 rounded-lg text-sm transition-colors {activeView === 'newsletter' ? 'bg-[var(--office-accent-muted)] text-[var(--office-accent)]' : 'text-[var(--office-text-muted)] hover:text-[var(--office-text)] hover:bg-[var(--office-surface-hover)]'}"
                onclick={() => (activeView = 'newsletter')}
            >
                Newsletter
            </button>
            <button
                class="px-3 py-1.5 rounded-lg text-sm transition-colors {activeView === 'users' ? 'bg-[var(--office-accent-muted)] text-[var(--office-accent)]' : 'text-[var(--office-text-muted)] hover:text-[var(--office-text)] hover:bg-[var(--office-surface-hover)]'}"
                onclick={() => (activeView = 'users')}
            >
                Users
            </button>
        </div>
    </div>

    {#if activeView === 'overview'}
        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {#each stats as stat}
                <div class="p-4 rounded-xl bg-[var(--office-surface)] border border-[var(--office-border)]">
                    <div class="flex items-start justify-between">
                        <div>
                            <p class="text-sm text-[var(--office-text-muted)]">{stat.label}</p>
                            <p class="text-3xl font-semibold mt-1">{stat.value}</p>
                        </div>
                        <div class="p-2 rounded-lg bg-[var(--office-bg)]">
                            <svg class="w-4 h-4 text-[var(--office-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {#if stat.icon === 'mail'}
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                                {:else if stat.icon === 'users'}
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                                {:else if stat.icon === 'check'}
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                {:else if stat.icon === 'clock'}
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                {/if}
                            </svg>
                        </div>
                    </div>
                    <div class="flex items-center gap-1 mt-3">
                        <span class="text-xs {stat.positive ? 'text-green-400' : 'text-red-400'}">{stat.change}</span>
                        <span class="text-xs text-[var(--office-text-muted)]">vs last week</span>
                    </div>
                </div>
            {/each}
        </div>

        <!-- Recent Activity -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <!-- Recent Subscribers -->
            <div class="rounded-xl bg-[var(--office-surface)] border border-[var(--office-border)] overflow-hidden">
                <div class="px-4 py-3 border-b border-[var(--office-border)]">
                    <h3 class="text-sm font-medium">Recent Subscribers</h3>
                </div>
                <div class="divide-y divide-[var(--office-border)]">
                    {#each activeSubscribers.slice(0, 5) as sub (sub.id)}
                        <div class="px-4 py-3 flex items-center justify-between hover:bg-[var(--office-surface-hover)] transition-colors">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-[var(--office-accent-muted)] flex items-center justify-center">
                                    <span class="text-xs font-medium text-[var(--office-accent)]">{sub.email[0].toUpperCase()}</span>
                                </div>
                                <span class="text-sm">{sub.email}</span>
                            </div>
                            <span class="text-xs text-[var(--office-text-muted)]">{formatDate(sub.subscribedAt)}</span>
                        </div>
                    {:else}
                        <div class="px-4 py-8 text-center text-sm text-[var(--office-text-muted)]">
                            No subscribers yet
                        </div>
                    {/each}
                </div>
            </div>

            <!-- Recent Users -->
            <div class="rounded-xl bg-[var(--office-surface)] border border-[var(--office-border)] overflow-hidden">
                <div class="px-4 py-3 border-b border-[var(--office-border)]">
                    <h3 class="text-sm font-medium">Recent Users</h3>
                </div>
                <div class="divide-y divide-[var(--office-border)]">
                    {#each data.users.slice(0, 5) as user (user.id)}
                        <div class="px-4 py-3 flex items-center justify-between hover:bg-[var(--office-surface-hover)] transition-colors">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-[var(--office-bg)] flex items-center justify-center">
                                    <span class="text-xs font-medium">{user.email[0].toUpperCase()}</span>
                                </div>
                                <div>
                                    <span class="text-sm">{user.email}</span>
                                    {#if !user.email_verified}
                                        <span class="ml-2 text-xs px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400">Pending</span>
                                    {/if}
                                </div>
                            </div>
                            <span class="text-xs text-[var(--office-text-muted)]">{formatDate(user.createdAt)}</span>
                        </div>
                    {:else}
                        <div class="px-4 py-8 text-center text-sm text-[var(--office-text-muted)]">
                            No users yet
                        </div>
                    {/each}
                </div>
            </div>
        </div>
    {:else if activeView === 'newsletter'}
        <!-- Newsletter Table -->
        <div class="rounded-xl bg-[var(--office-surface)] border border-[var(--office-border)] overflow-hidden">
            <div class="px-4 py-3 border-b border-[var(--office-border)] flex items-center justify-between">
                <h3 class="text-sm font-medium">Newsletter Subscribers</h3>
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
    {:else if activeView === 'users'}
        <!-- Users Table -->
        <div class="rounded-xl bg-[var(--office-surface)] border border-[var(--office-border)] overflow-hidden">
            <div class="px-4 py-3 border-b border-[var(--office-border)] flex items-center justify-between">
                <h3 class="text-sm font-medium">Registered Users</h3>
                <span class="text-xs text-[var(--office-text-muted)]">{verifiedUsers.length} verified · {unverifiedUsers.length} pending</span>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead>
                        <tr class="border-b border-[var(--office-border)]">
                            <th class="px-4 py-3 text-left text-xs font-medium text-[var(--office-text-muted)] uppercase tracking-wider">ID</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-[var(--office-text-muted)] uppercase tracking-wider">Email</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-[var(--office-text-muted)] uppercase tracking-wider">Status</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-[var(--office-text-muted)] uppercase tracking-wider">Role</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-[var(--office-text-muted)] uppercase tracking-wider">Created</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-[var(--office-border)]">
                        {#each data.users as user (user.id)}
                            <tr class="hover:bg-[var(--office-surface-hover)] transition-colors">
                                <td class="px-4 py-3 text-sm text-[var(--office-text-muted)] font-mono">{user.id}</td>
                                <td class="px-4 py-3 text-sm">{user.email}</td>
                                <td class="px-4 py-3">
                                    {#if user.email_verified}
                                        <span class="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">Verified</span>
                                    {:else}
                                        <span class="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400">Pending</span>
                                    {/if}
                                </td>
                                <td class="px-4 py-3 text-sm text-[var(--office-text-muted)]">{user.role}</td>
                                <td class="px-4 py-3 text-sm text-[var(--office-text-muted)]">
                                    {formatDate(user.createdAt)}
                                </td>
                            </tr>
                        {:else}
                            <tr>
                                <td colspan="5" class="px-4 py-8 text-center text-sm text-[var(--office-text-muted)]">
                                    No users yet
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>
    {/if}
</div>
