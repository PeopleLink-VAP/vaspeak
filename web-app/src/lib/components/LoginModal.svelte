<script lang="ts">
    import { goto } from "$app/navigation";

    let isOpen = $state(false);
    let mode = $state<"password" | "magic">("password");
    let email = $state("");
    let password = $state("");
    let loading = $state(false);
    let error = $state("");
    let success = $state("");

    export function open() {
        isOpen = true;
        email = "";
        password = "";
        error = "";
        success = "";
        mode = "password";
    }

    export function close() {
        isOpen = false;
    }

    async function handlePasswordLogin(e: Event) {
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
                close();
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

    async function handleMagicLink(e: Event) {
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

            if (data.success) {
                success = "Check your inbox for the magic link!";
            } else {
                error = data.error || "Failed to send magic link";
            }
        } catch {
            error = "Network error. Please try again.";
        } finally {
            loading = false;
        }
    }

    function handleBackdropClick(e: MouseEvent) {
        if (e.target === e.currentTarget) close();
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape") close();
    }
</script>

{#if isOpen}
    <!-- Backdrop -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="fixed inset-0 bg-navy/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 fade-in"
        onclick={handleBackdropClick}
        onkeydown={handleKeydown}
        role="dialog"
        aria-modal="true"
        tabindex="-1"
    >
        <!-- Modal -->
        <div
            class="bg-background rounded-card shadow-elevated w-full max-w-md overflow-hidden"
        >
            <!-- Header -->
            <div class="relative bg-navy px-6 py-8 text-center">
                <button
                    onclick={close}
                    class="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-warm-white cursor-pointer"
                    aria-label="Close"
                >
                    <svg
                        class="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>

                <div
                    class="w-16 h-16 rounded-full bg-sunflower/20 flex items-center justify-center mx-auto mb-4"
                >
                    <span class="text-3xl">🎤</span>
                </div>
                <h2 class="text-xl font-heading font-bold text-warm-white">
                    Welcome back
                </h2>
                <p class="text-warm-white/60 text-sm mt-1">
                    Continue your confidence journey
                </p>
            </div>

            <!-- Content -->
            <div class="p-6">
                <!-- Mode Tabs -->
                <div class="flex gap-2 mb-6">
                    <button
                        class="flex-1 py-2.5 rounded-input text-sm font-medium transition-all cursor-pointer {mode === 'password'
                            ? 'bg-sunflower text-navy'
                            : 'bg-navy/5 text-navy/70 hover:bg-navy/10'}"
                        onclick={() => (mode = 'password')}
                    >
                        Password
                    </button>
                    <button
                        class="flex-1 py-2.5 rounded-input text-sm font-medium transition-all cursor-pointer {mode === 'magic'
                            ? 'bg-sunflower text-navy'
                            : 'bg-navy/5 text-navy/70 hover:bg-navy/10'}"
                        onclick={() => (mode = 'magic')}
                    >
                        Magic Link
                    </button>
                </div>

                {#if error}
                    <div class="alert-error mb-4">{error}</div>
                {/if}

                {#if success}
                    <div class="alert-success mb-4">{success}</div>
                {/if}

                {#if mode === 'password'}
                    <form onsubmit={handlePasswordLogin} class="space-y-4">
                        <div>
                            <label
                                for="login-email"
                                class="block text-sm font-medium text-navy mb-1.5"
                            >
                                Email
                            </label>
                            <input
                                id="login-email"
                                type="email"
                                bind:value={email}
                                required
                                class="input-field"
                                placeholder="you@example.com"
                            />
                        </div>

                        <div>
                            <label
                                for="login-password"
                                class="block text-sm font-medium text-navy mb-1.5"
                            >
                                Password
                            </label>
                            <input
                                id="login-password"
                                type="password"
                                bind:value={password}
                                required
                                class="input-field"
                                placeholder="Your password"
                            />
                        </div>

                        <div class="text-right">
                            <a
                                href="/forgot-password"
                                class="text-sm text-sunflower hover:text-sunflower/80 transition-colors"
                            >
                                Forgot password?
                            </a>
                        </div>

                        <button
                            type="submit"
                            class="btn-primary w-full"
                            disabled={loading}
                        >
                            {loading ? "Signing in..." : "Login"}
                        </button>
                    </form>
                {:else}
                    <form onsubmit={handleMagicLink} class="space-y-4">
                        <div>
                            <label
                                for="magic-email"
                                class="block text-sm font-medium text-navy mb-1.5"
                            >
                                Email
                            </label>
                            <input
                                id="magic-email"
                                type="email"
                                bind:value={email}
                                required
                                class="input-field"
                                placeholder="you@example.com"
                            />
                        </div>

                        <div
                            class="bg-sunflower/5 border border-sunflower/20 rounded-card p-4 flex items-start gap-3"
                        >
                            <span class="text-xl">✨</span>
                            <div>
                                <p class="text-sm font-medium text-navy">
                                    Password-free login
                                </p>
                                <p class="text-xs text-navy/60 mt-0.5">
                                    We'll send you a secure link that logs you in
                                    instantly. No password needed!
                                </p>
                            </div>
                        </div>

                        <button
                            type="submit"
                            class="btn-primary w-full"
                            disabled={loading}
                        >
                            {loading ? "Sending..." : "Send Magic Link"}
                        </button>
                    </form>
                {/if}

                <!-- Footer -->
                <div class="mt-6 pt-5 border-t border-navy/10 text-center">
                    <p class="text-sm text-navy/60">
                        New to VASpeak?
                        <a
                            href="/onboarding"
                            class="text-sunflower font-medium hover:text-sunflower/80 transition-colors"
                        >
                            Start free →
                        </a>
                    </p>
                </div>
            </div>
        </div>
    </div>
{/if}
