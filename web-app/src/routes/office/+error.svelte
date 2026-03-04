<script lang="ts">
    import { page } from '$app/stores';
    import { onMount } from 'svelte';

    onMount(() => {
        const auth = $page.status === 401;
        if (auth) {
            window.location.reload();
        }
    });
</script>

<svelte:head>
    <title>401 Unauthorized — VASpeak</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-background">
    <div class="card text-center max-w-md">
        <div class="text-6xl mb-4">🔐</div>
        <h1 class="text-2xl font-heading font-bold text-navy mb-2">Authentication Required</h1>
        <p class="text-navy/70 mb-4">
            This area is restricted to administrators only.
        </p>
        <p class="text-sm text-navy/50">
            You should be prompted for credentials. If not, 
            <button 
                class="text-sunflower hover:underline"
                onclick={() => window.location.reload()}
            >
                click here to retry
            </button>.
        </p>
    </div>
</div>
