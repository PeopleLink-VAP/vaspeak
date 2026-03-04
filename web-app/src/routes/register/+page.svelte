<script lang="ts">
    import { goto } from "$app/navigation";
    import { t } from "$lib/stores/i18n.svelte";
    import LanguageSwitcher from "$lib/components/LanguageSwitcher.svelte";

    let email = $state("");
    let password = $state("");
    let loading = $state(false);
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
                success = t("register_success");
                email = "";
                password = "";
            } else {
                error = data.error || t("register_error_default");
            }
        } catch {
            error = t("register_error_network");
        } finally {
            loading = false;
        }
    }
</script>

<svelte:head>
    <title>{t("page_title_register")} — VASpeak</title>
</svelte:head>

<div
    class="min-h-screen flex items-center justify-center p-4 bg-background relative"
>
    <div class="absolute top-4 right-4"><LanguageSwitcher /></div>
    <div class="card w-full max-w-md space-y-6">
        <h1 class="text-2xl text-center">{t("register_title")}</h1>

        {#if error}
            <div class="alert-error">{error}</div>
        {/if}

        {#if success}
            <div class="alert-success">{success}</div>
        {/if}

        <form onsubmit={handleRegister} class="space-y-4">
            <div>
                <label
                    for="email"
                    class="block text-sm font-medium mb-1 text-navy"
                    >{t("register_label_email")}</label
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
                    class="block text-sm font-medium mb-1 text-navy"
                    >{t("register_label_password")}</label
                >
                <input
                    id="password"
                    type="password"
                    bind:value={password}
                    required
                    minlength={8}
                    class="input-field"
                    placeholder={t("register_password_placeholder")}
                />
            </div>

            <button type="submit" class="btn-primary w-full" disabled={loading}>
                {loading ? t("register_loading") : t("register_btn")}
            </button>
        </form>

        <p class="text-sm text-center text-text-secondary">
            {t("register_have_account")}
            <a href="/login" class="link">{t("register_have_account_link")}</a>
        </p>
        <p class="text-sm text-center text-text-secondary">
            {t("register_onboard")}
            <a
                href="/onboarding"
                class="text-sunflower font-medium hover:underline"
                >{t("register_onboard_link")} →</a
            >
        </p>
        <p class="text-sm text-center text-text-secondary">
            <a href="/" class="link">{t("register_back_home")}</a>
        </p>
    </div>
</div>
