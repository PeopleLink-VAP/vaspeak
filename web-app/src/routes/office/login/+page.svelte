<script lang="ts">
    import { goto } from '$app/navigation';

    let password = $state('');
    let loading = $state(false);
    let error = $state('');

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
    <style>
        .login-page {
            --office-bg: #0a0a0b;
            --office-surface: #141415;
            --office-border: #27272a;
            --office-text: #fafafa;
            --office-text-muted: #71717a;
            --office-accent: #f2a906;
        }
    </style>
</svelte:head>

<div class="login-page min-h-screen bg-[var(--office-bg)] flex items-center justify-center px-4">
    <!-- Background pattern -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none">
        <div class="absolute top-1/4 -left-1/4 w-96 h-96 bg-[var(--office-accent)] opacity-5 rounded-full blur-3xl"></div>
        <div class="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-[var(--office-accent)] opacity-5 rounded-full blur-3xl"></div>
    </div>

    <div class="w-full max-w-sm relative">
        <!-- Logo -->
        <div class="flex justify-center mb-8">
            <div class="w-12 h-12 rounded-xl bg-[var(--office-accent)] flex items-center justify-center">
                <span class="text-xl font-bold text-[var(--office-bg)]">V</span>
            </div>
        </div>

        <!-- Card -->
        <div class="bg-[var(--office-surface)] border border-[var(--office-border)] rounded-2xl p-6">
            <div class="text-center mb-6">
                <h1 class="text-xl font-semibold text-[var(--office-text)]">Welcome to Office</h1>
                <p class="text-sm text-[var(--office-text-muted)] mt-1">Enter password to continue</p>
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
                        class="w-full px-4 py-3 bg-[var(--office-bg)] border border-[var(--office-border)] rounded-lg text-[var(--office-text)] placeholder:text-[var(--office-text-muted)] focus:outline-none focus:border-[var(--office-accent)] transition-colors"
                        placeholder="Password"
                        autocomplete="current-password"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    class="w-full py-3 bg-[var(--office-accent)] text-[var(--office-bg)] font-medium rounded-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {loading ? 'Verifying...' : 'Continue'}
                </button>
            </form>
        </div>

        <div class="mt-6 text-center">
            <a href="/" class="text-sm text-[var(--office-text-muted)] hover:text-[var(--office-text)] transition-colors">
                ← Back to vaspeak.netlify.app
            </a>
        </div>
    </div>
</div>
