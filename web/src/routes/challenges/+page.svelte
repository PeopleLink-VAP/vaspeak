<script lang="ts">
	import BottomNav from '$lib/components/BottomNav.svelte';

	let { data } = $props();
	const credits = $derived(data.credits);
	const streak = $derived(data.streak);
	const wordGameStatus = $derived(data.wordGameStatus);
	const wordGameStats = $derived(data.wordGameStats);

	const dailyChallenges = [
		{ id: 'daily_lesson', title: 'Hoàn thành bài học hôm nay', reward: 1, icon: '/icons/i_lesson.png', done: false, href: '/dashboard' },
		{ id: 'daily_vocab', title: 'Ôn 5 từ vựng', reward: 1, icon: '/icons/i_abc.png', done: false, href: '/vocabulary' },
		{ id: 'daily_speak', title: 'Luyện nói 1 mẫu câu', reward: 1, icon: '/icons/i_microphone2.png', done: false, href: '/dashboard' }
	];

	const milestones = $derived([
		{ id: 'streak_3',  title: '3 ngày liên tiếp',  reward: 3,  progress: Math.min(streak, 3),  target: 3 },
		{ id: 'streak_7',  title: '7 ngày liên tiếp',  reward: 5,  progress: Math.min(streak, 7),  target: 7 },
		{ id: 'streak_14', title: '14 ngày liên tiếp', reward: 10, progress: Math.min(streak, 14), target: 14 },
		{ id: 'streak_30', title: '30 ngày liên tiếp', reward: 20, progress: Math.min(streak, 30), target: 30 }
	]);

	const wordGameStatusConfig = $derived({
		none:    { label: 'Chưa chơi hôm nay',    color: 'text-[#A3A3A3]', btnLabel: 'Chơi', btnClass: 'bg-[#D4960A] text-[#1A1A1A]' },
		pending: { label: 'Đang chờ trả lời',     color: 'text-[#D4960A]', btnLabel: 'Tiếp tục', btnClass: 'bg-[#D4960A] text-[#1A1A1A]' },
		correct: { label: 'Đã làm (+1 credit)',   color: 'text-[#10B981]', btnLabel: 'Chơi thêm', btnClass: 'bg-[#1A1A1A] text-white' },
		wrong:   { label: 'Đã làm (ôn lại)',      color: 'text-red-400',   btnLabel: 'Chơi thêm', btnClass: 'bg-[#1A1A1A] text-white' }
	}[wordGameStatus]);
</script>

<svelte:head>
	<title>Thử Thách — VASpeak</title>
</svelte:head>

<div class="min-h-screen bg-[#FAFAF8] pb-24">
	<!-- Top Bar -->
	<div class="sticky top-0 z-10 bg-[#FAFAF8]/95 backdrop-blur-lg border-b border-[#E8E8E8] px-5 py-4 flex items-center justify-between">
		<h1 class="font-heading font-bold text-[#1A1A1A] text-base tracking-tight">Thử Thách</h1>
		<div class="flex items-center gap-1.5">
			<img src="/icons/i_credit.png" alt="" class="w-4 h-4" />
			<span class="text-sm font-bold text-[#1A1A1A]">{credits.remaining}</span>
		</div>
	</div>

	<div class="max-w-md mx-auto px-5 pt-6 flex flex-col gap-8">

		<!-- Mini Games Section -->
		<div>
			<div class="flex items-baseline gap-2 mb-4">
				<p class="text-xs font-semibold text-[#A3A3A3] uppercase tracking-widest">Mini Games</p>
				<div class="flex-1 h-px bg-[#E8E8E8]"></div>
				{#if wordGameStats.total > 0}
					<span class="text-xs font-semibold text-[#D4960A]">{wordGameStats.wins}/{wordGameStats.total} đúng</span>
				{/if}
			</div>

			<div class="flex flex-col">
				<!-- Word of the Day -->
				<a href="/games/word-of-the-day" class="flex items-center gap-4 py-4 group">
					<div class="w-11 h-11 rounded-xl bg-[#F5F0E6] flex items-center justify-center p-2.5 shrink-0 group-hover:bg-[#D4960A]/15 transition-colors">
						<img src="/icons/i_abc.png" alt="" class="w-full h-full" />
					</div>
					<div class="flex-1 min-w-0">
						<p class="font-medium text-[#1A1A1A] text-sm group-hover:text-[#D4960A] transition-colors">Từ Của Ngày</p>
						<p class="text-xs mt-0.5 {wordGameStatusConfig.color} font-medium flex items-center gap-1">
							{#if wordGameStatus === 'correct'}
								<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
							{:else if wordGameStatus === 'wrong'}
								<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
							{/if}
							{wordGameStatusConfig.label}
						</p>
						<p class="text-[10px] text-[#A3A3A3] flex items-center gap-1 mt-0.5">
							Thưởng: <img src="/icons/i_credit.png" alt="" class="w-3 h-3" /> +1 nếu đúng
						</p>
					</div>
					<span class="px-3.5 py-2 rounded-lg font-bold text-xs active:scale-95 transition-all {wordGameStatusConfig.btnClass}">
						{wordGameStatusConfig.btnLabel}
					</span>
				</a>

				<!-- Future games placeholder -->
				<div class="border-t border-[#E8E8E8]"></div>
				<div class="flex items-center gap-4 py-4 opacity-40">
					<div class="w-11 h-11 rounded-xl bg-[#E8E8E8] flex items-center justify-center p-2.5 shrink-0 border border-dashed border-[#D4D4D4]">
						<img src="/icons/i_listen.png" alt="" class="w-full h-full opacity-50" />
					</div>
					<div class="flex-1">
						<p class="font-medium text-[#6B6B6B] text-sm">Nghe Hiểu Nhanh</p>
						<p class="text-[10px] text-[#A3A3A3]">Sắp ra mắt</p>
					</div>
				</div>
				<div class="border-t border-[#E8E8E8]"></div>
				<div class="flex items-center gap-4 py-4 opacity-40">
					<div class="w-11 h-11 rounded-xl bg-[#E8E8E8] flex items-center justify-center p-2.5 shrink-0 border border-dashed border-[#D4D4D4]">
						<img src="/icons/i_writing.png" alt="" class="w-full h-full opacity-50" />
					</div>
					<div class="flex-1">
						<p class="font-medium text-[#6B6B6B] text-sm">Ghép Câu</p>
						<p class="text-[10px] text-[#A3A3A3]">Sắp ra mắt</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Daily Challenges -->
		<div>
			<div class="flex items-baseline gap-2 mb-4">
				<p class="text-xs font-semibold text-[#A3A3A3] uppercase tracking-widest">Hôm nay</p>
				<div class="flex-1 h-px bg-[#E8E8E8]"></div>
			</div>

			<div class="flex flex-col">
				{#each dailyChallenges as challenge, i}
					<div class="flex items-center gap-4 py-3.5 {i < dailyChallenges.length - 1 ? 'border-b border-[#E8E8E8]' : ''}">
						<div class="w-9 h-9 rounded-xl bg-[#F5F0E6] flex items-center justify-center p-2 shrink-0">
							<img src={challenge.icon} alt="" class="w-full h-full" />
						</div>
						<div class="flex-1">
							<p class="font-medium text-[#1A1A1A] text-sm">{challenge.title}</p>
							<p class="text-xs text-[#A3A3A3] flex items-center gap-1 mt-0.5">
								Thưởng: <img src="/icons/i_credit.png" alt="" class="w-3 h-3" /> +{challenge.reward}
							</p>
						</div>
						{#if challenge.done}
							<div class="w-7 h-7 rounded-full bg-[#10B981]/15 flex items-center justify-center shrink-0">
								<svg class="w-3.5 h-3.5 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
							</div>
						{:else}
							<a href={challenge.href} class="px-3 py-1.5 rounded-lg bg-[#D4960A] text-[#1A1A1A] font-bold text-xs active:scale-95 transition-all">Làm</a>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<!-- Streak Milestones -->
		<div>
			<div class="flex items-baseline gap-2 mb-4">
				<p class="text-xs font-semibold text-[#A3A3A3] uppercase tracking-widest">Streak</p>
				<div class="flex-1 h-px bg-[#E8E8E8]"></div>
				<span class="text-xs font-bold text-[#D4960A]">{streak} ngày</span>
			</div>

			<div class="flex flex-col gap-4">
				{#each milestones as m}
					{@const pct = Math.round((m.progress / m.target) * 100)}
					{@const done = m.progress >= m.target}
					<div class="{done ? 'opacity-60' : ''}">
						<div class="flex items-center justify-between mb-2">
							<p class="text-sm font-medium text-[#1A1A1A] {done ? 'line-through' : ''}">{m.title}</p>
							<span class="text-xs font-bold {done ? 'text-[#10B981]' : 'text-[#A3A3A3]'} flex items-center gap-1">
								{#if done}
									<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
									Đã nhận
								{:else}
									<img src="/icons/i_credit.png" alt="" class="w-3 h-3" /> +{m.reward}
								{/if}
							</span>
						</div>
						<div class="w-full h-1 bg-[#E8E8E8] rounded-full overflow-hidden">
							<div
								class="h-full rounded-full transition-all {done ? 'bg-[#10B981]' : 'bg-[#D4960A]'}"
								style="width: {pct}%"
							></div>
						</div>
						<p class="text-[10px] text-[#A3A3A3] mt-1 font-medium">{m.progress}/{m.target} ngày</p>
					</div>
				{/each}
			</div>
		</div>

	</div>
</div>

<BottomNav active="dashboard" />
