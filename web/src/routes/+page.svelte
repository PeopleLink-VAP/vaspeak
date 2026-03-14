<script lang="ts">
	import { onMount } from 'svelte';

	let email = $state('');
	let status = $state<'idle' | 'loading' | 'success' | 'error'>('idle');
	let message = $state('');
	let scrollY = $state(0);

	onMount(() => {
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

<!-- ===== NAVBAR ===== -->
<header
	class="sticky top-0 z-50 transition-all duration-300"
	style:background={scrollY > 20 ? 'rgba(250,250,248,0.85)' : 'transparent'}
	style:backdrop-filter={scrollY > 20 ? 'blur(20px)' : 'none'}
>
	<nav class="max-w-6xl mx-auto px-6 lg:px-8 py-5 flex items-center justify-between">
		<span class="font-heading font-extrabold text-[#1A1A1A] text-lg tracking-tight">VASpeak</span>
		<a href="/login"
			class="text-[#D4960A] font-medium text-sm hover:text-[#b07d08] transition-colors">
			Đăng Nhập
		</a>
	</nav>
</header>

<!-- ===== HERO ===== -->
<section class="bg-[#FAFAF8] pt-16 sm:pt-20 lg:pt-28 pb-24 lg:pb-36 px-6 lg:px-8 overflow-hidden">
	<div class="max-w-6xl mx-auto lg:flex lg:items-start lg:gap-16">
		<!-- Left content -->
		<div class="lg:w-[58%]">
			<div class="inline-flex items-center gap-2 bg-[#D4960A]/10 rounded-full px-4 py-1.5 mb-7">
				<span class="text-[#D4960A] text-xs font-semibold uppercase tracking-wider">Sắp ra mắt</span>
				<span class="w-1.5 h-1.5 rounded-full bg-[#D4960A] pulse"></span>
			</div>

			<h1 class="font-heading font-extrabold text-[#1A1A1A] text-[2.75rem] sm:text-5xl lg:text-[3.5rem] leading-[1.08] tracking-tight mb-5">
				Nói Tiếng Anh Tự Tin<br/>
				<span class="text-[#D4960A]">Chỉ 15 Phút.</span>
			</h1>

			<p class="text-[#6B6B6B] text-base sm:text-lg max-w-xl mb-9 leading-relaxed">
				Luyện nói thực tế. Không học vẹt.
			</p>

			<form onsubmit={handleSubmit} class="flex flex-col sm:flex-row gap-3 max-w-md mb-4">
				<div class="flex-1 relative">
					<input
						type="email"
						bind:value={email}
						placeholder="email của bạn..."
						required
						disabled={status === 'loading' || status === 'success'}
						class="w-full px-0 py-3 bg-transparent text-[#1A1A1A] placeholder-[#A3A3A3] border-b border-[#E8E8E8] focus:border-[#D4960A] focus:outline-none text-sm transition-colors disabled:opacity-50"
					/>
				</div>
				<button
					type="submit"
					disabled={status === 'loading' || status === 'success'}
					class="bg-[#D4960A] text-[#1A1A1A] font-bold px-6 py-2.5 rounded-md hover:bg-[#b07d08] transition-all duration-200 disabled:opacity-60 whitespace-nowrap text-sm"
				>
					{status === 'loading' ? 'Đang gửi...' : status === 'success' ? '✓ Đã đăng ký!' : 'Đăng Ký'}
				</button>
			</form>

			{#if message}
				<p class={`text-sm font-medium mb-4 ${status === 'success' ? 'text-[#10B981]' : 'text-red-500'}`}>{message}</p>
			{/if}

			<p class="text-xs text-[#A3A3A3] mb-10">Không spam. Chỉ thông báo khi ra mắt chính thức.</p>

			<div class="flex flex-wrap items-center gap-4 text-sm text-[#6B6B6B]">
				<span>🇻🇳 Dành cho VA Việt Nam</span>
				<span class="text-[#E8E8E8]">·</span>
				<span class="flex items-center gap-1.5"><img src="/icons/i_microphone.png" alt="" class="w-4 h-4" /> Hội thoại thực tế</span>
				<span class="text-[#E8E8E8]">·</span>
				<span>📱 PWA</span>
			</div>
		</div>

		<!-- Right decorative typography (desktop only) -->
		<div class="hidden lg:flex lg:w-[42%] items-center justify-center select-none" aria-hidden="true">
			<span class="font-heading font-extrabold text-[180px] leading-none text-[#F0EDE4] tracking-tighter">
				SP<span class="text-[#D4960A]/10">EA</span>K
			</span>
		</div>
	</div>
</section>

<!-- ===== PROBLEM ===== -->
<section class="py-20 lg:py-28 px-6 lg:px-8 bg-[#FAFAF8]">
	<div class="max-w-6xl mx-auto">
		<div class="mb-12 lg:mb-16">
			<div class="w-10 h-0.5 bg-[#D4960A] mb-5 reveal"></div>
			<h2 class="reveal font-heading font-bold text-[#1A1A1A] text-2xl sm:text-3xl lg:text-4xl tracking-tight">
				Bạn Có Đang Gặp Phải Điều Này?
			</h2>
			<p class="reveal reveal-d1 text-[#6B6B6B] max-w-lg mt-3 text-sm sm:text-base">
				Những khó khăn thường gặp khi làm việc với khách hàng nước ngoài.
			</p>
		</div>

		<div class="grid md:grid-cols-3 gap-x-16 gap-y-10">
			{#each [
				{ icon: '😰', title: 'Lo lắng khi nói tiếng Anh', desc: 'Biết từ vựng nhưng cứ đến lúc nói lại bị đơ và mất tự tin.' },
				{ icon: '🤔', title: 'Không biết nói sao cho đúng', desc: 'Nghe hiểu khá ổn nhưng không biết cách diễn đạt đúng tông nghề nghiệp.' },
				{ icon: '📉', title: 'Mất cơ hội vì ngôn ngữ', desc: 'Kỹ năng chuyên môn tốt nhưng kém tự tin tiếng Anh khiến mất nhiều hợp đồng.' }
			] as p, i}
				<div class="reveal reveal-d{i+1} flex gap-5 items-start" style:padding-left="{i * 0}px">
					<span class="text-3xl flex-shrink-0 mt-0.5">{p.icon}</span>
					<div>
						<h3 class="font-heading font-semibold text-[#1A1A1A] text-base mb-1.5">{p.title}</h3>
						<p class="text-[#6B6B6B] text-sm leading-relaxed">{p.desc}</p>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- ===== HOW IT WORKS ===== -->
<section class="py-20 lg:py-28 px-6 lg:px-8 bg-[#FAFAF8]">
	<div class="max-w-6xl mx-auto">
		<div class="mb-12 lg:mb-16">
			<div class="w-10 h-0.5 bg-[#D4960A] mb-5 reveal"></div>
			<h2 class="reveal font-heading font-bold text-[#1A1A1A] text-2xl sm:text-3xl lg:text-4xl tracking-tight">
				4 Bước Mỗi Bài Học
			</h2>
			<p class="reveal reveal-d1 text-[#6B6B6B] max-w-lg mt-3 text-sm sm:text-base">
				15 phút mỗi ngày, tập trung vào tình huống thực tế bạn gặp trong công việc VA hàng ngày.
			</p>
		</div>

		<div class="grid sm:grid-cols-2 gap-y-14 gap-x-16 lg:gap-x-24">
			{#each [
				{ step: '01', icon: '/icons/i_listen.png', label: 'Nghe hiểu', desc: 'Nghe đoạn hội thoại với khách hàng nước ngoài và trả lời câu hỏi.' },
				{ step: '02', icon: '/icons/i_speaking.png', label: 'Luyện mẫu câu', desc: 'Đọc to và lặp lại các cấu trúc câu chuyên nghiệp theo từng tình huống.' },
				{ step: '03', icon: '/icons/i_microphone.png', label: 'Thực hành hội thoại', desc: 'Đóng vai VA trong tình huống giao tiếp thực tế với khách hàng.' },
				{ step: '04', icon: '/icons/i_writing.png', label: 'Nhìn lại và tiến bộ', desc: 'Ghi lại cảm xúc sau mỗi bài, theo dõi streak và mở khóa phần thưởng.' }
			] as item, i}
				<div class="reveal reveal-d{i+1} relative">
					<span class="font-heading font-black text-[5rem] leading-none text-[#F0EDE4] absolute -top-6 -left-2 select-none" aria-hidden="true">{item.step}</span>
					<div class="relative z-10 pt-8 pl-1">
						<img src={item.icon} alt={item.label} class="w-7 h-7 mb-3 opacity-70" />
						<h3 class="font-heading font-semibold text-[#1A1A1A] text-base mb-1.5">{item.label}</h3>
						<p class="text-[#6B6B6B] text-sm leading-relaxed max-w-xs">{item.desc}</p>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- ===== FEATURES ===== -->
<section class="py-20 lg:py-24 px-6 lg:px-8 bg-[#F5F0E6]">
	<div class="max-w-6xl mx-auto">
		<div class="mb-10 lg:mb-14">
			<h2 class="reveal font-heading font-bold text-[#1A1A1A] text-2xl sm:text-3xl tracking-tight">
				Tính Năng
			</h2>
		</div>

		<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
			{#each [
				{ icon: '/icons/i_challenge.png', title: '8 Ngành Nghề VA', desc: 'Ecommerce, Video Editing, Operations, Customer Support.' },
				{ icon: '/icons/i_credit.png', title: 'Credits Hàng Tháng', desc: 'Mỗi tháng nhận 100 credits để thực hành hội thoại.' },
				{ icon: '/icons/i_lesson.png', title: 'Streak Hàng Ngày', desc: 'Duy trì thói quen học mỗi ngày để mở khóa phần thưởng.' },
				{ icon: '/icons/i_abc.png', title: 'Kho Từ Vựng', desc: 'Từ vựng bạn gặp được lưu lại kèm ví dụ để ôn tập.' },
				{ icon: '/icons/i_listen2.png', title: 'Theo Dõi Tiến Độ', desc: 'Xem streak, điểm từng buổi, và bao nhiêu bài hoàn thành.' },
				{ icon: '/icons/i_speak.png', title: 'Cài Trên Điện Thoại', desc: 'Cài VASpeak lên màn hình như app thật. Học mọi lúc.' }
			] as feat, i}
				<div class="reveal reveal-d{(i%3)+1}">
					<img src={feat.icon} alt={feat.title} class="w-9 h-9 mb-3 opacity-80" />
					<h3 class="font-heading font-semibold text-[#1A1A1A] text-sm mb-1">{feat.title}</h3>
					<p class="text-[#6B6B6B] text-sm leading-relaxed">{feat.desc}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- ===== TESTIMONIALS ===== -->
<section class="py-20 lg:py-28 px-6 lg:px-8 bg-[#FAFAF8]">
	<div class="max-w-3xl mx-auto">
		<div class="reveal text-center lg:text-left">
			<span class="font-heading font-black text-[#D4960A]/20 text-[6rem] lg:text-[8rem] leading-none select-none" aria-hidden="true">❝</span>
			<blockquote class="font-heading text-[#1A1A1A] text-xl sm:text-2xl lg:text-[1.75rem] leading-snug italic -mt-10 lg:-mt-16 mb-8 max-w-2xl">
				Trước đây mỗi lần khách hàng gọi điện là tôi lo lắng. Sau 30 ngày dùng VASpeak tôi tự tin hơn hẳn và ký được hợp đồng mới nhờ giao tiếp tốt hơn.
			</blockquote>
			<div>
				<p class="font-semibold text-[#D4960A] text-sm uppercase tracking-wider">Nguyễn Thu Hà</p>
				<p class="text-[#A3A3A3] text-xs mt-0.5">Ecommerce VA, 2 năm kinh nghiệm</p>
			</div>
		</div>
	</div>
</section>

<!-- ===== CTA ===== -->
<section id="waitlist" class="py-24 lg:py-32 px-6 lg:px-8" style="background: linear-gradient(to bottom, #FAFAF8, #F5F0E6);">
	<div class="max-w-6xl mx-auto lg:flex lg:items-start lg:justify-between lg:gap-16">
		<!-- Left text -->
		<div class="lg:w-1/2 mb-10 lg:mb-0">
			<h2 class="reveal font-heading font-extrabold text-[#1A1A1A] text-2xl sm:text-3xl lg:text-4xl tracking-tight mb-3">
				Tham Gia Danh Sách Chờ
			</h2>
			<p class="reveal reveal-d1 text-[#6B6B6B] text-sm sm:text-base leading-relaxed max-w-md">
				Đăng ký để nhận thông báo khi VASpeak ra mắt. Các tài khoản đầu tiên sẽ nhận 50 credits miễn phí.
			</p>
		</div>

		<!-- Right form -->
		<div class="lg:w-1/2 max-w-md">
			<form onsubmit={handleSubmit} class="reveal reveal-d2 flex flex-col sm:flex-row gap-3 mb-4">
				<div class="flex-1 relative">
					<input
						type="email"
						bind:value={email}
						placeholder="email của bạn..."
						required
						disabled={status === 'loading' || status === 'success'}
						class="w-full px-0 py-3 bg-transparent text-[#1A1A1A] placeholder-[#A3A3A3] border-b border-[#E8E8E8] focus:border-[#D4960A] focus:outline-none text-sm transition-colors disabled:opacity-50"
					/>
				</div>
				<button
					type="submit"
					disabled={status === 'loading' || status === 'success'}
					class="bg-[#D4960A] text-[#1A1A1A] font-bold px-6 py-2.5 rounded-md hover:bg-[#b07d08] transition-all duration-200 disabled:opacity-60 whitespace-nowrap text-sm"
				>
					{status === 'loading' ? 'Đang gửi...' : status === 'success' ? '✓ Đã đăng ký!' : 'Đăng Ký'}
				</button>
			</form>

			{#if message}
				<p class={`text-sm font-medium mb-3 ${status === 'success' ? 'text-[#10B981]' : 'text-red-500'}`}>{message}</p>
			{/if}

			<div class="flex gap-5 text-xs text-[#A3A3A3]">
				<span>✓ Miễn phí</span>
				<span>✓ Không spam</span>
				<span>✓ Hủy bất cứ lúc nào</span>
			</div>
		</div>
	</div>
</section>

<!-- ===== FOOTER ===== -->
<footer class="bg-[#1A1A1A] py-8 px-6 lg:px-8">
	<div class="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
		<span class="font-heading font-bold text-white/80">VASpeak</span>
		<p class="text-[#6B6B6B]">© 2026 PeopleLink VAP</p>
		<div class="flex gap-5 items-center text-[#6B6B6B]">
			<a href="/privacy" class="hover:text-[#A3A3A3] transition-colors">Privacy</a>
			<a href="/terms" class="hover:text-[#A3A3A3] transition-colors">Terms</a>
			<span class="w-1 h-1 rounded-full bg-[#D4960A]"></span>
			<a href="/login" class="hover:text-[#A3A3A3] transition-colors">Đăng nhập</a>
		</div>
	</div>
</footer>
