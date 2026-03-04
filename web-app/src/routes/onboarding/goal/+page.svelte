<script lang="ts">
    import { goto } from "$app/navigation";
    import {
        getOnboardingState,
        setDailyGoal,
        setReminder,
        GOAL_META,
        type DailyGoal,
    } from "$lib/stores/onboarding";

    const onboardingData = getOnboardingState();
    const goals = Object.entries(GOAL_META) as [
        string,
        (typeof GOAL_META)[DailyGoal],
    ][];
</script>

<svelte:head>
    <title>Daily Goal — VASpeak</title>
</svelte:head>

<!-- Top bar -->
<div class="onboarding-topbar">
    <button
        class="onboarding-back"
        onclick={() => goto("/onboarding/level")}
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
    <button
        class="onboarding-skip"
        onclick={() => goto("/onboarding/how-it-works")}
        id="skip-btn">Skip</button
    >
</div>

<!-- Content -->
<div class="flex-1 fade-in">
    <h1 class="onboarding-heading" id="goal-heading">Set your daily goal</h1>
    <p class="onboarding-subtext">How much time can you commit each day?</p>

    <!-- Goal cards -->
    <div class="flex gap-3 mb-6">
        {#each goals as [minutes, meta], i}
            {@const numMin = Number(minutes) as DailyGoal}
            <button
                class="goal-card {onboardingData.dailyGoal === numMin
                    ? 'goal-card-selected'
                    : ''} fade-in fade-in-delay-{i + 1}"
                onclick={() => setDailyGoal(numMin)}
                id="goal-{minutes}"
                aria-pressed={onboardingData.dailyGoal === numMin}
            >
                <span class="text-2xl mb-1">{meta.emoji}</span>
                <div class="font-bold text-lg">{minutes}</div>
                <div class="text-xs opacity-70">min/day</div>
                <div class="text-xs font-medium mt-1">{meta.label}</div>
            </button>
        {/each}
    </div>

    <!-- Motivational card -->
    <div
        class="bg-sunflower/5 border-l-4 border-sunflower rounded-card p-4 mb-6 fade-in fade-in-delay-3"
    >
        <div class="flex items-start gap-3">
            <span class="text-2xl">💡</span>
            <div>
                <p class="font-semibold text-navy text-sm">
                    Consistency beats intensity
                </p>
                <p class="text-navy/60 text-xs mt-1">
                    Even 5 minutes daily builds confidence faster than
                    occasional long sessions.
                </p>
            </div>
        </div>
    </div>

    <!-- Daily reminder toggle -->
    <div
        class="bg-surface rounded-card shadow-subtle p-4 flex items-center justify-between fade-in fade-in-delay-4"
    >
        <div>
            <div class="font-semibold text-navy text-sm">Daily Reminder</div>
            <div class="text-xs text-navy/50 mt-0.5">
                {onboardingData.reminderTime} every day
            </div>
        </div>
        <button
            class="relative w-12 h-7 rounded-full transition-colors duration-200 cursor-pointer {onboardingData.reminderEnabled
                ? 'bg-sunflower'
                : 'bg-navy/20'}"
            onclick={() => setReminder(!onboardingData.reminderEnabled)}
            role="switch"
            aria-checked={onboardingData.reminderEnabled}
            id="reminder-toggle"
            aria-label="Toggle daily reminder"
        >
            <div
                class="absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 {onboardingData.reminderEnabled
                    ? 'translate-x-5.5'
                    : 'translate-x-0.5'}"
            ></div>
        </button>
    </div>
</div>

<!-- Continue button -->
<div class="pt-4">
    <button
        class="btn-primary w-full"
        onclick={() => goto("/onboarding/how-it-works")}
        id="continue-btn"
    >
        Continue
        <svg
            class="ml-2 w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
        </svg>
    </button>
</div>

<!-- Dots -->
<div class="onboarding-dots">
    <div class="onboarding-dot"></div>
    <div class="onboarding-dot"></div>
    <div class="onboarding-dot-active"></div>
    <div class="onboarding-dot"></div>
    <div class="onboarding-dot"></div>
</div>
