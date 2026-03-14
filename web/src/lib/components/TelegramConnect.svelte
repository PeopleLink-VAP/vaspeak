<!--
  TelegramConnect.svelte — Reusable Telegram connection widget.
  Restyled to match chromeless editorial design system.
-->
<script lang="ts">
	import { onMount } from 'svelte';

	let status = $state<'loading' | 'unlinked' | 'linked' | 'linking'>('loading');
	let username = $state<string | null>(null);
	let linkedAt = $state<string | null>(null);
	let linkToken = $state<string | null>(null);
	let showQR = $state(false);
	let pollInterval = $state<ReturnType<typeof setInterval> | null>(null);
	let error = $state('');
	let reminderHour = $state(8);
	let showTimeDropdown = $state(false);
	let detectedTimezone = $state('Asia/Ho_Chi_Minh');
	let savingTime = $state(false);

	const BOT_USERNAME = 'vaspeak_bot';

	onMount(() => {
		try { detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { /* fallback */ }
		checkStatus();
		return () => { if (pollInterval) clearInterval(pollInterval); };
	});

	async function checkStatus() {
		try {
			const res = await fetch('/api/telegram/link');
			const data = await res.json();
			if (data.linked) {
				status = 'linked';
				username = data.username;
				linkedAt = data.linkedAt;
				reminderHour = data.reminderHour ?? 8;
				showQR = false;
				if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
			} else if (data.token) {
				status = 'linking';
				linkToken = data.token;
			} else {
				status = 'unlinked';
			}
		} catch {
			error = 'Không thể kiểm tra trạng thái.';
			status = 'unlinked';
		}
	}

	async function startLinking() {
		error = '';
		try {
			const res = await fetch('/api/telegram/link', { method: 'POST' });
			const data = await res.json();
			linkToken = data.token;
			status = 'linking';
			showQR = true;
			if (pollInterval) clearInterval(pollInterval);
			pollInterval = setInterval(checkStatus, 3000);
		} catch { error = 'Có lỗi xảy ra. Vui lòng thử lại.'; }
	}

	async function unlink() {
		if (!confirm('Bạn có chắc muốn ngắt kết nối Telegram?')) return;
		try {
			await fetch('/api/telegram/link', { method: 'DELETE' });
			status = 'unlinked'; username = null; linkedAt = null; linkToken = null; showQR = false;
		} catch { error = 'Không thể ngắt kết nối.'; }
	}

	async function saveReminderTime(hour: number) {
		savingTime = true;
		try {
			await fetch('/api/telegram/link', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ reminderHour: hour, timezone: detectedTimezone })
			});
			reminderHour = hour;
			showTimeDropdown = false;
		} catch { error = 'Không thể lưu giờ nhắc nhở.'; }
		savingTime = false;
	}

	function closeQR() {
		showQR = false;
		if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
	}

	function formatHour(h: number): string {
		if (h < 0) return 'Tắt';
		if (h === 0) return '12:00 AM';
		if (h < 12) return `${h}:00 sáng`;
		if (h === 12) return '12:00 PM';
		return `${h - 12}:00 chiều`;
	}

	const qrUrl = $derived(
		linkToken ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`https://t.me/${BOT_USERNAME}?start=${linkToken}`)}` : ''
	);
	const telegramLink = $derived(
		linkToken ? `https://t.me/${BOT_USERNAME}?start=${linkToken}` : `https://t.me/${BOT_USERNAME}`
	);
	const linkedDate = $derived(
		linkedAt ? new Date(linkedAt).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' }) : null
	);
</script>

<div data-testid="telegram-connect">

	{#if error}
		<p class="text-xs text-red-500 mb-3">{error}</p>
	{/if}

	{#if status === 'loading'}
		<!-- Skeleton row -->
		<div class="flex items-center gap-3 py-3 animate-pulse">
			<div class="w-8 h-8 rounded-full bg-[#E8E8E8] shrink-0"></div>
			<div class="flex-1 h-3 bg-[#E8E8E8] rounded"></div>
		</div>

	{:else if status === 'linked'}
		<!-- Connected state -->
		<div class="flex items-center gap-3 pb-4 border-b border-[#E8E8E8]">
			<div class="w-9 h-9 rounded-full bg-[#0088cc]/10 flex items-center justify-center shrink-0">
				<svg class="w-4 h-4 text-[#0088cc]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.95 7.23l-2.02 9.53c-.15.68-.55.85-1.12.53l-3.1-2.28-1.49 1.44c-.17.17-.3.3-.62.3l.22-3.15 5.72-5.16c.25-.22-.05-.34-.39-.13l-7.07 4.45-3.05-.95c-.66-.21-.67-.66.14-.98l11.92-4.6c.55-.2 1.03.13.86.97z"/></svg>
			</div>
			<div class="flex-1 min-w-0">
				{#if username}<p class="text-sm font-semibold text-[#1A1A1A]">@{username}</p>{/if}
				{#if linkedDate}<p class="text-xs text-[#A3A3A3]">Kết nối từ {linkedDate}</p>{/if}
			</div>
			<span class="inline-flex items-center gap-1 text-[10px] font-semibold text-[#10B981] uppercase tracking-wide">
				<span class="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span> Live
			</span>
		</div>

		<!-- Reminder time row -->
		<div class="py-4 border-b border-[#E8E8E8]">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-medium text-[#1A1A1A]">Nhắc nhở hàng ngày</p>
					<p class="text-xs text-[#A3A3A3]">Gửi từ vựng qua Telegram</p>
				</div>
				<button
					onclick={() => showTimeDropdown = !showTimeDropdown}
					class="text-sm font-semibold text-[#D4960A] hover:underline transition-all"
					data-testid="reminder-time-btn"
				>
					{reminderHour < 0 ? 'Tắt' : formatHour(reminderHour)} ↓
				</button>
			</div>

			{#if showTimeDropdown}
				<div class="mt-3 grid grid-cols-4 gap-1.5" data-testid="time-grid">
					<button
						onclick={() => saveReminderTime(-1)}
						class="text-[10px] py-2 rounded-lg font-medium transition-colors
							{reminderHour < 0 ? 'bg-red-100 text-red-600 font-bold' : 'bg-[#F5F5F5] text-[#6B6B6B] hover:bg-[#E8E8E8]'}"
						disabled={savingTime}
					>Tắt</button>
					{#each [6,7,8,9,10,11,12,13,14,15,16,17,18,19,20] as h}
						<button
							onclick={() => saveReminderTime(h)}
							class="text-[10px] py-2 rounded-lg font-medium transition-colors
								{h === reminderHour ? 'bg-[#D4960A] text-[#1A1A1A] font-bold' : 'bg-[#F5F5F5] text-[#6B6B6B] hover:bg-[#E8E8E8]'}"
							disabled={savingTime}
						>
							{formatHour(h)}
						</button>
					{/each}
				</div>
				<p class="text-[10px] text-[#A3A3A3] mt-2">Múi giờ: {detectedTimezone}</p>
			{/if}
		</div>

		<!-- Unlink -->
		<div class="pt-4">
			<button
				onclick={unlink}
				class="text-xs text-[#A3A3A3] hover:text-red-500 transition-colors"
				data-testid="telegram-unlink"
			>
				Ngắt kết nối →
			</button>
		</div>

	{:else if status === 'unlinked'}
		<!-- Unlinked — invite to connect -->
		<div class="flex items-center gap-4">
			<div class="flex-1">
				<p class="text-sm font-medium text-[#1A1A1A]">Chưa kết nối</p>
				<p class="text-xs text-[#A3A3A3] mt-0.5">Nhận từ vựng & nhắc học qua Telegram</p>
			</div>
			<button
				onclick={startLinking}
				class="px-4 py-2 rounded-lg bg-[#0088cc] text-white font-bold text-xs hover:bg-[#0077b3] active:scale-[0.97] transition-all flex items-center gap-1.5 shrink-0"
				data-testid="telegram-link-btn"
			>
				<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.95 7.23l-2.02 9.53c-.15.68-.55.85-1.12.53l-3.1-2.28-1.49 1.44c-.17.17-.3.3-.62.3l.22-3.15 5.72-5.16c.25-.22-.05-.34-.39-.13l-7.07 4.45-3.05-.95c-.66-.21-.67-.66.14-.98l11.92-4.6c.55-.2 1.03.13.86.97z"/></svg>
				Kết nối
			</button>
		</div>

	{:else if status === 'linking' && !showQR}
		<div class="flex items-center gap-4">
			<div class="flex-1">
				<p class="text-sm font-medium text-[#1A1A1A]">Đang chờ kết nối</p>
				<p class="text-xs text-[#A3A3A3] mt-0.5">Mở QR để hoàn tất liên kết</p>
			</div>
			<button
				onclick={() => showQR = true}
				class="px-4 py-2 rounded-lg bg-[#0088cc] text-white font-bold text-xs hover:bg-[#0077b3] active:scale-[0.97] transition-all shrink-0"
			>
				Mở QR
			</button>
		</div>
	{/if}
</div>

<!-- QR Modal — bottom sheet style -->
{#if showQR && linkToken}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 bg-[#1A1A1A]/60 backdrop-blur-sm flex items-end sm:items-center justify-center"
		onclick={(e) => { if (e.target === e.currentTarget) closeQR(); }}
		data-testid="telegram-qr-modal"
		style="animation: fadeIn 0.2s ease-out"
	>
		<div class="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm overflow-hidden" style="animation: slideUp 0.3s ease-out">
			<!-- Handle -->
			<div class="flex justify-center pt-3 pb-1 sm:hidden">
				<div class="w-10 h-1 rounded-full bg-[#E8E8E8]"></div>
			</div>

			<div class="p-6">
				<div class="flex items-center justify-between mb-5">
					<h3 class="font-heading font-bold text-[#1A1A1A] text-lg">Kết nối Telegram</h3>
					<button
						onclick={closeQR}
						class="w-8 h-8 rounded-full bg-[#F5F5F5] flex items-center justify-center text-[#6B6B6B] hover:bg-[#E8E8E8] transition-colors"
					>
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
					</button>
				</div>

				<!-- QR -->
				<div class="flex justify-center mb-5">
					<div class="p-3 border border-[#E8E8E8] rounded-2xl bg-white">
						<img src={qrUrl} alt="QR code to link Telegram" class="w-44 h-44" />
					</div>
				</div>

				<p class="text-sm text-[#6B6B6B] text-center mb-5 leading-relaxed">
					Quét mã QR bằng camera<br>hoặc mở Telegram trực tiếp.
				</p>

				<a
					href={telegramLink}
					target="_blank"
					rel="noopener noreferrer"
					class="w-full py-3.5 rounded-lg font-bold text-sm bg-[#0088cc] text-white hover:bg-[#0077b3] active:scale-[0.97] transition-all flex items-center justify-center gap-2 mb-4"
					data-testid="telegram-open-link"
				>
					<svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.95 7.23l-2.02 9.53c-.15.68-.55.85-1.12.53l-3.1-2.28-1.49 1.44c-.17.17-.3.3-.62.3l.22-3.15 5.72-5.16c.25-.22-.05-.34-.39-.13l-7.07 4.45-3.05-.95c-.66-.21-.67-.66.14-.98l11.92-4.6c.55-.2 1.03.13.86.97z"/></svg>
					Mở trong Telegram
				</a>

				<p class="text-xs text-[#A3A3A3] flex items-center justify-center gap-2">
					<span class="w-1.5 h-1.5 rounded-full bg-[#D4960A] animate-pulse"></span>
					Đang chờ kết nối...
				</p>
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
	@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
</style>
