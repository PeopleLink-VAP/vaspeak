<script lang="ts">
	import AudioPlayer from '$lib/components/AudioPlayer.svelte';

	let { block, oncomplete }: {
		block: any;
		oncomplete: () => void;
	} = $props();

	let selectedAnswer = $state<number | null>(null);
	let answered = $state(false);
	let showConfetti = $state(false);

	// Play a short success sound using Web Audio API
	function playSuccessSound() {
		try {
			const ctx = new AudioContext();
			const times = [0, 0.1, 0.2];
			const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5 chord
			times.forEach((t, i) => {
				const osc = ctx.createOscillator();
				const gain = ctx.createGain();
				osc.connect(gain);
				gain.connect(ctx.destination);
				osc.type = 'sine';
				osc.frequency.value = freqs[i];
				gain.gain.setValueAtTime(0.18, ctx.currentTime + t);
				gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.35);
				osc.start(ctx.currentTime + t);
				osc.stop(ctx.currentTime + t + 0.35);
			});
		} catch { /* silently fail if AudioContext not available */ }
	}

	function selectAnswer(idx: number) {
		if (answered) return;
		selectedAnswer = idx;
		answered = true;
		if (idx === block.answer) {
			playSuccessSound();
			showConfetti = true;
			setTimeout(() => { showConfetti = false; }, 2000);
		}
	}

	let canContinue = $derived(answered);
</script>

<p class="text-[#6B6B6B] text-sm mb-5">{block.instruction}</p>

<!-- Audio Player with attention-grabbing arrow cue -->
<div class="mb-5 relative">
	{#if !answered}
		<div class="absolute -top-5 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce pointer-events-none">
			<svg class="w-4 h-4 text-[#D4960A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
			</svg>
		</div>
	{/if}
	<AudioPlayer text={block.audio_script} title="Client Conversation" subtitle={answered ? 'Nhấn để nghe lại' : 'Nhấn để nghe'} />
</div>

<!-- Transcript -->
<details class="mb-5">
	<summary class="text-xs text-[#A3A3A3] cursor-pointer hover:text-[#6B6B6B] transition-colors">Xem transcript ▾</summary>
	<p class="mt-2 text-[#6B6B6B] text-sm leading-relaxed italic bg-[#F5F0E6] rounded-xl p-3">
		{block.audio_script}
	</p>
</details>

<!-- MCQ -->
<p class="font-heading font-semibold text-[#1A1A1A] mb-4">{block.question}</p>
<div class="flex flex-col gap-0 relative">
	{#each block.options ?? [] as option, i}
		<button
			onclick={() => selectAnswer(i)}
			class="text-left w-full px-0 py-4 border-b border-[#E8E8E8] text-sm font-medium transition-all flex items-center gap-3
				{answered && i === block.answer ? 'text-[#10B981]' :
				answered && i === selectedAnswer && i !== block.answer ? 'text-red-500' :
				selectedAnswer === i && !answered ? 'text-[#D4960A]' :
				'text-[#1A1A1A] hover:text-[#D4960A]'}"
		>
			<span class="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs flex-shrink-0 transition-all
				{answered && i === block.answer ? 'bg-[#10B981]/10 text-[#10B981] scale-110' :
				answered && i === selectedAnswer && i !== block.answer ? 'bg-red-50 text-red-500' :
				'bg-[#1A1A1A]/5 text-[#6B6B6B]'}">
				{#if answered && i === block.answer}<img src="/icons/i_check.png" alt="" class="w-3 h-3" />{:else if answered && i === selectedAnswer && i !== block.answer}<img src="/icons/i_close.png" alt="" class="w-3 h-3" />{:else}{String.fromCharCode(65 + i)}{/if}
			</span>
			{option}
		</button>
	{/each}

	<!-- Confetti burst on correct answer -->
	{#if showConfetti}
		<div class="absolute inset-0 pointer-events-none overflow-hidden rounded" aria-hidden="true">
			{#each Array(14) as _, i}
				<div
					class="absolute w-2 h-2 rounded-full animate-confetti"
					style="
						left: {15 + (i * 5.5) % 70}%;
						top: {20 + (i * 7) % 40}%;
						background: {['#D4960A','#10B981','#6366F1','#F59E0B','#EF4444','#3B82F6'][i % 6]};
						animation-delay: {i * 60}ms;
						animation-duration: {700 + (i % 4) * 150}ms;
					"
				></div>
			{/each}
		</div>
	{/if}
</div>

<!-- Fixed Bottom CTA -->
<div class="fixed bottom-0 left-0 right-0 bg-[#FAFAF8]/90 backdrop-blur-lg border-t border-[#E8E8E8] px-5 py-4">
	<div class="max-w-lg mx-auto">
		{#if !answered}
			<p class="text-center text-xs text-[#A3A3A3] mb-2 flex items-center justify-center gap-1">
				<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M7 11l5-5m0 0l5 5m-5-5v12" />
				</svg>
				Nghe đoạn hội thoại rồi chọn đáp án đúng
			</p>
		{/if}
		<button
			onclick={oncomplete}
			disabled={!answered}
			class="w-full py-3.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2
				{answered
					? 'bg-[#D4960A] text-[#1A1A1A] hover:bg-[#b07d08] active:scale-[0.97]'
					: 'bg-[#E8E8E8] text-[#A3A3A3] cursor-not-allowed'}"
		>
			{#if answered}
				{selectedAnswer === block.answer ? '✓ Đúng rồi! Tiếp tục' : 'Xem đáp án → Tiếp tục'}
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
				</svg>
			{:else}
				Chọn đáp án để tiếp tục
			{/if}
		</button>
	</div>
</div>

<style>
	@keyframes confetti {
		0% { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; }
		100% { transform: translateY(-60px) scale(0.3) rotate(180deg); opacity: 0; }
	}
	.animate-confetti {
		animation: confetti 0.8s ease-out forwards;
	}
</style>
