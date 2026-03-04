<script lang="ts">
    import LanguageSwitcher from "$lib/components/LanguageSwitcher.svelte";
    let { children } = $props();
</script>

<svelte:head>
    <meta name="theme-color" content="#FFFBF1" />
</svelte:head>

<div class="onboarding-page">
    <div style="position: absolute; top: 1rem; right: 1rem; z-index: 10;">
        <LanguageSwitcher />
    </div>
    {@render children()}
</div>
