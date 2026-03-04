<script lang="ts">
    let email = $state("");
    let loading = $state(false);
    let success = $state("");
    let error = $state("");

    async function handleSubmit(e: Event) {
        e.preventDefault();
        error = "";
        success = "";
        loading = true;

        try {
            const res = await fetch("/api/auth/magic-link", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            success =
                data.message ||
                "If this email exists, a magic link has been sent.";
        } catch {
            error = "Network error. Please try again.";
        } finally {
            loading = false;
        }
    }
</script>

<svelte:head>
    <title>Magic Link — VASpeak</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center p-4 bg-background">
    <div class="card w-full max-w-md space-y-6">
        <h1 class="text-2xl text-center">Magic Link Login</h1>
        <p class="text-sm text-text-secondary text-center">
            No password needed — we'll email you a login link.
        </p>

        {#if error}
            <div class="alert-error">{error}</div>
        {/if}

        {#if success}
            <div class="alert-success">{success}</div>
        {/if}

        <form onsubmit={handleSubmit} class="space-y-4">
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

            <button type="submit" class="btn-primary w-full" disabled={loading}>
                {loading ? "Sending..." : "Send Magic Link"}
            </button>
        </form>

        <p class="text-sm text-center text-text-secondary">
            <a href="/login" class="link">← Back to login</a>
        </p>
    </div>
</div>
