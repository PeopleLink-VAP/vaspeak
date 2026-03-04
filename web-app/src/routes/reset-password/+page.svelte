<script lang="ts">
    import { page } from "$app/state";

    let password = $state("");
    let loading = $state(false);
    let error = $state("");
    let success = $state("");

    function getToken(): string {
        return page.url.searchParams.get("token") || "";
    }

    async function handleSubmit(e: Event) {
        e.preventDefault();
        error = "";
        success = "";
        loading = true;

        const token = getToken();
        if (!token) {
            error = "Missing reset token. Please use the link from your email.";
            loading = false;
            return;
        }

        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });
            const data = await res.json();

            if (data.success) {
                success = "Password reset successfully! You can now login.";
                password = "";
            } else {
                error = data.error || "Reset failed";
            }
        } catch {
            error = "Network error. Please try again.";
        } finally {
            loading = false;
        }
    }
</script>

<svelte:head>
    <title>Reset Password — VASpeak</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center p-4 bg-background">
    <div class="card w-full max-w-md space-y-6">
        <h1 class="text-2xl text-center">Reset Password</h1>

        {#if error}
            <div class="alert-error">{error}</div>
        {/if}

        {#if success}
            <div class="alert-success">
                {success}
                <a href="/login" class="block mt-2 link">Go to login →</a>
            </div>
        {/if}

        {#if !success}
            <form onsubmit={handleSubmit} class="space-y-4">
                <div>
                    <label
                        for="password"
                        class="block text-sm font-medium mb-1 text-navy"
                        >New Password</label
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

                <button
                    type="submit"
                    class="btn-primary w-full"
                    disabled={loading}
                >
                    {loading ? "Resetting..." : "Reset Password"}
                </button>
            </form>
        {/if}
    </div>
</div>
