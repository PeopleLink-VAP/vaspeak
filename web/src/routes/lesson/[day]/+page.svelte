<script lang="ts">
	import { goto } from '$app/navigation';

	let { data } = $props();
	let lesson = $derived(data.lesson);
	let blocks = $derived(lesson.content as any[]);
	const blockMeta = [
		{ label: 'Nghe & Giải Mã', icon: '🎧' },
		{ label: 'Luyện Mẫu Câu', icon: '💬' },
		{ label: 'Hội Thoại AI',   icon: '🎙️' },
		{ label: 'Phản Hồi',       icon: '⭐' }
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

	// ── Drilling state ────────────────────────────────────────────────
	let drIsRecording   = $state(false);
	let drIsTranscribing= $state(false);
	let drTranscript    = $state<string | null>(null);
	let drResult        = $state<'pass' | 'fail' | null>(null);
	let drMediaRecorder = $state<MediaRecorder | null>(null);
	let drAudioChunks   = $state<Blob[]>([]);
	let drError         = $state('');

	async function startDrillingRecord() {
		drError = '';
		drTranscript = null;
		drResult = null;
		drAudioChunks = [];
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			drMediaRecorder = new MediaRecorder(stream);
			drMediaRecorder.ondataavailable = (e) => {
				if (e.data.size > 0) drAudioChunks.push(e.data);
			};
			drMediaRecorder.onstop = async () => {
				stream.getTracks().forEach((track) => track.stop());
				drIsTranscribing = true;
				const audioBlob = new Blob(drAudioChunks, { type: 'audio/webm' });
				
				const formData = new FormData();
				formData.append('audio', audioBlob, 'drilling.webm');
				if (block.patterns?.[drillingIndex]?.target) {
					formData.append('prompt', block.patterns[drillingIndex].target);
				}

				try {
					const res = await fetch('/api/transcribe', { method: 'POST', body: formData });
					const j = await res.json() as any;
					if (!res.ok) throw new Error(j.error || 'Transcription failed');
					drTranscript = j.text;
					// V1: Simple evaluation
					const targetStr = (block.patterns[drillingIndex]?.target || '').toLowerCase().replace(/[^\w\s]/gi, '').trim();
					const spokenStr = (drTranscript || '').toLowerCase().replace(/[^\w\s]/gi, '').trim();
					// Very forgiving match:
					if (targetStr && spokenStr && (spokenStr.includes(targetStr) || targetStr.includes(spokenStr))) {
						drResult = 'pass';
					} else {
						drResult = 'fail';
					}
				} catch (e: any) {
					drError = e.message;
				} finally {
					drIsTranscribing = false;
				}
			};
			drMediaRecorder.start();
			drIsRecording = true;
		} catch (e) {
			drError = 'Microphone access denied: ' + String(e);
		}
	}

	function stopDrillingRecord() {
		if (drMediaRecorder && drMediaRecorder.state !== 'inactive') {
			drMediaRecorder.stop();
			drIsRecording = false;
		}
	}

	// ── Roleplay state ────────────────────────────────────────────────
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

	const rpExchanges = $derived(rpMessages.filter(m => m.role === 'user').length);
	const rpCanScore  = $derived(rpExchanges >= 2);

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
		if (currentBlock < totalBlocks - 1) {
			currentBlock++;
			selectedAnswer = null;
			answered       = false;
			drillingIndex  = 0;
			drTranscript = null; drResult = null; drError = '';
			rpMessages     = []; rpStarted = false;
			rpScore = null;     rpError = ''; rpStreamText = '';
		} else {
			saveProgress();
			goto('/dashboard');
		}
	}

	function nextPattern() {
		const patterns = block.patterns ?? [];
		if (drillingIndex < patterns.length - 1) {
			drillingIndex++;
			drTranscript = null; drResult = null; drError = '';
		}
		else nextBlock();
	}

	async function saveProgress() {
		const blockCompletions: Record<string, boolean> = {};
		for (let i = 0; i < totalBlocks; i++) blockCompletions[`block_${i + 1}`] = completedBlocks.has(i);
		try {
			await fetch('/api/progress', {
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
		} catch { /* silent */ }
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
					{meta.icon}
				</button>
			{/each}
		</div>
	</div>

	<!-- Block Content -->
	<div class="flex-1 px-4 py-2 pb-28">
		{#if block}
			<div class="mb-4">
				<span class="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#1B365D]/50">
					{blockMeta[currentBlock]?.icon} Block {currentBlock + 1} — {blockMeta[currentBlock]?.label}
				</span>
				<h2 class="font-heading font-bold text-[#1B365D] text-xl mt-1 leading-tight">{lesson.title}</h2>
			</div>

			<!-- ===== LISTENING BLOCK ===== -->
			{#if block.type === 'listening'}
				<p class="text-[#1B365D]/65 text-sm mb-5">{block.instruction}</p>

				<!-- Audio card -->
				<div class="bg-white rounded-2xl p-5 shadow-[0_4px_14px_rgba(27,54,93,0.08)] border border-[#1B365D]/8 mb-5">
					<div class="flex items-center gap-3 mb-4">
						<div class="w-12 h-12 rounded-xl bg-[#F2A906]/15 flex items-center justify-center text-2xl">🎧</div>
						<div>
							<p class="font-semibold text-[#1B365D] text-sm">Client Conversation</p>
							<p class="text-[#1B365D]/40 text-xs">Nhấn để nghe</p>
						</div>
					</div>
					<!-- Waveform placeholder -->
					<div class="flex items-center gap-1 h-8 mb-3">
						{#each Array(24) as _, i}
							<div class="flex-1 bg-[#F2A906]/40 rounded-full" style="height: {20 + Math.sin(i * 0.8) * 14}px"></div>
						{/each}
					</div>
					<!-- Script (shown as transcript) -->
					<details class="mt-3">
						<summary class="text-xs text-[#1B365D]/40 cursor-pointer hover:text-[#1B365D]/70">Xem transcript</summary>
						<p class="mt-2 text-[#1B365D]/70 text-sm leading-relaxed italic bg-[#FFFBF1] rounded-xl p-3">
							{block.audio_script}
						</p>
					</details>
				</div>

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
						{#if drIsRecording}
							<button onclick={stopDrillingRecord} class="w-full bg-red-500 border border-red-600 rounded-xl py-3.5 flex items-center justify-center gap-2 text-white text-sm font-bold shadow-md shadow-red-500/20 active:scale-95 transition-all animate-pulse">
								🛑 Dừng ghi âm
							</button>
						{:else if drIsTranscribing}
							<div class="w-full bg-white border border-[#1B365D]/12 rounded-xl py-3.5 flex items-center justify-center gap-2 text-[#1B365D]/50 text-sm">
								⏳ Đang phân tích...
							</div>
						{:else}
							<button onclick={startDrillingRecord} class="w-full bg-white border border-[#1B365D]/20 rounded-xl py-3.5 flex items-center justify-center gap-2 text-[#1B365D] text-sm font-bold hover:bg-[#F2A906]/10 hover:border-[#F2A906]/40 active:scale-95 transition-all">
								🎙️ Bấm để nói
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
					<p class="text-xs font-semibold uppercase tracking-wider text-white/50 mb-1">Kịch bản · ⚡{block.credit_cost ?? 3} credits/lượt</p>
					<p class="text-sm text-white/85 leading-relaxed">{block.scenario}</p>
				</div>

				{#if !rpStarted}
					<!-- Pre-start: persona + criteria + start button -->
					<div class="bg-white rounded-2xl p-4 border border-[#1B365D]/8 shadow-sm mb-3">
						<div class="flex items-center gap-2 mb-2">
							<div class="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-base">🤖</div>
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
						class="w-full py-3.5 rounded-xl font-bold text-sm bg-purple-600 text-white shadow-lg shadow-purple-500/20 hover:bg-purple-700 active:scale-95 transition-all"
					>
						🎙️ Bắt đầu hội thoại AI
					</button>
				{:else}
					<!-- Chat thread -->
					<div class="bg-white rounded-2xl border border-[#1B365D]/8 shadow-sm mb-3 overflow-hidden">
						<!-- Credits badge -->
						{#if rpCreditsLeft !== null}
							<div class="flex justify-end px-3 pt-2">
								<span class="text-xs bg-[#F2A906]/10 text-[#1B365D]/60 px-2 py-0.5 rounded-full">⚡ {rpCreditsLeft} credits</span>
							</div>
						{/if}
						<!-- Messages -->
						<div class="flex flex-col gap-3 p-3 max-h-72 overflow-y-auto">
							{#each rpMessages as msg (msg.role + msg.content.slice(0, 12))}
								{#if msg.role === 'assistant'}
									<div class="flex gap-2 items-start">
										<div class="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-sm flex-shrink-0">🤖</div>
										<div class="bg-[#F8F5FF] rounded-2xl rounded-tl-none px-3 py-2 text-sm text-[#1B365D] leading-relaxed max-w-[85%]">{msg.content}</div>
									</div>
								{:else}
									<div class="flex gap-2 items-start justify-end">
										<div class="bg-[#F2A906]/15 rounded-2xl rounded-tr-none px-3 py-2 text-sm text-[#1B365D] leading-relaxed max-w-[85%]">{msg.content}</div>
										<div class="w-7 h-7 rounded-full bg-[#F2A906]/20 flex items-center justify-center text-sm flex-shrink-0">🙋</div>
									</div>
								{/if}
							{/each}
							<!-- Streaming indicator -->
							{#if rpStreaming}
								<div class="flex gap-2 items-start">
									<div class="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-sm flex-shrink-0">🤖</div>
									<div class="bg-[#F8F5FF] rounded-2xl rounded-tl-none px-3 py-2 text-sm text-[#1B365D] leading-relaxed max-w-[85%]">
										{#if rpStreamText}{rpStreamText}{:else}<span class="animate-pulse">…</span>{/if}
									</div>
								</div>
							{/if}
						</div>
						<!-- Input row -->
						<div class="border-t border-[#1B365D]/8 flex gap-2 p-2">
							<textarea
								bind:value={rpUserDraft}
								placeholder="Nhập câu trả lời của bạn…"
								rows="2"
								class="flex-1 text-sm text-[#1B365D] placeholder-[#1B365D]/30 resize-none focus:outline-none p-1"
								onkeydown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendRoleplayMessage(); } }}
							></textarea>
							<button
								onclick={sendRoleplayMessage}
								disabled={rpStreaming || !rpUserDraft.trim()}
								class="px-3 py-1.5 rounded-xl bg-[#F2A906] text-[#1B365D] font-bold text-sm disabled:opacity-40 active:scale-95 transition-all self-end"
							>Gửi</button>
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
