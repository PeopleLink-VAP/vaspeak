<script lang="ts">
	let { block, oncomplete }: {
		block: any;
		oncomplete: (emotion: number | null, text: string) => void;
	} = $props();

	let selectedEmotion = $state<number | null>(null);
	let reflectionText  = $state('');
</script>

<p class="font-heading font-semibold text-[#1A1A1A] text-lg mb-5 leading-snug">{block.instruction}</p>

<!-- Emotion selection -->
<div class="flex gap-3 mb-6">
	{#each block.emotion_options ?? [] as emotion, i}
		<button
			onclick={() => selectedEmotion = i}
			class="flex-1 py-4 rounded-xl text-center transition-all
				{selectedEmotion === i ? 'bg-[#D4960A]/10 border border-[#D4960A]' : 'bg-transparent border border-[#E8E8E8]'}"
		>
			<div class="text-3xl mb-1">{emotion.split(' ')[0]}</div>
			<div class="text-xs text-[#6B6B6B] font-medium">{emotion.split(' ').slice(1).join(' ')}</div>
		</button>
	{/each}
</div>

<!-- Text input -->
<div class="mb-4">
	<textarea
		bind:value={reflectionText}
		placeholder={block.text_prompt ?? 'Ghi chú thêm... (tùy chọn)'}
		rows="4"
		class="w-full p-4 text-sm text-[#1A1A1A] placeholder-[#A3A3A3] resize-none focus:outline-none border border-[#E8E8E8] rounded-xl focus:border-[#D4960A] transition-colors bg-transparent"
	></textarea>
</div>

<!-- Fixed Bottom CTA -->
<div class="fixed bottom-0 left-0 right-0 bg-[#FAFAF8]/90 backdrop-blur-lg border-t border-[#E8E8E8] px-5 py-4">
	<div class="max-w-lg mx-auto">
		<button
			onclick={() => oncomplete(selectedEmotion, reflectionText)}
			class="w-full py-3.5 rounded-lg font-bold text-sm bg-[#10B981] text-white hover:bg-[#0da871] active:scale-[0.97] transition-all"
		>
			Hoàn thành & nhận phần thưởng →
		</button>
	</div>
</div>
