<!--
  NotificationPrompt.svelte — Notification subscription management.
  
  Shows a compact prompt to enable notifications on the profile page.
  Handles: permission request → VAPID subscription → API registration.
  
  Usage:
    <NotificationPrompt />
-->
<script lang="ts">
    let isSupported = $state(false);
    let permission = $state<NotificationPermission>('default');
    let isSubscribed = $state(false);
    let isLoading = $state(false);
    let reminderHour = $state(8);
    let showHourPicker = $state(false);
    let statusMessage = $state('');

    $effect(() => {
        isSupported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
        if (isSupported) {
            permission = Notification.permission;
            checkSubscription();
        }
    });

    async function checkSubscription() {
        try {
            const res = await fetch('/api/notifications/subscribe');
            const data = await res.json();
            isSubscribed = data.subscribed;
            if (data.subscriptions?.length > 0) {
                reminderHour = data.subscriptions[0].reminderHour ?? 8;
            }
        } catch { /* ignore */ }
    }

    async function subscribe() {
        if (!isSupported) return;
        isLoading = true;
        statusMessage = '';

        try {
            // Request permission
            const perm = await Notification.requestPermission();
            permission = perm;
            if (perm !== 'granted') {
                statusMessage = 'Bạn đã từ chối thông báo. Vào Cài đặt trình duyệt để bật lại.';
                isLoading = false;
                return;
            }

            // Get VAPID public key
            const vapidRes = await fetch('/api/notifications/vapid-key');
            const { publicKey } = await vapidRes.json();
            if (!publicKey) throw new Error('No VAPID key');

            // Get service worker registration
            const reg = await navigator.serviceWorker.ready;

            // Subscribe to push
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey).buffer as ArrayBuffer
            });

            const subJson = sub.toJSON();

            // Register with our server
            await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    endpoint: subJson.endpoint,
                    keys: subJson.keys,
                    reminderHour,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                })
            });

            isSubscribed = true;
            statusMessage = 'Đã bật thông báo!';
        } catch (err) {
            console.error('[NotificationPrompt] subscribe error:', err);
            statusMessage = 'Lỗi khi đăng ký thông báo.';
        }
        isLoading = false;
    }

    async function unsubscribe() {
        isLoading = true;
        statusMessage = '';
        try {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.getSubscription();
            if (sub) {
                await fetch('/api/notifications/subscribe', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ endpoint: sub.endpoint })
                });
                await sub.unsubscribe();
            }
            isSubscribed = false;
            statusMessage = 'Đã tắt thông báo.';
        } catch (err) {
            console.error('[NotificationPrompt] unsubscribe error:', err);
            statusMessage = 'Lỗi khi tắt thông báo.';
        }
        isLoading = false;
    }

    async function updateReminderHour() {
        isLoading = true;
        try {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.getSubscription();
            if (sub) {
                const subJson = sub.toJSON();
                await fetch('/api/notifications/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        endpoint: subJson.endpoint,
                        keys: subJson.keys,
                        reminderHour,
                        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                    })
                });
            }
            showHourPicker = false;
            statusMessage = `Nhắc nhở lúc ${formatHour(reminderHour)}.`;
        } catch (err) {
            console.error('[NotificationPrompt] update hour error:', err);
            statusMessage = 'Lỗi khi cập nhật.';
        }
        isLoading = false;
    }

    function formatHour(h: number): string {
        if (h === 0) return '12:00 sáng';
        if (h < 12) return `${h}:00 sáng`;
        if (h === 12) return '12:00 chiều';
        return `${h - 12}:00 chiều`;
    }

    function urlBase64ToUint8Array(base64String: string): Uint8Array {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }
</script>

{#if isSupported}
    <div class="flex flex-col gap-3">
        {#if !isSubscribed}
            <!-- Subscribe prompt -->
            <button
                onclick={subscribe}
                disabled={isLoading || permission === 'denied'}
                class="w-full flex items-center gap-3 p-4 bg-white rounded-xl border border-[#E8E8E8] hover:border-[#D4960A] transition-colors group active:scale-[0.97] disabled:opacity-50"
            >
                <div class="w-9 h-9 rounded-xl bg-[#D4960A]/10 flex items-center justify-center shrink-0 group-hover:bg-[#D4960A]/20 transition-colors">
                    <svg class="w-4.5 h-4.5 text-[#D4960A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                    </svg>
                </div>
                <div class="flex-1 text-left">
                    <p class="font-medium text-sm text-[#1A1A1A]">
                        {isLoading ? 'Đang xử lý...' : 'Bật thông báo hàng ngày'}
                    </p>
                    <p class="text-[10px] text-[#A3A3A3] mt-0.5">
                        {permission === 'denied' ? 'Đã bị chặn — vào Cài đặt trình duyệt để bật' : 'Nhận nhắc nhở chơi từ vựng mỗi ngày'}
                    </p>
                </div>
                {#if isLoading}
                    <div class="w-5 h-5 border-2 border-[#D4960A] border-t-transparent rounded-full animate-spin shrink-0"></div>
                {/if}
            </button>
        {:else}
            <!-- Subscribed state -->
            <div class="flex flex-col gap-2">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <div class="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></div>
                        <p class="text-sm font-medium text-[#1A1A1A]">Thông báo đang bật</p>
                    </div>
                    <button
                        onclick={unsubscribe}
                        disabled={isLoading}
                        class="text-xs text-red-400 font-medium hover:text-red-500 disabled:opacity-50"
                    >
                        Tắt
                    </button>
                </div>

                <!-- Reminder hour control -->
                <button
                    onclick={() => showHourPicker = !showHourPicker}
                    class="flex items-center justify-between py-2 text-left"
                >
                    <p class="text-xs text-[#A3A3A3]">Nhắc nhở lúc <span class="font-semibold text-[#1A1A1A]">{formatHour(reminderHour)}</span></p>
                    <svg class="w-3.5 h-3.5 text-[#A3A3A3] transition-transform {showHourPicker ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </button>

                {#if showHourPicker}
                    <div class="flex items-center gap-3">
                        <select
                            bind:value={reminderHour}
                            class="flex-1 px-0 py-2 bg-transparent text-[#1A1A1A] text-sm border-b border-[#E8E8E8] focus:border-[#D4960A] focus:outline-none transition-colors appearance-none"
                        >
                            {#each Array(24) as _, h}
                                <option value={h}>{formatHour(h)}</option>
                            {/each}
                        </select>
                        <button
                            onclick={updateReminderHour}
                            disabled={isLoading}
                            class="px-4 py-2 rounded-lg bg-[#1A1A1A] text-white text-xs font-semibold active:scale-95 transition-all disabled:opacity-50"
                        >
                            Lưu
                        </button>
                    </div>
                {/if}
            </div>
        {/if}

        {#if statusMessage}
            <p class="text-xs text-[#10B981] font-medium animate-fadeIn">{statusMessage}</p>
        {/if}
    </div>
{/if}

<style>
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
</style>
