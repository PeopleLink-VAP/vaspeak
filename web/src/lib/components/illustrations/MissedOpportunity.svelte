<!--
  MissedOpportunity.svelte — Illustration: contract/handshake slipping away
  Represents losing opportunities because of language barrier
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
	class="illustration-missed"
	aria-hidden="true"
>
	<!-- Document/contract shape -->
	<g class="contract">
		<rect x="20" y="10" rx="3" ry="3" width="32" height="42" fill="#1A1A1A" opacity="0.06" />
		<rect x="24" y="14" rx="1" ry="1" width="24" height="34" fill="#1A1A1A" opacity="0.04" />
		
		<!-- Text lines on document -->
		<line x1="28" y1="20" x2="44" y2="20" stroke="#1A1A1A" stroke-width="1.5" stroke-linecap="round" opacity="0.1" />
		<line x1="28" y1="25" x2="40" y2="25" stroke="#1A1A1A" stroke-width="1.5" stroke-linecap="round" opacity="0.08" />
		<line x1="28" y1="30" x2="42" y2="30" stroke="#1A1A1A" stroke-width="1.5" stroke-linecap="round" opacity="0.08" />
		
		<!-- Signature line -->
		<line x1="28" y1="40" x2="44" y2="40" stroke="#D4960A" stroke-width="1" stroke-linecap="round" opacity="0.3" stroke-dasharray="2 2" />
	</g>

	<!-- Crack / break through the document -->
	<g class="crack">
		<path
			d="M26 15 L30 22 L28 28 L32 34 L29 42 L33 50"
			stroke="#D4960A"
			stroke-width="1.5"
			stroke-linecap="round"
			fill="none"
			opacity="0.5"
			stroke-dasharray="3 2"
		/>
	</g>

	<!-- Arrow going down-right (opportunity slipping away) -->
	<g class="slip-arrow">
		<path
			d="M52 32 L62 44 L68 56"
			stroke="#D4960A"
			stroke-width="2"
			stroke-linecap="round"
			fill="none"
			opacity="0.4"
		/>
		<polygon points="66,58 70,52 72,60" fill="#D4960A" opacity="0.4" />
	</g>

	<!-- Small coins/stars falling away -->
	<g class="falling-items">
		<circle cx="58" cy="24" r="3" fill="#D4960A" opacity="0.15" class="coin coin-1" />
		<circle cx="64" cy="18" r="2" fill="#D4960A" opacity="0.1" class="coin coin-2" />
		<circle cx="54" cy="16" r="2.5" fill="#D4960A" opacity="0.12" class="coin coin-3" />
	</g>

	<!-- "X" rejection marks -->
	<g class="rejection" opacity="0.2">
		<line x1="56" y1="36" x2="60" y2="40" stroke="#1A1A1A" stroke-width="1.5" stroke-linecap="round" />
		<line x1="60" y1="36" x2="56" y2="40" stroke="#1A1A1A" stroke-width="1.5" stroke-linecap="round" />
	</g>
</svg>

<style>
	.illustration-missed {
		overflow: visible;
	}
	
	.contract {
		animation: contractFade 4s ease-in-out infinite;
	}
	
	.slip-arrow {
		animation: slipDown 3.5s ease-in-out infinite;
	}
	
	.crack {
		animation: crackReveal 4s ease-in-out infinite;
	}
	
	.coin-1 { animation: coinFall 3s ease-in 0s infinite; }
	.coin-2 { animation: coinFall 3s ease-in 0.6s infinite; }
	.coin-3 { animation: coinFall 3s ease-in 1.2s infinite; }
	
	@keyframes contractFade {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.7; }
	}
	
	@keyframes slipDown {
		0%, 100% { transform: translateY(0); opacity: 0.4; }
		50% { transform: translateY(4px); opacity: 0.6; }
	}
	
	@keyframes crackReveal {
		0%, 100% { stroke-dashoffset: 0; opacity: 0.3; }
		50% { stroke-dashoffset: 5; opacity: 0.6; }
	}
	
	@keyframes coinFall {
		0% { transform: translateY(0); opacity: 0.2; }
		50% { transform: translateY(6px) translateX(3px); opacity: 0.05; }
		100% { transform: translateY(0); opacity: 0.2; }
	}

	@media (prefers-reduced-motion: reduce) {
		.contract, .slip-arrow, .crack, .coin-1, .coin-2, .coin-3 {
			animation: none;
		}
	}
</style>
