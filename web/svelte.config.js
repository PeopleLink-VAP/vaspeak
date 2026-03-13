import adapter from '@sveltejs/adapter-auto';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		// vite preview doesn't support the ORIGIN env var for CSRF.
		// Real CSRF protection comes from httpOnly + sameSite:lax session cookies + Cloudflare HTTPS.
		csrf: { checkOrigin: false }
	},
	vitePlugin: {
		dynamicCompileOptions: ({ filename }) =>
			filename.includes('node_modules') ? undefined : { runes: true }
	}
};

export default config;
