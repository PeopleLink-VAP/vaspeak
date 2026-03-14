<script lang="ts">
	import { enhance } from '$app/forms';
	import BottomNav from '$lib/components/BottomNav.svelte';

	let { data, form } = $props();
	let words = $derived(data.words as any[]);
	let challengeStats = $derived(data.challengeStats ?? { total: 0, wins: 0, creditsEarned: 0 });

	let showAddModal = $state(false);
	let isSubmitting = $state(false);

	let masteredCount = $derived(words.filter(w => w.mastered === 1).length);
	let accuracy = $derived(challengeStats.total > 0 ? Math.round((challengeStats.wins / challengeStats.total) * 100) : 0);
</script>

<svelte:head>
	<title>Vocabulary Bank — VASpeak</title>
</svelte:head>

<div class="min-h-screen bg-[#FAFAF8] pb-24">
	<!-- Top Bar -->
	<div class="sticky top-0 z-10 bg-[#FAFAF8]/95 backdrop-blur-lg border-b border-[#E8E8E8] px-5 py-4 flex items-center justify-between gap-3">
		<div>
			<h1 class="font-heading font-bold text-[#1A1A1A] text-base tracking-tight">Vocabulary Bank</h1>
			<p class="text-[11px] text-[#A3A3A3] font-medium">{words.length} từ · {masteredCount} đã thành thạo</p>
		</div>
		<button
			onclick={() => showAddModal = true}
			class="h-8 px-3 rounded-lg bg-[#D4960A] text-[#1A1A1A] font-bold text-xs hover:bg-[#b07d08] active:scale-[0.97] transition-all"
		>
			+ Thêm từ
		</button>
	</div>

	<div class="max-w-md mx-auto px-5 pt-5 flex flex-col gap-5">

		<!-- Telegram challenge stats -->
		{#if challengeStats.total > 0}
			<div class="flex items-center gap-4 bg-white rounded-2xl border border-[#E8E8E8] p-4">
				<div class="w-9 h-9 rounded-xl bg-[#0088cc]/10 flex items-center justify-center shrink-0">
					<svg class="w-4 h-4 text-[#0088cc]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.95 7.23l-2.02 9.53c-.15.68-.55.85-1.12.53l-3.1-2.28-1.49 1.44c-.17.17-.3.3-.62.3l.22-3.15 5.72-5.16c.25-.22-.05-.34-.39-.13l-7.07 4.45-3.05-.95c-.66-.21-.67-.66.14-.98l11.92-4.6c.55-.2 1.03.13.86.97z"/></svg>
				</div>
				<div class="flex-1">
					<p class="text-sm font-semibold text-[#1A1A1A]">Thử thách Telegram</p>
					<p class="text-xs text-[#A3A3A3]">{challengeStats.wins}/{challengeStats.total} đúng · +{challengeStats.creditsEarned} credits</p>
				</div>
				<div class="text-right">
					<p class="text-xl font-bold text-[#10B981] font-heading">{accuracy}%</p>
					<p class="text-[9px] text-[#A3A3A3] uppercase tracking-wider">chính xác</p>
				</div>
			</div>
		{/if}

		{#if words.length === 0}
			<div class="text-center py-16">
				<p class="text-4xl mb-4">📚</p>
				<h3 class="font-heading font-semibold text-[#1A1A1A] text-base mb-2">Ngân hàng từ vựng trống</h3>
				<p class="text-sm text-[#6B6B6B] max-w-xs mx-auto leading-relaxed">
					Thêm từ mới hoặc cụm từ bạn học được trong các bài hội thoại AI.
				</p>
			</div>
		{:else}
			<div class="flex flex-col">
				{#each words as word, i}
					<div class="py-4 {i < words.length - 1 ? 'border-b border-[#E8E8E8]' : ''}">
						<div class="flex items-start justify-between gap-3">
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2 mb-0.5">
									<h3 class="font-heading font-bold text-[#1A1A1A] text-lg leading-tight">{word.word}</h3>
									{#if word.mastered === 1}
										<span class="text-[10px] font-semibold text-[#10B981] uppercase tracking-wide bg-[#10B981]/10 px-1.5 py-0.5 rounded">✓</span>
									{/if}
								</div>
								<p class="text-sm text-[#6B6B6B]">{word.definition}</p>
								{#if word.context_sentence}
									<p class="text-xs text-[#A3A3A3] italic mt-1.5">"{word.context_sentence}"</p>
								{/if}
								<!-- Source badge -->
								<div class="mt-2">
									{#if word.lesson_id}
										<span class="inline-flex items-center gap-1 text-[10px] font-semibold text-[#A3A3A3] uppercase tracking-wide">
											<img src="/icons/i_lesson.png" alt="" class="w-3 h-3" /> Bài học
										</span>
									{:else}
										<span class="inline-flex items-center gap-1 text-[10px] font-semibold text-[#0088cc]/60 uppercase tracking-wide">
											<svg class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.95 7.23l-2.02 9.53c-.15.68-.55.85-1.12.53l-3.1-2.28-1.49 1.44c-.17.17-.3.3-.62.3l.22-3.15 5.72-5.16c.25-.22-.05-.34-.39-.13l-7.07 4.45-3.05-.95c-.66-.21-.67-.66.14-.98l11.92-4.6c.55-.2 1.03.13.86.97z"/></svg>
											Telegram
										</span>
									{/if}
								</div>
							</div>

							<div class="flex items-center gap-1.5 shrink-0">
								<form method="POST" action="?/toggle" use:enhance>
									<input type="hidden" name="id" value={word.id} />
									<input type="hidden" name="current" value={word.mastered} />
									<button
										class="w-8 h-8 rounded-full flex items-center justify-center border transition-colors
											{word.mastered === 1 ? 'bg-[#10B981]/15 border-[#10B981]/30 text-[#10B981]' : 'bg-white border-[#E8E8E8] text-[#D4D4D4] hover:border-[#D4960A] hover:text-[#D4960A]'}"
										title={word.mastered === 1 ? 'Đã thành thạo' : 'Đánh dấu thành thạo'}
									>
										<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
									</button>
								</form>
								<form method="POST" action="?/delete" use:enhance>
									<input type="hidden" name="id" value={word.id} />
									<button
										class="w-8 h-8 rounded-full flex items-center justify-center border border-[#E8E8E8] text-[#D4D4D4] hover:border-red-200 hover:text-red-400 transition-colors"
									>
										<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
									</button>
								</form>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- Add Modal -->
{#if showAddModal}
	<div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4">
		<div class="absolute inset-0 bg-[#1A1A1A]/50 backdrop-blur-sm" onclick={() => showAddModal = false}></div>
		<div class="relative w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden pointer-events-auto">
			<div class="px-5 py-4 border-b border-[#E8E8E8] flex items-center justify-between">
				<h2 class="font-heading font-bold text-[#1A1A1A]">Thêm từ vựng</h2>
				<button onclick={() => showAddModal = false} class="w-8 h-8 flex items-center justify-center rounded-full bg-[#F5F5F5] text-[#6B6B6B] hover:bg-[#E8E8E8] transition-colors">
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
				</button>
			</div>
			<form method="POST" action="?/add" class="p-5 flex flex-col gap-5" use:enhance={() => {
				isSubmitting = true;
				return async ({ update }) => {
					await update();
					isSubmitting = false;
					if (!form?.error) showAddModal = false;
				};
			}}>
				{#if form?.error}
					<div class="text-sm text-red-500">{form.error}</div>
				{/if}

				<div>
					<label class="block text-xs font-semibold text-[#A3A3A3] uppercase tracking-widest mb-2">Từ / Cụm từ *</label>
					<input type="text" name="word" required value={form?.word ?? ''} placeholder="vd: outreach, follow up"
						class="w-full px-0 py-2.5 bg-transparent text-[#1A1A1A] text-sm border-b border-[#E8E8E8] focus:border-[#D4960A] focus:outline-none transition-colors" />
				</div>
				<div>
					<label class="block text-xs font-semibold text-[#A3A3A3] uppercase tracking-widest mb-2">Định nghĩa *</label>
					<input type="text" name="definition" required value={form?.definition ?? ''} placeholder="vd: tiếp cận, theo dõi"
						class="w-full px-0 py-2.5 bg-transparent text-[#1A1A1A] text-sm border-b border-[#E8E8E8] focus:border-[#D4960A] focus:outline-none transition-colors" />
				</div>
				<div>
					<label class="block text-xs font-semibold text-[#A3A3A3] uppercase tracking-widest mb-2">Câu ví dụ (Tùy chọn)</label>
					<textarea name="context" rows="2" placeholder="I will follow up with the client tomorrow."
						class="w-full px-0 py-2.5 bg-transparent text-[#1A1A1A] text-sm border-b border-[#E8E8E8] focus:border-[#D4960A] focus:outline-none transition-colors resize-none">{form?.context ?? ''}</textarea>
				</div>

				<button type="submit" disabled={isSubmitting}
					class="w-full py-3.5 rounded-lg font-bold text-sm bg-[#D4960A] text-[#1A1A1A] hover:bg-[#b07d08] active:scale-[0.97] transition-all disabled:opacity-50">
					{isSubmitting ? 'Đang lưu...' : 'Lưu từ vựng'}
				</button>
			</form>
		</div>
	</div>
{/if}

<BottomNav active="dashboard" />
