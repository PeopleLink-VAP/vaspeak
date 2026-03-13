<script lang="ts">
	import { onMount } from 'svelte';

	let email = $state('');
	let status = $state<'idle' | 'loading' | 'success' | 'error'>('idle');
	let message = $state('');
	let scrollY = $state(0);

	onMount(() => {
		// Scroll-reveal via IntersectionObserver
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						entry.target.classList.add('visible');
						observer.unobserve(entry.target);
					}
				}
			},
			{ threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
		);

		document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

		return () => observer.disconnect();
	});

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
				message = data.message ?? 'Đã đăng ký thành công!';
				email = '';
			} else {
				status = 'error';
				message = data.error ?? 'Có lỗi xảy ra. Vui lòng thử lại.';
			}
		} catch {
			status = 'error';
			message = 'Lỗi kết nối. Vui lòng thử lại.';
		}
	}
</script>

<svelte:head>
	<title>VASpeak – Luyện Nói Tiếng Anh Dành Cho VA</title>
	<meta name="description" content="VASpeak giúp Virtual Assistants Việt Nam luyện nói tiếng Anh qua hội thoại thực tế mỗi ngày. Không học vẹt, không dịch từng chữ." />
</svelte:head>

<svelte:window bind:scrollY />

<style>
	/* Scroll-reveal */
	.reveal {
		opacity: 0;
		transform: translateY(26px);
		transition: opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1),
		            transform 0.65s cubic-bezier(0.16, 1, 0.3, 1);
	}
	.reveal.visible { opacity: 1; transform: translateY(0); }

	.reveal-d1 { transition-delay: 0.07s; }
	.reveal-d2 { transition-delay: 0.14s; }
	.reveal-d3 { transition-delay: 0.21s; }
	.reveal-d4 { transition-delay: 0.28s; }
	.reveal-d5 { transition-delay: 0.35s; }
	.reveal-d6 { transition-delay: 0.42s; }

	/* Card hover lift */
	.lift {
		transition: transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1),
		            box-shadow 0.28s ease;
	}
	.lift:hover { transform: translateY(-4px); box-shadow: 0 14px 36px rgba(27,54,93,0.11); }

	/* Feature card */
	.feat-card { transition: background 0.2s ease, transform 0.25s ease; }
	.feat-card:hover { background: rgba(255,255,255,0.12); transform: translateY(-3px); }

	/* Breathing pulse */
	@keyframes breathe {
		0%, 100% { opacity: 1; transform: scale(1); }
		50%       { opacity: 0.55; transform: scale(0.8); }
	}
	.pulse { animation: breathe 2.2s ease-in-out infinite; }

	/* Hero parallax — managed via inline style + scrollY */
	.hero-inner { will-change: transform; }

	/* Section gradient blends — no hard visual borders */
	.blend-down  { background: linear-gradient(to bottom, #FFFBF1, #ffffff); }
	.blend-up    { background: linear-gradient(to bottom, #ffffff, #FFFBF1); }
	.blend-dark  { background: linear-gradient(to bottom, #FFFBF1 0%, #1B365D 7%, #1B365D 93%, #FFFBF1 100%); }
</style>

<!-- ===== NAVBAR ===== -->
<header class="sticky top-0 z-50 bg-[#FFFBF1]/80 backdrop-blur-xl border-b border-[#1B365D]/5 transition-shadow"
	style:box-shadow={scrollY > 20 ? '0 2px 20px rgba(27,54,93,0.07)' : 'none'}>
	<nav class="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
		<div class="flex items-center gap-2">
			<div class="w-8 h-8 rounded-lg bg-[#F2A906] flex items-center justify-center">
				<span class="text-[#1B365D] font-bold text-sm">VS</span>
			</div>
			<span class="font-heading font-bold text-[#1B365D] text-lg">VASpeak</span>
		</div>
		<a href="#waitlist"
			class="bg-[#F2A906] text-[#1B365D] font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-[#d99506] active:scale-95 transition-all duration-200">
			Đăng Ký
		</a>
	</nav>
</header>

<!-- ===== HERO ===== -->
<section class="bg-[#FFFBF1] pt-24 pb-32 px-5 overflow-hidden">
	<div
		class="max-w-4xl mx-auto text-center hero-inner"
		style:transform="translateY({Math.min(scrollY * 0.18, 60)}px)"
	>
		<div class="inline-flex items-center gap-2 bg-[#F2A906]/12 rounded-full px-4 py-1.5 mb-7">
			<span class="text-[#F2A906] text-xs font-semibold uppercase tracking-wider">Sắp ra mắt</span>
			<span class="w-1.5 h-1.5 rounded-full bg-[#F2A906] pulse"></span>
		</div>

		<h1 class="font-heading font-extrabold text-[#1B365D] text-4xl sm:text-5xl lg:text-6xl leading-tight mb-6">
			Nói Tiếng Anh Tự Tin<br/>
			<span class="text-[#F2A906]">Chỉ 15 Phút Mỗi Ngày</span>
		</h1>

		<p class="text-[#1B365D]/65 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
			VASpeak giúp Virtual Assistants Việt Nam luyện nói tiếng Anh qua hội thoại thực tế mỗi ngày. Không học vẹt, không dịch từng chữ.
		</p>

		<form onsubmit={handleSubmit} class="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto mb-5">
			<input
				type="email"
				bind:value={email}
				placeholder="email của bạn..."
				required
				disabled={status === 'loading' || status === 'success'}
				class="flex-1 px-4 py-3 rounded-lg border border-[#1B365D]/15 bg-white text-[#1B365D] placeholder-[#1B365D]/35 focus:outline-none focus:ring-2 focus:ring-[#F2A906] text-sm disabled:opacity-50"
			/>
			<button
				type="submit"
				disabled={status === 'loading' || status === 'success'}
				class="bg-[#F2A906] text-[#1B365D] font-bold px-6 py-3 rounded-lg hover:bg-[#d99506] transition-all duration-200 disabled:opacity-60 whitespace-nowrap text-sm"
			>
				{status === 'loading' ? 'Đang gửi...' : status === 'success' ? '✓ Đã đăng ký!' : 'Đăng Ký'}
			</button>
		</form>

		{#if message}
			<p class={`text-sm font-medium mb-4 ${status === 'success' ? 'text-[#10B981]' : 'text-red-500'}`}>{message}</p>
		{/if}

		<p class="text-xs text-[#1B365D]/35">Không spam. Chỉ thông báo khi ra mắt chính thức.</p>

		<div class="mt-14 flex flex-wrap items-center justify-center gap-4 text-sm text-[#1B365D]/50">
			<span class="flex items-center gap-1.5">🇻🇳 Dành riêng cho VA Việt Nam</span>
			<span class="w-px h-4 bg-[#1B365D]/10 hidden sm:block"></span>
			<span class="flex items-center gap-1.5">🎙️ Luyện qua hội thoại thực tế</span>
			<span class="w-px h-4 bg-[#1B365D]/10 hidden sm:block"></span>
			<span class="flex items-center gap-1.5">📱 Cài như app trên điện thoại</span>
		</div>
	</div>
</section>

<!-- ===== PROBLEM ===== -->
<div class="blend-down">
<section class="py-20 px-5">
	<div class="max-w-5xl mx-auto">
		<div class="text-center mb-14">
			<h2 class="reveal font-heading font-bold text-[#1B365D] text-3xl sm:text-4xl mb-4">
				Bạn Có Đang Gặp Phải Điều Này?
			</h2>
			<p class="reveal reveal-d1 text-[#1B365D]/55 max-w-xl mx-auto">
				Những khó khăn thường gặp khi làm việc với khách hàng nước ngoài.
			</p>
		</div>
		<div class="grid md:grid-cols-3 gap-6">
			{#each [
				{ icon: '😰', title: 'Lo lắng khi nói tiếng Anh', desc: 'Biết từ vựng nhưng cứ đến lúc nói lại bị đơ và mất tự tin.' },
				{ icon: '🤔', title: 'Không biết nói sao cho đúng', desc: 'Nghe hiểu khá ổn nhưng không biết cách diễn đạt đúng tông nghề nghiệp.' },
				{ icon: '📉', title: 'Mất cơ hội vì ngôn ngữ', desc: 'Kỹ năng chuyên môn tốt nhưng kém tự tin tiếng Anh khiến mất nhiều hợp đồng.' }
			] as p, i}
				<div class="reveal reveal-d{i+1} lift bg-white rounded-2xl p-6 shadow-[0_2px_20px_rgba(27,54,93,0.06)]">
					<div class="text-4xl mb-4">{p.icon}</div>
					<h3 class="font-heading font-semibold text-[#1B365D] text-lg mb-2">{p.title}</h3>
					<p class="text-[#1B365D]/55 text-sm leading-relaxed">{p.desc}</p>
				</div>
			{/each}
		</div>
	</div>
</section>
</div>

<!-- ===== HOW IT WORKS ===== -->
<div class="blend-up">
<section class="py-20 px-5">
	<div class="max-w-5xl mx-auto">
		<div class="text-center mb-14">
			<h2 class="reveal font-heading font-bold text-[#1B365D] text-3xl sm:text-4xl mb-4">
				4 Bước Mỗi Bài Học
			</h2>
			<p class="reveal reveal-d1 text-[#1B365D]/55 max-w-xl mx-auto">
				15 phút mỗi ngày, tập trung vào tình huống thực tế bạn gặp trong công việc VA hàng ngày.
			</p>
		</div>
		<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
			{#each [
				{ step: '01', icon: '🎧', label: 'Nghe hiểu', desc: 'Nghe đoạn hội thoại với khách hàng nước ngoài và trả lời câu hỏi.' },
				{ step: '02', icon: '💬', label: 'Luyện mẫu câu', desc: 'Đọc to và lặp lại các cấu trúc câu chuyên nghiệp theo từng tình huống.' },
				{ step: '03', icon: '🎙️', label: 'Thực hành hội thoại', desc: 'Đóng vai VA trong tình huống giao tiếp thực tế với khách hàng.' },
				{ step: '04', icon: '⭐', label: 'Nhìn lại và tiến bộ', desc: 'Ghi lại cảm xúc sau mỗi bài, theo dõi streak và mở khóa phần thưởng.' }
			] as item, i}
				<div class="reveal reveal-d{i+1} lift bg-white rounded-2xl p-6 shadow-[0_2px_20px_rgba(27,54,93,0.06)] relative">
					<div class="absolute top-5 right-5 text-[#1B365D]/8 font-heading font-black text-3xl">{item.step}</div>
					<div class="text-2xl mb-4">{item.icon}</div>
					<h3 class="font-heading font-semibold text-[#1B365D] text-base mb-2">{item.label}</h3>
					<p class="text-[#1B365D]/55 text-sm leading-relaxed">{item.desc}</p>
				</div>
			{/each}
		</div>
	</div>
</section>
</div>

<!-- ===== FEATURES (dark, seamlessly blended) ===== -->
<section class="blend-dark py-24 px-5">
	<div class="max-w-5xl mx-auto">
		<div class="text-center mb-14">
			<h2 class="reveal font-heading font-bold text-white text-3xl sm:text-4xl mb-4">
				Tính Năng Chính
			</h2>
			<p class="reveal reveal-d1 text-white/50 max-w-xl mx-auto">
				VASpeak được thiết kế cho công việc cụ thể của Virtual Assistants, không phải học tiếng Anh chung chung.
			</p>
		</div>
		<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
			{#each [
				{ icon: '🏆', title: '8 Ngành Nghề VA', desc: 'Ecommerce, Video Editing, Operations, Customer Support. Nội dung sát với công việc thực tế.' },
				{ icon: '⚡', title: 'Credits Hàng Tháng', desc: 'Mỗi tháng nhận 100 credits để thực hành hội thoại. Hoàn thành bài học để nhận thêm.' },
				{ icon: '🔥', title: 'Streak Hàng Ngày', desc: 'Duy trì thói quen học mỗi ngày để mở khóa templates và phần thưởng.' },
				{ icon: '📚', title: 'Kho Từ Vựng', desc: 'Từ vựng bạn gặp trong bài được lưu lại kèm ví dụ cụ thể để ôn tập sau.' },
				{ icon: '📊', title: 'Theo Dõi Tiến Độ', desc: 'Xem bạn đã hoàn thành bao nhiêu bài, streak bao nhiêu ngày và điểm từng buổi.' },
				{ icon: '📱', title: 'Cài Trên Điện Thoại', desc: 'Cài VASpeak lên màn hình như app thật. Học mọi lúc không cần mở trình duyệt.' }
			] as feat, i}
				<div class="reveal reveal-d{(i%3)+1} feat-card rounded-2xl p-6 border border-white/8 bg-white/6 backdrop-blur-sm">
					<div class="text-3xl mb-4">{feat.icon}</div>
					<h3 class="font-heading font-semibold text-white text-base mb-2">{feat.title}</h3>
					<p class="text-white/50 text-sm leading-relaxed">{feat.desc}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- ===== TESTIMONIALS ===== -->
<section class="py-20 px-5 bg-[#FFFBF1]">
	<div class="max-w-5xl mx-auto">
		<div class="text-center mb-14">
			<h2 class="reveal font-heading font-bold text-[#1B365D] text-3xl sm:text-4xl mb-4">
				VA Nói Gì Về VASpeak?
			</h2>
		</div>
		<div class="grid md:grid-cols-3 gap-6">
			{#each [
				{ name: 'Nguyễn Thu Hà', role: 'Ecommerce VA, 2 năm kinh nghiệm', quote: 'Trước đây mỗi lần khách hàng gọi điện là tôi lo lắng. Sau 30 ngày dùng VASpeak tôi tự tin hơn hẳn và ký được hợp đồng mới nhờ giao tiếp tốt hơn.' },
				{ name: 'Trần Minh Khoa', role: 'Video Editor VA, Freelancer', quote: 'Phần thực hành hội thoại là yêu thích nhất của tôi. Được đóng vai VA trong tình huống thực tế và nhận phản hồi ngay sau đó. Hiệu quả hơn học từ điển nhiều.' },
				{ name: 'Lê Phương Linh', role: 'Operations VA, Agency', quote: 'Streak 45 ngày rồi. Tôi chưa bao giờ duy trì được thói quen học lâu đến vậy. Theo dõi tiến độ mỗi ngày giúp tôi học đều và nhớ lâu hơn.' }
			] as t, i}
				<div class="reveal reveal-d{i+1} lift bg-white rounded-2xl p-6 shadow-[0_2px_20px_rgba(27,54,93,0.06)]">
					<div class="flex gap-0.5 mb-4">
						{#each [1,2,3,4,5] as _}
							<span class="text-[#F2A906] text-sm">★</span>
						{/each}
					</div>
					<p class="text-[#1B365D]/70 text-sm leading-relaxed mb-5 italic">"{t.quote}"</p>
					<div class="flex items-center gap-3">
						<div class="w-9 h-9 rounded-full bg-[#F2A906]/20 flex items-center justify-center font-heading font-bold text-[#1B365D] text-sm">
							{t.name[0]}
						</div>
						<div>
							<p class="font-semibold text-[#1B365D] text-sm">{t.name}</p>
							<p class="text-[#1B365D]/45 text-xs">{t.role}</p>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- ===== CTA ===== -->
<section id="waitlist" class="py-24 px-5 bg-[#FFFBF1]">
	<div class="max-w-lg mx-auto text-center">
		<div class="reveal bg-white rounded-3xl p-10 shadow-[0_8px_40px_rgba(27,54,93,0.08)]">
			<div class="text-4xl mb-5">📩</div>
			<h2 class="font-heading font-extrabold text-[#1B365D] text-2xl sm:text-3xl mb-3">
				Tham Gia Danh Sách Chờ
			</h2>
			<p class="text-[#1B365D]/55 mb-7 text-sm leading-relaxed">
				Đăng ký để nhận thông báo khi VASpeak ra mắt. Các tài khoản đầu tiên sẽ nhận 50 credits miễn phí.
			</p>

			<form onsubmit={handleSubmit} class="flex flex-col sm:flex-row gap-3">
				<input
					type="email"
					bind:value={email}
					placeholder="email của bạn..."
					required
					disabled={status === 'loading' || status === 'success'}
					class="flex-1 px-4 py-3.5 rounded-xl border border-[#1B365D]/15 bg-[#FFFBF1] text-[#1B365D] placeholder-[#1B365D]/35 focus:outline-none focus:ring-2 focus:ring-[#F2A906] text-sm disabled:opacity-50"
				/>
				<button
					type="submit"
					disabled={status === 'loading' || status === 'success'}
					class="bg-[#F2A906] text-[#1B365D] font-bold px-6 py-3.5 rounded-xl hover:bg-[#d99506] active:scale-95 transition-all duration-200 disabled:opacity-60 whitespace-nowrap text-sm shadow-md shadow-[#F2A906]/20"
				>
					{status === 'loading' ? 'Đang gửi...' : status === 'success' ? '✓ Đã đăng ký!' : 'Đăng Ký'}
				</button>
			</form>

			{#if message}
				<p class={`text-sm font-medium mt-4 ${status === 'success' ? 'text-[#10B981]' : 'text-red-500'}`}>{message}</p>
			{/if}

			<div class="mt-5 flex flex-wrap justify-center gap-4 text-xs text-[#1B365D]/35">
				<span>✓ Miễn phí</span>
				<span>✓ Không spam</span>
				<span>✓ Hủy bất cứ lúc nào</span>
			</div>
		</div>
	</div>
</section>

<!-- ===== FOOTER ===== -->
<footer class="bg-[#1B365D] text-white/40 py-10 px-5">
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
			<span class="w-px h-3 bg-white/15"></span>
			<a href="/login" class="hover:text-white transition-colors text-white/25">Đăng nhập</a>
		</div>
	</div>
</footer>
