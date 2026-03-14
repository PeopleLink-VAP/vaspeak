<script lang="ts">
	import { goto } from '$app/navigation';
	import { createAudioRecorder, formatRecordTime, transcribeAudio } from '$lib/audio-recorder';
	import AudioPlayer from '$lib/components/AudioPlayer.svelte';

	let { data } = $props();
	let lesson = $derived(data.lesson);
	let blocks = $derived(lesson.content as any[]);
	const blockMeta = [
		{ label: 'Nghe & Giải Mã', icon: '/icons/i_listen.png' },
		{ label: 'Luyện Mẫu Câu', icon: '/icons/i_speaking.png' },
		{ label: 'Hội Thoại AI',   icon: '/icons/i_microphone.png' },
		{ label: 'Phản Hồi',       icon: '/icons/i_writing.png' }
	];

	// ── Core state ────────────────────────────────────────────────────
	let currentBlock    = $state(0);
	let selectedAnswer  = $state<number | null>(null);
	let answered        = $state(false);
	let selectedEmotion = $state<number | null>(null);
	let reflectionText  = $state('');
	let drillingIndex   = $state(0);
	let completedBlocks = $state<Set<number>>(new Set());

	let block       = $derived(blocks[currentBlock]);
	let totalBlocks = $derived(blocks.length);
	let progressPct = $derived(Math.round((currentBlock / totalBlocks) * 100));

	// ── Drilling state (Block 2) ──────────────────────────────────────
	let drState: 'idle' | 'recording' | 'processing' = $state('idle');
	let drElapsed     = $state(0);
	let drTranscript  = $state<string | null>(null);
	let drResult      = $state<'pass' | 'fail' | null>(null);
	let drError       = $state('');

	const drRecorder = createAudioRecorder({
		maxDuration: 15,
		onStart:  () => { drState = 'recording'; drElapsed = 0; },
		onTick:   (s) => { drElapsed = s; },
		onStop:   async (blob) => {
			drState = 'processing';
			const target = block?.patterns?.[drillingIndex]?.target || '';
			const result = await transcribeAudio(blob, target, 'drilling.webm');
			if ('error' in result) {
				drError = result.error;
				drState = 'idle';
				return;
			}
			drTranscript = result.text;
			// Forgiving match
			const targetStr = target.toLowerCase().replace(/[^\w\s]/gi, '').trim();
			const spokenStr = (result.text || '').toLowerCase().replace(/[^\w\s]/gi, '').trim();
			if (targetStr && spokenStr && (spokenStr.includes(targetStr) || targetStr.includes(spokenStr))) {
				drResult = 'pass';
			} else {
				drResult = 'fail';
			}
			drState = 'idle';
		},
		onError:  (msg) => { drError = msg; drState = 'idle'; }
	});

	// ── Roleplay state (Block 3) ──────────────────────────────────────
	type ChatMsg = { role: 'user' | 'assistant'; content: string };

	let rpMessages    = $state<ChatMsg[]>([]);
	let rpUserDraft   = $state('');
	let rpStreaming    = $state(false);
	let rpStreamText  = $state('');
	let rpCreditsLeft = $state<number | null>(null);
	let rpError       = $state('');
	let rpStarted     = $state(false);
	let rpScore       = $state<null | {
		total: number;
		breakdown: { clarity: number; professionalism: number; vocabulary: number; confidence: number };
		feedback: string;
		highlight: string;
	}>(null);
	let rpScoring     = $state(false);

	// Voice input for Roleplay
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

	// Cleanup recorders on component destroy
	$effect(() => {
		return () => {
			drRecorder.destroy();
			rpRecorder.destroy();
		};
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

	// ── Navigation ────────────────────────────────────────────────────
	function selectAnswer(idx: number) {
		if (answered) return;
		selectedAnswer = idx;
		answered = true;
	}

	function nextBlock() {
		completedBlocks.add(currentBlock);
		drRecorder.destroy();
		rpRecorder.destroy();
		if (currentBlock < totalBlocks - 1) {
			currentBlock++;
			selectedAnswer = null;
			answered       = false;
			drillingIndex  = 0;
			drTranscript = null; drResult = null; drError = ''; drState = 'idle';
			rpMessages     = []; rpStarted = false;
			rpScore = null;     rpError = ''; rpStreamText = ''; rpState = 'idle';
		} else {
			saveProgress();
		}
	}

	function nextPattern() {
		const patterns = block.patterns ?? [];
		drRecorder.destroy();
		if (drillingIndex < patterns.length - 1) {
			drillingIndex++;
			drTranscript = null; drResult = null; drError = ''; drState = 'idle';
		}
		else nextBlock();
	}

	// ── Rewards state ──────────────────────────────────────────────
	let rewardToast = $state<{ streakBonus?: { credits: number; message: string }; newMilestones?: Array<{ id: string; label: string; icon: string; credits: number }> } | null>(null);
	let showingRewards = $state(false);

	async function saveProgress() {
		const blockCompletions: Record<string, boolean> = {};
		for (let i = 0; i < totalBlocks; i++) blockCompletions[`block_${i + 1}`] = completedBlocks.has(i);
		try {
			const res = await fetch('/api/progress', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					lessonId:        lesson.id,
					blockCompletions,
					simulationScores: rpScore ? { roleplay: rpScore } : undefined,
					stressLevel:     selectedEmotion !== null ? selectedEmotion + 1 : null,
					reflectionNotes: reflectionText || null
				})
			});
			const json = await res.json();
			if (json.rewards && (json.rewards.streakBonus || json.rewards.newMilestones?.length)) {
				rewardToast = json.rewards;
				showingRewards = true;
				// Show rewards for 4 seconds then navigate
				setTimeout(() => { goto('/dashboard'); }, 4000);
				return;
			}
		} catch { /* silent */ }
		goto('/dashboard');
	}
</script>

<svelte:head>
	<title>Day {lesson.day}: {lesson.title} — VASpeak</title>
</svelte:head>

<div class="min-h-screen bg-[#FFFBF1] flex flex-col max-w-lg mx-auto">

	<!-- Top Bar -->
	<div class="sticky top-0 z-10 bg-[#FFFBF1]/95 backdrop-blur-sm px-4 pt-4 pb-3">
		<div class="flex items-center gap-3">
			<a href="/dashboard" class="text-[#1B365D]/50 hover:text-[#1B365D] transition-colors text-xl leading-none">✕</a>
			<!-- Progress bar -->
			<div class="flex-1 h-2.5 bg-[#1B365D]/10 rounded-full overflow-hidden">
				<div
					class="h-full bg-[#F2A906] rounded-full transition-all duration-500"
					style="width: {progressPct}%"
				></div>
			</div>
			<span class="text-[#1B365D]/50 text-xs font-medium">{currentBlock + 1}/{totalBlocks}</span>
		</div>

		<!-- Block tabs -->
		<div class="flex gap-2 mt-3">
			{#each blockMeta as meta, i}
				<button
					onclick={() => { if (completedBlocks.has(i) || i === currentBlock) currentBlock = i; }}
					class="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium border transition-all
						{i === currentBlock ? 'bg-[#F2A906] border-[#F2A906] text-[#1B365D]' :
						completedBlocks.has(i) ? 'bg-[#10B981]/15 border-[#10B981]/30 text-[#10B981]' :
						'bg-white border-[#1B365D]/10 text-[#1B365D]/40'}"
				>
					<img src={meta.icon} alt={meta.label} class="w-5 h-5" />
				</button>
			{/each}
		</div>
	</div>

	<!-- Block Content -->
	<div class="flex-1 px-4 py-2 pb-28">
		{#if block}
			<div class="mb-4">
				<span class="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#1B365D]/50">
					<img src={blockMeta[currentBlock]?.icon} alt="" class="w-4 h-4" /> Block {currentBlock + 1} — {blockMeta[currentBlock]?.label}
				</span>
				<h2 class="font-heading font-bold text-[#1B365D] text-xl mt-1 leading-tight">{lesson.title}</h2>
			</div>

			<!-- ===== LISTENING BLOCK ===== -->
			{#if block.type === 'listening'}
				<p class="text-[#1B365D]/65 text-sm mb-5">{block.instruction}</p>

				<div class="mb-5">
					<AudioPlayer text={block.audio_script} title="Client Conversation" />
				</div>
				<!-- Transcript -->
				<details class="mb-5">
					<summary class="text-xs text-[#1B365D]/40 cursor-pointer hover:text-[#1B365D]/70">Xem transcript</summary>
					<p class="mt-2 text-[#1B365D]/70 text-sm leading-relaxed italic bg-[#FFFBF1] rounded-xl p-3">
						{block.audio_script}
					</p>
				</details>

				<!-- MCQ -->
				<p class="font-heading font-semibold text-[#1B365D] mb-3">{block.question}</p>
				<div class="flex flex-col gap-2.5">
					{#each block.options ?? [] as option, i}
						<button
							onclick={() => selectAnswer(i)}
							class="text-left w-full px-4 py-3.5 rounded-xl border text-sm font-medium transition-all
								{answered && i === block.answer ? 'bg-[#10B981]/10 border-[#10B981] text-[#10B981]' :
								answered && i === selectedAnswer && i !== block.answer ? 'bg-red-50 border-red-300 text-red-500' :
								selectedAnswer === i && !answered ? 'border-[#F2A906] bg-[#F2A906]/10 text-[#1B365D]' :
								'bg-white border-[#1B365D]/12 text-[#1B365D] hover:border-[#F2A906]/50'}"
						>
							<span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#1B365D]/8 text-xs mr-2">
								{String.fromCharCode(65 + i)}
							</span>
							{option}
						</button>
					{/each}
				</div>

			<!-- ===== DRILLING BLOCK ===== -->
			{:else if block.type === 'drilling'}
				<p class="text-[#1B365D]/65 text-sm mb-5">{block.instruction}</p>

				{@const patterns = block.patterns ?? []}
				{@const pattern = patterns[drillingIndex]}
				{#if pattern}
					<div class="bg-white rounded-2xl p-5 shadow-[0_4px_14px_rgba(27,54,93,0.08)] border border-[#1B365D]/8 mb-4">
						<div class="text-xs text-[#1B365D]/40 mb-3 uppercase tracking-wider font-medium">
							{drillingIndex + 1} / {patterns.length}
						</div>
						<p class="text-[#1B365D]/60 text-sm mb-4">📌 {pattern.prompt}</p>
						<div class="bg-[#F2A906]/8 rounded-xl p-4 border border-[#F2A906]/20">
							<p class="font-heading font-semibold text-[#1B365D] text-base leading-relaxed">
								"{pattern.target}"
							</p>
						</div>
					</div>
					<div class="flex flex-col gap-2.5">
						{#if drState === 'recording'}
							<button onclick={() => drRecorder.stop()} class="w-full bg-red-500 border border-red-600 rounded-xl py-3.5 flex items-center justify-center gap-2 text-white text-sm font-bold shadow-md shadow-red-500/20 active:scale-95 transition-all animate-pulse">
								🛑 Dừng ghi âm · {formatRecordTime(drElapsed)}
							</button>
						{:else if drState === 'processing'}
							<div class="w-full bg-white border border-[#1B365D]/12 rounded-xl py-3.5 flex items-center justify-center gap-2 text-[#1B365D]/50 text-sm">
								⏳ Đang phân tích...
							</div>
						{:else}
							<button onclick={() => { drError = ''; drTranscript = null; drResult = null; drRecorder.start(); }} class="w-full bg-white border border-[#1B365D]/20 rounded-xl py-3.5 flex items-center justify-center gap-2 text-[#1B365D] text-sm font-bold hover:bg-[#F2A906]/10 hover:border-[#F2A906]/40 active:scale-95 transition-all">
								<img src="/icons/i_microphone2.png" alt="" class="w-5 h-5" /> Bấm để nói
							</button>
						{/if}

						{#if drTranscript}
							<div class="bg-white rounded-xl p-4 border border-[#1B365D]/10 mt-1">
								<p class="text-xs text-[#1B365D]/50 mb-1">Bạn đã nói:</p>
								<p class="text-sm font-medium {drResult === 'pass' ? 'text-green-600' : 'text-red-500'}">"{drTranscript}"</p>
								{#if drResult === 'pass'}
									<p class="text-xs text-green-600 mt-2 font-bold">✅ Phát âm ổn áp! Giỏi quá.</p>
								{:else if drResult === 'fail'}
									<p class="text-xs text-red-500 mt-2 font-bold">❌ Có vẻ Whisper nghe chưa rõ, thử nói to & rõ hơn xíu nhé!</p>
								{/if}
							</div>
						{/if}
						
						{#if drError}
							<p class="text-xs text-red-500 mt-1 text-center">{drError}</p>
						{/if}
					</div>
				{/if}

			<!-- ===== ROLEPLAY BLOCK ===== -->
			{:else if block.type === 'roleplay'}
				<!-- Scenario header -->
				<div class="bg-[#1B365D] text-white rounded-2xl p-4 mb-3">
					<p class="text-xs font-semibold uppercase tracking-wider text-white/50 mb-1 flex items-center gap-1">Kịch bản · <img src="/icons/i_credit.png" alt="" class="w-3.5 h-3.5 inline" />{block.credit_cost ?? 3} credits/lượt</p>
					<p class="text-sm text-white/85 leading-relaxed">{block.scenario}</p>
				</div>

				{#if !rpStarted}
					<!-- Pre-start: persona + criteria + start button -->
					<div class="bg-white rounded-2xl p-4 border border-[#1B365D]/8 shadow-sm mb-3">
						<div class="flex items-center gap-2 mb-2">
							<div class="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center p-1.5"><img src="/icons/i_speaking.png" alt="AI" class="w-full h-full" /></div>
							<div>
								<p class="font-semibold text-[#1B365D] text-sm">AI Client</p>
								<p class="text-[#1B365D]/40 text-xs">{block.client_persona}</p>
							</div>
						</div>
						<p class="text-xs font-semibold uppercase tracking-wider text-[#1B365D]/40 mb-2 mt-3">Tiêu chí</p>
						<ul class="space-y-1">
							{#each block.scoring_criteria ?? [] as c}
								<li class="flex gap-2 text-xs text-[#1B365D]/65"><span class="text-[#F2A906]">✓</span>{c}</li>
							{/each}
						</ul>
					</div>
					<button
						onclick={startRoleplay}
						class="w-full py-3.5 rounded-xl font-bold text-sm bg-purple-600 text-white shadow-lg shadow-purple-500/20 hover:bg-purple-700 active:scale-95 transition-all flex items-center justify-center gap-2"
					>
						<img src="/icons/i_microphone2.png" alt="" class="w-5 h-5" /> Bắt đầu hội thoại AI
					</button>
				{:else}
					<!-- Chat thread -->
					<div class="bg-white rounded-2xl border border-[#1B365D]/8 shadow-sm mb-3 overflow-hidden">
						<!-- Credits badge -->
						{#if rpCreditsLeft !== null}
							<div class="flex justify-end px-3 pt-2">
								<span class="text-xs bg-[#F2A906]/10 text-[#1B365D]/60 px-2 py-0.5 rounded-full flex items-center gap-1"><img src="/icons/i_credit.png" alt="" class="w-3.5 h-3.5" /> {rpCreditsLeft} credits</span>
							</div>
						{/if}
						<!-- Messages -->
						<div class="flex flex-col gap-3 p-3 max-h-72 overflow-y-auto">
							{#each rpMessages as msg (msg.role + msg.content.slice(0, 12))}
								{#if msg.role === 'assistant'}
									<div class="flex gap-2 items-start">
										<div class="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center p-1 flex-shrink-0"><img src="/icons/i_speaking.png" alt="AI" class="w-full h-full" /></div>
										<div class="bg-[#F8F5FF] rounded-2xl rounded-tl-none px-3 py-2 text-sm text-[#1B365D] leading-relaxed max-w-[85%]">{msg.content}</div>
									</div>
								{:else}
									<div class="flex gap-2 items-start justify-end">
										<div class="bg-[#F2A906]/15 rounded-2xl rounded-tr-none px-3 py-2 text-sm text-[#1B365D] leading-relaxed max-w-[85%]">{msg.content}</div>
										<div class="w-7 h-7 rounded-full bg-[#F2A906]/20 flex items-center justify-center p-1 flex-shrink-0"><img src="/icons/i_user.png" alt="You" class="w-full h-full" /></div>
									</div>
								{/if}
							{/each}
							<!-- Streaming indicator -->
							{#if rpStreaming}
								<div class="flex gap-2 items-start">
									<div class="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center p-1 flex-shrink-0"><img src="/icons/i_speaking.png" alt="AI" class="w-full h-full" /></div>
									<div class="bg-[#F8F5FF] rounded-2xl rounded-tl-none px-3 py-2 text-sm text-[#1B365D] leading-relaxed max-w-[85%]">
										{#if rpStreamText}{rpStreamText}{:else}<span class="animate-pulse">…</span>{/if}
									</div>
								</div>
							{/if}
						</div>
						<!-- Input row -->
						<div class="border-t border-[#1B365D]/8 flex gap-2 p-2 items-end">
							{#if rpState === 'recording'}
								<div class="flex-1 flex items-center justify-center gap-2 p-3 text-red-500 text-sm font-medium animate-pulse border border-red-500/20 rounded-xl bg-red-50">
									<img src="/icons/i_microphone2.png" alt="" class="w-4 h-4" /> Đang ghi âm · {formatRecordTime(rpElapsed)}
								</div>
								<button
									onclick={() => rpRecorder.stop()}
									class="px-3 py-3 rounded-xl bg-red-500 text-white font-bold text-sm shadow-md shadow-red-500/20 active:scale-95 transition-all self-end"
								>Dừng</button>
							{:else}
								<div class="flex-1 relative">
									<textarea
										bind:value={rpUserDraft}
										placeholder={rpState === 'processing' ? "⏳ Đang chuyển giọng nói thành văn bản..." : "Nhập câu trả lời của bạn…"}
										rows="2"
										disabled={rpState === 'processing'}
										class="w-full text-sm text-[#1B365D] placeholder-[#1B365D]/30 resize-none focus:outline-none p-2 rounded-xl bg-white border border-[#1B365D]/20 {rpState === 'processing' ? 'opacity-50' : ''}"
										onkeydown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendRoleplayMessage(); } }}
									></textarea>
								</div>
								<div class="flex flex-col gap-1">
									<button
										onclick={() => rpRecorder.start()}
										disabled={rpStreaming || rpState === 'processing'}
										title="Nhập bằng giọng nói"
										class="px-3 py-1.5 rounded-xl bg-white border border-[#1B365D]/20 text-[#1B365D] font-bold text-sm hover:bg-[#F2A906]/10 active:scale-95 transition-all text-center disabled:opacity-50"
									><img src="/icons/i_microphone2.png" alt="Voice" class="w-5 h-5" /></button>
									<button
										onclick={sendRoleplayMessage}
										disabled={rpStreaming || rpState === 'processing' || !rpUserDraft.trim()}
										class="px-3 py-1.5 rounded-xl bg-[#F2A906] text-[#1B365D] font-bold text-sm disabled:opacity-40 active:scale-95 transition-all self-end"
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
						<div class="bg-white rounded-2xl border border-[#10B981]/30 p-4 mb-3">
							<div class="flex items-center gap-3 mb-3">
								<div class="text-3xl font-bold text-[#1B365D]">{rpScore.total}<span class="text-lg text-[#1B365D]/40">/100</span></div>
								<div class="flex-1">
									<div class="h-2 bg-[#1B365D]/8 rounded-full overflow-hidden">
										<div class="h-full bg-[#10B981] rounded-full transition-all" style="width:{rpScore.total}%"></div>
									</div>
								</div>
							</div>
							<div class="grid grid-cols-2 gap-2 mb-3">
								{#each Object.entries(rpScore.breakdown) as [k, v]}
									<div class="bg-[#FFFBF1] rounded-xl p-2">
										<p class="text-xs text-[#1B365D]/50 capitalize mb-1">{k}</p>
										<p class="font-bold text-[#1B365D] text-sm">{v}<span class="text-[#1B365D]/30">/25</span></p>
									</div>
								{/each}
							</div>
							{#if rpScore.feedback}<p class="text-sm text-[#1B365D]/70 leading-relaxed">{rpScore.feedback}</p>{/if}
							{#if rpScore.highlight}<p class="mt-2 text-xs text-[#10B981]">✨ "{rpScore.highlight}"</p>{/if}
						</div>
					{:else if rpCanScore}
						<button
							onclick={scoreRoleplay}
							disabled={rpScoring}
							class="w-full py-3 rounded-xl font-bold text-sm border-2 border-[#10B981] text-[#10B981] hover:bg-[#10B981]/8 active:scale-95 transition-all disabled:opacity-50"
						>
							{rpScoring ? '⏳ Đang chấm điểm…' : '⭐ Chấm điểm hội thoại của tôi'}
						</button>
					{/if}
				{/if}

			<!-- ===== REFLECTION BLOCK ===== -->
			{:else if block.type === 'reflection'}
				<p class="font-heading font-semibold text-[#1B365D] text-lg mb-5 leading-snug">{block.instruction}</p>

				<!-- Emoji selection -->
				<div class="flex gap-3 mb-6">
					{#each block.emotion_options ?? [] as emotion, i}
						<button
							onclick={() => selectedEmotion = i}
							class="flex-1 py-4 rounded-2xl border-2 text-center transition-all
								{selectedEmotion === i ? 'border-[#F2A906] bg-[#F2A906]/10' : 'border-[#1B365D]/10 bg-white'}"
						>
							<div class="text-3xl mb-1">{emotion.split(' ')[0]}</div>
							<div class="text-xs text-[#1B365D]/60 font-medium">{emotion.split(' ').slice(1).join(' ')}</div>
						</button>
					{/each}
				</div>

				<!-- Text input -->
				<div class="bg-white rounded-2xl border border-[#1B365D]/10 overflow-hidden mb-4">
					<textarea
						bind:value={reflectionText}
						placeholder={block.text_prompt ?? 'Ghi chú thêm... (tùy chọn)'}
						rows="4"
						class="w-full p-4 text-sm text-[#1B365D] placeholder-[#1B365D]/35 resize-none focus:outline-none"
					></textarea>
				</div>
			{/if}
		{/if}
	</div>

	<!-- Fixed Bottom CTA -->
	<div class="fixed bottom-0 left-0 right-0 bg-[#FFFBF1]/95 backdrop-blur-sm border-t border-[#1B365D]/8 px-4 py-4">
		<div class="max-w-lg mx-auto">
			{#if block?.type === 'listening'}
				<button
					onclick={nextBlock}
					disabled={!answered}
					class="w-full py-3.5 rounded-xl font-bold text-sm transition-all
						{answered
							? 'bg-[#F2A906] text-[#1B365D] shadow-lg shadow-[#F2A906]/25 hover:bg-[#d99506] active:scale-95'
							: 'bg-[#1B365D]/8 text-[#1B365D]/30 cursor-not-allowed'}"
				>
					{answered ? (selectedAnswer === block.answer ? '✓ Đúng rồi! Tiếp tục →' : 'Xem đáp án → Tiếp tục') : 'Chọn đáp án để tiếp tục'}
				</button>
			{:else if block?.type === 'drilling'}
				{@const patterns = block.patterns ?? []}
				<button
					onclick={nextPattern}
					class="w-full py-3.5 rounded-xl font-bold text-sm bg-[#F2A906] text-[#1B365D] shadow-lg shadow-[#F2A906]/25 hover:bg-[#d99506] active:scale-95 transition-all"
				>
					{drillingIndex < patterns.length - 1 ? `Mẫu tiếp theo (${drillingIndex + 2}/${patterns.length}) →` : 'Hoàn thành block này →'}
				</button>
			{:else if block?.type === 'roleplay'}
				<button
					onclick={nextBlock}
					class="w-full py-3.5 rounded-xl font-bold text-sm transition-all
						{rpScore
							? 'bg-[#10B981] text-white shadow-lg shadow-[#10B981]/25 hover:bg-[#0da871] active:scale-95'
							: 'bg-[#1B365D]/8 text-[#1B365D]/50 hover:bg-[#1B365D]/12 active:scale-95'}"
				>
					{rpScore ? '✓ Tiếp tục →' : 'Bỏ qua & tiếp tục →'}
				</button>
			{:else if block?.type === 'reflection'}
				<button
					onclick={nextBlock}
					class="w-full py-3.5 rounded-xl font-bold text-sm bg-[#10B981] text-white shadow-lg shadow-[#10B981]/25 hover:bg-[#0da871] active:scale-95 transition-all"
				>
					🎉 Hoàn thành & nhận phần thưởng →
				</button>
			{/if}
		</div>
	</div>
</div>

<!-- Reward celebration overlay -->
{#if showingRewards && rewardToast}
	<div class="fixed inset-0 z-50 bg-[#1B365D]/80 backdrop-blur-sm flex items-center justify-center p-6 animate-[fadeIn_0.3s_ease-out]" data-testid="reward-overlay">
		<div class="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center animate-[scaleIn_0.4s_ease-out]">
			<div class="text-5xl mb-4">🎉</div>
			<h2 class="font-heading font-bold text-[#1B365D] text-xl mb-2">Bài học hoàn thành!</h2>

			{#if rewardToast.streakBonus}
				<div class="bg-[#F2A906]/10 border border-[#F2A906]/30 rounded-xl p-4 mb-3 animate-[slideUp_0.5s_ease-out_0.2s_both]">
					<div class="text-2xl mb-1">🔥 +{rewardToast.streakBonus.credits} credits</div>
					<p class="text-sm text-[#1B365D]/60">{rewardToast.streakBonus.message}</p>
				</div>
			{/if}

			{#if rewardToast.newMilestones?.length}
				{#each rewardToast.newMilestones as m, i}
					<div class="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-2 animate-[slideUp_0.5s_ease-out_{0.4+i*0.15}s_both]" style="animation-delay: {0.4 + i * 0.15}s">
						<div class="flex items-center justify-center gap-2 mb-1">
							<span class="text-2xl">{m.icon}</span>
							<span class="font-bold text-[#1B365D]">{m.label}</span>
						</div>
						{#if m.credits > 0}
							<p class="text-sm text-purple-600 font-medium">+{m.credits} credits thưởng!</p>
						{/if}
					</div>
				{/each}
			{/if}

			<p class="text-xs text-[#1B365D]/40 mt-4">Đang chuyển về trang chủ...</p>
		</div>
	</div>
{/if}

<style>
	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}
	@keyframes scaleIn {
		from { opacity: 0; transform: scale(0.8); }
		to { opacity: 1; transform: scale(1); }
	}
	@keyframes slideUp {
		from { opacity: 0; transform: translateY(20px); }
		to { opacity: 1; transform: translateY(0); }
	}
</style>
