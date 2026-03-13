<script lang="ts">
	import { goto } from '$app/navigation';

	let { data } = $props();
	const { lesson } = data;

	// The 4 blocks from the DB
	const blocks: any[] = lesson.content;
	const blockMeta = [
		{ label: 'Nghe & Giải Mã', icon: '🎧', color: 'bg-blue-50 border-blue-100 text-blue-700' },
		{ label: 'Luyện Mẫu Câu', icon: '💬', color: 'bg-[#F2A906]/10 border-[#F2A906]/30 text-[#1B365D]' },
		{ label: 'Hội Thoại AI', icon: '🎙️', color: 'bg-purple-50 border-purple-100 text-purple-700' },
		{ label: 'Phản Hồi', icon: '⭐', color: 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]' }
	];

	// State
	let currentBlock = $state(0);
	let selectedAnswer = $state<number | null>(null);
	let answered = $state(false);
	let selectedEmotion = $state<number | null>(null);
	let reflectionText = $state('');
	let drillingIndex = $state(0);
	let completedBlocks = $state<Set<number>>(new Set());

	const block = $derived(blocks[currentBlock]);
	const totalBlocks = blocks.length; // should be 4
	const progressPct = $derived(Math.round(((currentBlock) / totalBlocks) * 100));

	function selectAnswer(idx: number) {
		if (answered) return;
		selectedAnswer = idx;
		answered = true;
	}

	function nextBlock() {
		completedBlocks.add(currentBlock);
		if (currentBlock < totalBlocks - 1) {
			currentBlock++;
			selectedAnswer = null;
			answered = false;
			drillingIndex = 0;
		} else {
			// All done — save progress
			saveProgress();
			goto('/dashboard');
		}
	}

	function nextPattern() {
		const patterns = block.patterns ?? [];
		if (drillingIndex < patterns.length - 1) {
			drillingIndex++;
		} else {
			nextBlock();
		}
	}

	async function saveProgress() {
		const blockCompletions: Record<string, boolean> = {};
		for (let i = 0; i < totalBlocks; i++) {
			blockCompletions[`block_${i + 1}`] = completedBlocks.has(i);
		}
		try {
			await fetch('/api/progress', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					lessonId: lesson.id,
					blockCompletions,
					stressLevel: selectedEmotion !== null ? selectedEmotion + 1 : null,
					reflectionNotes: reflectionText || null
				})
			});
		} catch { /* silent — don't block navigation */ }
	}
</script>

<svelte:head>
	<title>Day {lesson.day}: {lesson.title} — VASpeak</title>
</svelte:head>

<div class="min-h-screen bg-[#FFFBF1] flex flex-col max-w-lg mx-auto">

	<!-- Top Bar -->
	<div class="sticky top-0 z-10 bg-[#FFFBF1]/95 backdrop-blur-sm px-4 pt-4 pb-3">
		<div class="flex items-center gap-3">
			<a href="/dashboard" class="text-[#1B365D]/50 hover:text-[#1B365D] transition-colors text-xl leading-none">✕</a>
			<!-- Progress bar -->
			<div class="flex-1 h-2.5 bg-[#1B365D]/10 rounded-full overflow-hidden">
				<div
					class="h-full bg-[#F2A906] rounded-full transition-all duration-500"
					style="width: {progressPct}%"
				></div>
			</div>
			<span class="text-[#1B365D]/50 text-xs font-medium">{currentBlock + 1}/{totalBlocks}</span>
		</div>

		<!-- Block tabs -->
		<div class="flex gap-2 mt-3">
			{#each blockMeta as meta, i}
				<button
					onclick={() => { if (completedBlocks.has(i) || i === currentBlock) currentBlock = i; }}
					class="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium border transition-all
						{i === currentBlock ? 'bg-[#F2A906] border-[#F2A906] text-[#1B365D]' :
						completedBlocks.has(i) ? 'bg-[#10B981]/15 border-[#10B981]/30 text-[#10B981]' :
						'bg-white border-[#1B365D]/10 text-[#1B365D]/40'}"
				>
					{meta.icon}
				</button>
			{/each}
		</div>
	</div>

	<!-- Block Content -->
	<div class="flex-1 px-4 py-2 pb-28">
		{#if block}
			<div class="mb-4">
				<span class="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#1B365D]/50">
					{blockMeta[currentBlock]?.icon} Block {currentBlock + 1} — {blockMeta[currentBlock]?.label}
				</span>
				<h2 class="font-heading font-bold text-[#1B365D] text-xl mt-1 leading-tight">{lesson.title}</h2>
			</div>

			<!-- ===== LISTENING BLOCK ===== -->
			{#if block.type === 'listening'}
				<p class="text-[#1B365D]/65 text-sm mb-5">{block.instruction}</p>

				<!-- Audio card -->
				<div class="bg-white rounded-2xl p-5 shadow-[0_4px_14px_rgba(27,54,93,0.08)] border border-[#1B365D]/8 mb-5">
					<div class="flex items-center gap-3 mb-4">
						<div class="w-12 h-12 rounded-xl bg-[#F2A906]/15 flex items-center justify-center text-2xl">🎧</div>
						<div>
							<p class="font-semibold text-[#1B365D] text-sm">Client Conversation</p>
							<p class="text-[#1B365D]/40 text-xs">Nhấn để nghe</p>
						</div>
					</div>
					<!-- Waveform placeholder -->
					<div class="flex items-center gap-1 h-8 mb-3">
						{#each Array(24) as _, i}
							<div class="flex-1 bg-[#F2A906]/40 rounded-full" style="height: {20 + Math.sin(i * 0.8) * 14}px"></div>
						{/each}
					</div>
					<!-- Script (shown as transcript) -->
					<details class="mt-3">
						<summary class="text-xs text-[#1B365D]/40 cursor-pointer hover:text-[#1B365D]/70">Xem transcript</summary>
						<p class="mt-2 text-[#1B365D]/70 text-sm leading-relaxed italic bg-[#FFFBF1] rounded-xl p-3">
							{block.audio_script}
						</p>
					</details>
				</div>

				<!-- MCQ -->
				<p class="font-heading font-semibold text-[#1B365D] mb-3">{block.question}</p>
				<div class="flex flex-col gap-2.5">
					{#each block.options ?? [] as option, i}
						<button
							onclick={() => selectAnswer(i)}
							class="text-left w-full px-4 py-3.5 rounded-xl border text-sm font-medium transition-all
								{answered && i === block.answer ? 'bg-[#10B981]/10 border-[#10B981] text-[#10B981]' :
								answered && i === selectedAnswer && i !== block.answer ? 'bg-red-50 border-red-300 text-red-500' :
								selectedAnswer === i && !answered ? 'border-[#F2A906] bg-[#F2A906]/10 text-[#1B365D]' :
								'bg-white border-[#1B365D]/12 text-[#1B365D] hover:border-[#F2A906]/50'}"
						>
							<span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#1B365D]/8 text-xs mr-2">
								{String.fromCharCode(65 + i)}
							</span>
							{option}
						</button>
					{/each}
				</div>

			<!-- ===== DRILLING BLOCK ===== -->
			{:else if block.type === 'drilling'}
				<p class="text-[#1B365D]/65 text-sm mb-5">{block.instruction}</p>

				{@const patterns = block.patterns ?? []}
				{@const pattern = patterns[drillingIndex]}
				{#if pattern}
					<div class="bg-white rounded-2xl p-5 shadow-[0_4px_14px_rgba(27,54,93,0.08)] border border-[#1B365D]/8 mb-4">
						<div class="text-xs text-[#1B365D]/40 mb-3 uppercase tracking-wider font-medium">
							{drillingIndex + 1} / {patterns.length}
						</div>
						<p class="text-[#1B365D]/60 text-sm mb-4">📌 {pattern.prompt}</p>
						<div class="bg-[#F2A906]/8 rounded-xl p-4 border border-[#F2A906]/20">
							<p class="font-heading font-semibold text-[#1B365D] text-base leading-relaxed">
								"{pattern.target}"
							</p>
						</div>
					</div>
					<div class="flex gap-2.5">
						<div class="flex-1 bg-white border border-[#1B365D]/12 rounded-xl py-3.5 flex items-center justify-center gap-2 text-[#1B365D]/50 text-sm">
							🎙️ Ghi âm (sắp ra mắt)
						</div>
					</div>
				{/if}

			<!-- ===== ROLEPLAY BLOCK ===== -->
			{:else if block.type === 'roleplay'}
				<p class="text-[#1B365D]/65 text-sm mb-4">{block.instruction}</p>

				<!-- Scenario card -->
				<div class="bg-[#1B365D] text-white rounded-2xl p-4 mb-4">
					<p class="text-xs font-semibold uppercase tracking-wider text-white/50 mb-2">Kịch bản</p>
					<p class="text-sm text-white/85 leading-relaxed">{block.scenario}</p>
				</div>

				<!-- Client persona -->
				<div class="bg-white rounded-2xl p-4 shadow-[0_4px_14px_rgba(27,54,93,0.07)] border border-[#1B365D]/8 mb-4">
					<div class="flex items-center gap-3 mb-3">
						<div class="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-lg">🤖</div>
						<div>
							<p class="font-semibold text-[#1B365D] text-sm">AI Client</p>
							<p class="text-[#1B365D]/40 text-xs">{block.client_persona}</p>
						</div>
					</div>
					<div class="bg-[#FFFBF1] rounded-xl p-3">
						<p class="text-[#1B365D] text-sm leading-relaxed italic">"{block.client_opening}"</p>
					</div>
				</div>

				<!-- Scoring criteria -->
				<div class="bg-white rounded-2xl p-4 shadow-[0_4px_14px_rgba(27,54,93,0.07)] border border-[#1B365D]/8 mb-4">
					<p class="text-xs font-semibold uppercase tracking-wider text-[#1B365D]/50 mb-3">Tiêu chí chấm điểm</p>
					<ul class="space-y-1.5">
						{#each block.scoring_criteria ?? [] as criterion}
							<li class="flex items-start gap-2 text-sm text-[#1B365D]/70">
								<span class="text-[#F2A906] mt-0.5 flex-shrink-0">✓</span>
								{criterion}
							</li>
						{/each}
					</ul>
					{#if block.credit_cost}
						<p class="text-xs text-[#1B365D]/40 mt-3">⚡ Tốn {block.credit_cost} AI credit</p>
					{/if}
				</div>

				<!-- Record button -->
				<div class="bg-white rounded-2xl p-5 shadow-[0_4px_14px_rgba(27,54,93,0.07)] border border-[#1B365D]/8 text-center">
					<div class="w-16 h-16 rounded-full bg-[#F2A906] mx-auto flex items-center justify-center text-3xl mb-3 shadow-lg shadow-[#F2A906]/30">
						🎙️
					</div>
					<p class="text-[#1B365D]/50 text-sm">Chức năng ghi âm AI sắp ra mắt</p>
				</div>

			<!-- ===== REFLECTION BLOCK ===== -->
			{:else if block.type === 'reflection'}
				<p class="font-heading font-semibold text-[#1B365D] text-lg mb-5 leading-snug">{block.instruction}</p>

				<!-- Emoji selection -->
				<div class="flex gap-3 mb-6">
					{#each block.emotion_options ?? [] as emotion, i}
						<button
							onclick={() => selectedEmotion = i}
							class="flex-1 py-4 rounded-2xl border-2 text-center transition-all
								{selectedEmotion === i ? 'border-[#F2A906] bg-[#F2A906]/10' : 'border-[#1B365D]/10 bg-white'}"
						>
							<div class="text-3xl mb-1">{emotion.split(' ')[0]}</div>
							<div class="text-xs text-[#1B365D]/60 font-medium">{emotion.split(' ').slice(1).join(' ')}</div>
						</button>
					{/each}
				</div>

				<!-- Text input -->
				<div class="bg-white rounded-2xl border border-[#1B365D]/10 overflow-hidden mb-4">
					<textarea
						bind:value={reflectionText}
						placeholder={block.text_prompt ?? 'Ghi chú thêm... (tùy chọn)'}
						rows="4"
						class="w-full p-4 text-sm text-[#1B365D] placeholder-[#1B365D]/35 resize-none focus:outline-none"
					></textarea>
				</div>
			{/if}
		{/if}
	</div>

	<!-- Fixed Bottom CTA -->
	<div class="fixed bottom-0 left-0 right-0 bg-[#FFFBF1]/95 backdrop-blur-sm border-t border-[#1B365D]/8 px-4 py-4">
		<div class="max-w-lg mx-auto">
			{#if block?.type === 'listening'}
				<button
					onclick={nextBlock}
					disabled={!answered}
					class="w-full py-3.5 rounded-xl font-bold text-sm transition-all
						{answered
							? 'bg-[#F2A906] text-[#1B365D] shadow-lg shadow-[#F2A906]/25 hover:bg-[#d99506] active:scale-95'
							: 'bg-[#1B365D]/8 text-[#1B365D]/30 cursor-not-allowed'}"
				>
					{answered ? (selectedAnswer === block.answer ? '✓ Đúng rồi! Tiếp tục →' : 'Xem đáp án → Tiếp tục') : 'Chọn đáp án để tiếp tục'}
				</button>
			{:else if block?.type === 'drilling'}
				{@const patterns = block.patterns ?? []}
				<button
					onclick={nextPattern}
					class="w-full py-3.5 rounded-xl font-bold text-sm bg-[#F2A906] text-[#1B365D] shadow-lg shadow-[#F2A906]/25 hover:bg-[#d99506] active:scale-95 transition-all"
				>
					{drillingIndex < patterns.length - 1 ? `Mẫu tiếp theo (${drillingIndex + 2}/${patterns.length}) →` : 'Hoàn thành block này →'}
				</button>
			{:else if block?.type === 'roleplay'}
				<button
					onclick={nextBlock}
					class="w-full py-3.5 rounded-xl font-bold text-sm bg-[#F2A906] text-[#1B365D] shadow-lg shadow-[#F2A906]/25 hover:bg-[#d99506] active:scale-95 transition-all"
				>
					Bỏ qua & tiếp tục → (AI coming soon)
				</button>
			{:else if block?.type === 'reflection'}
				<button
					onclick={nextBlock}
					class="w-full py-3.5 rounded-xl font-bold text-sm bg-[#10B981] text-white shadow-lg shadow-[#10B981]/25 hover:bg-[#0da871] active:scale-95 transition-all"
				>
					🎉 Hoàn thành & nhận phần thưởng →
				</button>
			{/if}
		</div>
	</div>
</div>
