<script lang="ts">
    import { goto } from "$app/navigation";

    let email = $state("");
    let password = $state("");
    let loading = $state(false);
    let error = $state("");
    let success = $state("");

    async function handleRegister(e: Event) {
        e.preventDefault();
        error = "";
        success = "";
        loading = true;

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();

            if (data.success) {
                success =
                    "Registration successful! Check your email to verify your account.";
                email = "";
                password = "";
            } else {
                error = data.error || "Registration failed";
            }
        } catch {
            error = "Network error. Please try again.";
        } finally {
            loading = false;
        }
    }
</script>

<svelte:head>
    <title>Register — VASpeak</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center p-4 bg-background">
    <div class="card w-full max-w-md space-y-6">
        <h1 class="text-2xl text-center">Create Account</h1>

        {#if error}
            <div class="alert-error">{error}</div>
        {/if}

        {#if success}
            <div class="alert-success">{success}</div>
        {/if}

        <form onsubmit={handleRegister} class="space-y-4">
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
                    minlength={8}
                    class="input-field"
                    placeholder="Min 8 chars, uppercase, lowercase, number"
                />
            </div>

            <button type="submit" class="btn-primary w-full" disabled={loading}>
                {loading ? "Creating account..." : "Register"}
            </button>
        </form>

        <p class="text-sm text-center text-text-secondary">
            Already have an account? <a href="/login" class="link">Login</a>
        </p>
        <p class="text-sm text-center text-text-secondary">
            <a href="/" class="link">← Back to home</a>
        </p>
    </div>
</div>
