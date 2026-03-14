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

<div class="min-h-screen bg-[#FAFAF8] px-5 py-7 max-w-lg mx-auto">

	<!-- Header -->
	<header class="flex items-center justify-between mb-10">
		<div>
			<p class="text-[#A3A3A3] text-sm font-medium">Xin chào 👋</p>
			<h1 class="font-heading font-extrabold text-[#1A1A1A] text-2xl tracking-tight">{displayName}</h1>
		</div>
		<a href="/profile" class="w-10 h-10 rounded-full bg-[#D4960A]/15 flex items-center justify-center text-[#1A1A1A] font-bold font-heading text-sm">
			{displayName[0]?.toUpperCase() ?? 'V'}
		</a>
	</header>

	<!-- Stats Strip -->
	<div class="flex items-center gap-0 mb-8">
		<!-- Streak -->
		<div class="flex-1">
			<div class="flex items-center gap-2 mb-0.5">
				<span class="text-xl">🔥</span>
				<span class="font-heading font-extrabold text-[#D4960A] text-2xl">{streak}</span>
			</div>
			<p class="text-[#A3A3A3] text-[10px] font-semibold uppercase tracking-wider">Ngày Streak</p>
		</div>

		<div class="w-px h-10 bg-[#E8E8E8]"></div>

		<!-- Credits -->
		<a
			href="/credits"
			id="credits-widget"
			class="flex-1 pl-5 hover:opacity-80 transition-opacity"
		>
			<div class="flex items-center gap-2 mb-0.5">
				<img src="/icons/i_credit.png" alt="Credits" class="w-5 h-5" />
				<span id="credits-remaining-value" class="font-heading font-extrabold text-[#1A1A1A] text-2xl">{creditsRemaining}</span>
				<span class="text-[#A3A3A3] text-sm">/ {credits.allowance}</span>
			</div>
			<div class="w-full h-1 bg-[#E8E8E8] rounded-full mt-1">
				<div
					class="h-full rounded-full transition-all duration-500"
					class:bg-[#D4960A]={creditsPercent > 30}
					class:bg-orange-400={creditsPercent <= 30 && creditsPercent > 15}
					class:bg-red-400={creditsPercent <= 15}
					style="width: {creditsPercent}%"
				></div>
			</div>
			<p class="text-[#A3A3A3] text-[10px] font-semibold uppercase tracking-wider mt-1">AI Credits →</p>
		</a>
	</div>

	<!-- Week Progress -->
	<div class="mb-6">
		<div class="flex justify-between items-center mb-3">
			<span class="text-[#6B6B6B] text-xs font-medium">Week 1 · General Communication</span>
			<span class="text-[#A3A3A3] text-xs">{progress.completedDays}/7 bài</span>
		</div>
		<div class="flex gap-2">
			{#each Array(7) as _, i}
				<div class="flex-1 flex justify-center">
					{#if i < progress.completedDays}
						<div class="w-3 h-3 rounded-full bg-[#D4960A]"></div>
					{:else if i === progress.completedDays}
						<div class="w-3 h-3 rounded-full border-2 border-[#D4960A] pulse"></div>
					{:else}
						<div class="w-3 h-3 rounded-full bg-[#E8E8E8]"></div>
					{/if}
				</div>
			{/each}
		</div>
	</div>

	<!-- Today's Lesson CTA -->
	{#if todayLesson}
		<div class="bg-[#F5F0E6] rounded-2xl p-6 mb-6">
			<span class="text-xs font-semibold text-[#D4960A] uppercase tracking-wider">Hôm Nay · Day {todayLesson.day_number}</span>
			<h2 class="font-heading font-bold text-[#1A1A1A] text-lg mt-1.5 leading-tight">{todayLesson.title}</h2>
			<p class="text-[#6B6B6B] text-sm mt-1">Week {todayLesson.week_number}: {todayLesson.week_theme}</p>

			<!-- Block indicators -->
			<div class="flex gap-2 mt-4 mb-5">
				{#each blockIcons as iconSrc, i}
					<div class="w-8 h-8 rounded-full bg-[#1A1A1A]/5 flex items-center justify-center p-1.5" title="Block {i+1}">
						<img src={iconSrc} alt="Block {i+1}" class="w-full h-full object-contain opacity-60" />
					</div>
				{/each}
			</div>

			<div class="text-xs text-[#6B6B6B] mb-5 flex items-center gap-3">
				<span>⏱️ ~15 phút</span>
				<span class="text-[#E8E8E8]">·</span>
				<span>4 blocks</span>
				<span class="text-[#E8E8E8]">·</span>
				<span class="flex items-center gap-1"><img src="/icons/i_credit.png" alt="" class="w-3.5 h-3.5" /> 1 credit</span>
			</div>

			<a
				href="/lesson/{todayLesson.day_number}"
				class="block w-full bg-[#D4960A] text-[#1A1A1A] font-bold text-center py-3.5 rounded-lg hover:bg-[#b07d08] active:scale-[0.97] transition-all duration-150 text-sm"
			>
				Bắt Đầu Bài Học →
			</a>
		</div>
	{:else}
		<div class="bg-[#F5F0E6] rounded-2xl p-6 mb-6 text-center">
			<div class="text-4xl mb-3">🎉</div>
			<h2 class="font-heading font-bold text-[#1A1A1A] text-lg mb-2">Tuần này hoàn thành rồi!</h2>
			<p class="text-[#6B6B6B] text-sm">Bài học mới sẽ có vào tuần tới. Hãy luyện từ vựng trong lúc chờ nhé.</p>
			<a href="/vocabulary" class="inline-block mt-4 bg-[#D4960A] text-[#1A1A1A] font-bold px-6 py-3 rounded-lg text-sm">
				Ôn Từ Vựng
			</a>
		</div>
	{/if}

	<!-- Quick links -->
	<div class="flex items-start">
		<a href="/vocabulary" class="flex-1 py-3 hover:opacity-70 transition-opacity">
			<img src="/icons/i_abc.png" alt="Vocabulary" class="w-7 h-7 mb-2 opacity-60" />
			<p class="font-heading font-semibold text-[#1A1A1A] text-sm">Kho Từ Vựng</p>
			<p class="text-[#A3A3A3] text-xs mt-0.5">Ôn lại từ đã học</p>
		</a>
		<div class="w-px h-14 bg-[#E8E8E8] mt-3 flex-shrink-0"></div>
		<a href="/challenges" class="flex-1 py-3 pl-5 hover:opacity-70 transition-opacity">
			<img src="/icons/i_challenge.png" alt="Challenges" class="w-7 h-7 mb-2 opacity-60" />
			<p class="font-heading font-semibold text-[#1A1A1A] text-sm">Thử Thách</p>
			<p class="text-[#A3A3A3] text-xs mt-0.5">Kiếm thêm credits</p>
		</a>
	</div>
</div>

<BottomNav active="dashboard" />
