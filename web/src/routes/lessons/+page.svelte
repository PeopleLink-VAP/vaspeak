<script lang="ts">
	import BottomNav from '$lib/components/BottomNav.svelte';
	let { data } = $props();
	const weeks = $derived(data.weeks);
	const highestUnlockedDay = $derived(data.highestUnlockedDay);
</script>

<svelte:head>
	<title>Lộ Trình Học — VASpeak</title>
</svelte:head>

<div class="min-h-screen bg-[#FAFAF8] pb-24">
	<!-- Top Bar -->
	<div class="sticky top-0 z-10 bg-[#FAFAF8]/95 backdrop-blur-lg border-b border-[#E8E8E8] px-5 py-4">
		<h1 class="font-heading font-bold text-[#1A1A1A] text-base tracking-tight">Lộ Trình Học</h1>
	</div>

	<div class="max-w-md mx-auto px-5 pt-6 flex flex-col gap-8">
		{#if !weeks || weeks.length === 0}
			<div class="text-center py-16 px-4">
				<p class="text-3xl mb-4">📭</p>
				<h3 class="font-heading font-semibold text-[#1A1A1A] text-base mb-2">Chưa có bài học nào</h3>
				<p class="text-sm text-[#6B6B6B] leading-relaxed max-w-xs mx-auto">
					Hệ thống vẫn đang xử lý hoặc bạn chưa thuộc ngách nào.
				</p>
			</div>
		{:else}
			{#each weeks as week}
				<div>
					<!-- Week Header -->
					<div class="flex items-baseline gap-3 mb-4">
						<span class="text-xs font-semibold text-[#D4960A] uppercase tracking-widest">Tuần {week.weekNumber}</span>
						<div class="flex-1 h-px bg-[#E8E8E8]"></div>
					</div>
					<h2 class="font-heading font-bold text-[#1A1A1A] text-xl mb-4 tracking-tight leading-snug">{week.theme}</h2>

					<!-- Lesson List -->
					<div class="flex flex-col gap-2.5">
						{#each week.lessons as lesson (lesson.id)}
							{#if lesson.locked}
								<div class="flex items-center gap-4 p-3.5 rounded-xl opacity-40">
									<div class="w-9 h-9 rounded-full bg-[#E8E8E8] flex items-center justify-center shrink-0">
										<svg class="w-4 h-4 text-[#A3A3A3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
									</div>
									<div class="flex-1">
										<h4 class="font-medium text-[#1A1A1A] text-sm">Day {lesson.day_number}: {lesson.title}</h4>
										<p class="text-[10px] text-[#A3A3A3] mt-0.5">Hoàn thành Day {lesson.day_number - 1} để mở khóa</p>
									</div>
								</div>
							{:else}
								<a
									href="/lesson/{lesson.day_number}"
									class="flex items-center gap-4 p-3.5 rounded-xl border transition-all group
										{lesson.completed
											? 'bg-[#F5F0E6]/50 border-[#E8E8E8]'
											: 'bg-white border-[#E8E8E8] hover:border-[#D4960A]/40 hover:shadow-sm'}"
								>
									{#if lesson.completed}
										<div class="w-9 h-9 rounded-full bg-[#10B981]/15 flex items-center justify-center shrink-0">
											<svg class="w-4 h-4 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
										</div>
									{:else}
										<div class="w-9 h-9 rounded-full bg-[#D4960A] flex items-center justify-center shrink-0 font-bold text-[#1A1A1A] text-sm font-heading">
											{lesson.day_number}
										</div>
									{/if}

									<div class="flex-1 min-w-0">
										<h4 class="font-medium text-sm leading-snug
											{lesson.completed ? 'text-[#A3A3A3] line-through' : 'text-[#1A1A1A]'}">
											Day {lesson.day_number}: {lesson.title}
										</h4>
										{#if lesson.completed}
											<p class="text-[10px] text-[#10B981] font-semibold uppercase tracking-wider mt-0.5">Đã Hoàn Thành</p>
										{:else}
											<p class="text-[10px] text-[#A3A3A3] mt-0.5">Nhấp để làm bài</p>
										{/if}
									</div>

									<svg class="w-4 h-4 shrink-0 text-[#D4D4D4] group-hover:text-[#D4960A] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 18l6-6-6-6"/></svg>
								</a>
							{/if}
						{/each}
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>

<BottomNav active="lessons" />
