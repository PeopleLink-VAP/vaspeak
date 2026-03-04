<script lang="ts">
    import { t } from "$lib/stores/i18n.svelte";
    import LanguageSwitcher from "$lib/components/LanguageSwitcher.svelte";

    let email = $state("");
    let loading = $state(false);
    let success = $state("");
    let error = $state("");

    async function handleSubmit(e: Event) {
        e.preventDefault();
        error = "";
        success = "";
        loading = true;

        try {
            const res = await fetch("/api/auth/magic-link", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            success = data.message || t("magic_success");
        } catch {
            error = t("magic_error_network");
        } finally {
            loading = false;
        }
    }
</script>

<svelte:head>
    <title>{t("page_title_magic")} — VASpeak</title>
</svelte:head>

<div
    class="min-h-screen flex items-center justify-center p-4 bg-background relative"
>
    <div class="absolute top-4 right-4"><LanguageSwitcher /></div>
    <div class="card w-full max-w-md space-y-6">
        <h1 class="text-2xl text-center">{t("magic_title")}</h1>
        <p class="text-sm text-text-secondary text-center">
            {t("magic_subtitle")}
        </p>

        {#if error}
            <div class="alert-error">{error}</div>
        {/if}

        {#if success}
            <div class="alert-success">{success}</div>
        {/if}

        <form onsubmit={handleSubmit} class="space-y-4">
            <div>
                <label
                    for="email"
                    class="block text-sm font-medium mb-1 text-navy"
                    >{t("magic_label_email")}</label
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

            <button type="submit" class="btn-primary w-full" disabled={loading}>
                {loading ? t("magic_loading") : t("magic_btn")}
            </button>
        </form>

        <p class="text-sm text-center text-text-secondary">
            <a href="/login" class="link">{t("magic_back")}</a>
        </p>
    </div>
</div>
