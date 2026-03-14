<!--
  LostForWords.svelte — Illustration: thought bubble with scattered letters
  Represents not knowing how to express yourself professionally
-->
<script lang="ts">
	let { size = 64 }: { size?: number } = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 80 80"
	fill="none"
	xmlns="http://www.w3.org/2000/svg"
	class="illustration-lost"
	aria-hidden="true"
>
	<!-- Large thought bubble -->
	<rect x="18" y="8" rx="12" ry="12" width="52" height="38" fill="#1A1A1A" opacity="0.06" />
	<rect x="22" y="12" rx="9" ry="9" width="44" height="30" fill="#1A1A1A" opacity="0.04" />
	
	<!-- Bubble tail dots -->
	<circle cx="22" cy="50" r="4" fill="#1A1A1A" opacity="0.06" />
	<circle cx="16" cy="56" r="2.5" fill="#1A1A1A" opacity="0.05" />

	<!-- Scattered letters inside bubble — disorganized, representing confusion -->
	<g class="scattered-letters">
		<text x="28" y="24" font-family="Inter, sans-serif" font-size="10" font-weight="600" fill="#D4960A" opacity="0.7" class="letter letter-1">A</text>
		<text x="46" y="20" font-family="Inter, sans-serif" font-size="8" font-weight="500" fill="#1A1A1A" opacity="0.25" class="letter letter-2" transform="rotate(-15, 46, 20)">b</text>
		<text x="38" y="32" font-family="Inter, sans-serif" font-size="11" font-weight="700" fill="#D4960A" opacity="0.45" class="letter letter-3" transform="rotate(8, 38, 32)">?</text>
		<text x="54" y="28" font-family="Inter, sans-serif" font-size="7" font-weight="500" fill="#1A1A1A" opacity="0.2" class="letter letter-4" transform="rotate(-25, 54, 28)">c</text>
		<text x="32" y="38" font-family="Inter, sans-serif" font-size="9" font-weight="600" fill="#1A1A1A" opacity="0.15" class="letter letter-5" transform="rotate(12, 32, 38)">x</text>
		<text x="50" y="36" font-family="Inter, sans-serif" font-size="10" font-weight="600" fill="#D4960A" opacity="0.3" class="letter letter-6">!</text>
	</g>

	<!-- Person thinking (simple head + hand on chin) -->
	<circle cx="10" cy="66" r="8" fill="#1A1A1A" opacity="0.08" />
	<circle cx="10" cy="66" r="6" fill="#1A1A1A" opacity="0.1" />
</svg>

<style>
	.illustration-lost {
		overflow: visible;
	}

	.letter-1 { animation: letterFloat 4s ease-in-out infinite; }
	.letter-2 { animation: letterFloat 4s ease-in-out 0.5s infinite; }
	.letter-3 { animation: letterPulse 3s ease-in-out infinite; }
	.letter-4 { animation: letterFloat 4s ease-in-out 1s infinite; }
	.letter-5 { animation: letterFloat 4s ease-in-out 1.5s infinite; }
	.letter-6 { animation: letterPulse 3s ease-in-out 0.8s infinite; }

	@keyframes letterFloat {
		0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.2; }
		50% { transform: translateY(-3px) rotate(5deg); opacity: 0.45; }
	}
	
	@keyframes letterPulse {
		0%, 100% { opacity: 0.25; transform: scale(1); }
		50% { opacity: 0.65; transform: scale(1.15); }
	}

	@media (prefers-reduced-motion: reduce) {
		.letter-1, .letter-2, .letter-3, .letter-4, .letter-5, .letter-6 {
			animation: none;
		}
	}
</style>
