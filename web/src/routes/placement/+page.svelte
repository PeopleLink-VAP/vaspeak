<script lang="ts">
	import { enhance } from '$app/forms';
	import AudioPlayer from '$lib/components/AudioPlayer.svelte';
	import { createAudioRecorder, formatRecordTime, transcribeAudio } from '$lib/audio-recorder';

	let { form, data } = $props();

	let step = $state(1);
	const totalSteps = 4;

	let experience = $state('');
	let speaking   = $state('');
	let niche      = $state('general');

	// Audio assessment state (Step 4)
	let audioState: 'idle' | 'recording' | 'processing' | 'done' = $state('idle');
	let audioElapsed = $state(0);
	let transcript = $state('');
	let audioSkipped = $state(false);

	const recorder = createAudioRecorder({
		maxDuration: 20,
		onStart: () => { audioState = 'recording'; audioElapsed = 0; },
		onTick:  (s) => { audioElapsed = s; },
		onStop:  async (blob) => {
			audioState = 'processing';
			const result = await transcribeAudio(blob, 'Placement test speaking sample', 'placement.webm');
			if ('text' in result && result.text) {
				transcript = result.text;
			}
			audioState = 'done';
		},
		onError: () => { audioState = 'idle'; }
	});

	const niches = [
		{ value: 'general', label: 'Tiếng Anh Giao Tiếp Cơ Bản' },
		{ value: 'customer_support', label: 'Hỗ Trợ Khách Hàng (CS)' },
		{ value: 'data_entry', label: 'Nhập Liệu & Hành Chính' },
		{ value: 'social_media', label: 'Quản Lý Mạng Xã Hội' },
		{ value: 'ecommerce', label: 'Thương Mại Điện Tử (eCom)' },
		{ value: 'video_editor', label: 'Biên Tập Video' },
		{ value: 'executive_assistant', label: 'Trợ Lý Giám Đốc (EA)' }
	];

	const speakingPrompt = "Hi, my name is [your name]. I would like to apply for a Virtual Assistant position. I have experience in [your skill], and I am available to work Monday to Friday.";

	function next() { if (step < totalSteps) step++; }
	function prev() { if (step > 1) step--; }
</script>

<svelte:head>
	<title>Đánh Giá Trình Độ Đầu Vào — VASpeak</title>
</svelte:head>

<div class="min-h-screen bg-[#FFFBF1] flex flex-col max-w-lg mx-auto p-4 pt-8">
	<!-- Progress -->
	<div class="mb-8">
		<div class="flex justify-between text-xs font-bold text-[#1B365D]/50 mb-2 font-heading tracking-wider uppercase">
			<span>Khảo sát đầu vào</span>
			<span>{step} / {totalSteps}</span>
		</div>
		<div class="h-2 bg-[#1B365D]/10 rounded-full overflow-hidden">
			<div class="h-full bg-[#F2A906] transition-all duration-300" style="width: {(step / totalSteps) * 100}%"></div>
		</div>
	</div>

	<div class="bg-white rounded-3xl p-6 shadow-[0_4px_14px_rgba(27,54,93,0.06)] border border-[#1B365D]/6 flex-1 flex flex-col relative">
		
		<form method="POST" action="?/submit" use:enhance class="flex-1 flex flex-col">
			<input type="hidden" name="experience" value={experience} />
			<input type="hidden" name="speaking" value={speaking} />
			<input type="hidden" name="transcript" value={transcript} />
			
			{#if form?.error}
				<div class="bg-red-50 text-red-500 border border-red-200 text-sm px-4 py-3 rounded-xl mb-4 font-medium flex items-center gap-2">
					⚠️ {form.error}
				</div>
			{/if}

			{#if step === 1}
				<!-- Step 1: Experience -->
				<div class="flex-1 animate-[fadeIn_0.3s_ease-out]" data-testid="step-experience">
					<div class="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-2xl mb-4">🎒</div>
					<h2 class="font-heading font-bold text-[#1B365D] text-2xl mb-2 leading-tight">Bạn đã từng làm<br>Virtual Assistant (VA) chưa?</h2>
					<p class="text-[#1B365D]/60 text-sm mb-6">Câu hỏi này giúp VASpeak thiết kế các tình huống thực tiễn nhất cho bạn.</p>
					
					<div class="flex flex-col gap-3">
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
						<label onclick={() => experience = 'none'} class="relative flex border-2 {experience === 'none' ? 'border-[#F2A906] bg-[#F2A906]/10' : 'border-[#1B365D]/10 bg-white hover:border-[#1B365D]/20'} transition-all rounded-2xl p-4 cursor-pointer" data-testid="exp-none">
							<input type="radio" name="experience" value="none" checked={experience === 'none'} class="sr-only" />
							<div class="flex-1">
								<h3 class="font-bold text-[#1B365D] text-sm mb-1">Chưa (Beginner)</h3>
								<p class="text-xs text-[#1B365D]/60">Mình mới tìm hiểu và đang học hỏi về ngành này.</p>
							</div>
							<div class="text-xl">🐣</div>
						</label>
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
						<label onclick={() => experience = 'yes'} class="relative flex border-2 {experience === 'yes' ? 'border-[#F2A906] bg-[#F2A906]/10' : 'border-[#1B365D]/10 bg-white hover:border-[#1B365D]/20'} transition-all rounded-2xl p-4 cursor-pointer" data-testid="exp-yes">
							<input type="radio" name="experience" value="yes" checked={experience === 'yes'} class="sr-only" />
							<div class="flex-1">
								<h3 class="font-bold text-[#1B365D] text-sm mb-1">Đã có kinh nghiệm (Working VA)</h3>
								<p class="text-xs text-[#1B365D]/60">Mình đã/đang nhận dự án và làm việc với khách hàng.</p>
							</div>
							<div class="text-xl">💼</div>
						</label>
					</div>
				</div>
			{:else if step === 2}
				<!-- Step 2: Speaking Ability -->
				<div class="flex-1 animate-[fadeIn_0.3s_ease-out]" data-testid="step-speaking">
					<div class="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl mb-4">🗣️</div>
					<h2 class="font-heading font-bold text-[#1B365D] text-2xl mb-2 leading-tight">Đánh giá nhanh<br>trình độ nghe nói của bạn</h2>
					<p class="text-[#1B365D]/60 text-sm mb-6">Hãy tự tin chọn một mô tả sát với thực tế nhất để bài học không quá dễ hoặc quá khó.</p>
					
					<div class="flex flex-col gap-3">
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
						<label onclick={() => speaking = 'beginner'} class="relative flex border-2 {speaking === 'beginner' ? 'border-[#F2A906] bg-[#F2A906]/10' : 'border-[#1B365D]/10 bg-white hover:border-[#1B365D]/20'} transition-all rounded-2xl p-4 cursor-pointer" data-testid="speak-beginner">
							<input type="radio" name="speaking" value="beginner" checked={speaking === 'beginner'} class="sr-only" required />
							<div class="flex-1">
								<h3 class="font-bold text-[#1B365D] text-sm mb-1">Bồi Ngoại Ngữ (Cơ bản)</h3>
								<p class="text-xs text-[#1B365D]/60">Chỉ dùng được từ đơn, hay ấp úng, cần Google Translate liên tục.</p>
							</div>
						</label>
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
						<label onclick={() => speaking = 'intermediate'} class="relative flex border-2 {speaking === 'intermediate' ? 'border-[#F2A906] bg-[#F2A906]/10' : 'border-[#1B365D]/10 bg-white hover:border-[#1B365D]/20'} transition-all rounded-2xl p-4 cursor-pointer" data-testid="speak-intermediate">
							<input type="radio" name="speaking" value="intermediate" checked={speaking === 'intermediate'} class="sr-only" required />
							<div class="flex-1">
								<h3 class="font-bold text-[#1B365D] text-sm mb-1">Giao tiếp vừa đủ (Trung bình)</h3>
								<p class="text-xs text-[#1B365D]/60">Có thể trao đổi quy trình công việc, thỉnh thoảng bí từ hoặc hơi thiếu tự nhiên.</p>
							</div>
						</label>
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
						<label onclick={() => speaking = 'advanced'} class="relative flex border-2 {speaking === 'advanced' ? 'border-[#F2A906] bg-[#F2A906]/10' : 'border-[#1B365D]/10 bg-white hover:border-[#1B365D]/20'} transition-all rounded-2xl p-4 cursor-pointer" data-testid="speak-advanced">
							<input type="radio" name="speaking" value="advanced" checked={speaking === 'advanced'} class="sr-only" required />
							<div class="flex-1">
								<h3 class="font-bold text-[#1B365D] text-sm mb-1">Trả lời tự tin (Khá - Tốt)</h3>
								<p class="text-xs text-[#1B365D]/60">Phản xạ nhanh, trao đổi công việc trơn tru, muốn học cách gây ấn tượng và đàm phán.</p>
							</div>
						</label>
					</div>
				</div>
			{:else if step === 3}
				<!-- Step 3: Niche Targeted -->
				<div class="flex-1 animate-[fadeIn_0.3s_ease-out]" data-testid="step-niche">
					<div class="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-2xl mb-4">🎯</div>
					<h2 class="font-heading font-bold text-[#1B365D] text-2xl mb-2 leading-tight">Mục tiêu công việc (Niche)<br>mà bạn hướng đến?</h2>
					<p class="text-[#1B365D]/60 text-sm mb-6">VASpeak cung cấp nhóm từ vựng và tình huống hội thoại được tinh chỉnh riêng cho ngành của bạn.</p>
					
					<select
						name="niche"
						bind:value={niche}
						class="w-full bg-[#FFFBF1] border border-[#1B365D]/10 rounded-2xl px-5 py-4 text-sm font-medium text-[#1B365D] focus:outline-none focus:border-[#F2A906] appearance-none"
						data-testid="niche-select"
					>
						{#each niches as n}
							<option value={n.value}>{n.label}</option>
						{/each}
					</select>
				</div>
			{:else}
				<!-- Step 4: Speaking Sample (Audio) -->
				<div class="flex-1 animate-[fadeIn_0.3s_ease-out]" data-testid="step-audio">
					<div class="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-2xl mb-4">🎙️</div>
					<h2 class="font-heading font-bold text-[#1B365D] text-2xl mb-2 leading-tight">Thử giọng nhanh<br>(không bắt buộc)</h2>
					<p class="text-[#1B365D]/60 text-sm mb-4">Đọc đoạn văn dưới đây bằng tiếng Anh. Chúng tôi sẽ dùng AI để đánh giá trình độ phát âm của bạn.</p>

					<!-- Reference text to read -->
					<div class="bg-[#F2A906]/8 border border-[#F2A906]/20 rounded-xl p-4 mb-4">
						<p class="text-xs text-[#1B365D]/50 uppercase tracking-wider font-medium mb-2">Đọc đoạn sau:</p>
						<p class="text-sm text-[#1B365D] font-medium leading-relaxed italic">
							"{speakingPrompt}"
						</p>
					</div>

					<!-- Listen to example -->
					<div class="mb-4">
						<AudioPlayer text={speakingPrompt} title="Nghe mẫu" subtitle="Bấm để nghe cách phát âm" />
					</div>

					<!-- Recording area -->
					<div class="space-y-3">
						{#if audioState === 'recording'}
							<button 
								onclick={() => recorder.stop()} 
								class="w-full bg-red-500 border border-red-600 rounded-xl py-3.5 flex items-center justify-center gap-2 text-white text-sm font-bold shadow-md shadow-red-500/20 active:scale-95 transition-all animate-pulse"
								data-testid="stop-recording"
							>
								🛑 Dừng ghi âm · {formatRecordTime(audioElapsed)}
							</button>
						{:else if audioState === 'processing'}
							<div class="w-full bg-white border border-[#1B365D]/12 rounded-xl py-3.5 flex items-center justify-center gap-2 text-[#1B365D]/50 text-sm">
								⏳ Đang phân tích giọng nói...
							</div>
						{:else if audioState === 'done'}
							<div class="bg-green-50 border border-green-200 rounded-xl p-4" data-testid="transcript-result">
								<div class="flex items-center gap-2 mb-2">
									<span class="text-green-600 text-lg">✅</span>
									<span class="font-bold text-green-700 text-sm">Đã ghi nhận!</span>
								</div>
								{#if transcript}
									<p class="text-xs text-[#1B365D]/60 mb-1">AI nghe được:</p>
									<p class="text-sm text-[#1B365D] italic">"{transcript}"</p>
								{/if}
							</div>
							<button 
								onclick={() => { audioState = 'idle'; transcript = ''; }}
								class="w-full bg-white border border-[#1B365D]/20 rounded-xl py-3 flex items-center justify-center gap-2 text-[#1B365D] text-sm font-medium hover:bg-[#F2A906]/10 transition-all"
							>
								🔄 Thu âm lại
							</button>
						{:else}
							<button 
								onclick={() => recorder.start()} 
								class="w-full bg-white border border-[#1B365D]/20 rounded-xl py-3.5 flex items-center justify-center gap-2 text-[#1B365D] text-sm font-bold hover:bg-[#F2A906]/10 hover:border-[#F2A906]/40 active:scale-95 transition-all"
								data-testid="start-recording"
							>
								🎙️ Bấm để ghi âm
							</button>
							<button
								onclick={() => { audioSkipped = true; }}
								class="w-full text-center text-xs text-[#1B365D]/40 hover:text-[#1B365D]/60 transition-colors py-2"
								data-testid="skip-audio"
							>
								Bỏ qua bước này →
							</button>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Nav CTA -->
			<div class="mt-8 flex gap-3">
				{#if step > 1}
					<button type="button" onclick={prev} class="w-14 h-14 shrink-0 rounded-2xl bg-gray-100 flex items-center justify-center font-bold text-[#1B365D] hover:bg-gray-200 transition-colors" data-testid="btn-prev">←</button>
				{/if}

				{#if step < totalSteps}
					<button
						type="button"
						onclick={next}
						disabled={step === 1 ? !experience : step === 2 ? !speaking : false}
						class="flex-1 py-4 rounded-2xl font-bold text-sm bg-[#F2A906] text-[#1B365D] shadow-lg shadow-[#F2A906]/20 transition-all disabled:opacity-50 hover:bg-[#d99506] active:scale-95"
						data-testid="btn-next"
					>
						Tiếp tục →
					</button>
				{:else}
					<button
						type="submit"
						disabled={audioState === 'recording' || audioState === 'processing'}
						class="flex-1 py-4 rounded-2xl font-bold text-sm bg-[#1B365D] text-white shadow-lg shadow-[#1B365D]/20 transition-all hover:bg-[#1B365D]/90 active:scale-95 disabled:opacity-50"
						data-testid="btn-submit"
					>
						✨ Bắt đầu ngay
					</button>
				{/if}
			</div>
		</form>
	</div>
</div>

<style>
	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(10px); }
		to { opacity: 1; transform: translateY(0); }
	}
</style>
