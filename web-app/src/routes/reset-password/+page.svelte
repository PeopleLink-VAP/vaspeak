<script lang="ts">
    import { page } from "$app/state";
    import { t } from "$lib/stores/i18n.svelte";
    import LanguageSwitcher from "$lib/components/LanguageSwitcher.svelte";

    let password = $state("");
    let loading = $state(false);
    let error = $state("");
    let success = $state("");

    function getToken(): string {
        return page.url.searchParams.get("token") || "";
    }

    async function handleSubmit(e: Event) {
        e.preventDefault();
        error = "";
        success = "";
        loading = true;

        const token = getToken();
        if (!token) {
            error = t("reset_error_no_token");
            loading = false;
            return;
        }

        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });
            const data = await res.json();

            if (data.success) {
                success = t("reset_success");
                password = "";
            } else {
                error = data.error || t("reset_error_default");
            }
        } catch {
            error = t("reset_error_network");
        } finally {
            loading = false;
        }
    }
</script>

<svelte:head>
    <title>{t("page_title_reset")} — VASpeak</title>
</svelte:head>

<div
    class="min-h-screen flex items-center justify-center p-4 bg-background relative"
>
    <div class="absolute top-4 right-4"><LanguageSwitcher /></div>
    <div class="card w-full max-w-md space-y-6">
        <h1 class="text-2xl text-center">{t("reset_title")}</h1>

        {#if error}
            <div class="alert-error">{error}</div>
        {/if}

        {#if success}
            <div class="alert-success">
                {success}
                <a href="/login" class="block mt-2 link"
                    >{t("reset_success_link")}</a
                >
            </div>
        {/if}

        {#if !success}
            <form onsubmit={handleSubmit} class="space-y-4">
                <div>
                    <label
                        for="password"
                        class="block text-sm font-medium mb-1 text-navy"
                        >{t("reset_label_password")}</label
                    >
                    <input
                        id="password"
                        type="password"
                        bind:value={password}
                        required
                        minlength={8}
                        class="input-field"
                        placeholder={t("reset_password_placeholder")}
                    />
                </div>

                <button
                    type="submit"
                    class="btn-primary w-full"
                    disabled={loading}
                >
                    {loading ? t("reset_loading") : t("reset_btn")}
                </button>
            </form>
        {/if}
    </div>
</div>
