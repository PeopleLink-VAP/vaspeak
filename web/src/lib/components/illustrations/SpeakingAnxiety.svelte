<!--
  SpeakingAnxiety.svelte — Illustration: person with broken/stuttering speech waves
  Represents anxiety when speaking English
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
	class="illustration-anxiety"
	aria-hidden="true"
>
	<!-- Head silhouette -->
	<circle cx="28" cy="32" r="14" fill="#1A1A1A" opacity="0.08" />
	<circle cx="28" cy="32" r="11" fill="#1A1A1A" opacity="0.12" />
	
	<!-- Shoulders hint -->
	<path d="M12 58 C12 48 20 44 28 44 C36 44 44 48 44 58" fill="#1A1A1A" opacity="0.06" />
	
	<!-- Speech waves (broken/stuttering) -->
	<g class="speech-waves">
		<!-- Wave 1 — short, stuttered -->
		<path
			d="M46 24 Q50 22 48 26"
			stroke="#D4960A"
			stroke-width="2"
			stroke-linecap="round"
			fill="none"
			class="wave wave-1"
		/>
		<!-- Wave 2 — broken arc -->
		<path
			d="M52 20 Q58 18 56 28"
			stroke="#D4960A"
			stroke-width="2"
			stroke-linecap="round"
			fill="none"
			opacity="0.6"
			class="wave wave-2"
		/>
		<!-- Wave 3 — fading, barely there -->
		<path
			d="M60 16 Q68 14 64 30"
			stroke="#D4960A"
			stroke-width="1.5"
			stroke-linecap="round"
			fill="none"
			opacity="0.25"
			class="wave wave-3"
			stroke-dasharray="4 6"
		/>
	</g>

	<!-- Stress lines around head -->
	<g class="stress-marks">
		<line x1="14" y1="18" x2="10" y2="14" stroke="#1A1A1A" stroke-width="1.5" stroke-linecap="round" opacity="0.15" />
		<line x1="18" y1="14" x2="16" y2="9" stroke="#1A1A1A" stroke-width="1.5" stroke-linecap="round" opacity="0.1" />
		<line x1="10" y1="24" x2="5" y2="22" stroke="#1A1A1A" stroke-width="1.5" stroke-linecap="round" opacity="0.12" />
	</g>

	<!-- Small "..." text struggle -->
	<circle cx="48" cy="38" r="1.5" fill="#D4960A" opacity="0.5" class="dot dot-1" />
	<circle cx="53" cy="38" r="1.5" fill="#D4960A" opacity="0.35" class="dot dot-2" />
	<circle cx="58" cy="38" r="1.5" fill="#D4960A" opacity="0.2" class="dot dot-3" />
</svg>

<style>
	.illustration-anxiety {
		overflow: visible;
	}
	
	.wave-1 {
		animation: waveStutter 2.5s ease-in-out infinite;
	}
	.wave-2 {
		animation: waveStutter 2.5s ease-in-out 0.3s infinite;
	}
	.wave-3 {
		animation: waveFade 3s ease-in-out infinite;
	}
	
	.stress-marks {
		animation: tremble 0.15s ease-in-out infinite alternate;
		transform-origin: 28px 32px;
	}
	
	.dot-1 { animation: dotPulse 1.8s ease-in-out infinite; }
	.dot-2 { animation: dotPulse 1.8s ease-in-out 0.3s infinite; }
	.dot-3 { animation: dotPulse 1.8s ease-in-out 0.6s infinite; }
	
	@keyframes waveStutter {
		0%, 100% { opacity: 0.6; transform: translateX(0); }
		30% { opacity: 1; transform: translateX(2px); }
		50% { opacity: 0.2; transform: translateX(-1px); }
		70% { opacity: 0.8; transform: translateX(1px); }
	}
	
	@keyframes waveFade {
		0%, 100% { opacity: 0.1; stroke-dashoffset: 0; }
		50% { opacity: 0.35; stroke-dashoffset: 10; }
	}
	
	@keyframes tremble {
		from { transform: translate(-0.5px, 0); }
		to { transform: translate(0.5px, 0); }
	}
	
	@keyframes dotPulse {
		0%, 100% { opacity: 0.15; r: 1; }
		50% { opacity: 0.6; r: 2; }
	}

	@media (prefers-reduced-motion: reduce) {
		.wave-1, .wave-2, .wave-3, .stress-marks, .dot-1, .dot-2, .dot-3 {
			animation: none;
		}
	}
</style>
