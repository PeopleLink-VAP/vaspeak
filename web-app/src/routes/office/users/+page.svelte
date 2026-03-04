<script lang="ts">
    interface User {
        id: number;
        email: string;
        email_verified: boolean;
        role: string;
        createdAt: string;
        created_at: number;
    }

    interface PageData {
        users: User[];
    }

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();

    const verifiedUsers = $derived(data.users.filter((u: User) => u.email_verified));
    const unverifiedUsers = $derived(data.users.filter((u: User) => !u.email_verified));

    function formatDate(iso: string): string {
        return new Date(iso).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
</script>

<svelte:head>
    <title>Users — Office</title>
</svelte:head>

<div class="space-y-6">
    <div>
        <h1 class="text-2xl font-semibold text-[var(--office-text)]">Users</h1>
        <p class="text-sm text-[var(--office-text-muted)] mt-1">Manage registered users</p>
    </div>

    <div class="rounded-xl bg-[var(--office-surface)] border border-[var(--office-border)] overflow-hidden">
        <div class="px-4 py-3 border-b border-[var(--office-border)] flex items-center justify-between">
            <h3 class="text-sm font-medium">All Users</h3>
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
</div>
