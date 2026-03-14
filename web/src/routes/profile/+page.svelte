<script lang="ts">
	import { enhance } from '$app/forms';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import TelegramConnect from '$lib/components/TelegramConnect.svelte';

	let { data, form } = $props();
	let profile = $derived(data.profile);
	let credits = $derived(data.credits);

	let isSubmitting = $state(false);
	
	const niches = [
		{ value: 'general', label: 'Tiếng Anh Giao Tiếp Cơ Bản' },
		{ value: 'customer_support', label: 'Hỗ Trợ Khách Hàng (CS)' },
		{ value: 'data_entry', label: 'Nhập Liệu & Hành Chính' },
		{ value: 'social_media', label: 'Quản Lý Mạng Xã Hội' },
		{ value: 'ecommerce', label: 'Thương Mại Điện Tử (eCom)' },
		{ value: 'video_editor', label: 'Biên Tập Video' },
		{ value: 'executive_assistant', label: 'Trợ Lý Giám Đốc (EA)' }
	];
</script>

<svelte:head>
	<title>Hồ Sơ Của Bạn — VASpeak</title>
</svelte:head>

<div class="min-h-screen bg-[#FFFBF1] pb-24">
	<!-- Top Bar -->
	<div class="bg-white shadow-[0_4px_14px_rgba(27,54,93,0.04)] px-4 py-4 mb-6 sticky top-0 z-10 flex items-center justify-center relative">
		<h1 class="font-heading font-bold text-lg text-[#1B365D]">Hồ Sơ Của Tôi</h1>
		{#if profile?.role === 'admin'}
			<a href="/admin" class="absolute right-4 text-xs font-bold text-[#F2A906] uppercase tracking-wider bg-[#1B365D]/5 px-2 py-1 rounded-md hover:bg-[#1B365D]/10">Admin</a>
		{/if}
	</div>

	<div class="max-w-md mx-auto px-4">
		<!-- Summary Card -->
		<div class="bg-white rounded-2xl p-6 shadow-[0_4px_14px_rgba(27,54,93,0.07)] border border-[#1B365D]/6 mb-6 flex items-center gap-4">
			<div class="w-16 h-16 shrink-0 rounded-full bg-[#F2A906]/20 flex items-center justify-center text-[#1B365D] font-bold font-heading text-2xl">
				{profile?.display_name?.[0]?.toUpperCase() ?? 'V'}
			</div>
			<div>
				<h2 class="font-heading font-bold text-[#1B365D] text-xl">{profile?.display_name ?? 'Học viên VASpeak'}</h2>
				<p class="text-[#1B365D]/50 text-sm">{profile?.email}</p>
				<div class="flex gap-2 mt-2">
					<span class="inline-flex text-[10px] font-bold uppercase tracking-wider bg-[#1B365D]/5 text-[#1B365D]/50 px-2 py-0.5 rounded">
						🔥 Streak: {profile?.streak_count ?? 0}
					</span>
					<span class="inline-flex text-[10px] font-bold uppercase tracking-wider bg-[#F2A906]/20 text-[#1B365D]/70 px-2 py-0.5 rounded">
						⚡ Kế hoạch {credits?.subscription_status === 'pro' ? 'Pro' : 'Miễn phí'}
					</span>
				</div>
			</div>
		</div>

		<!-- Settings Form -->
		<h3 class="font-heading font-bold text-[#1B365D] text-base mb-3 ml-1">🔒 Cài Đặt Chung</h3>
		<form 
			method="POST" 
			action="?/update" 
			class="bg-white rounded-2xl p-5 shadow-[0_4px_14px_rgba(27,54,93,0.07)] border border-[#1B365D]/6 mb-6"
			use:enhance={() => {
				isSubmitting = true;
				return async ({ update }) => {
					await update();
					isSubmitting = false;
				};
			}}
		>
			{#if form?.success}
				<div class="bg-green-50 text-green-600 border border-green-200 text-sm px-4 py-3 rounded-xl mb-4 font-medium flex items-center gap-2">
					✅ Cập nhật hồ sơ thành công!
				</div>
			{/if}
			{#if form?.error}
				<div class="bg-red-50 text-red-500 border border-red-200 text-sm px-4 py-3 rounded-xl mb-4 font-medium flex items-center gap-2">
					⚠️ {form.error}
				</div>
			{/if}

			<div class="mb-4">
				<label class="block text-xs font-semibold uppercase tracking-wider text-[#1B365D]/50 mb-1.5 ml-1">Tên Hiển Thị</label>
				<input
					type="text"
					name="displayName"
					required
					value={profile?.display_name ?? ''}
					class="w-full bg-[#FFFBF1] border border-[#1B365D]/10 rounded-xl px-4 py-3 text-sm text-[#1B365D] focus:outline-none focus:border-[#F2A906]"
				/>
			</div>

			<div class="mb-5">
				<label class="block text-xs font-semibold uppercase tracking-wider text-[#1B365D]/50 mb-1.5 ml-1">Mục Tiêu Công Việc (Niche)</label>
				<select
					name="niche"
					class="w-full bg-[#FFFBF1] border border-[#1B365D]/10 rounded-xl px-4 py-3 text-sm text-[#1B365D] focus:outline-none focus:border-[#F2A906] appearance-none"
				>
					{#each niches as niche}
						<option value={niche.value} selected={profile?.niche === niche.value}>{niche.label}</option>
					{/each}
				</select>
			</div>

			<button
				type="submit"
				disabled={isSubmitting}
				class="w-full py-3.5 rounded-xl font-bold text-sm bg-gray-100 text-[#1B365D] hover:bg-gray-200 active:scale-95 transition-all outline-none disabled:opacity-50"
			>
				{isSubmitting ? 'Đang lưu...' : 'Lưu Thay Đổi'}
			</button>
		</form>

		<!-- Telegram Connection -->
		<h3 class="font-heading font-bold text-[#1B365D] text-base mb-3 ml-1">📲 Telegram</h3>
		<div class="mb-6">
			<TelegramConnect />
		</div>

		<!-- Danger Zone / Log Out -->
		<form method="POST" action="/logout">
			<button class="w-full py-4 text-center text-sm font-bold text-red-500 bg-red-50 hover:bg-red-100 rounded-2xl transition-colors active:scale-95 border border-red-100">
				Đăng Xuất Khỏi Thiết Bị
			</button>
		</form>
	</div>
</div>

<BottomNav active="profile" />
