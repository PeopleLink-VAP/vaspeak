<script lang="ts">
	const { data } = $props();
	const { credits, history } = data;

	const pct = Math.round((credits.remaining / credits.allowance) * 100);
	const barColor = pct > 30 ? '#F2A906' : pct > 15 ? '#fb923c' : '#f87171';

	const resetLabel = credits.resetDate
		? new Date(credits.resetDate).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long' })
		: 'cuối tháng';

	// Group history by date for the timeline
	type Entry = { date: string; lessonTitle: string; creditsSpent: number; score: number | null };
	const grouped = new Map<string, Entry[]>();
	for (const entry of (history as Entry[])) {
		if (!grouped.has(entry.date)) grouped.set(entry.date, []);
		grouped.get(entry.date)!.push(entry);
	}
	const days = [...grouped.entries()].sort((a, b) => b[0].localeCompare(a[0]));
</script>

<svelte:head>
	<title>AI Credits — VASpeak</title>
</svelte:head>

<div class="min-h-screen bg-[#FFFBF1] px-4 py-6 max-w-lg mx-auto pb-24">

	<!-- Header -->
	<div class="flex items-center gap-3 mb-6">
		<a href="/dashboard" class="text-[#1B365D]/40 hover:text-[#1B365D] text-xl leading-none transition-colors">←</a>
		<h1 class="font-heading font-bold text-[#1B365D] text-xl">AI Credits</h1>
	</div>

	<!-- Balance card -->
	<div id="credits-balance-card" class="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(27,54,93,0.09)] border border-[#1B365D]/6 mb-4">
		<div class="flex items-end justify-between mb-4">
			<div>
				<p class="text-[#1B365D]/45 text-xs font-semibold uppercase tracking-wider mb-1">Còn lại tháng này</p>
				<div class="flex items-baseline gap-2">
					<span id="credits-remaining" class="font-heading font-bold text-[#1B365D] text-5xl">{credits.remaining}</span>
					<span class="text-[#1B365D]/35 text-lg">/ {credits.allowance}</span>
				</div>
			</div>
			<div class="text-5xl">⚡</div>
		</div>

		<!-- Progress bar -->
		<div class="w-full h-3 bg-[#1B365D]/8 rounded-full overflow-hidden mb-3">
			<div
				class="h-full rounded-full transition-all duration-700"
				style="width: {pct}%; background: {barColor};"
			></div>
		</div>

		<div class="flex justify-between text-xs text-[#1B365D]/45">
			<span>{credits.used} diğunakan</span>
			<span>Reset {resetLabel}</span>
		</div>
	</div>

	<!-- What credits are used for -->
	<div class="bg-white rounded-2xl p-5 shadow-[0_4px_14px_rgba(27,54,93,0.07)] border border-[#1B365D]/6 mb-6">
		<p class="text-xs font-semibold uppercase tracking-wider text-[#1B365D]/45 mb-3">Cách tính credit</p>
		<div class="space-y-2.5">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2.5">
					<div class="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-base">🎙️</div>
					<div>
						<p class="text-sm font-medium text-[#1B365D]">Hội Thoại AI (mỗi lượt)</p>
						<p class="text-xs text-[#1B365D]/40">1 tin nhắn gửi đến AI client</p>
					</div>
				</div>
				<span class="font-bold text-[#1B365D] text-sm bg-[#F2A906]/10 px-2.5 py-1 rounded-lg">⚡ 3</span>
			</div>
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2.5">
					<div class="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center text-base">⭐</div>
					<div>
						<p class="text-sm font-medium text-[#1B365D]">Chấm điểm hội thoại</p>
						<p class="text-xs text-[#1B365D]/40">Phân tích & phản hồi từ AI</p>
					</div>
				</div>
				<span class="font-bold text-[#1B365D] text-sm bg-[#10B981]/10 px-2.5 py-1 rounded-lg text-[#10B981]">Miễn phí</span>
			</div>
		</div>
	</div>

	<!-- Usage history -->
	<h2 class="font-heading font-semibold text-[#1B365D] text-base mb-3">Lịch sử sử dụng</h2>

	{#if days.length === 0}
		<div class="bg-white rounded-2xl p-8 text-center border border-[#1B365D]/6">
			<div class="text-3xl mb-2">🌱</div>
			<p class="text-[#1B365D]/50 text-sm">Chưa có lịch sử. Hãy bắt đầu hội thoại AI đầu tiên!</p>
			<a href="/dashboard" class="inline-block mt-4 bg-[#F2A906] text-[#1B365D] font-bold px-5 py-2.5 rounded-xl text-sm">
				Bắt đầu học →
			</a>
		</div>
	{:else}
		<div id="credits-history" class="space-y-4">
			{#each days as [date, entries]}
				<div>
					<p class="text-xs font-semibold text-[#1B365D]/40 uppercase tracking-wider mb-2">
						{new Date(date + 'T00:00:00').toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
					</p>
					<div class="space-y-2">
						{#each entries as entry}
							<div class="bg-white rounded-xl px-4 py-3 border border-[#1B365D]/6 flex items-center justify-between">
								<div class="flex items-center gap-3">
									<div class="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-sm">🎙️</div>
									<div>
										<p class="text-sm font-medium text-[#1B365D]">{entry.lessonTitle}</p>
										{#if entry.score !== null}
											<p class="text-xs text-[#10B981]">Điểm: {entry.score}/100</p>
										{:else}
											<p class="text-xs text-[#1B365D]/40">Hội thoại AI</p>
										{/if}
									</div>
								</div>
								{#if entry.creditsSpent > 0}
									<span class="text-sm font-bold text-[#1B365D]/60">−⚡{entry.creditsSpent}</span>
								{:else}
									<span class="text-xs text-[#1B365D]/30">—</span>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Monthly reset note -->
	<div class="mt-6 rounded-2xl bg-[#F2A906]/8 border border-[#F2A906]/20 p-4 text-center">
		<p class="text-sm text-[#1B365D]/70">
			Credits được làm mới vào đầu mỗi tháng.<br>
			<strong class="text-[#1B365D]">{credits.allowance} credits</strong> mỗi tháng với gói Free.
		</p>
	</div>
</div>
