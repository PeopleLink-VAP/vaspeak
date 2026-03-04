<script lang="ts">
    import { goto } from "$app/navigation";
    import LoginModal from "$lib/components/LoginModal.svelte";

    let loginModal = $state<ReturnType<typeof LoginModal>>();
</script>

<svelte:head>
    <title>Welcome — VASpeak</title>
    <meta
        name="description"
        content="VASpeak: English speaking confidence trainer for Vietnamese Virtual Assistants. Build your dream VA career."
    />
</svelte:head>

<!-- Hero illustration area -->
<div
    class="flex-1 flex flex-col items-center justify-center text-center fade-in"
>
    <!-- CSS-only abstract illustration -->
    <div class="relative w-56 h-56 mb-8">
        <!-- Outer soft circle -->
        <div class="absolute inset-0 rounded-full bg-sunflower/10"></div>
        <!-- Inner accent circle -->
        <div
            class="absolute inset-6 rounded-full bg-sunflower/20 flex items-center justify-center"
        >
            <div class="absolute inset-6 rounded-full bg-sunflower/30"></div>
        </div>
        <!-- Center icon -->
        <div class="absolute inset-0 flex items-center justify-center">
            <span class="text-6xl">🎤</span>
        </div>
        <!-- Floating accent dots -->
        <div
            class="absolute -top-2 right-4 w-4 h-4 rounded-full bg-navy/20 animate-bounce"
            style="animation-delay: 0.2s;"
        ></div>
        <div
            class="absolute bottom-4 -left-2 w-3 h-3 rounded-full bg-sunflower/50 animate-bounce"
            style="animation-delay: 0.5s;"
        ></div>
        <div
            class="absolute top-8 -right-3 w-2 h-2 rounded-full bg-leaf-green/40 animate-bounce"
            style="animation-delay: 0.8s;"
        ></div>
    </div>

    <h1
        class="text-3xl font-heading font-bold text-navy mb-3"
        id="welcome-heading"
    >
        VASpeak
    </h1>
    <p class="text-navy/70 text-base leading-relaxed max-w-sm mb-2">
        Your English speaking confidence trainer for Virtual Assistants
    </p>
    <p class="text-navy/50 text-sm">
        Build your dream VA career — one conversation at a time.
    </p>
</div>

<!-- Actions -->
<div class="space-y-3 fade-in fade-in-delay-2">
    <button
        id="get-started-btn"
        class="btn-primary w-full text-lg"
        onclick={() => goto("/onboarding/level")}
    >
        Get Started
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

    <p class="text-center text-sm text-navy/60">
        Already have an account?
        <button
            onclick={() => loginModal?.open()}
            class="text-sunflower font-medium hover:underline cursor-pointer"
            >Log in</button
        >
    </p>
</div>

<!-- Dots -->
<div class="onboarding-dots">
    <div class="onboarding-dot-active"></div>
    <div class="onboarding-dot"></div>
    <div class="onboarding-dot"></div>
    <div class="onboarding-dot"></div>
    <div class="onboarding-dot"></div>
</div>

<LoginModal bind:this={loginModal} />
