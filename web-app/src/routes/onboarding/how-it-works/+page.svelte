<script lang="ts">
    import { goto } from "$app/navigation";

    const steps = [
        {
            num: 1,
            emoji: "🎧",
            title: "Listening Decoding",
            description:
                "Listen to real VA scenarios and train your ear for natural English patterns.",
            bg: "bg-navy/5",
        },
        {
            num: 2,
            emoji: "🗣️",
            title: "Pronunciation Drilling",
            description:
                "Practice key phrases with guided repetition and immediate feedback.",
            bg: "bg-sunflower/10",
        },
        {
            num: 3,
            emoji: "🤝",
            title: "Simulation",
            description:
                "Role-play realistic client calls and meetings to build real confidence.",
            bg: "bg-leaf-green/5",
        },
        {
            num: 4,
            emoji: "📝",
            title: "Reflection",
            description:
                "Review your performance and track your confidence growth over time.",
            bg: "bg-navy/5",
        },
    ];
</script>

<svelte:head>
    <title>How It Works — VASpeak</title>
</svelte:head>

<!-- Top bar -->
<div class="onboarding-topbar">
    <button
        class="onboarding-back"
        onclick={() => goto("/onboarding/goal")}
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
        onclick={() => goto("/onboarding/signup")}
        id="skip-btn">Skip</button
    >
</div>

<!-- Content -->
<div class="flex-1 fade-in">
    <h1 class="onboarding-heading" id="how-heading">
        How your daily lesson works
    </h1>
    <p class="onboarding-subtext">
        Each lesson follows a proven 4-step method to build lasting confidence.
    </p>

    <!-- Timeline -->
    <div class="relative space-y-4">
        <!-- Vertical line -->
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
                            {step.title}
                        </h3>
                    </div>
                    <p class="text-navy/60 text-xs leading-relaxed">
                        {step.description}
                    </p>
                </div>
            </div>
        {/each}
    </div>

    <!-- Motivational tagline -->
    <p
        class="text-center text-navy/50 text-xs italic mt-6 fade-in fade-in-delay-4"
    >
        "Confidence isn't something you wait for — it's something you build."
    </p>
</div>

<!-- Continue button -->
<div class="pt-4">
    <button
        class="btn-primary w-full"
        onclick={() => goto("/onboarding/signup")}
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
    <div class="onboarding-dot"></div>
    <div class="onboarding-dot-active"></div>
    <div class="onboarding-dot"></div>
</div>
