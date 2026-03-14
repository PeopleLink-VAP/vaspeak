<script lang="ts">
	import { createTTSPlayer, idleBars, type TTSState } from '$lib/tts-player';

	/** The text to speak */
	let { text, title = 'Audio', subtitle = 'Nhấn để nghe', voice = undefined }: {
		text: string;
		title?: string;
		subtitle?: string;
		voice?: string;
	} = $props();

	let playerState: TTSState = $state('idle');
	let barHeights = $state<number[]>(idleBars());
	let error = $state('');

	const player = createTTSPlayer({
		onStateChange: (s) => { playerState = s; },
		onError: (msg) => { error = msg; },
		onBarsUpdate: (h) => { barHeights = h; }
	});

	function handleClick() {
		error = '';
		player.toggle(text, voice);
	}

	function handleStop(e: MouseEvent) {
		e.stopPropagation();
		player.stop();
	}

	$effect(() => {
		return () => { player.destroy(); };
	});

	function getLabel(s: TTSState): string {
		if (s === 'loading') return 'Đang tạo giọng nói AI...';
		if (s === 'speaking') return 'Đang phát · nhấn để tạm dừng';
		if (s === 'paused') return 'Tạm dừng · nhấn để tiếp tục';
		return subtitle;
	}

	const stateIcons: Record<TTSState, string> = {
		idle: '🎧',
		loading: '⏳',
		speaking: '⏸️',
		paused: '▶️'
	};
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div 
	onclick={handleClick}
	class="audio-player"
	class:audio-player--speaking={playerState === 'speaking'}
	class:audio-player--loading={playerState === 'loading'}
	data-testid="audio-player"
	data-state={playerState}
>
	<div class="audio-player__header">
		<div class="audio-player__icon" class:audio-player__icon--active={playerState === 'speaking'}>
			{stateIcons[playerState]}
		</div>
		<div class="audio-player__info">
			<p class="audio-player__title">{title}</p>
			<p class="audio-player__subtitle">{getLabel(playerState)}</p>
		</div>
		{#if playerState === 'speaking' || playerState === 'paused'}
			<button 
				onclick={handleStop}
				class="audio-player__stop"
				title="Dừng"
				data-testid="audio-player-stop"
			>✕</button>
		{/if}
	</div>

	<!-- Visualizer bars -->
	<div class="vis-container" data-testid="audio-visualizer">
		{#each barHeights as h, i}
			<div 
				class="vis-bar {playerState === 'speaking' ? 'vis-active' : playerState === 'loading' ? 'vis-loading' : playerState === 'paused' ? 'vis-paused' : 'vis-idle'}"
				style="height: {h}px; {playerState === 'loading' ? `animation-delay: ${i * 50}ms` : ''}"
			></div>
		{/each}
	</div>

	{#if error}
		<p class="audio-player__error" data-testid="audio-player-error">⚠️ {error}</p>
	{/if}
</div>

<style>
	.audio-player {
		background: white;
		border-radius: 16px;
		padding: 20px;
		box-shadow: 0 4px 14px rgba(27, 54, 93, 0.08);
		border: 1px solid rgba(27, 54, 93, 0.08);
		cursor: pointer;
		transition: all 0.2s;
	}
	.audio-player:hover {
		box-shadow: 0 6px 20px rgba(27, 54, 93, 0.12);
	}
	.audio-player:active {
		transform: scale(0.98);
	}
	.audio-player--speaking {
		box-shadow: 0 0 0 2px rgba(242, 169, 6, 0.5);
	}
	.audio-player--loading {
		pointer-events: none;
		opacity: 0.85;
	}

	.audio-player__header {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 16px;
	}
	.audio-player__icon {
		width: 48px;
		height: 48px;
		border-radius: 12px;
		background: rgba(242, 169, 6, 0.15);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		transition: background 0.2s;
	}
	.audio-player__icon--active {
		background: rgba(242, 169, 6, 0.25);
	}
	.audio-player__info {
		flex: 1;
	}
	.audio-player__title {
		font-weight: 600;
		color: #1B365D;
		font-size: 0.875rem;
		margin: 0;
	}
	.audio-player__subtitle {
		color: rgba(27, 54, 93, 0.4);
		font-size: 0.75rem;
		margin: 0;
	}
	.audio-player__stop {
		width: 32px;
		height: 32px;
		border-radius: 8px;
		background: #fef2f2;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #f87171;
		border: none;
		cursor: pointer;
		font-size: 0.875rem;
		transition: background 0.15s;
	}
	.audio-player__stop:hover {
		background: #fee2e2;
	}
	.audio-player__error {
		font-size: 0.75rem;
		color: #ef4444;
		margin: 8px 0 0;
	}

	/* Visualizer */
	.vis-container {
		display: flex;
		align-items: flex-end;
		justify-content: center;
		gap: 2px;
		height: 36px;
		padding: 0 2px;
	}
	.vis-bar {
		flex: 1;
		min-width: 3px;
		border-radius: 3px;
		transition: height 0.08s ease-out;
		will-change: height;
	}
	.vis-idle {
		background: rgba(242, 169, 6, 0.3);
		transition: height 0.4s ease;
	}
	.vis-loading {
		background: rgba(242, 169, 6, 0.2);
		animation: vis-shimmer 1.2s ease-in-out infinite;
	}
	.vis-active {
		background: linear-gradient(to top, #F2A906, #f5c342);
		box-shadow: 0 0 4px rgba(242, 169, 6, 0.3);
	}
	.vis-paused {
		background: rgba(242, 169, 6, 0.4);
		transition: height 0.4s ease;
	}

	@keyframes vis-shimmer {
		0%, 100% { transform: scaleY(0.5); opacity: 0.3; }
		50% { transform: scaleY(1.5); opacity: 0.8; }
	}
</style>
