<script lang="ts">
	import { enhance } from '$app/forms';
	import BottomNav from '$lib/components/BottomNav.svelte';

	let { data, form } = $props();
	let words = $derived(data.words as any[]);
	let challengeStats = $derived(data.challengeStats ?? { total: 0, wins: 0, creditsEarned: 0 });

	let showAddModal = $state(false);
	let isSubmitting = $state(false);

	let masteredCount = $derived(words.filter(w => w.mastered === 1).length);
</script>

<svelte:head>
	<title>Vocabulary Bank — VASpeak</title>
</svelte:head>

<div class="min-h-screen bg-[#FFFBF1] pb-24">
	<!-- Top Bar -->
	<div class="bg-white shadow-[0_4px_14px_rgba(27,54,93,0.04)] px-4 py-4 mb-6 sticky top-0 z-10 flex items-center gap-3">
		<a href="/dashboard" class="flex items-center justify-center w-10 h-10 rounded-full bg-[#1B365D]/5 text-[#1B365D]/50 hover:bg-[#1B365D]/10 transition-colors">
			<span class="text-xl leading-none -ml-1">←</span>
		</a>
		<div>
			<h1 class="font-heading font-bold text-lg text-[#1B365D]">Vocabulary Bank</h1>
			<p class="text-xs text-[#1B365D]/50 font-medium">{words.length} từ đã học • {masteredCount} đã thành thạo</p>
		</div>
	</div>

	<div class="max-w-md mx-auto px-4">
		<!-- Challenge Stats Banner -->
		{#if challengeStats.total > 0}
		<div class="bg-white rounded-2xl p-4 shadow-[0_2px_10px_rgba(27,54,93,0.05)] border border-[#1B365D]/6 mb-4 flex items-center gap-3">
			<div class="w-10 h-10 rounded-xl bg-[#0088cc]/10 flex items-center justify-center shrink-0">
				<svg class="w-5 h-5 text-[#0088cc]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.95 7.23l-2.02 9.53c-.15.68-.55.85-1.12.53l-3.1-2.28-1.49 1.44c-.17.17-.3.3-.62.3l.22-3.15 5.72-5.16c.25-.22-.05-.34-.39-.13l-7.07 4.45-3.05-.95c-.66-.21-.67-.66.14-.98l11.92-4.6c.55-.2 1.03.13.86.97z"/></svg>
			</div>
			<div class="flex-1">
				<p class="text-xs font-semibold text-[#1B365D]">Thử thách Telegram</p>
				<p class="text-[10px] text-[#1B365D]/40">{challengeStats.wins}/{challengeStats.total} đúng • +{challengeStats.creditsEarned} credits</p>
			</div>
			<div class="text-right">
				<p class="text-lg font-bold text-[#10B981]">{challengeStats.total > 0 ? Math.round((challengeStats.wins / challengeStats.total) * 100) : 0}%</p>
				<p class="text-[9px] text-[#1B365D]/30 uppercase tracking-wider">độ chính xác</p>
			</div>
		</div>
		{/if}

		<!-- Add Button -->
		<button
			onclick={() => showAddModal = true}
			class="w-full mb-6 bg-white border-2 border-dashed border-[#1B365D]/20 rounded-2xl p-4 flex flex-col items-center justify-center text-[#1B365D]/50 hover:bg-[#1B365D]/5 hover:border-[#1B365D]/40 active:scale-95 transition-all outline-none"
		>
			<span class="text-2xl mb-1">+</span>
			<span class="text-sm font-semibold">Thêm từ mới</span>
		</button>

		{#if words.length === 0}
			<div class="text-center py-12 px-4">
				<div class="text-5xl mb-4 opacity-50">📚</div>
				<h3 class="font-heading font-semibold text-[#1B365D] text-lg mb-2">Ngân hàng từ vựng trống</h3>
				<p class="text-sm text-[#1B365D]/60 leading-relaxed max-w-xs mx-auto">
					Thêm các từ mới hoặc cụm từ bạn học được trong các bài hội thoại AI vào đây.
				</p>
			</div>
		{:else}
			<div class="flex flex-col gap-3">
				{#each words as word}
					<div class="bg-white rounded-2xl p-4 shadow-[0_4px_14px_rgba(27,54,93,0.05)] border border-[#1B365D]/8 relative group">
						<div class="flex items-start justify-between gap-3 mb-2">
							<div>
								<h3 class="font-heading font-bold text-[#1B365D] text-lg">{word.word}</h3>
								<p class="text-sm text-[#1B365D]/70">{word.definition}</p>
							</div>
							
							<div class="flex items-center gap-2">
								<form method="POST" action="?/toggle" use:enhance>
									<input type="hidden" name="id" value={word.id} />
									<input type="hidden" name="current" value={word.mastered} />
									<button
										class="w-8 h-8 rounded-full flex items-center justify-center border transition-colors
											{word.mastered === 1 ? 'bg-[#10B981]/15 border-[#10B981]/30 text-[#10B981]' : 'bg-white border-[#1B365D]/10 text-[#1B365D]/20 hover:border-[#F2A906] hover:text-[#F2A906]'}"
										title={word.mastered === 1 ? 'Đã thành thạo' : 'Đánh dấu thành thạo'}
									>
										✓
									</button>
								</form>

								<form method="POST" action="?/delete" use:enhance>
									<input type="hidden" name="id" value={word.id} />
									<button class="w-8 h-8 rounded-full flex items-center justify-center bg-white border border-[#1B365D]/10 text-red-400 hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-colors">
										✕
									</button>
								</form>
							</div>
						</div>

						{#if word.context_sentence}
							<div class="mt-3 pt-3 border-t border-[#1B365D]/5">
								<p class="text-xs text-[#1B365D]/50 font-medium mb-1 tracking-wider uppercase">Ví dụ:</p>
								<p class="text-sm text-[#1B365D]/80 italic">"{word.context_sentence}"</p>
							</div>
						{/if}
						
						{#if word.lesson_id}
							<div class="mt-2 flex gap-1.5">
								<span class="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-[#1B365D]/5 text-[#1B365D]/50 px-2 py-0.5 rounded">
									<img src="/icons/i_lesson.png" alt="" class="w-3 h-3" /> Từ bài học
								</span>
							</div>
						{:else if !word.lesson_id}
							<div class="mt-2 flex gap-1.5">
								<span class="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-[#0088cc]/8 text-[#0088cc] px-2 py-0.5 rounded">
									<svg class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.95 7.23l-2.02 9.53c-.15.68-.55.85-1.12.53l-3.1-2.28-1.49 1.44c-.17.17-.3.3-.62.3l.22-3.15 5.72-5.16c.25-.22-.05-.34-.39-.13l-7.07 4.45-3.05-.95c-.66-.21-.67-.66.14-.98l11.92-4.6c.55-.2 1.03.13.86.97z"/></svg>
									Telegram
								</span>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- Add Modal -->
{#if showAddModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center px-4">
		<!-- Backdrop -->
		<div class="absolute inset-0 bg-[#1B365D]/40 backdrop-blur-sm" onclick={() => showAddModal = false}></div>
		
		<!-- Modal Content -->
		<div class="relative w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden pointer-events-auto">
			<div class="px-5 py-4 border-b border-[#1B365D]/10 flex items-center justify-between bg-gray-50/50">
				<h2 class="font-heading font-bold text-[#1B365D]">Thêm từ vựng</h2>
				<button onclick={() => showAddModal = false} class="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-[#1B365D]/10 text-[#1B365D]/50 hover:text-[#1B365D]">
					✕
				</button>
			</div>

			<form method="POST" action="?/add" class="p-5 flex flex-col gap-4" use:enhance={() => {
				isSubmitting = true;
				return async ({ update }) => {
					await update();
					isSubmitting = false;
					if (!form?.error) showAddModal = false;
				};
			}}>
				{#if form?.error}
					<div class="bg-red-50 text-red-500 text-sm px-3 py-2 rounded-xl mb-1">{form.error}</div>
				{/if}

				<div>
					<label class="block text-xs font-semibold uppercase tracking-wider text-[#1B365D]/50 mb-1.5 ml-1">Từ / Cụm từ *</label>
					<input
						type="text"
						name="word"
						required
						value={form?.word ?? ''}
						placeholder="vd: outreach, follow up"
						class="w-full bg-[#FFFBF1] border border-[#1B365D]/10 rounded-xl px-4 py-3 text-sm text-[#1B365D] focus:outline-none focus:border-[#F2A906]"
					/>
				</div>

				<div>
					<label class="block text-xs font-semibold uppercase tracking-wider text-[#1B365D]/50 mb-1.5 ml-1">Định nghĩa / Nghĩa Tiếng Việt *</label>
					<input
						type="text"
						name="definition"
						required
						value={form?.definition ?? ''}
						placeholder="vd: tiếp cận, theo dõi"
						class="w-full bg-[#FFFBF1] border border-[#1B365D]/10 rounded-xl px-4 py-3 text-sm text-[#1B365D] focus:outline-none focus:border-[#F2A906]"
					/>
				</div>

				<div>
					<label class="block text-xs font-semibold uppercase tracking-wider text-[#1B365D]/50 mb-1.5 ml-1">Câu ví dụ (Tùy chọn)</label>
					<textarea
						name="context"
						rows="2"
						placeholder="I will follow up with the client tomorrow."
						class="w-full bg-[#FFFBF1] border border-[#1B365D]/10 rounded-xl px-4 py-3 text-sm text-[#1B365D] focus:outline-none focus:border-[#F2A906] resize-none"
					>{form?.context ?? ''}</textarea>
				</div>

				<button
					type="submit"
					disabled={isSubmitting}
					class="w-full mt-2 py-3.5 rounded-xl font-bold text-sm bg-[#F2A906] text-[#1B365D] hover:bg-[#d99506] active:scale-95 transition-all shadow-md shadow-[#F2A906]/20 disabled:opacity-50"
				>
					{isSubmitting ? 'Đang lưu...' : 'Lưu từ vựng'}
				</button>
			</form>
		</div>
	</div>
{/if}

<BottomNav active="dashboard" />
