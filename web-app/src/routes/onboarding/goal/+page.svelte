<script lang="ts">
    import { goto } from "$app/navigation";
    import {
        getOnboardingState,
        setDailyGoal,
        setReminder,
        GOAL_META,
        type DailyGoal,
    } from "$lib/stores/onboarding.svelte";
    import { t } from "$lib/stores/i18n.svelte";

    const onboardingData = getOnboardingState();
    const goals = Object.entries(GOAL_META) as [
        string,
        (typeof GOAL_META)[DailyGoal],
    ][];
</script>

<svelte:head>
    <title>{t("page_title_goal")} — VASpeak</title>
</svelte:head>

<!-- Top bar -->
<div class="onboarding-topbar">
    <button
        class="onboarding-back"
        onclick={() => goto("/onboarding/level")}
        aria-label={t("btn_back")}
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
</div>

<!-- Content -->
<div class="flex-1 fade-in">
    <h1 class="onboarding-heading" id="goal-heading">
        {t("onboarding_goal_title")}
    </h1>
    <p class="onboarding-subtext">{t("onboarding_goal_subtitle")}</p>

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
                <div class="text-xs opacity-70">{t("goal_unit")}</div>
                <div class="text-xs font-medium mt-1">
                    {t(meta.labelKey)}
                </div>
            </button>
        {/each}
    </div>

    <!-- Tip card -->
    <div
        class="bg-sunflower/5 border-l-4 border-sunflower rounded-card p-4 mb-6 fade-in fade-in-delay-3"
    >
        <div class="flex items-start gap-3">
            <span class="text-2xl">💡</span>
            <div>
                <p class="font-semibold text-navy text-sm">
                    {t("goal_tip_title")}
                </p>
                <p class="text-navy/60 text-xs mt-1">
                    {t("goal_tip_body")}
                </p>
            </div>
        </div>
    </div>

    <!-- Reminder toggle -->
    <div
        class="bg-surface rounded-card shadow-subtle p-4 flex items-center justify-between fade-in fade-in-delay-4"
    >
        <div>
            <div class="font-semibold text-navy text-sm">
                {t("goal_reminder_label")}
            </div>
            <div class="text-xs text-navy/50 mt-0.5">
                {onboardingData.reminderTime}
                {t("goal_reminder_time")}
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
            aria-label={t("goal_reminder_label")}
        >
            <div
                class="absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 {onboardingData.reminderEnabled
                    ? 'translate-x-5.5'
                    : 'translate-x-0.5'}"
            ></div>
        </button>
    </div>
</div>

<!-- Continue -->
<div class="pt-4">
    <button
        class="btn-primary w-full"
        onclick={() => goto("/onboarding/how-it-works")}
        id="continue-btn"
    >
        {t("btn_continue")}
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
