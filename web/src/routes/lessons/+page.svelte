<script lang="ts">
	let { data } = $props();
	const weeks = $derived(data.weeks);
	const highestUnlockedDay = $derived(data.highestUnlockedDay);
</script>

<svelte:head>
	<title>Lộ Trình Học — VASpeak</title>
</svelte:head>

<div class="min-h-screen bg-[#FFFBF1] pb-24 relative">
	<!-- Top Bar -->
	<div class="bg-white shadow-[0_4px_14px_rgba(27,54,93,0.04)] px-4 py-4 mb-6 sticky top-0 z-10 flex items-center justify-center relative">
		<h1 class="font-heading font-bold text-lg text-[#1B365D]">Lộ Trình Học</h1>
	</div>

	<div class="max-w-md mx-auto px-4 flex flex-col gap-6">
		{#if !weeks || weeks.length === 0}
			<div class="text-center py-12 px-4 bg-white rounded-2xl border border-[#1B365D]/6 border-dashed opacity-75">
				<div class="text-5xl mb-4">📭</div>
				<h3 class="font-heading font-semibold text-[#1B365D] text-lg mb-2">Chưa có bài học nào</h3>
				<p class="text-sm text-[#1B365D]/60 leading-relaxed max-w-xs mx-auto">
					Hệ thống vẫn đang xử lý hoặc bạn chưa thuộc ngách nào.
				</p>
			</div>
		{:else}
			{#each weeks as week}
				<div class="bg-white rounded-2xl p-5 shadow-[0_4px_14px_rgba(27,54,93,0.05)] border border-[#1B365D]/8">
					<!-- Week Header -->
					<div class="border-b border-[#1B365D]/5 pb-3 mb-3">
						<span class="text-xs font-semibold text-[#F2A906] uppercase tracking-wider block mb-1">Tuần {week.weekNumber}</span>
						<h2 class="font-heading font-bold text-[#1B365D] text-lg leading-tight">{week.theme}</h2>
					</div>
					
					<!-- Lesson List -->
					<div class="flex flex-col gap-3">
						{#each week.lessons as lesson (lesson.id)}
							{#if lesson.locked}
								<div class="flex items-center gap-4 bg-[#FFFBF1] p-3 rounded-xl border border-[#1B365D]/5 opacity-60">
									<div class="w-10 h-10 rounded-full bg-[#1B365D]/5 flex items-center justify-center shrink-0">
										<span class="text-sm opacity-50">🔒</span>
									</div>
									<div>
										<h4 class="font-heading font-semibold text-[#1B365D]/60 text-sm">Day {lesson.day_number}: {lesson.title}</h4>
										<p class="text-[10px] text-[#1B365D]/40 font-bold uppercase tracking-wide mt-0.5">Yêu cầu hoàn thành Day {lesson.day_number - 1}</p>
									</div>
								</div>
							{:else}
								<a href="/lesson/{lesson.day_number}" class="flex items-center gap-4 bg-white p-3 rounded-xl border border-[#1B365D]/10 hover:border-[#F2A906]/60 transition-colors group">
									{#if lesson.completed}
										<!-- Completed State -->
										<div class="w-10 h-10 rounded-full bg-[#10B981]/15 text-[#10B981] flex items-center justify-center shrink-0 font-bold text-sm">
											✓
										</div>
									{:else}
										<!-- Active/Next State -->
										<div class="w-10 h-10 rounded-full bg-[#F2A906] text-[#1B365D] flex items-center justify-center shrink-0 font-bold font-heading shadow-md shadow-[#F2A906]/30">
											{lesson.day_number}
										</div>
									{/if}
									
									<div class="flex-1">
										<h4 class="font-heading font-semibold {lesson.completed ? 'text-[#1B365D]/80 line-through' : 'text-[#1B365D]'} text-sm leading-snug group-hover:text-[#F2A906] transition-colors">
											Day {lesson.day_number}: {lesson.title}
										</h4>
										{#if lesson.completed}
											<p class="text-[10px] text-[#10B981] font-bold uppercase tracking-wider mt-0.5">Đã Hoàn Thành</p>
										{:else}
											<p class="text-[10px] text-[#1B365D]/50 font-medium mt-0.5">Nhấp vào để làm bài</p>
										{/if}
									</div>
									
									<div class="text-[#1B365D]/20 group-hover:text-[#F2A906] transition-colors shrink-0">
										<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
											<path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
										</svg>
									</div>
								</a>
							{/if}
						{/each}
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>

<!-- Bottom Nav -->
<nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-[#1B365D]/8 px-6 py-3 z-50">
	<div class="flex justify-around max-w-lg mx-auto">
		{#each [
			{ href: '/dashboard', icon: '🏠', label: 'Trang Chủ', active: false },
			{ href: '/lessons',   icon: '📖', label: 'Bài Học',   active: true },
			{ href: '/credits',   icon: '⚡', label: 'Credits',   active: false },
			{ href: '/profile',   icon: '👤', label: 'Cá Nhân',   active: false }
		] as nav}
			<a href={nav.href} class="flex flex-col items-center gap-1 {nav.active ? 'text-[#F2A906]' : 'text-[#1B365D]/40'} hover:text-[#1B365D] transition-colors">
				<span class="text-xl">{nav.icon}</span>
				<span class="text-[10px] font-medium">{nav.label}</span>
			</a>
		{/each}
	</div>
</nav>
