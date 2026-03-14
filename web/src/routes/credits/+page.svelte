<script lang="ts">
	import BottomNav from '$lib/components/BottomNav.svelte';
	const { data } = $props();
	const { credits, history } = data;

	const pct = Math.round((credits.remaining / credits.allowance) * 100);

	const resetLabel = credits.resetDate
		? new Date(credits.resetDate).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long' })
		: 'cuối tháng';

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

<div class="min-h-screen bg-[#FAFAF8] pb-24">
	<!-- Top Bar -->
	<div class="sticky top-0 z-10 bg-[#FAFAF8]/95 backdrop-blur-lg border-b border-[#E8E8E8] px-5 py-4 flex items-center gap-3">
		<a href="/dashboard" class="text-[#A3A3A3] hover:text-[#1A1A1A] transition-colors text-lg leading-none">←</a>
		<h1 class="font-heading font-bold text-[#1A1A1A] text-base tracking-tight">AI Credits</h1>
	</div>

	<div class="max-w-md mx-auto px-5 pt-6 flex flex-col gap-6">

		<!-- Balance hero -->
		<div id="credits-balance-card">
			<div class="flex items-end justify-between mb-5">
				<div>
					<p class="text-xs font-semibold text-[#A3A3A3] uppercase tracking-widest mb-1">Còn lại tháng này</p>
					<div class="flex items-baseline gap-2">
						<span id="credits-remaining" class="font-heading font-bold text-[#1A1A1A] text-6xl leading-none">{credits.remaining}</span>
						<span class="text-[#A3A3A3] text-xl">/ {credits.allowance}</span>
					</div>
				</div>
				<img src="/icons/i_credit.png" alt="Credits" class="w-10 h-10 opacity-70" />
			</div>

			<!-- Usage bar — hairline style -->
			<div class="w-full h-1 bg-[#E8E8E8] rounded-full overflow-hidden mb-2">
				<div
					class="h-full rounded-full transition-all duration-700"
					style="width: {pct}%; background: {pct > 30 ? '#D4960A' : pct > 15 ? '#fb923c' : '#f87171'};"
				></div>
			</div>
			<div class="flex justify-between text-[11px] text-[#A3A3A3] font-medium">
				<span>{credits.used} đã dùng</span>
				<span>Reset {resetLabel}</span>
			</div>
		</div>

		<!-- Divider -->
		<div class="h-px bg-[#E8E8E8]"></div>

		<!-- How credits work -->
		<div>
			<p class="text-xs font-semibold text-[#A3A3A3] uppercase tracking-widest mb-4">Cách tính credit</p>
			<div class="flex flex-col gap-4">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<div class="w-8 h-8 rounded-xl bg-[#F5F0E6] flex items-center justify-center p-1.5">
							<img src="/icons/i_microphone.png" alt="" class="w-full h-full" />
						</div>
						<div>
							<p class="text-sm font-medium text-[#1A1A1A]">Hội Thoại AI (mỗi lượt)</p>
							<p class="text-xs text-[#A3A3A3]">1 tin nhắn gửi đến AI client</p>
						</div>
					</div>
					<span class="text-sm font-bold text-[#D4960A]">⚡ 3</span>
				</div>
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<div class="w-8 h-8 rounded-xl bg-[#F5F0E6] flex items-center justify-center p-1.5">
							<img src="/icons/i_writing.png" alt="" class="w-full h-full" />
						</div>
						<div>
							<p class="text-sm font-medium text-[#1A1A1A]">Chấm điểm hội thoại</p>
							<p class="text-xs text-[#A3A3A3]">Phân tích & phản hồi từ AI</p>
						</div>
					</div>
					<span class="text-sm font-semibold text-[#10B981]">Miễn phí</span>
				</div>
			</div>
		</div>

		<!-- Divider -->
		<div class="h-px bg-[#E8E8E8]"></div>

		<!-- Usage history -->
		<div>
			<p class="text-xs font-semibold text-[#A3A3A3] uppercase tracking-widest mb-4">Lịch sử sử dụng</p>

			{#if days.length === 0}
				<div class="text-center py-10">
					<p class="text-4xl mb-3">🌱</p>
					<p class="text-[#A3A3A3] text-sm mb-4">Chưa có lịch sử. Hãy bắt đầu hội thoại AI đầu tiên!</p>
					<a href="/dashboard" class="inline-block bg-[#D4960A] text-[#1A1A1A] font-bold px-5 py-2.5 rounded-lg text-sm">
						Bắt đầu học →
					</a>
				</div>
			{:else}
				<div id="credits-history" class="flex flex-col gap-6">
					{#each days as [date, entries]}
						<div>
							<p class="text-[10px] font-semibold text-[#A3A3A3] uppercase tracking-widest mb-2">
								{new Date(date + 'T00:00:00').toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
							</p>
							<div class="flex flex-col">
								{#each entries as entry, i}
									<div class="flex items-center gap-3 py-3 {i < entries.length - 1 ? 'border-b border-[#E8E8E8]' : ''}">
										<div class="w-8 h-8 rounded-lg bg-[#F5F0E6] flex items-center justify-center p-1.5 shrink-0">
											<img src="/icons/i_microphone.png" alt="" class="w-full h-full" />
										</div>
										<div class="flex-1 min-w-0">
											<p class="text-sm font-medium text-[#1A1A1A] truncate">{entry.lessonTitle}</p>
											{#if entry.score !== null}
												<p class="text-xs text-[#10B981]">Điểm: {entry.score}/100</p>
											{:else}
												<p class="text-xs text-[#A3A3A3]">Hội thoại AI</p>
											{/if}
										</div>
										{#if entry.creditsSpent > 0}
											<span class="text-sm font-bold text-[#6B6B6B] shrink-0">−{entry.creditsSpent}</span>
										{:else}
											<span class="text-xs text-[#E8E8E8] shrink-0">—</span>
										{/if}
									</div>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Monthly note -->
		<div class="bg-[#F5F0E6]/60 rounded-2xl p-4 text-center">
			<p class="text-sm text-[#6B6B6B]">
				Credits được làm mới vào đầu mỗi tháng.<br>
				<strong class="text-[#1A1A1A]">{credits.allowance} credits</strong> mỗi tháng với gói Free.
			</p>
		</div>

	</div>
</div>

<BottomNav active="credits" />
