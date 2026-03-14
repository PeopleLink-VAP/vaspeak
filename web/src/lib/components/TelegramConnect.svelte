<!--
  TelegramConnect.svelte — Reusable Telegram connection widget.
  
  Features:
  - Shows connection status (linked/unlinked)
  - QR code + deep link for linking
  - Polls for connection while QR shown
  - Auto-detects timezone, allows setting reminder hour
  - All state managed internally (no props needed)
  
  Usage: <TelegramConnect />
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
		// Auto-detect timezone
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

<div class="bg-white rounded-2xl p-5 shadow-[0_4px_14px_rgba(27,54,93,0.07)] border border-[#1B365D]/6" data-testid="telegram-connect">
	<div class="flex items-center gap-3 mb-3">
		<div class="w-10 h-10 rounded-xl bg-[#0088cc]/10 flex items-center justify-center shrink-0">
			<svg class="w-5 h-5 text-[#0088cc]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.95 7.23l-2.02 9.53c-.15.68-.55.85-1.12.53l-3.1-2.28-1.49 1.44c-.17.17-.3.3-.62.3l.22-3.15 5.72-5.16c.25-.22-.05-.34-.39-.13l-7.07 4.45-3.05-.95c-.66-.21-.67-.66.14-.98l11.92-4.6c.55-.2 1.03.13.86.97z"/></svg>
		</div>
		<div class="flex-1">
			<h3 class="font-heading font-semibold text-[#1B365D] text-sm">Kết Nối Telegram</h3>
			<p class="text-xs text-[#1B365D]/40">Nhận thử thách từ vựng & nhắc nhở hàng ngày</p>
		</div>
		{#if status === 'linked'}
			<span class="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-[#10B981]/10 text-[#10B981] px-2 py-1 rounded-lg">
				<span class="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span> Đã kết nối
			</span>
		{:else if status === 'loading'}
			<span class="text-xs text-[#1B365D]/30">Đang tải...</span>
		{/if}
	</div>

	{#if error}
		<div class="bg-red-50 text-red-500 text-xs px-3 py-2 rounded-lg mb-3">{error}</div>
	{/if}

	{#if status === 'linked'}
		<div class="bg-[#0088cc]/5 rounded-xl p-3 mb-3">
			<div class="flex items-center justify-between mb-2">
				<div>
					{#if username}<p class="text-sm font-medium text-[#1B365D]">@{username}</p>{/if}
					{#if linkedDate}<p class="text-xs text-[#1B365D]/40">Kết nối từ {linkedDate}</p>{/if}
				</div>
				<span class="text-lg">✅</span>
			</div>
			<!-- Reminder time setting -->
			<div class="border-t border-[#0088cc]/10 pt-2 mt-2">
				<div class="flex items-center justify-between">
					<span class="text-xs text-[#1B365D]/50">⏰ Nhắc nhở hàng ngày</span>
					<button
						onclick={() => showTimeDropdown = !showTimeDropdown}
						class="text-xs font-bold text-[#0088cc] bg-[#0088cc]/10 px-2.5 py-1 rounded-lg hover:bg-[#0088cc]/20 transition-colors"
						data-testid="reminder-time-btn"
					>
						{reminderHour < 0 ? '🔕 Tắt' : formatHour(reminderHour)}
					</button>
				</div>
				{#if showTimeDropdown}
					<div class="mt-2 grid grid-cols-4 gap-1.5 animate-[fadeIn_0.15s_ease-out]" data-testid="time-grid">
						<button onclick={() => saveReminderTime(-1)} class="text-[10px] py-1.5 rounded-lg {reminderHour < 0 ? 'bg-red-100 text-red-600 font-bold' : 'bg-[#1B365D]/5 text-[#1B365D]/50 hover:bg-[#1B365D]/10'} transition-colors" disabled={savingTime}>🔕 Tắt</button>
						{#each [6,7,8,9,10,11,12,13,14,15,16,17,18,19,20] as h}
							<button onclick={() => saveReminderTime(h)} class="text-[10px] py-1.5 rounded-lg {h === reminderHour ? 'bg-[#F2A906] text-[#1B365D] font-bold' : 'bg-[#1B365D]/5 text-[#1B365D]/60 hover:bg-[#F2A906]/20'} transition-colors" disabled={savingTime}>
								{formatHour(h)}
							</button>
						{/each}
					</div>
					<p class="text-[10px] text-[#1B365D]/30 mt-1.5 text-center">Múi giờ: {detectedTimezone}</p>
				{/if}
			</div>
		</div>
		<button onclick={unlink} class="w-full text-center text-xs text-red-400 hover:text-red-600 transition-colors py-1.5" data-testid="telegram-unlink">Ngắt kết nối</button>
	{:else if status === 'unlinked'}
		<button onclick={startLinking} class="w-full py-3 rounded-xl font-bold text-sm bg-[#0088cc] text-white hover:bg-[#0077b3] active:scale-95 transition-all flex items-center justify-center gap-2" data-testid="telegram-link-btn">
			<svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.95 7.23l-2.02 9.53c-.15.68-.55.85-1.12.53l-3.1-2.28-1.49 1.44c-.17.17-.3.3-.62.3l.22-3.15 5.72-5.16c.25-.22-.05-.34-.39-.13l-7.07 4.45-3.05-.95c-.66-.21-.67-.66.14-.98l11.92-4.6c.55-.2 1.03.13.86.97z"/></svg>
			Kết nối @vaspeak_bot
		</button>
	{:else if status === 'linking' && !showQR}
		<button onclick={() => showQR = true} class="w-full py-3 rounded-xl font-bold text-sm bg-[#0088cc] text-white hover:bg-[#0077b3] active:scale-95 transition-all flex items-center justify-center gap-2">Mở QR để kết nối</button>
	{/if}
</div>

<!-- QR Modal -->
{#if showQR && linkToken}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-50 bg-[#1B365D]/80 backdrop-blur-sm flex items-center justify-center p-6 animate-[fadeIn_0.2s_ease-out]" onclick={(e) => { if (e.target === e.currentTarget) closeQR(); }} data-testid="telegram-qr-modal">
		<div class="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center animate-[scaleIn_0.3s_ease-out]">
			<div class="flex items-center justify-between mb-4">
				<h3 class="font-heading font-bold text-[#1B365D] text-lg">Kết nối Telegram</h3>
				<button onclick={closeQR} class="w-8 h-8 rounded-full bg-[#1B365D]/5 flex items-center justify-center text-[#1B365D]/40 hover:bg-[#1B365D]/10 transition-colors">✕</button>
			</div>
			<div class="bg-white border-2 border-[#0088cc]/20 rounded-2xl p-4 mb-4 inline-block">
				<img src={qrUrl} alt="QR code to link Telegram" class="w-48 h-48 mx-auto" />
			</div>
			<p class="text-sm text-[#1B365D]/60 mb-4">Quét mã QR hoặc nhấn nút bên dưới để mở Telegram.</p>
			<a href={telegramLink} target="_blank" rel="noopener noreferrer" class="w-full py-3 rounded-xl font-bold text-sm bg-[#0088cc] text-white hover:bg-[#0077b3] active:scale-95 transition-all flex items-center justify-center gap-2 mb-3" data-testid="telegram-open-link">
				<svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.95 7.23l-2.02 9.53c-.15.68-.55.85-1.12.53l-3.1-2.28-1.49 1.44c-.17.17-.3.3-.62.3l.22-3.15 5.72-5.16c.25-.22-.05-.34-.39-.13l-7.07 4.45-3.05-.95c-.66-.21-.67-.66.14-.98l11.92-4.6c.55-.2 1.03.13.86.97z"/></svg>
				Mở trong Telegram
			</a>
			<p class="text-xs text-[#1B365D]/30 flex items-center justify-center gap-1.5">
				<span class="w-1.5 h-1.5 rounded-full bg-[#F2A906] animate-pulse"></span> Đang chờ kết nối...
			</p>
		</div>
	</div>
{/if}

<style>
	@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
	@keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
</style>
