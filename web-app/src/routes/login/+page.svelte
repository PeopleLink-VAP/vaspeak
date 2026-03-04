<script lang="ts">
    import { goto } from "$app/navigation";
    import { t } from "$lib/stores/i18n.svelte";
    import LanguageSwitcher from "$lib/components/LanguageSwitcher.svelte";

    let email = $state("");
    let password = $state("");
    let loading = $state(false);
    let error = $state("");

    async function handleLogin(e: Event) {
        e.preventDefault();
        error = "";
        loading = true;

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();

            if (data.success) {
                goto("/");
            } else {
                error = data.error || t("login_error_default");
            }
        } catch {
            error = t("login_error_network");
        } finally {
            loading = false;
        }
    }
</script>

<svelte:head>
    <title>{t("page_title_login")} — VASpeak</title>
</svelte:head>

<div
    class="min-h-screen flex items-center justify-center p-4 bg-background relative"
>
    <div class="absolute top-4 right-4"><LanguageSwitcher /></div>
    <div class="card w-full max-w-md space-y-6">
        <h1 class="text-2xl text-center">{t("login_title")}</h1>

        {#if error}
            <div class="alert-error">{error}</div>
        {/if}

        <form onsubmit={handleLogin} class="space-y-4">
            <div>
                <label
                    for="email"
                    class="block text-sm font-medium mb-1 text-navy"
                    >{t("login_label_email")}</label
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
                    >{t("login_label_password")}</label
                >
                <input
                    id="password"
                    type="password"
                    bind:value={password}
                    required
                    class="input-field"
                />
            </div>

            <button type="submit" class="btn-primary w-full" disabled={loading}>
                {loading ? t("login_loading") : t("login_btn")}
            </button>
        </form>

        <div class="space-y-2 text-sm text-center text-text-secondary">
            <p>
                <a href="/forgot-password" class="link">{t("login_forgot")}</a>
            </p>
            <p>
                {t("login_no_account")}
                <a href="/onboarding" class="link"
                    >{t("login_no_account_link")}</a
                >
            </p>
            <p><a href="/magic-link" class="link">{t("login_magic")}</a></p>
            <p><a href="/" class="link">{t("login_back_home")}</a></p>
        </div>
    </div>
</div>
