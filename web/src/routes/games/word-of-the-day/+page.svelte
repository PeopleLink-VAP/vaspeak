<script lang="ts">
	import BottomNav from '$lib/components/BottomNav.svelte';

	// States: setup | loading | playing | answering | correct | wrong | error | done
	type GameState = 'setup' | 'loading' | 'playing' | 'answering' | 'correct' | 'wrong' | 'error' | 'done';

	let gameState: GameState = $state('setup');
	let sessionTarget = $state(10); // How many words to learn this session
	let challenge = $state<{
		word: string;
		question: string;
		options: string[];
	} | null>(null);
	let result = $state<{
		correct: boolean;
		correctIndex: number;
		correctAnswer: string;
		word: string;
		definition: string;
		example: string;
		creditsEarned: number;
	} | null>(null);
	let selectedIndex = $state(-1);
	let credits = $state(0);
	let errorMsg = $state('');
	let streak = $state(0);
	let totalPlayed = $state(0);
	let correctCount = $state(0);
	let showCreditToast = $state(false);
	let creditToastValue = $state(0);

	const sessionOptions = [5, 10, 15, 20];

	async function loadChallenge() {
		gameState = 'loading';
		challenge = null;
		result = null;
		selectedIndex = -1;
		errorMsg = '';

		try {
			const res = await fetch('/api/games/word-challenge');
			const data = await res.json();

			if (!res.ok) {
				errorMsg = data.error || 'Lỗi khi tải thử thách';
				gameState = 'error';
				return;
			}

			challenge = data.challenge;
			credits = data.credits ?? 0;
			gameState = 'playing';
		} catch (err) {
			errorMsg = 'Không thể kết nối. Kiểm tra mạng và thử lại.';
			gameState = 'error';
		}
	}

	async function submitAnswer(index: number) {
		if (gameState !== 'playing' || !challenge) return;
		selectedIndex = index;
		gameState = 'answering';

		try {
			const res = await fetch('/api/games/word-challenge', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ word: challenge.word, answerIndex: index })
			});
			const data = await res.json();

			if (!res.ok) {
				errorMsg = data.error || 'Lỗi khi gửi đáp án';
				gameState = 'error';
				return;
			}

			result = data;
			totalPlayed++;
			if (data.correct) {
				streak++;
				correctCount++;
				credits = Math.max(0, credits);
				// Show credit popup
				if (data.creditsEarned > 0) {
					creditToastValue = data.creditsEarned;
					showCreditToast = true;
					setTimeout(() => { showCreditToast = false; }, 2000);
				}
			} else {
				streak = 0;
			}
			gameState = data.correct ? 'correct' : 'wrong';
		} catch {
			errorMsg = 'Không thể gửi đáp án. Thử lại.';
			gameState = 'error';
		}
	}

	function playNext() {
		// Check if session complete
		if (totalPlayed >= sessionTarget) {
			gameState = 'done';
			return;
		}
		loadChallenge();
	}

	function endSession() {
		gameState = 'done';
	}

	function startSession(target: number) {
		sessionTarget = target;
		totalPlayed = 0;
		correctCount = 0;
		streak = 0;
		loadChallenge();
	}

	const labels = ['A', 'B', 'C', 'D'];
</script>

<svelte:head>
	<title>Từ Của Ngày — VASpeak</title>
</svelte:head>

<div class="min-h-screen bg-[#FAFAF8] pb-24">
	<!-- Top Bar -->
	<div class="sticky top-0 z-10 bg-[#FAFAF8]/95 backdrop-blur-lg border-b border-[#E8E8E8] px-5 py-4 flex items-center justify-between">
		<div class="flex items-center gap-3">
			<a href="/challenges" class="text-[#A3A3A3] hover:text-[#1A1A1A] transition-colors" aria-label="Quay lại">
				<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
			</a>
			<h1 class="font-heading font-bold text-[#1A1A1A] text-base tracking-tight">Từ Của Ngày</h1>
		</div>
		<div class="flex items-center gap-3">
			{#if gameState !== 'setup' && gameState !== 'done'}
				<!-- Session progress -->
				<span class="text-xs text-[#A3A3A3] font-medium">{totalPlayed}/{sessionTarget}</span>
				<!-- Exit session button -->
				<button
					onclick={endSession}
					class="text-xs text-[#A3A3A3] hover:text-red-400 transition-colors font-medium flex items-center gap-1"
					title="Kết thúc phiên"
				>
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
					Thoát
				</button>
			{/if}
			{#if streak > 0}
				<div class="flex items-center gap-1 text-[#D4960A]">
					<img src="/icons/i_challenge.png" alt="" class="w-4 h-4" />
					<span class="text-xs font-bold">{streak}</span>
				</div>
			{/if}
			<div class="flex items-center gap-1.5">
				<img src="/icons/i_credit.png" alt="" class="w-4 h-4" />
				<span class="text-sm font-bold text-[#1A1A1A]">{credits}</span>
			</div>
		</div>
	</div>

	<!-- Credit Toast Popup -->
	{#if showCreditToast}
		<div class="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#D4960A] text-[#1A1A1A] font-bold text-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-creditPop">
			<img src="/icons/i_credit.png" alt="" class="w-4 h-4" />
			+{creditToastValue} điểm thưởng!
		</div>
	{/if}

	<div class="max-w-md mx-auto px-5 pt-8 flex flex-col gap-6">

		<!-- ── SETUP SCREEN ── -->
		{#if gameState === 'setup'}
			<div class="flex flex-col items-center text-center py-8 gap-6">
				<div class="w-16 h-16 rounded-2xl bg-[#F5F0E6] flex items-center justify-center">
					<img src="/icons/i_abc.png" alt="" class="w-9 h-9" />
				</div>
				<div>
					<h2 class="font-heading font-bold text-[#1A1A1A] text-2xl mb-2">Từ Của Ngày</h2>
					<p class="text-sm text-[#6B6B6B] leading-relaxed">Luyện từ vựng tiếng Anh mỗi ngày<br />để tích lũy điểm thưởng.</p>
				</div>

				<div class="w-full">
					<p class="text-xs font-semibold text-[#A3A3A3] uppercase tracking-wider mb-4">Học bao nhiêu từ hôm nay?</p>
					<div class="grid grid-cols-4 gap-3">
						{#each sessionOptions as opt}
							<button
								onclick={() => startSession(opt)}
								id="session-{opt}"
								class="py-4 rounded-xl border-2 font-bold text-lg transition-all
									{opt === 10
										? 'border-[#D4960A] bg-[#D4960A]/10 text-[#D4960A]'
										: 'border-[#E8E8E8] bg-white text-[#1A1A1A] hover:border-[#D4960A]/50 hover:bg-[#D4960A]/5 active:scale-95'}"
							>
								{opt}
							</button>
						{/each}
					</div>
					<p class="text-xs text-[#A3A3A3] mt-3 text-center">Mỗi câu đúng = +1 điểm thưởng</p>
				</div>
			</div>

		<!-- ── LOADING STATE ── -->
		{:else if gameState === 'loading'}
			<div class="flex flex-col items-center justify-center py-20 gap-4">
				<div class="w-12 h-12 rounded-2xl bg-[#F5F0E6] flex items-center justify-center animate-pulse">
					<img src="/icons/i_abc.png" alt="" class="w-7 h-7" />
				</div>
				<p class="text-sm text-[#A3A3A3] font-medium">Đang tạo thử thách...</p>
				<div class="flex gap-1">
					<div class="w-1.5 h-1.5 rounded-full bg-[#D4960A] animate-bounce" style="animation-delay: 0ms"></div>
					<div class="w-1.5 h-1.5 rounded-full bg-[#D4960A] animate-bounce" style="animation-delay: 150ms"></div>
					<div class="w-1.5 h-1.5 rounded-full bg-[#D4960A] animate-bounce" style="animation-delay: 300ms"></div>
				</div>
			</div>

		<!-- ── ERROR STATE ── -->
		{:else if gameState === 'error'}
			<div class="flex flex-col items-center justify-center py-16 gap-4 text-center">
				<div class="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
					<svg class="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
				</div>
				<p class="text-sm text-[#6B6B6B] max-w-[260px]">{errorMsg}</p>
				<button
					onclick={loadChallenge}
					class="px-6 py-2.5 rounded-lg bg-[#1A1A1A] text-white text-sm font-semibold hover:bg-[#333] active:scale-95 transition-all"
				>
					Thử lại
				</button>
			</div>

		<!-- ── DONE / SESSION COMPLETE ── -->
		{:else if gameState === 'done'}
			<div class="flex flex-col items-center text-center py-10 gap-5">
				<div class="text-5xl">🎉</div>
				<div>
					<h2 class="font-heading font-bold text-[#1A1A1A] text-2xl mb-2">Phiên học hoàn thành!</h2>
					<p class="text-sm text-[#6B6B6B]">Bạn đã học <strong>{totalPlayed}</strong> từ, trả lời đúng <strong>{correctCount}/{totalPlayed}</strong>.</p>
				</div>
				<div class="bg-[#D4960A]/10 rounded-2xl p-5 w-full">
					<div class="flex items-center justify-center gap-2 mb-1">
						<img src="/icons/i_credit.png" alt="" class="w-5 h-5" />
						<span class="font-heading font-bold text-2xl text-[#D4960A]">+{correctCount}</span>
					</div>
					<p class="text-xs text-[#6B6B6B]">điểm thưởng kiếm được phiên này</p>
				</div>
				<div class="flex gap-3 w-full">
					<button
						onclick={() => { gameState = 'setup'; totalPlayed = 0; correctCount = 0; streak = 0; }}
						class="flex-1 py-3.5 rounded-xl border-2 border-[#E8E8E8] text-sm font-semibold text-[#1A1A1A] hover:border-[#D4960A]/50 active:scale-95 transition-all"
					>
						Chơi lại
					</button>
					<a
						href="/challenges"
						class="flex-1 py-3.5 rounded-xl text-center bg-[#1A1A1A] text-white text-sm font-bold hover:bg-[#333] active:scale-95 transition-all"
					>
						Về trang chủ
					</a>
				</div>
			</div>

		<!-- ── PLAYING / ANSWERING / RESULT ── -->
		{:else if challenge}
			<!-- Session progress bar -->
			<div class="w-full h-1 bg-[#E8E8E8] rounded-full overflow-hidden -mt-2">
				<div class="h-full bg-[#D4960A] rounded-full transition-all duration-300" style="width: {(totalPlayed / sessionTarget) * 100}%"></div>
			</div>

			<!-- Question Card -->
			<div class="relative">
				<div class="flex items-baseline gap-2 mb-4">
					<p class="text-xs font-semibold text-[#A3A3A3] uppercase tracking-widest">Điền vào chỗ trống</p>
					<div class="flex-1 h-px bg-[#E8E8E8]"></div>
				</div>

				<div class="py-4">
					<p class="text-lg font-medium text-[#1A1A1A] leading-relaxed font-heading tracking-tight">
						{#if challenge.question}
							{@html challenge.question.replace(/___/g, '<span class="inline-block w-20 border-b-2 border-[#D4960A] mx-1"></span>')}
						{:else}
							<span class="text-[#A3A3A3] italic">Chọn nghĩa đúng của từ "<strong class="text-[#1A1A1A]">{challenge.word}</strong>"</span>
						{/if}
					</p>
				</div>
			</div>

			<!-- Options Grid -->
			<div class="grid grid-cols-1 gap-3">
				{#each challenge.options as option, i}
					{@const isSelected = selectedIndex === i}
					{@const isCorrectOption = result && i === result.correctIndex}
					{@const isWrongSelection = result && isSelected && !result.correct}
					{@const isDisabled = gameState !== 'playing'}

					<button
						onclick={() => submitAnswer(i)}
						disabled={isDisabled}
						class="relative w-full text-left px-5 py-4 rounded-xl border-2 transition-all duration-300
							{isCorrectOption && (gameState === 'correct' || gameState === 'wrong')
								? 'border-[#10B981] bg-[#10B981]/5'
								: isWrongSelection
									? 'border-red-400 bg-red-50 animate-shake'
									: isSelected && gameState === 'answering'
										? 'border-[#D4960A] bg-[#D4960A]/5'
										: 'border-[#E8E8E8] bg-white hover:border-[#D4960A]/50 active:scale-[0.97]'}
							{isDisabled && !isCorrectOption && !isWrongSelection ? 'opacity-50' : ''}
						"
					>
						<div class="flex items-center gap-3.5">
							<span class="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold
								{isCorrectOption && (gameState === 'correct' || gameState === 'wrong')
									? 'bg-[#10B981] text-white'
									: isWrongSelection
										? 'bg-red-400 text-white'
										: isSelected && gameState === 'answering'
											? 'bg-[#D4960A] text-white'
											: 'bg-[#F5F0E6] text-[#1A1A1A]'}
							">
								{labels[i]}
							</span>
							<span class="text-sm font-medium text-[#1A1A1A]">{option}</span>
						</div>

						{#if isCorrectOption && (gameState === 'correct' || gameState === 'wrong')}
							<div class="absolute right-4 top-1/2 -translate-y-1/2">
								<svg class="w-5 h-5 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
							</div>
						{/if}
						{#if isWrongSelection}
							<div class="absolute right-4 top-1/2 -translate-y-1/2">
								<svg class="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
							</div>
						{/if}
					</button>
				{/each}
			</div>

			<!-- Answering spinner -->
			{#if gameState === 'answering'}
				<div class="flex justify-center py-2">
					<div class="w-5 h-5 border-2 border-[#D4960A] border-t-transparent rounded-full animate-spin"></div>
				</div>
			{/if}

			<!-- Result Card -->
			{#if result && (gameState === 'correct' || gameState === 'wrong')}
				<div class="mt-2 rounded-2xl border border-[#E8E8E8] overflow-hidden animate-slideUp">
					<!-- Result Header -->
					<div class="px-5 py-4 {gameState === 'correct' ? 'bg-[#10B981]/5' : 'bg-red-50'}">
						<div class="flex items-center gap-3">
							{#if gameState === 'correct'}
								<div class="w-10 h-10 rounded-xl bg-[#10B981]/15 flex items-center justify-center shrink-0">
									<svg class="w-5 h-5 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
								</div>
								<div>
									<p class="font-heading font-bold text-[#10B981] text-base">Chính xác!</p>
									<p class="text-xs text-[#10B981]/80 font-medium flex items-center gap-1">
										<img src="/icons/i_credit.png" alt="" class="w-3 h-3" /> +1 điểm thưởng
									</p>
								</div>
							{:else}
								<div class="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
									<svg class="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
								</div>
								<div>
									<p class="font-heading font-bold text-red-500 text-base">Sai rồi!</p>
									<p class="text-xs text-red-400/80 font-medium">Đáp án: {labels[result.correctIndex]}. {result.correctAnswer}</p>
								</div>
							{/if}
						</div>
					</div>

					<!-- Word Detail -->
					{#if result.definition || result.example}
						<div class="px-5 py-4 border-t border-[#E8E8E8] bg-white">
							<p class="font-heading font-bold text-[#1A1A1A] text-base mb-1">"{result.word}"</p>
							{#if result.definition}
								<p class="text-sm text-[#6B6B6B] mb-2">{result.definition}</p>
							{/if}
							{#if result.example}
								<p class="text-xs text-[#A3A3A3] italic leading-relaxed">"{result.example}"</p>
							{/if}
						</div>
					{/if}
				</div>

				<!-- Next/Done Button -->
				{#if totalPlayed >= sessionTarget}
					<button
						onclick={() => { gameState = 'done'; }}
						class="w-full py-4 rounded-xl font-bold text-sm bg-[#10B981] text-white hover:bg-[#0da871] active:scale-[0.97] transition-all flex items-center justify-center gap-2"
					>
						🎉 Hoàn thành phiên học!
					</button>
				{:else}
					<button
						onclick={playNext}
						class="w-full py-4 rounded-xl font-bold text-sm bg-[#1A1A1A] text-white hover:bg-[#333] active:scale-[0.97] transition-all flex items-center justify-center gap-2"
					>
						Từ tiếp theo ({totalPlayed + 1}/{sessionTarget})
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
					</button>
				{/if}

				<!-- Early exit button -->
				<button
					onclick={endSession}
					class="w-full text-center text-xs text-[#A3A3A3] hover:text-[#6B6B6B] transition-colors py-1"
				>
					Kết thúc phiên sớm →
				</button>
			{/if}
		{/if}

		<!-- Stats footer (subtle) -->
		{#if totalPlayed > 0 && gameState !== 'done' && gameState !== 'setup'}
			<div class="text-center py-2">
				<p class="text-[10px] text-[#A3A3A3] font-medium uppercase tracking-wider">
					Phiên này: {totalPlayed}/{sessionTarget} từ · {streak > 0 ? `chuỗi ${streak}` : 'chưa có chuỗi'}
				</p>
			</div>
		{/if}
	</div>
</div>

<BottomNav active="challenges" />

<style>
	@keyframes slideUp {
		from { opacity: 0; transform: translateY(12px); }
		to { opacity: 1; transform: translateY(0); }
	}
	@keyframes shake {
		0%, 100% { transform: translateX(0); }
		20% { transform: translateX(-4px); }
		40% { transform: translateX(4px); }
		60% { transform: translateX(-3px); }
		80% { transform: translateX(2px); }
	}
	@keyframes creditPop {
		0% { opacity: 0; transform: translateX(-50%) translateY(-8px) scale(0.9); }
		20% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1.05); }
		80% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
		100% { opacity: 0; transform: translateX(-50%) translateY(-4px) scale(0.95); }
	}
	.animate-slideUp { animation: slideUp 0.35s ease-out forwards; }
	.animate-shake { animation: shake 0.4s ease-in-out; }
	.animate-creditPop { animation: creditPop 2s ease-out forwards; }
</style>
