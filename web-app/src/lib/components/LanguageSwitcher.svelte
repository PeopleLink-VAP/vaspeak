<script lang="ts">
    import { getLocale, setLocale, type Locale } from "$lib/stores/i18n.svelte";

    const locales: { code: Locale; label: string }[] = [
        { code: "en", label: "EN" },
        { code: "vi", label: "VI" },
    ];
</script>

<div class="locale-switcher" role="group" aria-label="Language">
    {#each locales as loc}
        <button
            class="locale-btn {getLocale() === loc.code
                ? 'locale-btn-active'
                : ''}"
            onclick={() => setLocale(loc.code)}
            aria-pressed={getLocale() === loc.code}
            id="lang-{loc.code}"
        >
            {loc.label}
        </button>
    {/each}
</div>

<style>
    .locale-switcher {
        display: inline-flex;
        align-items: center;
        border: 1px solid color-mix(in srgb, var(--color-navy) 15%, transparent);
        border-radius: 999px;
        overflow: hidden;
    }

    .locale-btn {
        padding: 0.25rem 0.65rem;
        font-size: 0.7rem;
        font-weight: 600;
        letter-spacing: 0.04em;
        cursor: pointer;
        background: transparent;
        border: none;
        color: color-mix(in srgb, var(--color-navy) 50%, transparent);
        transition:
            background 0.15s,
            color 0.15s;
        line-height: 1.5;
    }

    .locale-btn:hover {
        color: var(--color-navy);
    }

    .locale-btn-active {
        background: var(--color-navy);
        color: var(--color-warm-white, #fffdf7);
        border-radius: 999px;
    }
</style>
