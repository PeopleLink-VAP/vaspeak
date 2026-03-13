<script lang="ts">

	let email = $state('');
	let status = $state<'idle' | 'loading' | 'success' | 'error'>('idle');
	let message = $state('');

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!email) return;
		status = 'loading';
		try {
			const res = await fetch('/api/waitlist', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email })
			});
			const data = await res.json();
			if (res.ok) {
				status = 'success';
				message = data.message ?? "You're on the list! 🎉";
				email = '';
			} else {
				status = 'error';
				message = data.error ?? 'Something went wrong. Please try again.';
			}
		} catch {
			status = 'error';
			message = 'Network error. Please try again.';
		}
	}
</script>

<svelte:head>
	<title>VASpeak – Luyện Nói Tiếng Anh Tự Tin Dành Cho VA</title>
	<meta name="description" content="VASpeak giúp Virtual Assistants Việt Nam luyện nói tiếng Anh chuyên nghiệp với AI mỗi ngày chỉ 15 phút. Gamified, mobile-first, real-world scenarios." />
	<meta property="og:title" content="VASpeak – Luyện Nói Tiếng Anh Tự Tin Dành Cho VA" />
	<meta property="og:description" content="Duolingo-style English speaking trainer for Vietnamese Virtual Assistants." />
</svelte:head>

<!-- ===== NAVBAR ===== -->
<header class="sticky top-0 z-50 bg-[#FFFBF1]/90 backdrop-blur-md border-b border-[#1B365D]/8">
	<nav class="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
		<div class="flex items-center gap-2">
			<div class="w-8 h-8 rounded-lg bg-[#F2A906] flex items-center justify-center">
				<span class="text-[#1B365D] font-bold text-sm leading-none">VS</span>
			</div>
			<span class="font-heading font-bold text-[#1B365D] text-lg">VASpeak</span>
		</div>
		<a href="#waitlist"
			class="bg-[#F2A906] text-[#1B365D] font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-[#d99506] transition-colors duration-200">
			Join Waitlist
		</a>
	</nav>
</header>

<!-- ===== HERO ===== -->
<section class="bg-[#FFFBF1] pt-20 pb-24 px-5">
	<div class="max-w-4xl mx-auto text-center">
		<div class="inline-flex items-center gap-2 bg-[#F2A906]/15 border border-[#F2A906]/40 rounded-full px-4 py-1.5 mb-6">
			<span class="text-[#F2A906] text-xs font-semibold uppercase tracking-wider">Coming Soon</span>
			<span class="w-1.5 h-1.5 rounded-full bg-[#F2A906] animate-pulse"></span>
		</div>
		<h1 class="font-heading font-extrabold text-[#1B365D] text-4xl sm:text-5xl lg:text-6xl leading-tight mb-5">
			Nói Tiếng Anh Tự Tin<br/>
			<span class="text-[#F2A906]">Chỉ 15 Phút Mỗi Ngày</span>
		</h1>
		<p class="text-[#1B365D]/70 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
			VASpeak là ứng dụng luyện nói tiếng Anh theo phong cách Duolingo dành riêng cho Virtual Assistants Việt Nam. Học qua hội thoại thực tế với AI mỗi ngày.
		</p>

		<!-- Waitlist Form (hero) -->
		<form onsubmit={handleSubmit} class="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto mb-6">
			<input
				type="email"
				bind:value={email}
				placeholder="email của bạn..."
				required
				disabled={status === 'loading' || status === 'success'}
				class="flex-1 px-4 py-3 rounded-lg border border-[#1B365D]/20 bg-white text-[#1B365D] placeholder-[#1B365D]/40 focus:outline-none focus:ring-2 focus:ring-[#F2A906] text-sm disabled:opacity-50"
			/>
			<button
				type="submit"
				disabled={status === 'loading' || status === 'success'}
				class="bg-[#F2A906] text-[#1B365D] font-bold px-6 py-3 rounded-lg hover:bg-[#d99506] transition-all duration-200 disabled:opacity-60 whitespace-nowrap text-sm"
			>
				{status === 'loading' ? 'Đang gửi...' : status === 'success' ? '✓ Đã đăng ký!' : 'Đăng Ký Miễn Phí'}
			</button>
		</form>

		{#if message}
			<p class={`text-sm font-medium ${status === 'success' ? 'text-[#10B981]' : 'text-red-500'}`}>{message}</p>
		{/if}

		<p class="text-xs text-[#1B365D]/40 mt-3">Không spam. Chỉ thông báo khi ra mắt chính thức.</p>

		<!-- Social Proof -->
		<div class="mt-14 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-[#1B365D]/60">
			<div class="flex items-center gap-2">
				<span class="text-2xl">🇻🇳</span>
				<span>Dành riêng cho VA Việt Nam</span>
			</div>
			<div class="hidden sm:block w-px h-5 bg-[#1B365D]/15"></div>
			<div class="flex items-center gap-2">
				<span class="text-2xl">🤖</span>
				<span>Powered by Groq AI</span>
			</div>
			<div class="hidden sm:block w-px h-5 bg-[#1B365D]/15"></div>
			<div class="flex items-center gap-2">
				<span class="text-2xl">📱</span>
				<span>Cài như app trên điện thoại</span>
			</div>
		</div>
	</div>
</section>

<!-- ===== PROBLEM ===== -->
<section class="bg-white py-20 px-5">
	<div class="max-w-5xl mx-auto">
		<div class="text-center mb-14">
			<h2 class="font-heading font-bold text-[#1B365D] text-3xl sm:text-4xl mb-4">
				Bạn Có Đang Gặp Phải...?
			</h2>
			<p class="text-[#1B365D]/60 max-w-xl mx-auto">Những rào cản phổ biến nhất của VA khi làm việc với khách hàng nước ngoài.</p>
		</div>
		<div class="grid md:grid-cols-3 gap-6">
			{#each [
				{ icon: '😰', title: 'Sợ nói chuyện với khách Tây', desc: 'Biết từ vựng nhưng cứ đến lúc nói là lại bị "đơ", mất tự tin.' },
				{ icon: '🤔', title: 'Không biết nói thế nào cho chuyên nghiệp', desc: 'Nghe hiểu khá ổn nhưng không biết cách diễn đạt đúng tông của VA.' },
				{ icon: '📉', title: 'Mất khách vì rào cản ngôn ngữ', desc: 'Đã tốt về kỹ năng chuyên môn nhưng kém tự tin về tiếng Anh làm mất nhiều hợp đồng.' }
			] as problem}
				<div class="bg-[#FFFBF1] rounded-2xl p-6 border border-[#1B365D]/8 shadow-[0_4px_14px_rgba(27,54,93,0.06)]">
					<div class="text-4xl mb-4">{problem.icon}</div>
					<h3 class="font-heading font-semibold text-[#1B365D] text-lg mb-2">{problem.title}</h3>
					<p class="text-[#1B365D]/60 text-sm leading-relaxed">{problem.desc}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- ===== HOW IT WORKS ===== -->
<section class="bg-[#FFFBF1] py-20 px-5">
	<div class="max-w-5xl mx-auto">
		<div class="text-center mb-14">
			<h2 class="font-heading font-bold text-[#1B365D] text-3xl sm:text-4xl mb-4">
				4 Bước Mỗi Bài Học, 15 Phút Mỗi Ngày
			</h2>
			<p class="text-[#1B365D]/60 max-w-xl mx-auto">Mỗi bài học được thiết kế để luyện nói thực tế — không học vẹt, không dịch từng chữ.</p>
		</div>
		<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
			{#each [
				{ step: '01', icon: '🎧', color: 'bg-blue-50 border-blue-100', label: 'Nghe & Giải Mã', desc: 'Nghe đoạn hội thoại thực tế với khách hàng và trả lời câu hỏi.' },
				{ step: '02', icon: '💬', color: 'bg-[#F2A906]/10 border-[#F2A906]/20', label: 'Luyện Mẫu Câu', desc: 'Học và lặp lại các cấu trúc câu chuyên nghiệp cho từng tình huống.' },
				{ step: '03', icon: '🎙️', color: 'bg-purple-50 border-purple-100', label: 'Hội Thoại với AI', desc: 'Nói chuyện trực tiếp với AI đóng vai khách hàng. AI chấm điểm phát âm và ngữ pháp của bạn.' },
				{ step: '04', icon: '⭐', color: 'bg-[#10B981]/10 border-[#10B981]/20', label: 'Phản Hồi & Phần Thưởng', desc: 'Tự đánh giá cảm xúc và nhận credits, streaks, phần thưởng.' }
			] as item, i}
				<div class="bg-white rounded-2xl p-6 border border-[#1B365D]/8 shadow-[0_4px_14px_rgba(27,54,93,0.06)] relative">
					<div class="absolute top-5 right-5 text-[#1B365D]/10 font-heading font-black text-3xl">{item.step}</div>
					<div class={`w-12 h-12 rounded-xl ${item.color} border flex items-center justify-center text-2xl mb-4`}>{item.icon}</div>
					<h3 class="font-heading font-semibold text-[#1B365D] text-base mb-2">{item.label}</h3>
					<p class="text-[#1B365D]/60 text-sm leading-relaxed">{item.desc}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- ===== FEATURES ===== -->
<section class="bg-[#1B365D] py-20 px-5">
	<div class="max-w-5xl mx-auto">
		<div class="text-center mb-14">
			<h2 class="font-heading font-bold text-white text-3xl sm:text-4xl mb-4">
				Không Chỉ Là Một App Học Tiếng Anh
			</h2>
			<p class="text-white/60 max-w-xl mx-auto">VASpeak được xây dựng cụ thể cho thế giới của Virtual Assistants.</p>
		</div>
		<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
			{#each [
				{ icon: '🏆', title: '8 Chuyên Ngành VA', desc: 'Ecommerce, Video Editing, Operations, Customer Support và hơn thế nữa. Học đúng từ vựng cho công việc của bạn.' },
				{ icon: '⚡', title: '100 AI Credits / Tháng', desc: 'Mỗi buổi hội thoại AI tiêu thụ credits. Earn thêm bằng cách hoàn thành milestones và daily challenges.' },
				{ icon: '🔥', title: 'Streak & Phần Thưởng', desc: 'Duy trì streak hàng ngày để mở khóa templates, certificates và phần thưởng độc quyền.' },
				{ icon: '📚', title: 'Kho Từ Vựng Thông Minh', desc: 'Mỗi từ vựng bạn gặp được lưu vào kho cá nhân kèm ví dụ thực tế từ hội thoại của bạn.' },
				{ icon: '📊', title: 'Bảng Xếp Hạng', desc: 'So sánh tiến độ với các VA khác. Cạnh tranh lành mạnh thúc đẩy học tập hiệu quả hơn.' },
				{ icon: '📱', title: 'Cài Như App Thật (PWA)', desc: 'Cài VASpeak lên màn hình điện thoại như một app native, học mọi lúc mọi nơi không cần mạng mạnh.' }
			] as feat}
				<div class="bg-white/8 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/12 transition-colors duration-200">
					<div class="text-3xl mb-4">{feat.icon}</div>
					<h3 class="font-heading font-semibold text-white text-base mb-2">{feat.title}</h3>
					<p class="text-white/55 text-sm leading-relaxed">{feat.desc}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- ===== TESTIMONIALS ===== -->
<section class="bg-white py-20 px-5">
	<div class="max-w-5xl mx-auto">
		<div class="text-center mb-14">
			<h2 class="font-heading font-bold text-[#1B365D] text-3xl sm:text-4xl mb-4">
				VA Nói Gì Về VASpeak?
			</h2>
		</div>
		<div class="grid md:grid-cols-3 gap-6">
			{#each [
				{ name: 'Nguyễn Thu Hà', role: 'Ecommerce VA – 2 năm kinh nghiệm', quote: 'Trước đây mỗi lần khách hàng gọi điện là tôi lo lắng lắm. Sau 30 ngày dùng VASpeak, tôi tự tin hơn hẳn và còn kiếm được 2 client mới nhờ giao tiếp tốt hơn.' },
				{ name: 'Trần Minh Khoa', role: 'Video Editor VA – Freelancer', quote: 'Phần AI roleplay là yêu thích nhất của tôi. Được nói chuyện với "khách hàng" mà không sợ mắc lỗi, sau đó AI sửa ngay cho mình – hiệu quả hơn học phát âm từ điển nhiều.' },
				{ name: 'Lê Phương Linh', role: 'Operations VA – Agency', quote: 'Streak 45 ngày rồi! 🔥 Tôi chưa bao giờ duy trì được thói quen học lâu đến vậy. Gamification của VASpeak thực sự làm cho việc học trở nên thú vị.' }
			] as t}
				<div class="bg-[#FFFBF1] rounded-2xl p-6 border border-[#1B365D]/8 shadow-[0_4px_14px_rgba(27,54,93,0.06)]">
					<div class="flex gap-1 mb-4">
						{#each [1,2,3,4,5] as _}
							<span class="text-[#F2A906] text-sm">★</span>
						{/each}
					</div>
					<p class="text-[#1B365D]/75 text-sm leading-relaxed mb-5 italic">"{t.quote}"</p>
					<div class="flex items-center gap-3">
						<div class="w-9 h-9 rounded-full bg-[#F2A906]/20 flex items-center justify-center font-heading font-bold text-[#1B365D] text-sm">
							{t.name[0]}
						</div>
						<div>
							<p class="font-semibold text-[#1B365D] text-sm">{t.name}</p>
							<p class="text-[#1B365D]/50 text-xs">{t.role}</p>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- ===== WAITLIST CTA ===== -->
<section id="waitlist" class="bg-[#FFFBF1] py-24 px-5">
	<div class="max-w-2xl mx-auto text-center">
		<div class="bg-white rounded-3xl p-10 shadow-[0_8px_40px_rgba(27,54,93,0.1)] border border-[#1B365D]/8">
			<div class="text-5xl mb-5">🚀</div>
			<h2 class="font-heading font-extrabold text-[#1B365D] text-3xl sm:text-4xl mb-4">
				Sẵn Sàng Bắt Đầu Hành Trình?
			</h2>
			<p class="text-[#1B365D]/65 mb-8 leading-relaxed">
				Đăng ký ngay để nhận thông báo khi VASpeak ra mắt chính thức và <strong>50 AI Credits miễn phí</strong> cho người dùng đầu tiên.
			</p>

			<form onsubmit={handleSubmit} class="flex flex-col sm:flex-row gap-3">
				<input
					type="email"
					bind:value={email}
					placeholder="email của bạn..."
					required
					disabled={status === 'loading' || status === 'success'}
					class="flex-1 px-4 py-3.5 rounded-xl border border-[#1B365D]/20 bg-[#FFFBF1] text-[#1B365D] placeholder-[#1B365D]/40 focus:outline-none focus:ring-2 focus:ring-[#F2A906] text-sm disabled:opacity-50"
				/>
				<button
					type="submit"
					disabled={status === 'loading' || status === 'success'}
					class="bg-[#F2A906] text-[#1B365D] font-bold px-7 py-3.5 rounded-xl hover:bg-[#d99506] active:scale-95 transition-all duration-200 disabled:opacity-60 whitespace-nowrap text-sm shadow-lg shadow-[#F2A906]/30"
				>
					{status === 'loading' ? 'Đang gửi...' : status === 'success' ? '✓ Đã đăng ký!' : '🎉 Đăng Ký Miễn Phí'}
				</button>
			</form>

			{#if message}
				<p class={`text-sm font-medium mt-4 ${status === 'success' ? 'text-[#10B981]' : 'text-red-500'}`}>{message}</p>
			{/if}

			<div class="mt-6 flex flex-col sm:flex-row justify-center gap-5 text-xs text-[#1B365D]/45">
				<span>✓ Miễn phí 50 AI Credits</span>
				<span>✓ Không spam</span>
				<span>✓ Hủy bất cứ lúc nào</span>
			</div>
		</div>
	</div>
</section>

<!-- ===== FOOTER ===== -->
<footer class="bg-[#1B365D] text-white/50 py-10 px-5">
	<div class="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
		<div class="flex items-center gap-2">
			<div class="w-6 h-6 rounded bg-[#F2A906] flex items-center justify-center">
				<span class="text-[#1B365D] font-bold text-xs">VS</span>
			</div>
			<span class="text-white font-semibold font-heading">VASpeak</span>
		</div>
		<p>© 2026 VASpeak by PeopleLink VAP. All rights reserved.</p>
		<div class="flex gap-5 items-center">
			<a href="/privacy" class="hover:text-white transition-colors">Privacy</a>
			<a href="/terms" class="hover:text-white transition-colors">Terms</a>
			<span class="w-px h-3 bg-white/20"></span>
			<a href="/login" class="hover:text-white transition-colors text-white/35">Đăng nhập</a>
		</div>
	</div>
</footer>
