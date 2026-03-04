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
    <title>Admin Login — VASpeak</title>
</svelte:head>

<div class="min-h-screen bg-background flex items-center justify-center px-4">
    <div class="card max-w-sm w-full">
        <div class="text-center mb-6">
            <div class="text-4xl mb-3">🔐</div>
            <h1 class="text-2xl font-heading font-bold text-navy">Admin Portal</h1>
            <p class="text-sm text-navy/60 mt-1">Enter password to continue</p>
        </div>

        {#if error}
            <div class="alert-error mb-4">{error}</div>
        {/if}

        <form onsubmit={handleSubmit} class="space-y-4">
            <div>
                <label for="password" class="block text-sm font-medium mb-1 text-navy">Password</label>
                <input
                    id="password"
                    type="password"
                    bind:value={password}
                    required
                    class="input-field"
                    placeholder="Enter admin password"
                    autocomplete="current-password"
                />
            </div>

            <button
                type="submit"
                class="btn-primary w-full"
                disabled={loading}
            >
                {loading ? 'Verifying...' : 'Login'}
            </button>
        </form>

        <div class="mt-6 pt-4 border-t border-navy/10 text-center">
            <a href="/" class="text-sm text-navy/60 hover:text-sunflower transition-colors">
                ← Back to site
            </a>
        </div>
    </div>
</div>
