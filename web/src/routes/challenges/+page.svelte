<script lang="ts">
	import BottomNav from '$lib/components/BottomNav.svelte';

	let { data } = $props();
	const credits = $derived(data.credits);
	const streak = $derived(data.streak);

	const dailyChallenges = [
		{ id: 'daily_lesson', title: 'Hoàn thành bài học hôm nay', reward: 1, icon: '/icons/i_lesson.png', done: false },
		{ id: 'daily_vocab', title: 'Ôn 5 từ vựng', reward: 1, icon: '/icons/i_abc.png', done: false },
		{ id: 'daily_speak', title: 'Luyện nói 1 mẫu câu', reward: 1, icon: '/icons/i_microphone2.png', done: false }
	];

	const milestones = [
		{ id: 'streak_3', title: '🔥 3 ngày liên tiếp', reward: 3, progress: Math.min(streak, 3), target: 3 },
		{ id: 'streak_7', title: '🔥 7 ngày liên tiếp', reward: 5, progress: Math.min(streak, 7), target: 7 },
		{ id: 'streak_14', title: '🔥 14 ngày liên tiếp', reward: 10, progress: Math.min(streak, 14), target: 14 },
		{ id: 'streak_30', title: '🔥 30 ngày liên tiếp', reward: 20, progress: Math.min(streak, 30), target: 30 }
	];
</script>

<svelte:head>
	<title>Thử Thách — VASpeak</title>
</svelte:head>

<div class="min-h-screen bg-[#FFFBF1] pb-24">
	<!-- Top Bar -->
	<div class="bg-white shadow-[0_4px_14px_rgba(27,54,93,0.04)] px-4 py-4 mb-6 sticky top-0 z-10 flex items-center justify-center relative">
		<h1 class="font-heading font-bold text-lg text-[#1B365D]">Thử Thách & Phần Thưởng</h1>
		<div class="absolute right-4 flex items-center gap-1.5 bg-[#F2A906]/10 px-2.5 py-1 rounded-lg">
			<img src="/icons/i_credit.png" alt="" class="w-4 h-4" />
			<span class="text-sm font-bold text-[#1B365D]">{credits.remaining}</span>
		</div>
	</div>

	<div class="max-w-md mx-auto px-4">
		<!-- Daily Challenges -->
		<h2 class="font-heading font-bold text-[#1B365D] text-base mb-3 flex items-center gap-2">
			<img src="/icons/i_challenge.png" alt="" class="w-6 h-6" />
			Thử thách hàng ngày
		</h2>
		<div class="flex flex-col gap-3 mb-8">
			{#each dailyChallenges as challenge}
				<div class="bg-white rounded-2xl p-4 shadow-[0_4px_14px_rgba(27,54,93,0.05)] border border-[#1B365D]/6 flex items-center gap-3">
					<div class="w-10 h-10 rounded-xl bg-[#F2A906]/10 flex items-center justify-center p-2 shrink-0">
						<img src={challenge.icon} alt="" class="w-full h-full" />
					</div>
					<div class="flex-1">
						<p class="font-semibold text-[#1B365D] text-sm">{challenge.title}</p>
						<p class="text-xs text-[#1B365D]/40 flex items-center gap-1 mt-0.5">
							Thưởng: <img src="/icons/i_credit.png" alt="" class="w-3 h-3" /> +{challenge.reward} credit
						</p>
					</div>
					{#if challenge.done}
						<div class="w-8 h-8 rounded-full bg-[#10B981]/15 text-[#10B981] flex items-center justify-center font-bold text-sm shrink-0">✓</div>
					{:else}
						<a href="/dashboard" class="px-3 py-1.5 rounded-lg bg-[#F2A906] text-[#1B365D] font-bold text-xs active:scale-95 transition-all shadow-sm">Làm</a>
					{/if}
				</div>
			{/each}
		</div>

		<!-- Streak Milestones -->
		<h2 class="font-heading font-bold text-[#1B365D] text-base mb-3">🏆 Mốc Streak</h2>
		<div class="flex flex-col gap-3 mb-8">
			{#each milestones as m}
				{@const pct = Math.round((m.progress / m.target) * 100)}
				{@const done = m.progress >= m.target}
				<div class="bg-white rounded-2xl p-4 shadow-[0_4px_14px_rgba(27,54,93,0.05)] border border-[#1B365D]/6 {done ? 'border-[#10B981]/30' : ''}">
					<div class="flex items-center justify-between mb-2">
						<p class="font-semibold text-[#1B365D] text-sm {done ? 'line-through opacity-60' : ''}">{m.title}</p>
						<span class="text-xs font-bold flex items-center gap-1 {done ? 'text-[#10B981]' : 'text-[#1B365D]/40'}">
							{#if done}
								✓ Đã nhận
							{:else}
								<img src="/icons/i_credit.png" alt="" class="w-3 h-3" /> +{m.reward}
							{/if}
						</span>
					</div>
					<div class="w-full h-2 bg-[#1B365D]/8 rounded-full overflow-hidden">
						<div 
							class="h-full rounded-full transition-all {done ? 'bg-[#10B981]' : 'bg-[#F2A906]'}" 
							style="width: {pct}%"
						></div>
					</div>
					<p class="text-[10px] text-[#1B365D]/40 mt-1.5 font-medium">{m.progress}/{m.target} ngày</p>
				</div>
			{/each}
		</div>

		<!-- Coming soon teaser -->
		<div class="bg-white rounded-2xl p-6 shadow-[0_4px_14px_rgba(27,54,93,0.05)] border border-dashed border-[#1B365D]/15 text-center">
			<img src="/icons/i_challenge.png" alt="" class="w-12 h-12 mx-auto mb-3 opacity-40" />
			<h3 class="font-heading font-semibold text-[#1B365D]/60 text-sm mb-1">Thêm thử thách sắp ra mắt</h3>
			<p class="text-xs text-[#1B365D]/40">Vocabulary battles, Speed drills, Weekly leaderboard và nhiều hơn nữa.</p>
		</div>
	</div>
</div>

<BottomNav active="dashboard" />
