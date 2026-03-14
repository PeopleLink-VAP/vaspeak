<script lang="ts">
	import { createAudioRecorder, formatRecordTime, transcribeAudio } from '$lib/audio-recorder';

	let { block, oncomplete }: {
		block: any;
		oncomplete: () => void;
	} = $props();

	let drillingIndex = $state(0);
	let drState: 'idle' | 'recording' | 'processing' = $state('idle');
	let drElapsed     = $state(0);
	let drTranscript  = $state<string | null>(null);
	let drResult      = $state<'pass' | 'fail' | null>(null);
	let drError       = $state('');

	const drRecorder = createAudioRecorder({
		maxDuration: 15,
		onStart:  () => { drState = 'recording'; drElapsed = 0; },
		onTick:   (s) => { drElapsed = s; },
		onStop:   async (blob) => {
			drState = 'processing';
			const target = patterns[drillingIndex]?.target || '';
			const result = await transcribeAudio(blob, target, 'drilling.webm');
			if ('error' in result) {
				drError = result.error;
				drState = 'idle';
				return;
			}
			drTranscript = result.text;
			const targetStr = target.toLowerCase().replace(/[^\w\s]/gi, '').trim();
			const spokenStr = (result.text || '').toLowerCase().replace(/[^\w\s]/gi, '').trim();
			if (targetStr && spokenStr && (spokenStr.includes(targetStr) || targetStr.includes(spokenStr))) {
				drResult = 'pass';
			} else {
				drResult = 'fail';
			}
			drState = 'idle';
		},
		onError:  (msg) => { drError = msg; drState = 'idle'; }
	});

	let patterns = $derived(block.patterns ?? []);
	let pattern  = $derived(patterns[drillingIndex]);

	$effect(() => {
		return () => drRecorder.destroy();
	});

	function nextPattern() {
		drRecorder.destroy();
		if (drillingIndex < patterns.length - 1) {
			drillingIndex++;
			drTranscript = null; drResult = null; drError = ''; drState = 'idle';
		} else {
			oncomplete();
		}
	}
</script>

<p class="text-[#6B6B6B] text-sm mb-5">{block.instruction}</p>

{#if pattern}
	<div class="mb-5">
		<div class="text-xs text-[#A3A3A3] mb-4 uppercase tracking-wider font-medium">
			{drillingIndex + 1} / {patterns.length}
		</div>
		<p class="text-[#6B6B6B] text-sm mb-4"><img src="/icons/i_pin.png" alt="" class="w-4 h-4 inline mr-1" />{pattern.prompt}</p>
		<div class="bg-[#F5F0E6] rounded-xl p-5">
			<p class="font-heading font-semibold text-[#1A1A1A] text-base leading-relaxed">
				"{pattern.target}"
			</p>
		</div>
	</div>
	<div class="flex flex-col gap-2.5">
		{#if drState === 'recording'}
			<button onclick={() => drRecorder.stop()} class="w-full bg-red-500 rounded-lg py-3.5 flex items-center justify-center gap-2 text-white text-sm font-bold active:scale-95 transition-all animate-pulse">
				<img src="/icons/i_stop.png" alt="" class="w-4 h-4" /> Dừng ghi âm · {formatRecordTime(drElapsed)}
			</button>
		{:else if drState === 'processing'}
			<div class="w-full bg-[#F5F0E6] rounded-lg py-3.5 flex items-center justify-center gap-2 text-[#6B6B6B] text-sm">
				<img src="/icons/i_loading.png" alt="" class="w-4 h-4 animate-spin" /> Đang phân tích...
			</div>
		{:else}
			<button onclick={() => { drError = ''; drTranscript = null; drResult = null; drRecorder.start(); }} class="w-full bg-[#FAFAF8] border border-[#E8E8E8] rounded-lg py-3.5 flex items-center justify-center gap-2 text-[#1A1A1A] text-sm font-bold hover:border-[#D4960A] active:scale-95 transition-all">
				<img src="/icons/i_microphone2.png" alt="" class="w-5 h-5" /> Bấm để nói
			</button>
		{/if}

		{#if drTranscript}
			<div class="rounded-xl p-4 border-b border-[#E8E8E8] mt-1">
				<p class="text-xs text-[#A3A3A3] mb-1">Bạn đã nói:</p>
				<p class="text-sm font-medium {drResult === 'pass' ? 'text-[#10B981]' : 'text-red-500'}">"{drTranscript}"</p>
				{#if drResult === 'pass'}
					<p class="text-xs text-[#10B981] mt-2 font-bold"><img src="/icons/i_check.png" alt="" class="w-3 h-3 inline mr-1" />Phát âm ổn áp! Giỏi quá.</p>
				{:else if drResult === 'fail'}
					<p class="text-xs text-red-500 mt-2 font-bold"><img src="/icons/i_close.png" alt="" class="w-3 h-3 inline mr-1" />Có vẻ nghe chưa rõ, thử nói to & rõ hơn xíu nhé!</p>
				{/if}
			</div>
		{/if}
		
		{#if drError}
			<p class="text-xs text-red-500 mt-1 text-center">{drError}</p>
		{/if}
	</div>
{/if}

<!-- Fixed Bottom CTA -->
<div class="fixed bottom-0 left-0 right-0 bg-[#FAFAF8]/90 backdrop-blur-lg border-t border-[#E8E8E8] px-5 py-4">
	<div class="max-w-lg mx-auto">
		<button
			onclick={nextPattern}
			class="w-full py-3.5 rounded-lg font-bold text-sm bg-[#D4960A] text-[#1A1A1A] hover:bg-[#b07d08] active:scale-[0.97] transition-all"
		>
			{drillingIndex < patterns.length - 1 ? `Mẫu tiếp theo (${drillingIndex + 2}/${patterns.length}) →` : 'Hoàn thành block này →'}
		</button>
	</div>
</div>
