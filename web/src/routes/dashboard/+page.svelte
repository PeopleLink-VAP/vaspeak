<script lang="ts">
	import BottomNav from '$lib/components/BottomNav.svelte';
	let { data } = $props();

	const todayLesson = $derived(data.todayLesson);
	const progress = $derived(data.progress);
	const credits = $derived(data.credits);
	const profile = $derived(data.profile);
	const creditsRemaining = $derived(credits.allowance - credits.used);
	const creditsPercent = $derived(Math.round((creditsRemaining / credits.allowance) * 100));
	const displayName = $derived(String(profile?.display_name ?? 'Bạn'));
	const streak = $derived(profile?.streak_count ?? 0);

	// Block icons using custom icon set
	const blockIcons = [
		'/icons/i_listen.png',
		'/icons/i_speaking.png',
		'/icons/i_microphone.png',
		'/icons/i_writing.png'
	];
</script>

<svelte:head>
	<title>Dashboard — VASpeak</title>
</svelte:head>

<div class="min-h-screen bg-[#FFFBF1] px-4 py-6 max-w-lg mx-auto">

	<!-- Header -->
	<header class="flex items-center justify-between mb-8">
		<div>
			<p class="text-[#1B365D]/50 text-sm font-medium">Xin chào 👋</p>
			<h1 class="font-heading font-bold text-[#1B365D] text-2xl">{displayName}</h1>
		</div>
		<a href="/profile" class="w-10 h-10 rounded-full bg-[#F2A906]/20 flex items-center justify-center text-[#1B365D] font-bold font-heading">
			{displayName[0]?.toUpperCase() ?? 'V'}
		</a>
	</header>

	<!-- Stats Row -->
	<div class="grid grid-cols-2 gap-3 mb-6">
		<!-- Streak -->
		<div class="bg-white rounded-2xl p-4 shadow-[0_4px_14px_rgba(27,54,93,0.07)] border border-[#1B365D]/6">
			<div class="flex items-center gap-2 mb-1">
				<span class="text-xl">🔥</span>
				<span class="font-heading font-bold text-[#1B365D] text-2xl">{streak}</span>
			</div>
			<p class="text-[#1B365D]/50 text-xs font-medium uppercase tracking-wide">Ngày Streak</p>
		</div>

		<!-- Credits (links to ledger) -->
		<a
			href="/credits"
			id="credits-widget"
			class="bg-white rounded-2xl p-4 shadow-[0_4px_14px_rgba(27,54,93,0.07)] border border-[#1B365D]/6 hover:border-[#F2A906]/40 transition-colors"
		>
			<div class="flex items-center gap-2 mb-1">
				<img src="/icons/i_credit.png" alt="Credits" class="w-6 h-6" />
				<span id="credits-remaining-value" class="font-heading font-bold text-[#1B365D] text-2xl">{creditsRemaining}</span>
				<span class="text-[#1B365D]/40 text-sm">/ {credits.allowance}</span>
			</div>
			<div class="w-full h-1.5 bg-[#1B365D]/8 rounded-full mt-1">
				<div
					class="h-full rounded-full transition-all"
					class:bg-[#F2A906]={creditsPercent > 30}
					class:bg-orange-400={creditsPercent <= 30 && creditsPercent > 15}
					class:bg-red-400={creditsPercent <= 15}
					style="width: {creditsPercent}%"
				></div>
			</div>
			<p class="text-[#1B365D]/50 text-xs font-medium uppercase tracking-wide mt-1">AI Credits →</p>
		</a>
	</div>

	<!-- Progress Bar -->
	<div class="bg-white rounded-2xl p-5 shadow-[0_4px_14px_rgba(27,54,93,0.07)] border border-[#1B365D]/6 mb-4">
		<div class="flex justify-between items-center mb-3">
			<span class="font-heading font-semibold text-[#1B365D] text-sm">Week 1 — General Communication</span>
			<span class="text-[#1B365D]/50 text-xs">{progress.completedDays}/7 bài</span>
		</div>
		<div class="flex gap-1.5">
			{#each Array(7) as _, i}
				<div class="flex-1 h-2 rounded-full {i < progress.completedDays ? 'bg-[#F2A906]' : 'bg-[#1B365D]/10'}"></div>
			{/each}
		</div>
	</div>

	<!-- Today's Lesson CTA -->
	{#if todayLesson}
		<div class="bg-white rounded-2xl p-6 shadow-[0_4px_14px_rgba(27,54,93,0.07)] border border-[#1B365D]/6 mb-4">
			<div class="flex items-start justify-between mb-4">
				<div>
					<span class="text-xs font-semibold text-[#F2A906] uppercase tracking-wider">Hôm Nay · Day {todayLesson.day_number}</span>
					<h2 class="font-heading font-bold text-[#1B365D] text-lg mt-1 leading-tight">{todayLesson.title}</h2>
					<p class="text-[#1B365D]/50 text-sm mt-1">Week {todayLesson.week_number}: {todayLesson.week_theme}</p>
				</div>
				<!-- Block completion circles with custom icons -->
				<div class="flex gap-1.5 mt-1">
					{#each blockIcons as iconSrc, i}
						<div class="w-8 h-8 rounded-full {i < 0 ? 'bg-[#F2A906]' : 'bg-[#1B365D]/6'} flex items-center justify-center p-1.5" title="Block {i+1}">
							<img src={iconSrc} alt="Block {i+1}" class="w-full h-full object-contain" />
						</div>
					{/each}
				</div>
			</div>

			<div class="text-xs text-[#1B365D]/40 mb-4 flex items-center gap-3">
				<span>⏱️ ~15 phút</span>
				<span>·</span>
				<span>4 blocks</span>
				<span>·</span>
				<span class="flex items-center gap-1"><img src="/icons/i_credit.png" alt="" class="w-3.5 h-3.5" /> 1 credit</span>
			</div>

			<a
				href="/lesson/{todayLesson.day_number}"
				class="block w-full bg-[#F2A906] text-[#1B365D] font-bold text-center py-3.5 rounded-xl hover:bg-[#d99506] active:scale-95 transition-all duration-150 shadow-lg shadow-[#F2A906]/25"
			>
				Bắt Đầu Bài Học →
			</a>
		</div>
	{:else}
		<div class="bg-white rounded-2xl p-6 shadow-[0_4px_14px_rgba(27,54,93,0.07)] border border-[#1B365D]/6 mb-4 text-center">
			<div class="text-4xl mb-3">🎉</div>
			<h2 class="font-heading font-bold text-[#1B365D] text-lg mb-2">Tuần này hoàn thành rồi!</h2>
			<p class="text-[#1B365D]/55 text-sm">Bài học mới sẽ có vào tuần tới. Hãy luyện từ vựng trong lúc chờ nhé.</p>
			<a href="/vocabulary" class="inline-block mt-4 bg-[#F2A906] text-[#1B365D] font-bold px-6 py-3 rounded-xl text-sm">
				Ôn Từ Vựng
			</a>
		</div>
	{/if}

	<!-- Quick links -->
	<div class="grid grid-cols-2 gap-3">
		<a href="/vocabulary" class="bg-white rounded-2xl p-4 shadow-[0_4px_14px_rgba(27,54,93,0.07)] border border-[#1B365D]/6 hover:border-[#F2A906]/50 transition-colors">
			<img src="/icons/i_abc.png" alt="Vocabulary" class="w-8 h-8 mb-2" />
			<p class="font-heading font-semibold text-[#1B365D] text-sm">Kho Từ Vựng</p>
			<p class="text-[#1B365D]/45 text-xs mt-0.5">Ôn lại từ đã học</p>
		</a>
		<a href="/challenges" class="bg-white rounded-2xl p-4 shadow-[0_4px_14px_rgba(27,54,93,0.07)] border border-[#1B365D]/6 hover:border-[#F2A906]/50 transition-colors">
			<img src="/icons/i_challenge.png" alt="Challenges" class="w-8 h-8 mb-2" />
			<p class="font-heading font-semibold text-[#1B365D] text-sm">Thử Thách</p>
			<p class="text-[#1B365D]/45 text-xs mt-0.5">Kiếm thêm credits</p>
		</a>
	</div>
</div>

<BottomNav active="dashboard" />
