<script lang="ts">
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    let password = $state('');
    let loading = $state(false);
    let error = $state('');
    let theme = $state<'dark' | 'light'>('dark');
    let mounted = $state(false);

    onMount(() => {
        const saved = localStorage.getItem('office-theme') as 'dark' | 'light' | null;
        if (saved) theme = saved;
        mounted = true;
    });

    async function handleSubmit(e: Event) {
        e.preventDefault();
        error = '';
        loading = true;

        try {
            const res = await fetch('/office/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            const data = await res.json();

            if (data.success) {
                goto('/office');
            } else {
                error = data.error || 'Login failed';
            }
        } catch {
            error = 'Network error. Please try again.';
        } finally {
            loading = false;
        }
    }
</script>

<svelte:head>
    <title>Login — Office</title>
</svelte:head>

<div 
    class="min-h-screen flex items-center justify-center px-4 transition-colors duration-300 {mounted ? theme : 'dark'}"
    style:background-color={theme === 'dark' ? '#0a0a0b' : '#fafafa'}
>
    <!-- Background pattern -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none">
        <div class="absolute top-1/4 -left-1/4 w-96 h-96 bg-[#f2a906] opacity-5 rounded-full blur-3xl"></div>
        <div class="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-[#f2a906] opacity-5 rounded-full blur-3xl"></div>
    </div>

    <div class="w-full max-w-sm relative">
        <!-- Logo -->
        <div class="flex justify-center mb-8">
            <div class="w-12 h-12 rounded-xl bg-[#f2a906] flex items-center justify-center">
                <span class="text-xl font-bold" style:color={theme === 'dark' ? '#0a0a0b' : '#0a0a0b'}>V</span>
            </div>
        </div>

        <!-- Card -->
        <div 
            class="rounded-2xl p-6 transition-colors duration-300"
            style:background-color={theme === 'dark' ? '#141415' : '#ffffff'}
            style:border={theme === 'dark' ? '1px solid #27272a' : '1px solid #e4e4e7'}
        >
            <div class="text-center mb-6">
                <h1 
                    class="text-xl font-semibold transition-colors"
                    style:color={theme === 'dark' ? '#fafafa' : '#18181b'}
                >
                    Welcome to Office
                </h1>
                <p 
                    class="text-sm mt-1 transition-colors"
                    style:color={theme === 'dark' ? '#71717a' : '#71717a'}
                >
                    Enter password to continue
                </p>
            </div>

            {#if error}
                <div class="mb-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                </div>
            {/if}

            <form onsubmit={handleSubmit} class="space-y-4">
                <div>
                    <input
                        type="password"
                        bind:value={password}
                        required
                        class="w-full px-4 py-3 rounded-lg transition-colors focus:outline-none"
                        style:background-color={theme === 'dark' ? '#0a0a0b' : '#f4f4f5'}
                        style:border={theme === 'dark' ? '1px solid #27272a' : '1px solid #e4e4e7'}
                        style:color={theme === 'dark' ? '#fafafa' : '#18181b'}
                        placeholder="Password"
                        autocomplete="current-password"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    class="w-full py-3 bg-[#f2a906] font-medium rounded-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    style:color="#0a0a0b"
                >
                    {loading ? 'Verifying...' : 'Continue'}
                </button>
            </form>
        </div>

        <div class="mt-6 text-center">
            <a 
                href="/" 
                class="text-sm transition-colors"
                style:color={theme === 'dark' ? '#71717a' : '#71717a'}
            >
                ← Back to vaspeak.netlify.app
            </a>
        </div>
    </div>
</div>
