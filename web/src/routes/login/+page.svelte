<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';

	let { form } = $props();
	let tab = $state<'login' | 'register' | 'magic'>('login');
	let loading = $state(false);

	// Show error from magic link redirect (?error=invalid_token etc.)
	const errorParam = $derived($page.url.searchParams.get('error'));
	const errorMessages: Record<string, string> = {
		invalid_token: 'Link đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng thử lại.',
		missing_token: 'Link đăng nhập không đúng định dạng.',
		user_not_found: 'Không tìm thấy tài khoản. Vui lòng đăng ký trước.'
	};
</script>

<svelte:head>
	<title>Đăng Nhập — VASpeak</title>
	<meta name="description" content="Đăng nhập vào VASpeak để tiếp tục luyện nói tiếng Anh hàng ngày." />
</svelte:head>

<div class="min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-center px-5 py-12">

	<!-- Logo -->
	<a href="/" class="flex items-center gap-2 mb-10">
		<span class="font-heading font-extrabold text-[#1A1A1A] text-xl tracking-tight">VASpeak</span>
	</a>

	<div class="w-full max-w-sm">

		<!-- URL error (from magic link redirect) -->
		{#if errorParam && errorMessages[errorParam]}
			<div class="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3 mb-5 text-center">
				{errorMessages[errorParam]}
			</div>
		{/if}

		<!-- Tabs — minimal underline style -->
		<div class="flex gap-0 mb-8 border-b border-[#E8E8E8]">
			<button
				onclick={() => tab = 'login'}
				class="flex-1 pb-3 text-xs font-semibold uppercase tracking-wider transition-colors
					{tab === 'login'
						? 'text-[#1A1A1A] border-b-2 border-[#D4960A]'
						: 'text-[#A3A3A3] hover:text-[#6B6B6B]'}"
			>
				Mật Khẩu
			</button>
			<button
				onclick={() => tab = 'magic'}
				class="flex-1 pb-3 text-xs font-semibold uppercase tracking-wider transition-colors
					{tab === 'magic'
						? 'text-[#1A1A1A] border-b-2 border-[#D4960A]'
						: 'text-[#A3A3A3] hover:text-[#6B6B6B]'}"
			>
				✉️ Magic Link
			</button>
			<button
				onclick={() => tab = 'register'}
				class="flex-1 pb-3 text-xs font-semibold uppercase tracking-wider transition-colors
					{tab === 'register'
						? 'text-[#1A1A1A] border-b-2 border-[#D4960A]'
						: 'text-[#A3A3A3] hover:text-[#6B6B6B]'}"
			>
				Đăng Ký
			</button>
		</div>

		<!-- Error from server action -->
		{#if form?.error && form?.action === tab}
			<div class="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3 mb-5">
				{form.error}
			</div>
		{/if}

		<!-- ── PASSWORD LOGIN ── -->
		{#if tab === 'login'}
			<form
				method="POST"
				action="?/login"
				use:enhance={() => {
					loading = true;
					return async ({ update }) => { loading = false; await update(); };
				}}
				class="flex flex-col gap-5"
			>
				<div>
					<label for="login-email" class="block text-xs font-semibold text-[#A3A3A3] mb-2 uppercase tracking-wider">Email</label>
					<input
						id="login-email"
						name="email"
						type="email"
						required
						autocomplete="email"
						placeholder="ban@example.com"
						class="w-full px-0 py-3 bg-transparent text-[#1A1A1A] text-sm placeholder-[#A3A3A3] border-b border-[#E8E8E8] focus:border-[#D4960A] focus:outline-none transition-colors"
					/>
				</div>

				<div>
					<label for="login-password" class="block text-xs font-semibold text-[#A3A3A3] mb-2 uppercase tracking-wider">Mật khẩu</label>
					<input
						id="login-password"
						name="password"
						type="password"
						required
						autocomplete="current-password"
						placeholder="••••••••"
						class="w-full px-0 py-3 bg-transparent text-[#1A1A1A] text-sm placeholder-[#A3A3A3] border-b border-[#E8E8E8] focus:border-[#D4960A] focus:outline-none transition-colors"
					/>
				</div>

				<button
					type="submit"
					disabled={loading}
					class="w-full bg-[#D4960A] text-[#1A1A1A] font-bold py-3.5 rounded-lg text-sm hover:bg-[#b07d08] active:scale-[0.97] transition-all duration-150 disabled:opacity-60 mt-2"
				>
					{loading ? 'Đang đăng nhập...' : 'Đăng Nhập →'}
				</button>

				<div class="text-center text-xs text-[#A3A3A3] flex items-center gap-2 justify-center">
					<span>Không nhớ mật khẩu?</span>
					<button type="button" onclick={() => tab = 'magic'} class="text-[#D4960A] font-semibold hover:underline">
						Dùng magic link
					</button>
				</div>
			</form>

		<!-- ── MAGIC LINK ── -->
		{:else if tab === 'magic'}
			{#if form?.action === 'magic' && form?.success}
				<!-- Success state -->
				<div class="text-center py-6">
					<div class="text-5xl mb-4">📬</div>
					<h2 class="font-heading font-bold text-[#1A1A1A] text-lg mb-2">Kiểm tra email của bạn!</h2>
					<p class="text-sm text-[#6B6B6B] leading-relaxed">{form.message}</p>
					<button
						onclick={() => tab = 'magic'}
						class="mt-5 text-xs text-[#D4960A] font-semibold hover:underline"
					>
						Gửi lại link khác
					</button>
				</div>
			{:else}
				<form
					method="POST"
					action="?/magic"
					use:enhance={() => {
						loading = true;
						return async ({ update }) => { loading = false; await update(); };
					}}
					class="flex flex-col gap-5"
				>
					<div class="text-center pb-2">
						<p class="text-sm text-[#6B6B6B] leading-relaxed">
							Nhập email của bạn — chúng tôi sẽ gửi một link đăng nhập tức thì. Không cần mật khẩu!
						</p>
					</div>

					<div>
						<label for="magic-email" class="block text-xs font-semibold text-[#A3A3A3] mb-2 uppercase tracking-wider">Email</label>
						<input
							id="magic-email"
							name="email"
							type="email"
							required
							autocomplete="email"
							placeholder="ban@example.com"
							class="w-full px-0 py-3 bg-transparent text-[#1A1A1A] text-sm placeholder-[#A3A3A3] border-b border-[#E8E8E8] focus:border-[#D4960A] focus:outline-none transition-colors"
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						class="w-full bg-[#1A1A1A] text-white font-bold py-3.5 rounded-lg text-sm hover:bg-[#333] active:scale-[0.97] transition-all duration-150 disabled:opacity-60 mt-2"
					>
						{loading ? 'Đang gửi...' : '✉️ Gửi Magic Link'}
					</button>

					<p class="text-center text-xs text-[#A3A3A3]">
						Chưa có tài khoản?
						<button type="button" onclick={() => tab = 'register'} class="text-[#D4960A] font-semibold hover:underline">
							Đăng ký miễn phí
						</button>
					</p>
				</form>
			{/if}

		<!-- ── REGISTER ── -->
		{:else if form?.action === 'register' && form?.success}
			<div class="text-center py-6">
				<div class="text-5xl mb-4">📬</div>
				<h2 class="font-heading font-bold text-[#1A1A1A] text-lg mb-2">Kiểm tra email của bạn!</h2>
				<p class="text-sm text-[#6B6B6B] leading-relaxed text-balance">{form.message}</p>
				<button
					onclick={() => tab = 'login'}
					class="mt-5 text-xs text-[#D4960A] font-semibold hover:underline"
				>
					Về trang Đăng nhập
				</button>
			</div>
		{:else}
			<form
				method="POST"
				action="?/register"
				use:enhance={() => {
					loading = true;
					return async ({ update }) => { loading = false; await update(); };
				}}
				class="flex flex-col gap-5"
			>
				<div>
					<label for="reg-name" class="block text-xs font-semibold text-[#A3A3A3] mb-2 uppercase tracking-wider">Tên hiển thị</label>
					<input
						id="reg-name"
						name="display_name"
						type="text"
						required
						autocomplete="name"
						placeholder="Nguyễn Thị Hoa"
						class="w-full px-0 py-3 bg-transparent text-[#1A1A1A] text-sm placeholder-[#A3A3A3] border-b border-[#E8E8E8] focus:border-[#D4960A] focus:outline-none transition-colors"
					/>
				</div>

				<div>
					<label for="reg-email" class="block text-xs font-semibold text-[#A3A3A3] mb-2 uppercase tracking-wider">Email</label>
					<input
						id="reg-email"
						name="email"
						type="email"
						required
						autocomplete="email"
						placeholder="ban@example.com"
						class="w-full px-0 py-3 bg-transparent text-[#1A1A1A] text-sm placeholder-[#A3A3A3] border-b border-[#E8E8E8] focus:border-[#D4960A] focus:outline-none transition-colors"
					/>
				</div>

				<div>
					<label for="reg-password" class="block text-xs font-semibold text-[#A3A3A3] mb-2 uppercase tracking-wider">Mật khẩu</label>
					<input
						id="reg-password"
						name="password"
						type="password"
						required
						autocomplete="new-password"
						placeholder="Tối thiểu 8 ký tự"
						minlength="8"
						class="w-full px-0 py-3 bg-transparent text-[#1A1A1A] text-sm placeholder-[#A3A3A3] border-b border-[#E8E8E8] focus:border-[#D4960A] focus:outline-none transition-colors"
					/>
				</div>

				<button
					type="submit"
					disabled={loading}
					class="w-full bg-[#D4960A] text-[#1A1A1A] font-bold py-3.5 rounded-lg text-sm hover:bg-[#b07d08] active:scale-[0.97] transition-all duration-150 disabled:opacity-60 mt-2"
				>
					{loading ? 'Đang tạo tài khoản...' : 'Tạo Tài Khoản Miễn Phí →'}
				</button>

				<p class="text-center text-xs text-[#A3A3A3]">
					Đã có tài khoản?
					<button type="button" onclick={() => tab = 'login'} class="text-[#D4960A] font-semibold hover:underline">
						Đăng nhập
					</button>
				</p>

				<p class="text-center text-[11px] text-[#A3A3A3]/70 leading-relaxed">
					Bằng cách đăng ký, bạn đồng ý với<br/>
					<a href="/terms" class="underline hover:text-[#6B6B6B]">Điều khoản</a> và
					<a href="/privacy" class="underline hover:text-[#6B6B6B]">Chính sách bảo mật</a>
				</p>
			</form>
		{/if}

	</div>

	<!-- Back to home -->
	<p class="text-center text-xs text-[#A3A3A3] mt-8">
		<a href="/" class="hover:text-[#6B6B6B] transition-colors">← Về trang chủ</a>
	</p>
</div>
