<script lang="ts">
    import { goto } from "$app/navigation";

    let email = $state("");
    let password = $state("");
    let loading = $state(false);
    let error = $state("");

    async function handleLogin(e: Event) {
        e.preventDefault();
        error = "";
        loading = true;

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();

            if (data.success) {
                goto("/");
            } else {
                error = data.error || "Login failed";
            }
        } catch {
            error = "Network error. Please try again.";
        } finally {
            loading = false;
        }
    }
</script>

<svelte:head>
    <title>Login — VASpeak</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center p-4 bg-background">
    <div class="card w-full max-w-md space-y-6">
        <h1 class="text-2xl text-center">Login</h1>

        {#if error}
            <div class="alert-error">{error}</div>
        {/if}

        <form onsubmit={handleLogin} class="space-y-4">
            <div>
                <label
                    for="email"
                    class="block text-sm font-medium mb-1 text-navy"
                    >Email</label
                >
                <input
                    id="email"
                    type="email"
                    bind:value={email}
                    required
                    class="input-field"
                    placeholder="you@example.com"
                />
            </div>

            <div>
                <label
                    for="password"
                    class="block text-sm font-medium mb-1 text-navy"
                    >Password</label
                >
                <input
                    id="password"
                    type="password"
                    bind:value={password}
                    required
                    class="input-field"
                    placeholder="Your password"
                />
            </div>

            <button type="submit" class="btn-primary w-full" disabled={loading}>
                {loading ? "Signing in..." : "Login"}
            </button>
        </form>

        <div class="space-y-2 text-sm text-center text-text-secondary">
            <p><a href="/forgot-password" class="link">Forgot password?</a></p>
            <p>
                Don't have an account? <a href="/onboarding" class="link"
                    >Get Started</a
                >
            </p>
            <p><a href="/magic-link" class="link">Login with magic link</a></p>
            <p><a href="/" class="link">← Back to home</a></p>
        </div>
    </div>
</div>
