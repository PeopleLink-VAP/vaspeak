const fs = require('fs');
let svelte = fs.readFileSync('src/routes/login/+page.svelte', 'utf-8');
svelte = svelte.replace(`				<!-- ── REGISTER ── -->
				{:else}
					<form`, `				<!-- ── REGISTER ── -->
				{:else if form?.action === 'register' && form?.success}
						<!-- Success state -->
						<div class="text-center py-4">
							<div class="text-5xl mb-4">📬</div>
							<h2 class="font-heading font-bold text-[#1B365D] text-lg mb-2">Kiểm tra email của bạn!</h2>
							<p class="text-sm text-[#1B365D]/60 leading-relaxed text-balance">{form.message}</p>
							<button
								onclick={() => tab = 'login'}
								class="mt-5 text-xs text-[#F2A906] font-semibold hover:underline"
							>
								Quay lại Đăng nhập
							</button>
						</div>
				{:else}
					<form`);
fs.writeFileSync('src/routes/login/+page.svelte', svelte);
