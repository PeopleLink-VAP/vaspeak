<script lang="ts">
    import { goto } from "$app/navigation";
    import {
        getOnboardingState,
        clearOnboarding,
        LEVEL_META,
        GOAL_META,
    } from "$lib/stores/onboarding";

    const onboardingData = getOnboardingState();

    let email = $state("");
    let password = $state("");
    let loading = $state(false);
    let magicLoading = $state(false);
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
                success = "Account created! Check your email to verify.";
                clearOnboarding();
                setTimeout(() => goto("/"), 2000);
            } else {
                error = data.error || "Registration failed";
            }
        } catch {
            error = "Network error. Please try again.";
        } finally {
            loading = false;
        }
    }

    async function handleMagicLink() {
        if (!email) {
            error = "Please enter your email first.";
            return;
        }
        error = "";
        success = "";
        magicLoading = true;

        try {
            const res = await fetch("/api/auth/magic-link", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            success = data.message || "Magic link sent! Check your inbox.";
            clearOnboarding();
        } catch {
            error = "Network error. Please try again.";
        } finally {
            magicLoading = false;
        }
    }
</script>

<svelte:head>
    <title>Create Account — VASpeak</title>
</svelte:head>

<!-- Top bar -->
<div class="onboarding-topbar">
    <button
        class="onboarding-back"
        onclick={() => goto("/onboarding/how-it-works")}
        aria-label="Go back"
        id="back-btn"
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
                d="M15 19l-7-7 7-7"
            />
        </svg>
    </button>
    <div></div>
</div>

<!-- Content -->
<div class="flex-1 fade-in">
    <h1 class="onboarding-heading" id="signup-heading">You're all set! 🎉</h1>
    <p class="onboarding-subtext">
        Create your account to start building confidence.
    </p>

    <!-- Preference summary card -->
    <div
        class="bg-navy rounded-card p-4 mb-6 text-warm-white fade-in fade-in-delay-1"
        id="summary-card"
    >
        <h3
            class="text-xs font-medium text-warm-white/60 uppercase tracking-wider mb-3"
        >
            Your Setup
        </h3>
        <div class="space-y-2 text-sm">
            <div class="flex justify-between">
                <span class="text-warm-white/70">Level</span>
                <span class="font-medium">
                    {onboardingData.level
                        ? `${LEVEL_META[onboardingData.level].emoji} ${LEVEL_META[onboardingData.level].title}`
                        : "Not set"}
                </span>
            </div>
            <div class="flex justify-between">
                <span class="text-warm-white/70">Daily Goal</span>
                <span class="font-medium"
                    >{GOAL_META[onboardingData.dailyGoal].emoji}
                    {onboardingData.dailyGoal} min/day</span
                >
            </div>
            <div class="flex justify-between">
                <span class="text-warm-white/70">Reminders</span>
                <span class="font-medium"
                    >{onboardingData.reminderEnabled
                        ? `✅ ${onboardingData.reminderTime}`
                        : "❌ Off"}</span
                >
            </div>
        </div>
    </div>

    <!-- Alerts -->
    {#if error}
        <div class="alert-error mb-4" id="signup-error">{error}</div>
    {/if}
    {#if success}
        <div class="alert-success mb-4" id="signup-success">{success}</div>
    {/if}

    <!-- Registration form -->
    <form onsubmit={handleRegister} class="space-y-4 fade-in fade-in-delay-2">
        <div>
            <label for="email" class="block text-sm font-medium mb-1 text-navy"
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
                class="block text-sm font-medium mb-1 text-navy">Password</label
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
            <p class="text-xs text-navy/50 mt-1">
                Must contain uppercase, lowercase, and a number.
            </p>
        </div>

        <button
            type="submit"
            class="btn-primary w-full"
            disabled={loading}
            id="create-account-btn"
        >
            {loading ? "Creating account..." : "Create Account"}
        </button>
    </form>

    <!-- Divider -->
    <div class="flex items-center gap-3 my-4 fade-in fade-in-delay-3">
        <div class="flex-1 h-px bg-navy/10"></div>
        <span class="text-xs text-navy/40">or</span>
        <div class="flex-1 h-px bg-navy/10"></div>
    </div>

    <!-- Magic link -->
    <button
        class="btn-secondary w-full fade-in fade-in-delay-3"
        onclick={handleMagicLink}
        disabled={magicLoading}
        id="magic-link-btn"
    >
        {magicLoading ? "Sending..." : "Continue with Magic Link ✨"}
    </button>

    <!-- Terms -->
    <p class="text-xs text-navy/50 text-center mt-4 fade-in fade-in-delay-4">
        By signing up, you agree to our Terms of Service and Privacy Policy.
    </p>

    <!-- Login link -->
    <p class="text-sm text-center text-navy/60 mt-2">
        Already have an account?
        <a href="/login" class="text-sunflower font-medium hover:underline"
            >Log in</a
        >
    </p>
</div>

<!-- Dots (all active = completion) -->
<div class="onboarding-dots">
    <div class="onboarding-dot-active"></div>
    <div class="onboarding-dot-active"></div>
    <div class="onboarding-dot-active"></div>
    <div class="onboarding-dot-active"></div>
    <div class="onboarding-dot-active"></div>
</div>
