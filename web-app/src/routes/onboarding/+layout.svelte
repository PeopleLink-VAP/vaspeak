<script lang="ts">
    let { children } = $props();
</script>

<svelte:head>
    <meta name="theme-color" content="#FFFBF1" />
</svelte:head>

<div class="onboarding-page">
    {@render children()}
</div>
