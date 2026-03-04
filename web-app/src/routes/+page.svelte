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
    <title>VASpeak — English Confidence Trainer</title>
</svelte:head>

<div class="min-h-screen p-8 max-w-4xl mx-auto space-y-12">
    <!-- Nav -->
    <nav class="flex items-center justify-between">
        <a href="/" class="text-xl font-heading font-bold text-navy">VASpeak</a>
        <div class="flex items-center gap-4 text-sm">
            {#if user}
                <span class="text-text-secondary">{user.email}</span>
                <button onclick={handleLogout} class="link cursor-pointer"
                    >Logout</button
                >
            {:else}
                <a href="/login" class="link">Login</a>
                <a href="/register" class="btn-primary !py-1.5 !px-4 text-sm"
                    >Register</a
                >
            {/if}
        </div>
    </nav>

    <header class="space-y-4">
        <h1 class="text-4xl">VASpeak</h1>
        <p class="text-text-secondary text-lg">
            Your English speaking confidence trainer for Virtual Assistants.
        </p>
    </header>

    <section class="grid gap-6 md:grid-cols-2">
        <div class="card space-y-4">
            <h2 class="text-2xl">Today's Mission</h2>
            <p class="text-text-secondary">
                Ready to build some confidence? Let's start with your daily
                training.
            </p>
            <button class="btn-primary w-full">
                Start Lesson
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
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                </svg>
            </button>
        </div>

        <section class="card space-y-4">
            <h2 class="text-2xl">Your Progress</h2>
            <div class="flex items-center space-x-2">
                <span class="text-3xl font-bold text-sunflower">7</span>
                <span class="text-text-secondary">Day Streak</span>
            </div>
            <div class="w-full bg-muted rounded-full h-2.5">
                <div
                    class="bg-success h-2.5 rounded-full"
                    style="width: 45%"
                ></div>
            </div>
            <p class="text-sm text-text-secondary">
                45% of the confidence program completed
            </p>
        </section>
    </section>

    <section class="space-y-6">
        <h2 class="text-2xl">Current Progress</h2>
        <div class="card overflow-hidden !p-0">
            <table class="w-full text-left">
                <thead class="bg-muted text-muted-foreground text-sm uppercase">
                    <tr>
                        <th class="px-6 py-3 font-semibold">Lesson</th>
                        <th class="px-6 py-3 font-semibold">Status</th>
                        <th class="px-6 py-3 font-semibold">Score</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-muted">
                    <tr>
                        <td class="px-6 py-4 text-text-secondary"
                            >Day 1: Introduction to Client Calls</td
                        >
                        <td class="px-6 py-4 text-success font-semibold"
                            >Completed</td
                        >
                        <td class="px-6 py-4 font-semibold">85/100</td>
                    </tr>
                    <tr>
                        <td class="px-6 py-4 text-text-secondary"
                            >Day 2: Active Listening Techniques</td
                        >
                        <td class="px-6 py-4 text-sunflower font-semibold"
                            >In Progress</td
                        >
                        <td class="px-6 py-4 text-text-secondary">—</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </section>

    <!-- Newsletter -->
    <section class="card space-y-4">
        <h2 class="text-2xl">Newsletter</h2>
        <p class="text-text-secondary text-sm">
            Get weekly tips and updates on improving your English confidence.
        </p>

        {#if newsletterError}
            <div class="alert-error">{newsletterError}</div>
        {/if}
        {#if newsletterMsg}
            <div class="alert-success">{newsletterMsg}</div>
        {/if}

        <form onsubmit={handleNewsletterSubscribe} class="flex gap-2">
            <input
                type="email"
                bind:value={newsletterEmail}
                required
                placeholder="you@example.com"
                class="input-field flex-1"
            />
            <button
                type="submit"
                class="btn-primary !px-6"
                disabled={newsletterLoading}
            >
                {newsletterLoading ? "..." : "Subscribe"}
            </button>
        </form>
    </section>
</div>
