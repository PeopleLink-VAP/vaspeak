<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();
	let tab = $state<'login' | 'register'>('login');
	let loading = $state(false);
</script>

<svelte:head>
	<title>Đăng Nhập — VASpeak</title>
	<meta name="description" content="Đăng nhập vào VASpeak để tiếp tục luyện nói tiếng Anh hàng ngày." />
</svelte:head>

<div class="min-h-screen bg-[#FFFBF1] flex flex-col items-center justify-center px-4 py-12">

	<!-- Logo -->
	<a href="/" class="flex items-center gap-2.5 mb-8">
		<div class="w-10 h-10 rounded-xl bg-[#F2A906] flex items-center justify-center shadow-lg shadow-[#F2A906]/30">
			<span class="text-[#1B365D] font-extrabold font-heading text-sm">VS</span>
		</div>
		<span class="font-heading font-bold text-[#1B365D] text-xl">VASpeak</span>
	</a>

	<div class="w-full max-w-sm">

		<!-- Card -->
		<div class="bg-white rounded-2xl shadow-[0_8px_40px_rgba(27,54,93,0.1)] border border-[#1B365D]/6 overflow-hidden">

			<!-- Tabs -->
			<div class="flex border-b border-[#1B365D]/8">
				<button
					onclick={() => tab = 'login'}
					class="flex-1 py-4 text-sm font-semibold transition-colors
						{tab === 'login'
							? 'text-[#1B365D] border-b-2 border-[#F2A906] bg-[#F2A906]/4'
							: 'text-[#1B365D]/40 hover:text-[#1B365D]/70'}"
				>
					Đăng Nhập
				</button>
				<button
					onclick={() => tab = 'register'}
					class="flex-1 py-4 text-sm font-semibold transition-colors
						{tab === 'register'
							? 'text-[#1B365D] border-b-2 border-[#F2A906] bg-[#F2A906]/4'
							: 'text-[#1B365D]/40 hover:text-[#1B365D]/70'}"
				>
					Đăng Ký
				</button>
			</div>

			<div class="p-6">

				<!-- Error from server -->
				{#if form?.error && form?.action === tab}
					<div class="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
						{form.error}
					</div>
				{/if}

				<!-- ── LOGIN FORM ── -->
				{#if tab === 'login'}
					<form
						method="POST"
						action="?/login"
						use:enhance={() => {
							loading = true;
							return async ({ update }) => { loading = false; await update(); };
						}}
						class="flex flex-col gap-4"
					>
						<div>
							<label for="login-email" class="block text-xs font-semibold text-[#1B365D]/60 mb-1.5 uppercase tracking-wide">Email</label>
							<input
								id="login-email"
								name="email"
								type="email"
								required
								autocomplete="email"
								placeholder="ban@example.com"
								class="w-full px-4 py-3 rounded-xl border border-[#1B365D]/15 bg-[#FFFBF1] text-[#1B365D] text-sm placeholder-[#1B365D]/30 focus:outline-none focus:ring-2 focus:ring-[#F2A906] focus:border-transparent transition"
							/>
						</div>

						<div>
							<label for="login-password" class="block text-xs font-semibold text-[#1B365D]/60 mb-1.5 uppercase tracking-wide">Mật khẩu</label>
							<input
								id="login-password"
								name="password"
								type="password"
								required
								autocomplete="current-password"
								placeholder="••••••••"
								class="w-full px-4 py-3 rounded-xl border border-[#1B365D]/15 bg-[#FFFBF1] text-[#1B365D] text-sm placeholder-[#1B365D]/30 focus:outline-none focus:ring-2 focus:ring-[#F2A906] focus:border-transparent transition"
							/>
						</div>

						<button
							type="submit"
							disabled={loading}
							class="w-full bg-[#F2A906] text-[#1B365D] font-bold py-3.5 rounded-xl text-sm hover:bg-[#d99506] active:scale-95 transition-all duration-150 disabled:opacity-60 shadow-lg shadow-[#F2A906]/25 mt-1"
						>
							{loading ? 'Đang đăng nhập...' : 'Đăng Nhập →'}
						</button>

						<p class="text-center text-xs text-[#1B365D]/40 mt-1">
							Chưa có tài khoản?
							<button type="button" onclick={() => tab = 'register'} class="text-[#F2A906] font-semibold hover:underline">
								Đăng ký miễn phí
							</button>
						</p>
					</form>

				<!-- ── REGISTER FORM ── -->
				{:else}
					<form
						method="POST"
						action="?/register"
						use:enhance={() => {
							loading = true;
							return async ({ update }) => { loading = false; await update(); };
						}}
						class="flex flex-col gap-4"
					>
						<div>
							<label for="reg-name" class="block text-xs font-semibold text-[#1B365D]/60 mb-1.5 uppercase tracking-wide">Tên hiển thị</label>
							<input
								id="reg-name"
								name="display_name"
								type="text"
								required
								autocomplete="name"
								placeholder="Nguyễn Thị Hoa"
								class="w-full px-4 py-3 rounded-xl border border-[#1B365D]/15 bg-[#FFFBF1] text-[#1B365D] text-sm placeholder-[#1B365D]/30 focus:outline-none focus:ring-2 focus:ring-[#F2A906] focus:border-transparent transition"
							/>
						</div>

						<div>
							<label for="reg-email" class="block text-xs font-semibold text-[#1B365D]/60 mb-1.5 uppercase tracking-wide">Email</label>
							<input
								id="reg-email"
								name="email"
								type="email"
								required
								autocomplete="email"
								placeholder="ban@example.com"
								class="w-full px-4 py-3 rounded-xl border border-[#1B365D]/15 bg-[#FFFBF1] text-[#1B365D] text-sm placeholder-[#1B365D]/30 focus:outline-none focus:ring-2 focus:ring-[#F2A906] focus:border-transparent transition"
							/>
						</div>

						<div>
							<label for="reg-password" class="block text-xs font-semibold text-[#1B365D]/60 mb-1.5 uppercase tracking-wide">Mật khẩu</label>
							<input
								id="reg-password"
								name="password"
								type="password"
								required
								autocomplete="new-password"
								placeholder="Tối thiểu 8 ký tự"
								minlength="8"
								class="w-full px-4 py-3 rounded-xl border border-[#1B365D]/15 bg-[#FFFBF1] text-[#1B365D] text-sm placeholder-[#1B365D]/30 focus:outline-none focus:ring-2 focus:ring-[#F2A906] focus:border-transparent transition"
							/>
						</div>

						<button
							type="submit"
							disabled={loading}
							class="w-full bg-[#F2A906] text-[#1B365D] font-bold py-3.5 rounded-xl text-sm hover:bg-[#d99506] active:scale-95 transition-all duration-150 disabled:opacity-60 shadow-lg shadow-[#F2A906]/25 mt-1"
						>
							{loading ? 'Đang tạo tài khoản...' : 'Tạo Tài Khoản Miễn Phí →'}
						</button>

						<p class="text-center text-xs text-[#1B365D]/40 mt-1">
							Đã có tài khoản?
							<button type="button" onclick={() => tab = 'login'} class="text-[#F2A906] font-semibold hover:underline">
								Đăng nhập
							</button>
						</p>

						<p class="text-center text-[11px] text-[#1B365D]/30 leading-relaxed">
							Bằng cách đăng ký, bạn đồng ý với<br/>
							<a href="/terms" class="underline hover:text-[#1B365D]/60">Điều khoản</a> và
							<a href="/privacy" class="underline hover:text-[#1B365D]/60">Chính sách bảo mật</a>
						</p>
					</form>
				{/if}
			</div>
		</div>
	</div>
</div>
