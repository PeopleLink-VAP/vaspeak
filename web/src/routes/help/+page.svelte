<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData, form: ActionData } = $props();
	
	let activeTab = $state<'kb' | 'feedback' | 'chat'>('kb');
	let searchQuery = $state('');
	
	// KB State
	let expandedArticle = $state<string | null>(null);
	let filteredArticles = $derived(
		searchQuery.trim() === ''
			? data.articles
			: data.articles.filter(a => 
				a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
				a.content.toLowerCase().includes(searchQuery.toLowerCase())
			)
	);

	// Feedback form states
	let isSubmittingFeedback = $state(false);
	let feedbackPreviewUrl = $state<string | null>(null);

	// Chat states
	let chatMessages = $state<{role: 'user'|'assistant', content: string}[]>([
		{ role: 'assistant', content: 'Xin chào! Tôi có thể giúp gì cho bạn hôm nay?' }
	]);
	let chatInput = $state('');
	let isChatting = $state(false);

	const handleImageChange = (e: Event) => {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			feedbackPreviewUrl = URL.createObjectURL(file);
		} else {
			feedbackPreviewUrl = null;
		}
	};

	const sendChatMessage = async () => {
		if (!chatInput.trim() || isChatting) return;
		
		const msg = chatInput.trim();
		chatMessages = [...chatMessages, { role: 'user', content: msg }];
		chatInput = '';
		isChatting = true;

		try {
			const res = await fetch('/api/support/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ messages: chatMessages })
			});
			const result = await res.json();
			if (result.success) {
				chatMessages = [...chatMessages, { role: 'assistant', content: result.reply }];
			} else {
				chatMessages = [...chatMessages, { role: 'assistant', content: 'Rất tiếc dịch vụ hỗ trợ đang bận. Vui lòng thử lại sau.' }];
			}
		} catch (e) {
			chatMessages = [...chatMessages, { role: 'assistant', content: 'Lỗi kết nối. Vui lòng kiểm tra lại mạng.' }];
		} finally {
			isChatting = false;
		}
	};
</script>

<svelte:head>
	<title>Trung Tâm Hỗ Trợ — VASpeak</title>
</svelte:head>

<div class="min-h-screen bg-[#FAFAF8] pb-10 flex flex-col">
	<!-- Top bar -->
	<div class="sticky top-0 z-10 bg-[#FAFAF8]/95 backdrop-blur-lg border-b border-[#E8E8E8] px-4 py-3 flex items-center gap-3">
		<a href="/profile" class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 active:scale-95 transition-all text-[#1A1A1A]">
			<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
		</a>
		<h1 class="font-heading font-bold text-[#1A1A1A] text-lg">Hỗ Trợ</h1>
	</div>

	<!-- Tabs -->
	<div class="flex items-center gap-6 px-5 border-b border-[#E8E8E8] pt-2 overflow-x-auto no-scrollbar">
		<button 
			onclick={() => activeTab = 'kb'} 
			class="pb-3 text-sm font-semibold tracking-wide border-b-2 transition-colors whitespace-nowrap {activeTab === 'kb' ? 'border-[#D4960A] text-[#1A1A1A]' : 'border-transparent text-[#A3A3A3] hover:text-[#1A1A1A]'}"
		>
			Kiến Thức
		</button>
		<button 
			onclick={() => activeTab = 'feedback'} 
			class="pb-3 text-sm font-semibold tracking-wide border-b-2 transition-colors whitespace-nowrap {activeTab === 'feedback' ? 'border-[#D4960A] text-[#1A1A1A]' : 'border-transparent text-[#A3A3A3] hover:text-[#1A1A1A]'}"
		>
			Phản Hồi & Báo Lỗi
		</button>
		<button 
			onclick={() => activeTab = 'chat'} 
			class="pb-3 text-sm font-semibold tracking-wide border-b-2 transition-colors whitespace-nowrap {activeTab === 'chat' ? 'border-[#D4960A] text-[#1A1A1A]' : 'border-transparent text-[#A3A3A3] hover:text-[#1A1A1A]'}"
		>
			Chat Hỗ Trợ
		</button>
	</div>

	<div class="flex-1 px-5 pt-6 pb-20 max-w-md mx-auto w-full">
		{#if activeTab === 'kb'}
			<!-- Knowledge Base -->
			<div class="relative mb-6">
				<svg class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#A3A3A3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
				<input 
					type="text" 
					bind:value={searchQuery}
					placeholder="Tìm kiếm vấn đề của bạn..." 
					class="w-full bg-white border border-[#E8E8E8] rounded-xl pl-10 pr-4 py-3.5 text-sm text-[#1A1A1A] placeholder:text-[#A3A3A3] focus:border-[#D4960A] focus:outline-none transition-colors"
				/>
			</div>

			<div class="flex flex-col gap-3">
				{#each filteredArticles as article}
					<button 
						onclick={() => expandedArticle = expandedArticle === article.id ? null : article.id}
						class="flex flex-col text-left bg-white border border-[#E8E8E8] rounded-xl overflow-hidden transition-all {expandedArticle === article.id ? 'border-[#D4960A]' : 'hover:border-[#D4960A]/50'}"
					>
						<div class="flex items-center justify-between p-4 bg-white">
							<h3 class="font-semibold text-[#1A1A1A] text-sm pr-4">{article.title}</h3>
							<svg class="w-4 h-4 text-[#A3A3A3] shrink-0 transition-transform {expandedArticle === article.id ? 'rotate-180 text-[#D4960A]' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
						</div>
						{#if expandedArticle === article.id}
							<div class="p-4 pt-0 text-sm text-[#6B6B6B] leading-relaxed border-t border-[#E8E8E8]/50 bg-[#FAFAF8]/50 mt-1">
								{article.content}
							</div>
						{/if}
					</button>
				{:else}
					<div class="text-center py-10">
						<p class="text-[#A3A3A3] text-sm">Không tìm thấy kết quả nào với từ khóa "{searchQuery}"</p>
					</div>
				{/each}
			</div>

		{:else if activeTab === 'feedback'}
			<!-- Feedback Form -->
			<form 
				method="POST" 
				action="?/submitFeedback" 
				enctype="multipart/form-data" 
				class="flex flex-col gap-5"
				use:enhance={() => {
					isSubmittingFeedback = true;
					return async ({ update }) => { 
						await update(); 
						isSubmittingFeedback = false; 
						if (form?.success) feedbackPreviewUrl = null;
					};
				}}
			>
				{#if form?.isFeedback && form?.success}
					<div class="p-3 bg-[#10B981]/10 text-[#10B981] rounded-xl text-sm font-medium border border-[#10B981]/20 flex items-center gap-2">
						<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
						{form.message}
					</div>
				{/if}
				{#if form?.isFeedback && form?.error}
					<div class="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-2">
						<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
						{form.error}
					</div>
				{/if}

				<div>
					<label for="topic" class="block text-xs font-semibold text-[#A3A3A3] uppercase tracking-widest mb-2">Chủ Đề</label>
					<select id="topic" name="topic" required class="w-full bg-transparent text-[#1A1A1A] text-sm py-2.5 border-b border-[#E8E8E8] focus:border-[#D4960A] focus:outline-none transition-colors appearance-none">
						<option value="general">Góp ý chung</option>
						<option value="bug">Báo lỗi hệ thống</option>
						<option value="content">Phản hồi về nội dung bài học</option>
						<option value="account">Vấn đề tài khoản / thanh toán</option>
					</select>
				</div>

				<div>
					<label for="message" class="block text-xs font-semibold text-[#A3A3A3] uppercase tracking-widest mb-2">Lời Nhắn</label>
					<textarea id="message" name="message" required rows="4" placeholder="Mô tả chi tiết vấn đề của bạn..." class="w-full bg-white border border-[#E8E8E8] rounded-xl p-3.5 text-sm text-[#1A1A1A] placeholder:text-[#A3A3A3] focus:border-[#D4960A] focus:outline-none transition-colors resize-none"></textarea>
				</div>

				<div>
					<p class="block text-xs font-semibold text-[#A3A3A3] uppercase tracking-widest mb-2">Đính kèm ảnh (Tùy chọn)</p>
					
					{#if feedbackPreviewUrl}
						<div class="relative w-full aspect-video rounded-xl border border-[#E8E8E8] overflow-hidden mb-3 bg-[#FAFAF8]">
							<!-- svelte-ignore a11y_img_redundant_alt -->
							<img src={feedbackPreviewUrl} alt="Preview" class="w-full h-full object-contain" />
							<button type="button" onclick={() => feedbackPreviewUrl = null} class="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 shadow-sm flex items-center justify-center text-red-500 hover:scale-105 active:scale-95 transition-all">
								<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
							</button>
						</div>
					{:else}
						<label class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#E8E8E8] rounded-xl hover:border-[#D4960A] hover:bg-[#D4960A]/5 transition-colors cursor-pointer group">
							<svg class="w-6 h-6 text-[#A3A3A3] group-hover:text-[#D4960A] mb-2 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
							<span class="text-[11px] font-semibold text-[#A3A3A3] uppercase tracking-wide group-hover:text-[#D4960A] transition-colors">Tải ảnh lên chụp màn hình</span>
							<input type="file" name="attachment" accept="image/*" class="hidden" onchange={handleImageChange} />
						</label>
					{/if}
				</div>

				<button type="submit" disabled={isSubmittingFeedback} class="w-full py-3.5 rounded-xl font-bold text-sm bg-[#1A1A1A] text-white hover:bg-[#333] active:scale-[0.97] transition-all disabled:opacity-50 mt-2">
					{isSubmittingFeedback ? 'Đang gửi...' : 'Gửi Phản Hồi'}
				</button>
			</form>

		{:else if activeTab === 'chat'}
			<div class="h-full flex flex-col -mx-5 px-5 -mt-6 pt-6">
				<!-- Chat window -->
				<div class="flex-1 flex flex-col gap-4 overflow-y-auto mb-4 pb-12 pt-4">
					{#each chatMessages as msg}
						<div class="flex w-full {msg.role === 'user' ? 'justify-end' : 'justify-start'}">
							<div class="max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed {msg.role === 'user' ? 'bg-[#D4960A] text-white rounded-br-sm' : 'bg-white border border-[#E8E8E8] text-[#1A1A1A] rounded-bl-sm'}">
								{msg.content}
							</div>
						</div>
					{/each}
					{#if isChatting}
						<div class="flex w-full justify-start">
							<div class="bg-white border border-[#E8E8E8] rounded-2xl rounded-bl-sm px-4 py-3.5 flex items-center gap-1.5">
								<div class="w-1.5 h-1.5 rounded-full bg-[#A3A3A3] animate-bounce"></div>
								<div class="w-1.5 h-1.5 rounded-full bg-[#A3A3A3] animate-bounce" style="animation-delay: 150ms"></div>
								<div class="w-1.5 h-1.5 rounded-full bg-[#A3A3A3] animate-bounce" style="animation-delay: 300ms"></div>
							</div>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>
	
	<!-- Chat input footer -->
	{#if activeTab === 'chat'}
		<div class="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#FAFAF8] border-t border-[#E8E8E8] p-3 safe-bottom">
			<form class="flex items-end gap-2" onsubmit={(e) => { e.preventDefault(); sendChatMessage(); }}>
				<textarea 
					bind:value={chatInput} 
					onkeydown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); } }}
					placeholder="Nhắn tin cho đội ngũ hỗ trợ..." 
					class="flex-1 bg-white border border-[#E8E8E8] rounded-2xl px-4 py-3 text-sm text-[#1A1A1A] placeholder:text-[#A3A3A3] focus:border-[#D4960A] focus:outline-none transition-colors resize-none max-h-32 min-h-12"
					rows="1"
				></textarea>
				<button type="submit" disabled={!chatInput.trim() || isChatting} class="w-12 h-12 shrink-0 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center hover:bg-[#333] active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100">
					<svg class="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z"/></svg>
				</button>
			</form>
		</div>
	{/if}
</div>
