<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();
	let loading = $state(false);
</script>

<svelte:head>
	<title>Đặt Lại Mật Khẩu — VASpeak</title>
	<meta name="description" content="Đặt lại mật khẩu tài khoản VASpeak của bạn." />
</svelte:head>

<div class="min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-center px-5 py-12">

	<!-- Logo -->
	<a href="/" class="flex items-center gap-2 mb-10">
		<span class="font-heading font-extrabold text-[#1A1A1A] text-xl tracking-tight">VASpeak</span>
	</a>

	<div class="w-full max-w-sm">

		<!-- ── INVALID / EXPIRED TOKEN ── -->
		{#if data.mode === 'invalid'}
			<div class="text-center py-6">
				<div class="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
					<svg class="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
					</svg>
				</div>
				<h1 class="font-heading font-bold text-[#1A1A1A] text-xl mb-2">Link đã hết hạn</h1>
				<p class="text-sm text-[#6B6B6B] mb-6 leading-relaxed">
					Link đặt lại mật khẩu này đã hết hạn hoặc đã được sử dụng rồi.<br />
					Vui lòng yêu cầu link mới.
				</p>
				<a
					href="/auth/reset-password"
					class="inline-block bg-[#D4960A] text-[#1A1A1A] font-bold px-6 py-3 rounded-lg text-sm hover:bg-[#b07d08] transition-all"
				>
					Yêu cầu link mới →
				</a>
			</div>

		<!-- ── SET NEW PASSWORD ── -->
		{:else if data.mode === 'reset'}
			{#if form?.action === 'reset' && form?.success}
				<div class="text-center py-6">
					<div class="text-5xl mb-4">✅</div>
					<h1 class="font-heading font-bold text-[#1A1A1A] text-xl mb-2">Đặt lại thành công!</h1>
					<p class="text-sm text-[#6B6B6B] leading-relaxed">Mật khẩu đã được cập nhật. Đang chuyển về trang chủ...</p>
				</div>
			{:else}
				<h1 class="font-heading font-bold text-[#1A1A1A] text-2xl mb-1">Đặt lại mật khẩu</h1>
				<p class="text-sm text-[#6B6B6B] mb-8">Tài khoản: <strong>{data.email}</strong></p>

				{#if form?.error && form?.action === 'reset'}
					<div class="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3 mb-5">
						{form.error}
					</div>
				{/if}

				<form
					method="POST"
					action="?/reset"
					use:enhance={() => {
						loading = true;
						return async ({ update }) => { loading = false; await update(); };
					}}
					class="flex flex-col gap-5"
				>
					<input type="hidden" name="token" value={data.token} />

					<div>
						<label for="reset-password" class="block text-xs font-semibold text-[#A3A3A3] mb-2 uppercase tracking-wider">Mật khẩu mới</label>
						<input
							id="reset-password"
							name="password"
							type="password"
							required
							minlength="8"
							autocomplete="new-password"
							placeholder="Tối thiểu 8 ký tự"
							class="w-full px-0 py-3 bg-transparent text-[#1A1A1A] text-sm placeholder-[#A3A3A3] border-b border-[#E8E8E8] focus:border-[#D4960A] focus:outline-none transition-colors"
						/>
					</div>

					<div>
						<label for="reset-confirm" class="block text-xs font-semibold text-[#A3A3A3] mb-2 uppercase tracking-wider">Xác nhận mật khẩu</label>
						<input
							id="reset-confirm"
							name="confirm_password"
							type="password"
							required
							minlength="8"
							autocomplete="new-password"
							placeholder="Nhập lại mật khẩu"
							class="w-full px-0 py-3 bg-transparent text-[#1A1A1A] text-sm placeholder-[#A3A3A3] border-b border-[#E8E8E8] focus:border-[#D4960A] focus:outline-none transition-colors"
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						class="w-full bg-[#D4960A] text-[#1A1A1A] font-bold py-3.5 rounded-lg text-sm hover:bg-[#b07d08] active:scale-[0.97] transition-all duration-150 disabled:opacity-60 mt-2"
					>
						{loading ? 'Đang đặt lại...' : 'Đặt Lại Mật Khẩu →'}
					</button>
				</form>
			{/if}

		<!-- ── REQUEST LINK (default) ── -->
		{:else}
			{#if form?.action === 'request' && form?.success}
				<div class="text-center py-6">
					<div class="text-5xl mb-4">📬</div>
					<h1 class="font-heading font-bold text-[#1A1A1A] text-xl mb-2">Kiểm tra email của bạn!</h1>
					<p class="text-sm text-[#6B6B6B] leading-relaxed">{form.message}</p>
					<a href="/login" class="mt-6 inline-block text-xs text-[#D4960A] font-semibold hover:underline">
						← Quay lại Đăng nhập
					</a>
				</div>
			{:else}
				<h1 class="font-heading font-bold text-[#1A1A1A] text-2xl mb-1">Quên mật khẩu?</h1>
				<p class="text-sm text-[#6B6B6B] mb-8 leading-relaxed">
					Nhập email tài khoản — chúng tôi sẽ gửi link đặt lại mật khẩu ngay.
				</p>

				{#if form?.error && form?.action === 'request'}
					<div class="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3 mb-5">
						{form.error}
					</div>
				{/if}

				<form
					method="POST"
					action="?/request"
					use:enhance={() => {
						loading = true;
						return async ({ update }) => { loading = false; await update(); };
					}}
					class="flex flex-col gap-5"
				>
					<div>
						<label for="forgot-email" class="block text-xs font-semibold text-[#A3A3A3] mb-2 uppercase tracking-wider">Email</label>
						<input
							id="forgot-email"
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
						id="btn-request-reset"
						class="w-full bg-[#D4960A] text-[#1A1A1A] font-bold py-3.5 rounded-lg text-sm hover:bg-[#b07d08] active:scale-[0.97] transition-all duration-150 disabled:opacity-60 mt-2"
					>
						{loading ? 'Đang gửi...' : 'Gửi Link Đặt Lại →'}
					</button>
				</form>

				<p class="text-center text-xs text-[#A3A3A3] mt-6">
					Nhớ mật khẩu rồi?
					<a href="/login" class="text-[#D4960A] font-semibold hover:underline">Đăng nhập</a>
				</p>
			{/if}
		{/if}

	</div>
</div>
