<script lang="ts">
	import { createAudioRecorder, formatRecordTime, transcribeAudio } from '$lib/audio-recorder';

	let { block, oncomplete }: {
		block: any;
		oncomplete: (score: RoleplayScore | null) => void;
	} = $props();

	type ChatMsg = { role: 'user' | 'assistant'; content: string };
	type RoleplayScore = {
		total: number;
		breakdown: { clarity: number; professionalism: number; vocabulary: number; confidence: number };
		feedback: string;
		highlight: string;
	};

	let rpMessages    = $state<ChatMsg[]>([]);
	let rpUserDraft   = $state('');
	let rpStreaming    = $state(false);
	let rpStreamText  = $state('');
	let rpCreditsLeft = $state<number | null>(null);
	let rpError       = $state('');
	let rpStarted     = $state(false);
	let rpScore       = $state<RoleplayScore | null>(null);
	let rpScoring     = $state(false);

	let rpState: 'idle' | 'recording' | 'processing' = $state('idle');
	let rpElapsed = $state(0);

	const rpRecorder = createAudioRecorder({
		maxDuration: 30,
		onStart: () => { rpState = 'recording'; rpElapsed = 0; },
		onTick:  (s) => { rpElapsed = s; },
		onStop:  async (blob) => {
			rpState = 'processing';
			const contextPrompt = rpMessages.map(m => m.content).join(' ');
			const result = await transcribeAudio(blob, contextPrompt, 'roleplay.webm');
			if ('error' in result) {
				rpError = result.error;
			} else {
				rpUserDraft = (rpUserDraft + ' ' + (result.text || '')).trim();
			}
			rpState = 'idle';
		},
		onError: (msg) => { rpError = msg; rpState = 'idle'; }
	});

	const rpExchanges = $derived(rpMessages.filter(m => m.role === 'user').length);
	const rpCanScore  = $derived(rpExchanges >= 2);

	$effect(() => {
		return () => rpRecorder.destroy();
	});

	function startRoleplay() {
		if (!block || rpStarted) return;
		rpStarted = true;
		rpError   = '';
		rpMessages = [{ role: 'assistant', content: block.client_opening }];
	}

	async function sendRoleplayMessage() {
		if (!rpUserDraft.trim() || rpStreaming || !block) return;
		const userMsg = rpUserDraft.trim();
		rpUserDraft  = '';
		rpError      = '';
		rpMessages   = [...rpMessages, { role: 'user', content: userMsg }];
		rpStreaming   = true;
		rpStreamText  = '';

		try {
			const res = await fetch('/api/roleplay', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					scenario:        block.scenario,
					clientPersona:   block.client_persona,
					clientOpening:   block.client_opening,
					scoringCriteria: block.scoring_criteria ?? [],
					messages:        [...rpMessages]
				})
			});

			if (!res.ok) {
				const j = await res.json().catch(() => ({})) as any;
				rpError    = res.status === 402
					? `Hết AI Credits! Còn ${j.remaining ?? 0} credits.`
					: (j.error ?? 'Lỗi không xác định.');
				rpMessages = rpMessages.slice(0, -1);
				return;
			}

			const credits = res.headers.get('X-Credits-Remaining');
			if (credits) rpCreditsLeft = parseInt(credits);

			const reader  = res.body!.getReader();
			const decoder = new TextDecoder();
			let full = '';
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				full += decoder.decode(value, { stream: true });
				rpStreamText = full;
			}
			rpMessages   = [...rpMessages, { role: 'assistant', content: full }];
			rpStreamText = '';
		} catch (e) {
			rpError = `Lỗi kết nối: ${String(e)}`;
		} finally {
			rpStreaming = false;
		}
	}

	async function scoreRoleplay() {
		if (!block || rpScoring || rpMessages.length < 2) return;
		rpScoring = true;
		rpError   = '';
		const history    = rpMessages.map(m => `${m.role === 'user' ? 'VA' : 'Client'}: ${m.content}`).join('\n');
		const vaResponse = rpMessages.filter(m => m.role === 'user').map(m => m.content).join(' | ');
		try {
			const res = await fetch('/api/roleplay/score', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					scenario:            block.scenario,
					scoringCriteria:     block.scoring_criteria ?? [],
					vaResponse,
					conversationHistory: history
				})
			});
			const j = await res.json() as any;
			if (j.ok) rpScore = j.score; else rpError = j.error ?? 'Không thể chấm điểm.';
		} catch (e) {
			rpError = `Lỗi: ${String(e)}`;
		} finally {
			rpScoring = false;
		}
	}
</script>

<!-- Scenario header -->
<div class="bg-[#1A1A1A] text-white rounded-xl p-4 mb-4">
	<p class="text-xs font-semibold uppercase tracking-wider text-white/45 mb-1 flex items-center gap-1">Kịch bản · <img src="/icons/i_credit.png" alt="" class="w-3.5 h-3.5 inline" />{block.credit_cost ?? 3} credits/lượt</p>
	<p class="text-sm text-white/80 leading-relaxed">{block.scenario}</p>
</div>

{#if !rpStarted}
	<!-- Pre-start -->
	<div class="mb-4">
		<div class="flex items-center gap-2 mb-3">
			<div class="w-8 h-8 rounded-full bg-[#F3EFFF] flex items-center justify-center p-1.5"><img src="/icons/i_speaking.png" alt="AI" class="w-full h-full" /></div>
			<div>
				<p class="font-semibold text-[#1A1A1A] text-sm">AI Client</p>
				<p class="text-[#A3A3A3] text-xs">{block.client_persona}</p>
			</div>
		</div>
		<p class="text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-2 mt-4">Tiêu chí</p>
		<ul class="space-y-1.5">
			{#each block.scoring_criteria ?? [] as c}
				<li class="flex gap-2 text-xs text-[#6B6B6B]"><span class="text-[#D4960A]"><img src="/icons/i_check.png" alt="" class="w-3 h-3 inline" /></span>{c}</li>
			{/each}
		</ul>
	</div>
	<button
		onclick={startRoleplay}
		class="w-full py-3.5 rounded-lg font-bold text-sm bg-[#1A1A1A] text-white hover:bg-[#333] active:scale-95 transition-all flex items-center justify-center gap-2"
	>
		<img src="/icons/i_microphone2.png" alt="" class="w-5 h-5 invert" /> Bắt đầu hội thoại AI
	</button>
{:else}
	<!-- Chat thread -->
	<div class="mb-4">
		<!-- Credits badge -->
		{#if rpCreditsLeft !== null}
			<div class="flex justify-end mb-2">
				<span class="text-xs bg-[#D4960A]/10 text-[#6B6B6B] px-2.5 py-0.5 rounded-full flex items-center gap-1"><img src="/icons/i_credit.png" alt="" class="w-3.5 h-3.5" /> {rpCreditsLeft} credits</span>
			</div>
		{/if}
		<!-- Messages -->
		<div class="flex flex-col gap-3 max-h-72 overflow-y-auto">
			{#each rpMessages as msg (msg.role + msg.content.slice(0, 12))}
				{#if msg.role === 'assistant'}
					<div class="flex gap-2 items-start">
						<div class="w-7 h-7 rounded-full bg-[#F3EFFF] flex items-center justify-center p-1 flex-shrink-0"><img src="/icons/i_speaking.png" alt="AI" class="w-full h-full" /></div>
						<div class="bg-[#F3EFFF] rounded-2xl rounded-tl-none px-3.5 py-2.5 text-sm text-[#1A1A1A] leading-relaxed max-w-[85%]">{msg.content}</div>
					</div>
				{:else}
					<div class="flex gap-2 items-start justify-end">
						<div class="bg-[#FFF5E0] rounded-2xl rounded-tr-none px-3.5 py-2.5 text-sm text-[#1A1A1A] leading-relaxed max-w-[85%]">{msg.content}</div>
						<div class="w-7 h-7 rounded-full bg-[#D4960A]/15 flex items-center justify-center p-1 flex-shrink-0"><img src="/icons/i_user.png" alt="You" class="w-full h-full" /></div>
					</div>
				{/if}
			{/each}
			{#if rpStreaming}
				<div class="flex gap-2 items-start">
					<div class="w-7 h-7 rounded-full bg-[#F3EFFF] flex items-center justify-center p-1 flex-shrink-0"><img src="/icons/i_speaking.png" alt="AI" class="w-full h-full" /></div>
					<div class="bg-[#F3EFFF] rounded-2xl rounded-tl-none px-3.5 py-2.5 text-sm text-[#1A1A1A] leading-relaxed max-w-[85%]">
						{#if rpStreamText}{rpStreamText}{:else}<span class="animate-pulse">…</span>{/if}
					</div>
				</div>
			{/if}
		</div>
		<!-- Input row -->
		<div class="flex gap-2 mt-3 items-end">
			{#if rpState === 'recording'}
				<div class="flex-1 flex items-center justify-center gap-2 p-3 text-red-500 text-sm font-medium animate-pulse border border-red-200 rounded-lg bg-red-50/50">
					<img src="/icons/i_microphone2.png" alt="" class="w-4 h-4" /> Đang ghi âm · {formatRecordTime(rpElapsed)}
				</div>
				<button
					onclick={() => rpRecorder.stop()}
					class="px-3 py-3 rounded-lg bg-red-500 text-white font-bold text-sm active:scale-95 transition-all self-end"
				>Dừng</button>
			{:else}
				<div class="flex-1 relative">
					<textarea
						bind:value={rpUserDraft}
						placeholder={rpState === 'processing' ? "Đang chuyển giọng nói..." : "Nhập câu trả lời..."}
						rows="2"
						disabled={rpState === 'processing'}
						class="w-full text-sm text-[#1A1A1A] placeholder-[#A3A3A3] resize-none focus:outline-none p-3 rounded-lg bg-transparent border border-[#E8E8E8] focus:border-[#D4960A] transition-colors {rpState === 'processing' ? 'opacity-50' : ''}"
						onkeydown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendRoleplayMessage(); } }}
					></textarea>
				</div>
				<div class="flex flex-col gap-1">
					<button
						onclick={() => rpRecorder.start()}
						disabled={rpStreaming || rpState === 'processing'}
						title="Nhập bằng giọng nói"
						class="px-3 py-1.5 rounded-lg bg-transparent border border-[#E8E8E8] text-[#1A1A1A] font-bold text-sm hover:border-[#D4960A] active:scale-95 transition-all text-center disabled:opacity-50"
					><img src="/icons/i_microphone2.png" alt="Voice" class="w-5 h-5" /></button>
					<button
						onclick={sendRoleplayMessage}
						disabled={rpStreaming || rpState === 'processing' || !rpUserDraft.trim()}
						class="px-3 py-1.5 rounded-lg bg-[#D4960A] text-[#1A1A1A] font-bold text-sm disabled:opacity-40 active:scale-95 transition-all self-end"
					>Gửi</button>
				</div>
			{/if}
		</div>
	</div>

	{#if rpError}
		<p class="text-red-500 text-xs mb-2 px-1">{rpError}</p>
	{/if}

	<!-- Score Results -->
	{#if rpScore}
		<div class="rounded-xl border-b border-[#E8E8E8] p-5 mb-3">
			<div class="flex items-center gap-3 mb-4">
				<div class="text-3xl font-bold text-[#1A1A1A]">{rpScore.total}<span class="text-lg text-[#A3A3A3]">/100</span></div>
				<div class="flex-1">
					<div class="h-1.5 bg-[#E8E8E8] rounded-full overflow-hidden">
						<div class="h-full bg-[#10B981] rounded-full transition-all" style="width:{rpScore.total}%"></div>
					</div>
				</div>
			</div>
			<div class="grid grid-cols-2 gap-2 mb-4">
				{#each Object.entries(rpScore.breakdown) as [k, v]}
					<div class="bg-[#F5F0E6] rounded-lg p-2.5">
						<p class="text-xs text-[#A3A3A3] capitalize mb-0.5">{k}</p>
						<p class="font-bold text-[#1A1A1A] text-sm">{v}<span class="text-[#A3A3A3]">/25</span></p>
					</div>
				{/each}
			</div>
			{#if rpScore.feedback}<p class="text-sm text-[#6B6B6B] leading-relaxed">{rpScore.feedback}</p>{/if}
			{#if rpScore.highlight}<p class="mt-2 text-xs text-[#10B981]"><img src="/icons/i_star.png" alt="" class="w-3 h-3 inline mr-0.5" /> "{rpScore.highlight}"</p>{/if}
		</div>
	{:else if rpCanScore}
		<button
			onclick={scoreRoleplay}
			disabled={rpScoring}
			class="w-full py-3 rounded-lg font-bold text-sm border border-[#D4960A] text-[#D4960A] hover:bg-[#D4960A]/5 active:scale-95 transition-all disabled:opacity-50"
		>
			{rpScoring ? 'Đang chấm điểm…' : 'Chấm điểm hội thoại của tôi'}
		</button>
	{/if}
{/if}

<!-- Fixed Bottom CTA -->
<div class="fixed bottom-0 left-0 right-0 bg-[#FAFAF8]/90 backdrop-blur-lg border-t border-[#E8E8E8] px-5 py-4">
	<div class="max-w-lg mx-auto">
		<button
			onclick={() => oncomplete(rpScore)}
			class="w-full py-3.5 rounded-lg font-bold text-sm transition-all
				{rpScore
					? 'bg-[#10B981] text-white hover:bg-[#0da871] active:scale-[0.97]'
					: 'bg-white border-2 border-[#D4960A]/40 text-[#D4960A] hover:bg-[#D4960A]/5 active:scale-[0.97]'}"
		>
			{rpScore ? 'Tiếp tục →' : 'Bỏ qua & tiếp tục →'}
		</button>
	</div>
</div>
