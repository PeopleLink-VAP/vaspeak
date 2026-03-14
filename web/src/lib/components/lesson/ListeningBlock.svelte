<script lang="ts">
	import AudioPlayer from '$lib/components/AudioPlayer.svelte';

	let { block, oncomplete }: {
		block: any;
		oncomplete: () => void;
	} = $props();

	let selectedAnswer = $state<number | null>(null);
	let answered = $state(false);

	function selectAnswer(idx: number) {
		if (answered) return;
		selectedAnswer = idx;
		answered = true;
	}

	let canContinue = $derived(answered);
</script>

<p class="text-[#6B6B6B] text-sm mb-5">{block.instruction}</p>

<div class="mb-5">
	<AudioPlayer text={block.audio_script} title="Client Conversation" />
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
<div class="flex flex-col gap-0">
	{#each block.options ?? [] as option, i}
		<button
			onclick={() => selectAnswer(i)}
			class="text-left w-full px-0 py-4 border-b border-[#E8E8E8] text-sm font-medium transition-all flex items-center gap-3
				{answered && i === block.answer ? 'text-[#10B981]' :
				answered && i === selectedAnswer && i !== block.answer ? 'text-red-500' :
				selectedAnswer === i && !answered ? 'text-[#D4960A]' :
				'text-[#1A1A1A] hover:text-[#D4960A]'}"
		>
			<span class="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs flex-shrink-0
				{answered && i === block.answer ? 'bg-[#10B981]/10 text-[#10B981]' :
				answered && i === selectedAnswer && i !== block.answer ? 'bg-red-50 text-red-500' :
				'bg-[#1A1A1A]/5 text-[#6B6B6B]'}">
				{#if answered && i === block.answer}<img src="/icons/i_check.png" alt="" class="w-3 h-3" />{:else if answered && i === selectedAnswer && i !== block.answer}<img src="/icons/i_close.png" alt="" class="w-3 h-3" />{:else}{String.fromCharCode(65 + i)}{/if}
			</span>
			{option}
		</button>
	{/each}
</div>

<!-- Fixed Bottom CTA -->
<div class="fixed bottom-0 left-0 right-0 bg-[#FAFAF8]/90 backdrop-blur-lg border-t border-[#E8E8E8] px-5 py-4">
	<div class="max-w-lg mx-auto">
		<button
			onclick={oncomplete}
			disabled={!answered}
			class="w-full py-3.5 rounded-lg font-bold text-sm transition-all
				{answered
					? 'bg-[#D4960A] text-[#1A1A1A] hover:bg-[#b07d08] active:scale-[0.97]'
					: 'bg-[#E8E8E8] text-[#A3A3A3] cursor-not-allowed'}"
		>
			{answered ? (selectedAnswer === block.answer ? 'Đúng rồi! Tiếp tục →' : 'Xem đáp án → Tiếp tục') : 'Chọn đáp án để tiếp tục'}
		</button>
	</div>
</div>
