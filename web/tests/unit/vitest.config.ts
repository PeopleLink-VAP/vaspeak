import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['tests/unit/**/*.{test,spec}.ts'],
		environment: 'node',
		alias: {
			'$lib': '/media/dev/PROJECTS/LAB/vaspeak/web/src/lib'
		}
	}
});
