<script lang="ts">
    import { onMount, onDestroy } from 'svelte';

    /**
     * Reusable relative-time display.
     * Automatically ticks and respects the browser's timezone.
     *
     * Usage: <TimeAgo timestamp="2026-03-14T09:00:00Z" />
     */
    let { timestamp, live = true, class: className = '' }: {
        timestamp: string;
        live?: boolean;
        class?: string;
    } = $props();

    let now = $state(Date.now());
    let timer: ReturnType<typeof setInterval> | undefined;

    function format(ts: string, clock: number): string {
        const d = new Date(ts);
        if (isNaN(d.getTime())) return '—';

        const diffMs = clock - d.getTime();
        if (diffMs < 0) return 'just now';

        const seconds = Math.floor(diffMs / 1000);
        if (seconds < 10) return 'just now';
        if (seconds < 60) return `${seconds}s ago`;

        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;

        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ${minutes % 60}m ago`;

        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d ago`;

        // Beyond a week, show the date in the user's locale
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }

    let display = $derived(format(timestamp, now));

    // Full date/time for the tooltip — uses browser locale + timezone automatically
    let fullDate = $derived(() => {
        const d = new Date(timestamp);
        if (isNaN(d.getTime())) return '';
        return d.toLocaleString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    });

    onMount(() => {
        if (live) {
            timer = setInterval(() => { now = Date.now(); }, 15000);
        }
    });

    onDestroy(() => {
        if (timer) clearInterval(timer);
    });
</script>

<time
    datetime={timestamp}
    title={fullDate()}
    class="time-ago {className}"
>
    {display}
</time>

<style>
    .time-ago {
        white-space: nowrap;
    }
</style>
