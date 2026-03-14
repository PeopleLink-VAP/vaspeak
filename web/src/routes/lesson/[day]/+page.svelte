<script lang="ts">
	import { goto } from '$app/navigation';
	import ListeningBlock from '$lib/components/lesson/ListeningBlock.svelte';
	import DrillingBlock from '$lib/components/lesson/DrillingBlock.svelte';
	import RoleplayBlock from '$lib/components/lesson/RoleplayBlock.svelte';
	import ReflectionBlock from '$lib/components/lesson/ReflectionBlock.svelte';

	let { data } = $props();
	let lesson = $derived(data.lesson);
	let blocks = $derived(lesson.content as any[]);
	const blockMeta = [
		{ label: 'Nghe & Giải Mã', icon: '/icons/i_listen.png' },
		{ label: 'Luyện Mẫu Câu', icon: '/icons/i_speaking.png' },
		{ label: 'Hội Thoại AI',   icon: '/icons/i_microphone.png' },
		{ label: 'Phản Hồi',       icon: '/icons/i_writing.png' }
	];

	// ── Core state ────────────────────────────────────────────────────
	let currentBlock    = $state(0);
	let completedBlocks = $state<Set<number>>(new Set());

	let block       = $derived(blocks[currentBlock]);
	let totalBlocks = $derived(blocks.length);
	let progressPct = $derived(Math.round((currentBlock / totalBlocks) * 100));

	// ── Collected progress data ───────────────────────────────────────
	let roleplayScore = $state<any>(null);
	let stressLevel = $state<number | null>(null);
	let reflectionNotes = $state<string | null>(null);

	// ── Rewards state ──────────────────────────────────────────────
	let rewardToast = $state<{ streakBonus?: { credits: number; message: string }; newMilestones?: Array<{ id: string; label: string; icon: string; credits: number }> } | null>(null);
	let showingRewards = $state(false);

	function handleRoleplayComplete(score: any) {
		roleplayScore = score;
		nextBlock();
	}

	function handleReflectionComplete(emotion: number | null, text: string) {
		stressLevel = emotion !== null ? emotion + 1 : null;
		reflectionNotes = text || null;
		nextBlock();
	}

	function nextBlock() {
		completedBlocks.add(currentBlock);
		if (currentBlock < totalBlocks - 1) {
			currentBlock++;
		} else {
			saveProgress();
		}
	}

	async function saveProgress() {
		const blockCompletions: Record<string, boolean> = {};
		for (let i = 0; i < totalBlocks; i++) blockCompletions[`block_${i + 1}`] = completedBlocks.has(i);
		try {
			const res = await fetch('/api/progress', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					lessonId:        lesson.id,
					blockCompletions,
					simulationScores: roleplayScore ? { roleplay: roleplayScore } : undefined,
					stressLevel,
					reflectionNotes
				})
			});
			const json = await res.json();
			if (json.rewards && (json.rewards.streakBonus || json.rewards.newMilestones?.length)) {
				rewardToast = json.rewards;
				showingRewards = true;
				setTimeout(() => { goto('/dashboard'); }, 4000);
				return;
			}
		} catch { /* silent */ }
		goto('/dashboard');
	}
</script>

<svelte:head>
	<title>Day {lesson.day}: {lesson.title} — VASpeak</title>
</svelte:head>

<div class="min-h-screen bg-[#FAFAF8] flex flex-col max-w-lg mx-auto">

	<!-- Top Bar -->
	<div class="sticky top-0 z-10 bg-[#FAFAF8]/90 backdrop-blur-lg px-5 pt-4 pb-3">
		<div class="flex items-center gap-3">
			<a href="/dashboard" class="text-[#A3A3A3] hover:text-[#1A1A1A] transition-colors text-lg leading-none">✕</a>
			<div class="flex-1 h-1.5 bg-[#E8E8E8] rounded-full overflow-hidden">
				<div
					class="h-full bg-[#D4960A] rounded-full transition-all duration-500"
					style="width: {progressPct}%"
				></div>
			</div>
			<span class="text-[#A3A3A3] text-xs font-medium">{currentBlock + 1}/{totalBlocks}</span>
		</div>

		<!-- Block tabs -->
		<div class="flex gap-2 mt-3">
			{#each blockMeta as meta, i}
				<button
					onclick={() => { if (completedBlocks.has(i) || i === currentBlock) currentBlock = i; }}
					class="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium transition-all
						{i === currentBlock ? 'bg-[#D4960A]/15' :
						completedBlocks.has(i) ? 'bg-[#10B981]/10' :
						'bg-transparent'}"
				>
					<img src={meta.icon} alt={meta.label} class="w-5 h-5 {i === currentBlock ? 'opacity-100' : completedBlocks.has(i) ? 'opacity-60' : 'opacity-25'}" />
				</button>
			{/each}
		</div>
	</div>

	<!-- Block Content -->
	<div class="flex-1 px-5 py-2 pb-28">
		{#if block}
			<div class="mb-5">
				<span class="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#D4960A]">
					<img src={blockMeta[currentBlock]?.icon} alt="" class="w-4 h-4" /> Block {currentBlock + 1} — {blockMeta[currentBlock]?.label}
				</span>
				<h2 class="font-heading font-bold text-[#1A1A1A] text-xl mt-1 leading-tight tracking-tight">{lesson.title}</h2>
			</div>

			<!-- Component rendering based on block type -->
			{#if block.type === 'listening'}
				<ListeningBlock {block} oncomplete={nextBlock} />
			{:else if block.type === 'drilling'}
				<DrillingBlock {block} oncomplete={nextBlock} />
			{:else if block.type === 'roleplay'}
				<RoleplayBlock {block} oncomplete={handleRoleplayComplete} />
			{:else if block.type === 'reflection'}
				<ReflectionBlock {block} oncomplete={handleReflectionComplete} />
			{/if}
		{/if}
	</div>
</div>

<!-- Reward celebration overlay -->
{#if showingRewards && rewardToast}
	<div class="fixed inset-0 z-50 bg-[#1A1A1A]/70 backdrop-blur-sm flex items-center justify-center p-6" style="animation: fadeIn 0.3s ease-out" data-testid="reward-overlay">
		<div class="bg-white rounded-2xl p-6 max-w-sm w-full text-center" style="animation: scaleIn 0.4s ease-out">
			<div class="text-5xl mb-4">🎉</div>
			<h2 class="font-heading font-bold text-[#1A1A1A] text-xl mb-2">Bài học hoàn thành!</h2>

			{#if rewardToast.streakBonus}
				<div class="bg-[#D4960A]/10 rounded-xl p-4 mb-3" style="animation: slideUp 0.5s ease-out 0.2s both">
					<div class="text-2xl mb-1">🔥 +{rewardToast.streakBonus.credits} credits</div>
					<p class="text-sm text-[#6B6B6B]">{rewardToast.streakBonus.message}</p>
				</div>
			{/if}

			{#if rewardToast.newMilestones?.length}
				{#each rewardToast.newMilestones as m, i}
					<div class="bg-[#F3EFFF] rounded-xl p-4 mb-2" style="animation: slideUp 0.5s ease-out {0.4 + i * 0.15}s both">
						<div class="flex items-center justify-center gap-2 mb-1">
							<span class="text-2xl">{m.icon}</span>
							<span class="font-bold text-[#1A1A1A]">{m.label}</span>
						</div>
						{#if m.credits > 0}
							<p class="text-sm text-[#D4960A] font-medium">+{m.credits} credits thưởng!</p>
						{/if}
					</div>
				{/each}
			{/if}

			<p class="text-xs text-[#A3A3A3] mt-4">Đang chuyển về trang chủ...</p>
		</div>
	</div>
{/if}
