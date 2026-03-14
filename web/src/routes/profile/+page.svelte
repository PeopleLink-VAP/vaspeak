<script lang="ts">
	import { enhance } from '$app/forms';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import TelegramConnect from '$lib/components/TelegramConnect.svelte';

	let { data, form } = $props();
	let profile = $derived(data.profile);
	let credits = $derived(data.credits);
	let badges = $derived(data.badges ?? []);
	let earnedCount = $derived(data.earnedCount ?? 0);
	let stats = $derived(data.stats);
	let challengeStats = $derived(data.challengeStats ?? { total: 0, wins: 0 });

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

	const initial = $derived(profile?.display_name?.[0]?.toUpperCase() ?? 'V');
</script>

<svelte:head>
	<title>Hồ Sơ Của Bạn — VASpeak</title>
</svelte:head>

<div class="min-h-screen bg-[#FAFAF8] pb-24">
	<!-- Top Bar -->
	<div class="sticky top-0 z-10 bg-[#FAFAF8]/95 backdrop-blur-lg border-b border-[#E8E8E8] px-5 py-4 flex items-center justify-between">
		<h1 class="font-heading font-bold text-[#1A1A1A] text-base tracking-tight">Hồ Sơ</h1>
		{#if profile?.role === 'admin'}
			<a href="/admin" class="text-xs font-semibold text-[#D4960A] uppercase tracking-wider hover:underline">Admin ↗</a>
		{/if}
	</div>

	<div class="max-w-md mx-auto px-5 pt-6 flex flex-col gap-6">

		<!-- Identity block -->
		<div class="flex items-center gap-4">
			<div class="w-14 h-14 shrink-0 rounded-full bg-[#D4960A]/15 flex items-center justify-center font-bold font-heading text-[#D4960A] text-xl">
				{initial}
			</div>
			<div>
				<h2 class="font-heading font-bold text-[#1A1A1A] text-xl leading-tight">{profile?.display_name ?? 'Học viên VASpeak'}</h2>
				<p class="text-[#A3A3A3] text-sm mt-0.5">{profile?.email}</p>
				<div class="flex gap-2 mt-1.5">
					<span class="text-[10px] font-semibold text-[#6B6B6B] uppercase tracking-wide">🔥 {profile?.streak_count ?? 0} ngày</span>
					<span class="text-[#E8E8E8]">·</span>
					<span class="text-[10px] font-semibold text-[#D4960A] uppercase tracking-wide">
						{credits?.subscription_status === 'pro' ? 'Pro' : 'Free'}
					</span>
				</div>
			</div>
		</div>

		<!-- Stats strip -->
		{#if stats}
			<div class="flex items-center divide-x divide-[#E8E8E8] bg-white rounded-2xl border border-[#E8E8E8] overflow-hidden">
				<div class="flex-1 py-4 text-center">
					<p class="font-heading font-bold text-[#1A1A1A] text-2xl">{stats.lessonsCompleted}</p>
					<p class="text-[10px] text-[#A3A3A3] font-medium uppercase tracking-wide mt-0.5">Bài học</p>
				</div>
				<div class="flex-1 py-4 text-center">
					<p class="font-heading font-bold text-[#1A1A1A] text-2xl">{stats.vocabMastered}</p>
					<p class="text-[10px] text-[#A3A3A3] font-medium uppercase tracking-wide mt-0.5">Từ thuộc</p>
				</div>
				<div class="flex-1 py-4 text-center">
					<p class="font-heading font-bold text-[#1A1A1A] text-2xl">{challengeStats.wins}/{challengeStats.total}</p>
					<p class="text-[10px] text-[#A3A3A3] font-medium uppercase tracking-wide mt-0.5">TG challenges</p>
				</div>
			</div>
		{/if}

		<!-- Badges -->
		<div>
			<div class="flex items-baseline gap-2 mb-3">
				<p class="text-xs font-semibold text-[#A3A3A3] uppercase tracking-widest">Huy Hiệu</p>
				<span class="text-xs text-[#D4960A] font-semibold">{earnedCount}/{badges.length}</span>
			</div>
			<div class="grid grid-cols-4 gap-3">
				{#each badges as badge}
					<div class="flex flex-col items-center text-center {badge.earned ? '' : 'opacity-25'}" title={badge.label}>
						<div class="w-12 h-12 rounded-2xl {badge.earned ? 'bg-[#D4960A]/10' : 'bg-[#E8E8E8]'} flex items-center justify-center text-2xl mb-1.5">
							{badge.icon}
						</div>
						<span class="text-[9px] text-[#6B6B6B] font-medium leading-tight text-center">{badge.label}</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- Divider -->
		<div class="h-px bg-[#E8E8E8]"></div>

		<!-- Settings Form -->
		<div>
			<p class="text-xs font-semibold text-[#A3A3A3] uppercase tracking-widest mb-4">Cài Đặt</p>
			<form
				method="POST"
				action="?/update"
				class="flex flex-col gap-5"
				use:enhance={() => {
					isSubmitting = true;
					return async ({ update }) => { await update(); isSubmitting = false; };
				}}
			>
				{#if form?.success}
					<div class="text-sm text-[#10B981] flex items-center gap-2">
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
						Cập nhật hồ sơ thành công!
					</div>
				{/if}
				{#if form?.error}
					<div class="text-sm text-red-500">{form.error}</div>
				{/if}

				<div>
					<label class="block text-xs font-semibold text-[#A3A3A3] uppercase tracking-widest mb-2">Tên Hiển Thị</label>
					<input
						type="text"
						name="displayName"
						required
						value={profile?.display_name ?? ''}
						class="w-full px-0 py-2.5 bg-transparent text-[#1A1A1A] text-sm border-b border-[#E8E8E8] focus:border-[#D4960A] focus:outline-none transition-colors"
					/>
				</div>

				<div>
					<label class="block text-xs font-semibold text-[#A3A3A3] uppercase tracking-widest mb-2">Mục Tiêu Công Việc</label>
					<select
						name="niche"
						class="w-full px-0 py-2.5 bg-transparent text-[#1A1A1A] text-sm border-b border-[#E8E8E8] focus:border-[#D4960A] focus:outline-none transition-colors appearance-none"
					>
						{#each niches as niche}
							<option value={niche.value} selected={profile?.niche === niche.value}>{niche.label}</option>
						{/each}
					</select>
				</div>

				<button
					type="submit"
					disabled={isSubmitting}
					class="w-full py-3.5 rounded-lg font-bold text-sm bg-[#1A1A1A] text-white hover:bg-[#333] active:scale-[0.97] transition-all disabled:opacity-50 mt-1"
				>
					{isSubmitting ? 'Đang lưu...' : 'Lưu Thay Đổi'}
				</button>
			</form>
		</div>

		<!-- Divider -->
		<div class="h-px bg-[#E8E8E8]"></div>

		<!-- Telegram -->
		<div>
			<p class="text-xs font-semibold text-[#A3A3A3] uppercase tracking-widest mb-4">Telegram</p>
			<TelegramConnect />
		</div>

		<!-- Divider -->
		<div class="h-px bg-[#E8E8E8]"></div>

		<!-- Logout -->
		<form method="POST" action="/logout">
			<button class="w-full py-3.5 text-center text-sm font-semibold text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors active:scale-[0.97]">
				Đăng Xuất Khỏi Thiết Bị
			</button>
		</form>

		<div class="pb-2"></div>
	</div>
</div>

<BottomNav active="profile" />
