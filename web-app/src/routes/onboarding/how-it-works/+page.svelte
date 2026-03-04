<script lang="ts">
    import { goto } from "$app/navigation";
    import { t } from "$lib/stores/i18n.svelte";

    const steps = [
        {
            num: 1,
            emoji: "🎧",
            titleKey: "step_listening_title" as const,
            descKey: "step_listening_desc" as const,
            bg: "bg-navy/5",
        },
        {
            num: 2,
            emoji: "🗣️",
            titleKey: "step_drilling_title" as const,
            descKey: "step_drilling_desc" as const,
            bg: "bg-sunflower/10",
        },
        {
            num: 3,
            emoji: "🤝",
            titleKey: "step_simulation_title" as const,
            descKey: "step_simulation_desc" as const,
            bg: "bg-leaf-green/5",
        },
        {
            num: 4,
            emoji: "📝",
            titleKey: "step_reflection_title" as const,
            descKey: "step_reflection_desc" as const,
            bg: "bg-navy/5",
        },
    ];
</script>

<svelte:head>
    <title>{t("page_title_how")} — VASpeak</title>
</svelte:head>

<!-- Top bar -->
<div class="onboarding-topbar">
    <button
        class="onboarding-back"
        onclick={() => goto("/onboarding/goal")}
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
    <h1 class="onboarding-heading" id="how-heading">
        {t("onboarding_how_title")}
    </h1>
    <p class="onboarding-subtext">{t("onboarding_how_subtitle")}</p>

    <!-- Timeline -->
    <div class="relative space-y-4">
        <div class="timeline-line"></div>

        {#each steps as step, i}
            <div
                class="flex items-start gap-4 relative fade-in fade-in-delay-{i +
                    1}"
            >
                <div class="timeline-dot z-10">{step.num}</div>
                <div class="timeline-card {step.bg}">
                    <div class="flex items-center gap-2 mb-1">
                        <span class="text-lg">{step.emoji}</span>
                        <h3 class="font-bold text-navy text-sm">
                            {t(step.titleKey)}
                        </h3>
                    </div>
                    <p class="text-navy/60 text-xs leading-relaxed">
                        {t(step.descKey)}
                    </p>
                </div>
            </div>
        {/each}
    </div>

    <p
        class="text-center text-navy/50 text-xs italic mt-6 fade-in fade-in-delay-4"
    >
        {t("how_quote")}
    </p>
</div>

<!-- Continue -->
<div class="pt-4">
    <button
        class="btn-primary w-full"
        onclick={() => goto("/onboarding/signup")}
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
    <div class="onboarding-dot"></div>
    <div class="onboarding-dot-active"></div>
    <div class="onboarding-dot"></div>
</div>
