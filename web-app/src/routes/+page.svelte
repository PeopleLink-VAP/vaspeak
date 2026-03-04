<script lang="ts">
    let user: { email: string } | null = $state(null);
    let newsletterEmail = $state("");
    let newsletterLoading = $state(false);
    let newsletterMsg = $state("");
    let newsletterError = $state("");

    $effect(() => {
        fetch("/api/auth/me")
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (data?.user) user = data.user;
            });
    });

    async function handleLogout() {
        await fetch("/api/auth/logout", { method: "POST" });
        user = null;
    }

    async function handleNewsletterSubscribe(e: Event) {
        e.preventDefault();
        newsletterError = "";
        newsletterMsg = "";
        newsletterLoading = true;

        try {
            const res = await fetch("/api/newsletter/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: newsletterEmail }),
            });
            const data = await res.json();

            if (data.success) {
                newsletterMsg = "Subscribed! Check your inbox.";
                newsletterEmail = "";
            } else {
                newsletterError = data.error || "Subscription failed";
            }
        } catch {
            newsletterError = "Network error. Please try again.";
        } finally {
            newsletterLoading = false;
        }
    }
</script>

<svelte:head>
    <title>VASpeak — English Confidence Trainer for Virtual Assistants</title>
    <meta
        name="description"
        content="Build real English speaking confidence for your VA career. Daily 15-minute lessons designed specifically for Vietnamese Virtual Assistants."
    />
</svelte:head>

<div class="min-h-screen bg-background">
    <!-- ═══════ NAV ═══════ -->
    <nav class="max-w-5xl mx-auto flex items-center justify-between px-6 py-5">
        <a href="/" class="text-xl font-heading font-bold text-navy">
            🎤 VASpeak
        </a>
        <div class="flex items-center gap-4 text-sm">
            {#if user}
                <span class="text-navy/60 hidden sm:inline">{user.email}</span>
                <button
                    onclick={handleLogout}
                    class="text-navy/60 hover:text-navy cursor-pointer transition-colors"
                    >Logout</button
                >
            {:else}
                <a
                    href="/login"
                    class="text-navy/70 hover:text-navy transition-colors"
                    >Login</a
                >
                <a
                    href="/onboarding"
                    class="btn-primary !py-2 !px-5 text-sm"
                    id="nav-cta"
                >
                    Start Free
                </a>
            {/if}
        </div>
    </nav>

    <!-- ═══════ HERO ═══════ -->
    <section class="max-w-5xl mx-auto px-6 pt-12 pb-16 md:pt-20 md:pb-24">
        <div class="max-w-2xl mx-auto text-center fade-in">
            <!-- Eyebrow -->
            <div
                class="inline-flex items-center gap-2 bg-sunflower/10 text-navy/80 text-xs font-medium px-4 py-1.5 rounded-full mb-6"
            >
                <span class="w-2 h-2 bg-sunflower rounded-full animate-pulse"
                ></span>
                Built for Vietnamese Virtual Assistants
            </div>

            <h1
                class="text-4xl md:text-5xl font-heading font-bold text-navy leading-tight mb-5"
                id="hero-heading"
            >
                Speak English with confidence —
                <span class="text-sunflower">one conversation at a time</span>
            </h1>

            <p
                class="text-lg text-navy/70 leading-relaxed mb-8 max-w-xl mx-auto"
            >
                Daily 15-minute lessons that build real speaking confidence
                through listening, drilling, and simulated client conversations.
            </p>

            <!-- CTAs -->
            <div
                class="flex flex-col sm:flex-row items-center justify-center gap-3"
            >
                <a
                    href="/onboarding"
                    class="btn-primary text-lg !px-8 !py-3.5 w-full sm:w-auto"
                    id="hero-cta"
                >
                    Start Your Journey
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
                </a>
                <span class="text-sm text-navy/50"
                    >Free · No credit card needed</span
                >
            </div>
        </div>

        <!-- Social proof -->
        <div
            class="flex flex-wrap items-center justify-center gap-6 mt-12 text-navy/40 text-sm fade-in fade-in-delay-2"
        >
            <span class="font-medium">Designed with</span>
            <span class="flex items-center gap-1.5 text-navy/60 font-semibold">
                <span class="text-lg">🇻🇳</span> Vietnamese VAs in mind
            </span>
            <span class="hidden sm:inline">·</span>
            <span class="flex items-center gap-1.5">
                <span class="text-sunflower">★★★★★</span>
                <span class="text-navy/60 font-medium">50+ daily lessons</span>
            </span>
        </div>
    </section>

    <!-- ═══════ PROBLEM → SOLUTION ═══════ -->
    <section class="bg-white py-16 md:py-20">
        <div class="max-w-5xl mx-auto px-6">
            <div class="max-w-2xl mx-auto text-center mb-12 fade-in">
                <h2 class="text-2xl md:text-3xl mb-4">Sound familiar?</h2>
                <p class="text-navy/60">
                    You know the grammar. You know the vocabulary. But when it's
                    time to speak on a real client call…
                </p>
            </div>

            <div class="grid md:grid-cols-3 gap-6 mb-12">
                <!-- Pain point cards -->
                <div
                    class="bg-crimson/5 rounded-card p-6 border border-crimson/10 fade-in fade-in-delay-1"
                >
                    <span class="text-2xl mb-3 block">😰</span>
                    <h3 class="font-semibold text-navy text-sm mb-2">
                        Freezing on calls
                    </h3>
                    <p class="text-navy/60 text-sm leading-relaxed">
                        You prepare everything, but your mind goes blank when
                        the client actually speaks.
                    </p>
                </div>
                <div
                    class="bg-crimson/5 rounded-card p-6 border border-crimson/10 fade-in fade-in-delay-2"
                >
                    <span class="text-2xl mb-3 block">🔄</span>
                    <h3 class="font-semibold text-navy text-sm mb-2">
                        Repeating the same phrases
                    </h3>
                    <p class="text-navy/60 text-sm leading-relaxed">
                        You rely on safe, simple sentences and wish you could
                        express ideas more naturally.
                    </p>
                </div>
                <div
                    class="bg-crimson/5 rounded-card p-6 border border-crimson/10 fade-in fade-in-delay-3"
                >
                    <span class="text-2xl mb-3 block">📉</span>
                    <h3 class="font-semibold text-navy text-sm mb-2">
                        Missing opportunities
                    </h3>
                    <p class="text-navy/60 text-sm leading-relaxed">
                        Better-paying clients require confident English — and
                        you know you're not there yet.
                    </p>
                </div>
            </div>

            <!-- Transition -->
            <div class="max-w-xl mx-auto text-center fade-in">
                <div
                    class="inline-flex items-center gap-2 bg-sunflower/10 px-4 py-2 rounded-full text-sm text-navy font-medium mb-4"
                >
                    <svg
                        class="w-4 h-4 text-sunflower"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fill-rule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clip-rule="evenodd"
                        />
                    </svg>
                    VASpeak is built exactly for this
                </div>
                <p class="text-navy/60 text-sm">
                    Not grammar drills. Not vocabulary flashcards. Real speaking
                    practice for real VA scenarios.
                </p>
            </div>
        </div>
    </section>

    <!-- ═══════ HOW IT WORKS ═══════ -->
    <section class="py-16 md:py-20">
        <div class="max-w-5xl mx-auto px-6">
            <div class="text-center mb-12 fade-in">
                <h2 class="text-2xl md:text-3xl mb-3">
                    Your daily lesson, in 4 steps
                </h2>
                <p class="text-navy/60 max-w-md mx-auto">
                    Each lesson follows a proven method that builds lasting
                    confidence — not just knowledge.
                </p>
            </div>

            <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div class="text-center fade-in fade-in-delay-1">
                    <div
                        class="w-14 h-14 rounded-full bg-navy/5 flex items-center justify-center mx-auto mb-4"
                    >
                        <span class="text-2xl">🎧</span>
                    </div>
                    <div
                        class="text-xs font-medium text-sunflower uppercase tracking-wider mb-1"
                    >
                        Step 1
                    </div>
                    <h3 class="font-semibold text-navy text-sm mb-1">Listen</h3>
                    <p class="text-navy/60 text-xs leading-relaxed">
                        Hear real VA scenarios and train your ear for natural
                        English.
                    </p>
                </div>
                <div class="text-center fade-in fade-in-delay-2">
                    <div
                        class="w-14 h-14 rounded-full bg-sunflower/10 flex items-center justify-center mx-auto mb-4"
                    >
                        <span class="text-2xl">🗣️</span>
                    </div>
                    <div
                        class="text-xs font-medium text-sunflower uppercase tracking-wider mb-1"
                    >
                        Step 2
                    </div>
                    <h3 class="font-semibold text-navy text-sm mb-1">Drill</h3>
                    <p class="text-navy/60 text-xs leading-relaxed">
                        Repeat key phrases until they feel natural and
                        automatic.
                    </p>
                </div>
                <div class="text-center fade-in fade-in-delay-3">
                    <div
                        class="w-14 h-14 rounded-full bg-leaf-green/10 flex items-center justify-center mx-auto mb-4"
                    >
                        <span class="text-2xl">🤝</span>
                    </div>
                    <div
                        class="text-xs font-medium text-sunflower uppercase tracking-wider mb-1"
                    >
                        Step 3
                    </div>
                    <h3 class="font-semibold text-navy text-sm mb-1">
                        Simulate
                    </h3>
                    <p class="text-navy/60 text-xs leading-relaxed">
                        Role-play real client calls to build muscle memory.
                    </p>
                </div>
                <div class="text-center fade-in fade-in-delay-4">
                    <div
                        class="w-14 h-14 rounded-full bg-navy/5 flex items-center justify-center mx-auto mb-4"
                    >
                        <span class="text-2xl">📝</span>
                    </div>
                    <div
                        class="text-xs font-medium text-sunflower uppercase tracking-wider mb-1"
                    >
                        Step 4
                    </div>
                    <h3 class="font-semibold text-navy text-sm mb-1">
                        Reflect
                    </h3>
                    <p class="text-navy/60 text-xs leading-relaxed">
                        Review your growth and track your confidence over time.
                    </p>
                </div>
            </div>
        </div>
    </section>

    <!-- ═══════ FEATURES ═══════ -->
    <section class="bg-white py-16 md:py-20">
        <div class="max-w-5xl mx-auto px-6">
            <div class="text-center mb-12 fade-in">
                <h2 class="text-2xl md:text-3xl mb-3">
                    Made for your VA journey
                </h2>
                <p class="text-navy/60 max-w-md mx-auto">
                    Every lesson is designed around the situations you actually
                    face as a Virtual Assistant.
                </p>
            </div>

            <div class="grid md:grid-cols-2 gap-6">
                <div
                    class="bg-background rounded-card p-6 flex items-start gap-4 fade-in fade-in-delay-1"
                >
                    <div
                        class="w-10 h-10 rounded-full bg-sunflower/15 flex items-center justify-center shrink-0"
                    >
                        <span class="text-lg">📞</span>
                    </div>
                    <div>
                        <h3 class="font-semibold text-navy text-sm mb-1">
                            Real client scenarios
                        </h3>
                        <p class="text-navy/60 text-sm leading-relaxed">
                            Onboarding calls, status updates, scope changes —
                            the conversations that actually matter.
                        </p>
                    </div>
                </div>
                <div
                    class="bg-background rounded-card p-6 flex items-start gap-4 fade-in fade-in-delay-2"
                >
                    <div
                        class="w-10 h-10 rounded-full bg-sunflower/15 flex items-center justify-center shrink-0"
                    >
                        <span class="text-lg">⏱️</span>
                    </div>
                    <div>
                        <h3 class="font-semibold text-navy text-sm mb-1">
                            Just 15 minutes a day
                        </h3>
                        <p class="text-navy/60 text-sm leading-relaxed">
                            Designed for busy VAs. Short, focused sessions that
                            fit between client tasks.
                        </p>
                    </div>
                </div>
                <div
                    class="bg-background rounded-card p-6 flex items-start gap-4 fade-in fade-in-delay-3"
                >
                    <div
                        class="w-10 h-10 rounded-full bg-sunflower/15 flex items-center justify-center shrink-0"
                    >
                        <span class="text-lg">🇻🇳</span>
                    </div>
                    <div>
                        <h3 class="font-semibold text-navy text-sm mb-1">
                            Built for Vietnamese speakers
                        </h3>
                        <p class="text-navy/60 text-sm leading-relaxed">
                            Targets the specific pronunciation and confidence
                            patterns that Vietnamese VAs struggle with.
                        </p>
                    </div>
                </div>
                <div
                    class="bg-background rounded-card p-6 flex items-start gap-4 fade-in fade-in-delay-4"
                >
                    <div
                        class="w-10 h-10 rounded-full bg-sunflower/15 flex items-center justify-center shrink-0"
                    >
                        <span class="text-lg">📈</span>
                    </div>
                    <div>
                        <h3 class="font-semibold text-navy text-sm mb-1">
                            Track your confidence
                        </h3>
                        <p class="text-navy/60 text-sm leading-relaxed">
                            See your progress grow day by day. Build streaks and
                            unlock new scenarios.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- ═══════ TESTIMONIAL / QUOTE ═══════ -->
    <section class="py-16">
        <div class="max-w-3xl mx-auto px-6 text-center fade-in">
            <div class="bg-surface rounded-card shadow-navy p-8 md:p-12">
                <span class="text-4xl mb-4 block">💬</span>
                <blockquote
                    class="text-lg md:text-xl text-navy/80 leading-relaxed italic mb-6"
                >
                    "Confidence isn't something you wait for — it's something
                    you build, one conversation at a time."
                </blockquote>
                <div class="text-sm text-navy/50">The VASpeak philosophy</div>
            </div>
        </div>
    </section>

    <!-- ═══════ NEWSLETTER ═══════ -->
    <section class="bg-navy py-16">
        <div class="max-w-2xl mx-auto px-6 text-center">
            <h2 class="text-2xl md:text-3xl text-warm-white mb-3">
                Weekly confidence tips
            </h2>
            <p class="text-warm-white/60 text-sm mb-8 max-w-md mx-auto">
                Get practical English tips, new lesson previews, and VA career
                advice delivered every Tuesday.
            </p>

            {#if newsletterError}
                <div
                    class="bg-crimson/20 border border-crimson/40 text-warm-white px-4 py-3 rounded-input text-sm mb-4"
                >
                    {newsletterError}
                </div>
            {/if}
            {#if newsletterMsg}
                <div
                    class="bg-success/20 border border-success/40 text-warm-white px-4 py-3 rounded-input text-sm mb-4"
                >
                    {newsletterMsg}
                </div>
            {/if}

            <form
                onsubmit={handleNewsletterSubscribe}
                class="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
                <input
                    type="email"
                    bind:value={newsletterEmail}
                    required
                    placeholder="your.email@example.com"
                    class="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-input text-warm-white placeholder:text-warm-white/40 focus:outline-none focus:ring-2 focus:ring-sunflower focus:border-sunflower transition-all"
                    id="newsletter-email"
                />
                <button
                    type="submit"
                    class="btn-primary !py-3 !px-6 whitespace-nowrap"
                    disabled={newsletterLoading}
                    id="newsletter-submit"
                >
                    {newsletterLoading ? "..." : "Subscribe"}
                </button>
            </form>

            <p class="text-warm-white/30 text-xs mt-4">
                No spam. Unsubscribe anytime.
            </p>
        </div>
    </section>

    <!-- ═══════ FINAL CTA ═══════ -->
    <section class="py-16 md:py-20">
        <div class="max-w-2xl mx-auto px-6 text-center fade-in">
            <h2 class="text-2xl md:text-3xl mb-4">
                Ready to build confidence?
            </h2>
            <p class="text-navy/60 mb-8 max-w-md mx-auto">
                Set up your personalized learning path in under 2 minutes. Start
                your first lesson today.
            </p>
            <a
                href="/onboarding"
                class="btn-primary text-lg !px-8 !py-3.5 inline-flex"
                id="final-cta"
            >
                Get Started — It's Free
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
            </a>
        </div>
    </section>

    <!-- ═══════ FOOTER ═══════ -->
    <footer class="border-t border-navy/10 py-8">
        <div
            class="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-navy/40"
        >
            <div class="font-heading font-bold text-navy/60">🎤 VASpeak</div>
            <div class="flex items-center gap-4">
                <a href="/login" class="hover:text-navy transition-colors"
                    >Login</a
                >
                <a href="/onboarding" class="hover:text-navy transition-colors"
                    >Get Started</a
                >
            </div>
            <div>
                A <a
                    href="https://virtualassistantpro.vn"
                    class="text-sunflower hover:underline"
                    target="_blank"
                    rel="noopener">Virtual Assistant PRO</a
                > product
            </div>
        </div>
    </footer>
</div>
