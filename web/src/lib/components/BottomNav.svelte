<!--
  BottomNav.svelte — Reusable bottom navigation bar.
  
  Usage:
    <BottomNav active="dashboard" />
    <BottomNav active="lessons" />
    <BottomNav active="challenges" />
    <BottomNav active="credits" />
    <BottomNav active="profile" />
-->
<script lang="ts">
	let { active = 'dashboard' }: { active?: 'dashboard' | 'lessons' | 'challenges' | 'credits' | 'profile' } = $props();

	const items = [
		{ key: 'dashboard',  href: '/dashboard',  icon: '/icons/i_speak.png',     label: 'Trang Chủ' },
		{ key: 'lessons',    href: '/lessons',     icon: '/icons/i_lesson.png',    label: 'Bài Học' },
		{ key: 'challenges', href: '/challenges',  icon: '/icons/i_challenge.png', label: 'Mini Game' },
		{ key: 'credits',    href: '/credits',     icon: '/icons/i_credit.png',    label: 'Credits' },
		{ key: 'profile',    href: '/profile',     icon: '/icons/i_profile.png',   label: 'Cá Nhân' }
	];
</script>

<nav class="fixed bottom-0 left-0 right-0 bg-[#FAFAF8]/90 backdrop-blur-lg border-t border-[#E8E8E8] px-4 py-2 z-50" data-testid="bottom-nav">
	<div class="flex justify-around max-w-lg mx-auto">
		{#each items as item}
			<a
				href={item.href}
				class="flex flex-col items-center gap-0.5 py-1 transition-opacity {item.key === active ? 'opacity-100' : 'opacity-35'} hover:opacity-100"
				data-testid="nav-{item.key}"
			>
				<img src={item.icon} alt={item.label} class="w-6 h-6" />
				<span class="text-[9px] font-medium {item.key === active ? 'text-[#D4960A]' : 'text-[#6B6B6B]'}">{item.label}</span>
			</a>
		{/each}
	</div>
</nav>
<div class="h-20"></div> <!-- bottom nav spacer -->
