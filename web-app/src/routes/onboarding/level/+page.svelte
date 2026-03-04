<script lang="ts">
    import { goto } from "$app/navigation";
    import {
        getOnboardingState,
        setLevel,
        LEVEL_META,
        type UserLevel,
    } from "$lib/stores/onboarding";

    const state = getOnboardingState();
    const levels = Object.entries(LEVEL_META) as [
        UserLevel,
        (typeof LEVEL_META)[UserLevel],
    ][];

    function selectLevel(level: UserLevel) {
        setLevel(level);
    }
</script>

<svelte:head>
    <title>Your Level — VASpeak</title>
</svelte:head>

<!-- Top bar -->
<div class="onboarding-topbar">
    <button
        class="onboarding-back"
        onclick={() => goto("/onboarding")}
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
        onclick={() => goto("/onboarding/goal")}
        id="skip-btn">Skip</button
    >
</div>

<!-- Content -->
<div class="flex-1 fade-in">
    <h1 class="onboarding-heading" id="level-heading">
        What's your English level?
    </h1>
    <p class="onboarding-subtext">
        This helps us personalize your learning journey.
    </p>

    <div class="space-y-3">
        {#each levels as [key, meta], i}
            <button
                class="selection-card w-full text-left {state.level === key
                    ? 'selection-card-selected'
                    : ''} fade-in fade-in-delay-{i + 1}"
                onclick={() => selectLevel(key)}
                id="level-{key}"
                aria-pressed={state.level === key}
            >
                <span class="text-3xl shrink-0">{meta.emoji}</span>
                <div class="min-w-0">
                    <div class="font-semibold text-navy">{meta.title}</div>
                    <div class="text-sm text-navy/60 mt-0.5">
                        {meta.description}
                    </div>
                </div>
                {#if state.level === key}
                    <svg
                        class="w-5 h-5 text-sunflower shrink-0 ml-auto"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fill-rule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clip-rule="evenodd"
                        />
                    </svg>
                {/if}
            </button>
        {/each}
    </div>
</div>

<!-- Continue button -->
<div class="pt-4 fade-in fade-in-delay-4">
    <button
        class="btn-primary w-full"
        disabled={!state.level}
        onclick={() => goto("/onboarding/goal")}
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
    <div class="onboarding-dot-active"></div>
    <div class="onboarding-dot"></div>
    <div class="onboarding-dot"></div>
    <div class="onboarding-dot"></div>
</div>
