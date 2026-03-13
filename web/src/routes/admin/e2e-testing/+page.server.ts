import type { PageServerLoad } from './$types';
import { readdirSync, readFileSync, statSync, existsSync } from 'fs';
import { resolve, join } from 'path';

const RECORDINGS_DIR = resolve('static/e2e-recordings');

function fileType(name: string): 'video' | 'screenshot' | 'log' | 'json' | 'other' {
	if (name.endsWith('.webm'))  return 'video';
	if (name.endsWith('.png'))   return 'screenshot';
	if (name.endsWith('.log'))   return 'log';
	if (name.endsWith('.json'))  return 'json';
	return 'other';
}

function parseSummary(runDir: string) {
	const p = join(runDir, 'results.json');
	if (!existsSync(p)) return null;
	try {
		const raw = JSON.parse(readFileSync(p, 'utf-8'));
		const suites = raw.suites ?? [];
		let total = 0, passed = 0, failed = 0, skipped = 0;
		function walk(items: any[]) {
			for (const s of items) {
				if (s.specs) walk(s.specs);
				if (s.tests) {
					for (const t of s.tests) {
						total++;
						const status = t.results?.[0]?.status ?? 'skipped';
						if (status === 'passed') passed++;
						else if (status === 'failed' || status === 'timedOut') failed++;
						else skipped++;
					}
				}
			}
		}
		walk(suites);
		return { total, passed, failed, skipped };
	} catch { return null; }
}

export const load: PageServerLoad = async () => {
	if (!existsSync(RECORDINGS_DIR)) return { runs: [] };

	const runs: any[] = [];
	try {
		const dirs = readdirSync(RECORDINGS_DIR)
			.filter(d => { try { return statSync(join(RECORDINGS_DIR, d)).isDirectory(); } catch { return false; } })
			.sort((a, b) => b.localeCompare(a))
			.slice(0, 20);

		for (const dir of dirs) {
			const runDir = join(RECORDINGS_DIR, dir);
			let meta: any = { timestamp: dir, status: 'unknown', exitCode: -1, baseUrl: '', grepFilter: '' };
			const metaPath = join(runDir, 'meta.json');
			if (existsSync(metaPath)) {
				try { meta = JSON.parse(readFileSync(metaPath, 'utf-8')); } catch { /* ok */ }
			}

			const files = readdirSync(runDir)
				.filter(f => f !== 'meta.json')
				.map(f => ({
					name:      f,
					url:       `/e2e-recordings/${dir}/${encodeURIComponent(f)}`,
					type:      fileType(f),
					sizeBytes: (() => { try { return statSync(join(runDir, f)).size; } catch { return 0; } })()
				}))
				.sort((a, b) => {
					const o: Record<string, number> = { video: 0, screenshot: 1, log: 2, json: 3, other: 4 };
					return (o[a.type] ?? 4) - (o[b.type] ?? 4);
				});

			const summary = parseSummary(runDir);
			runs.push({ id: dir, meta, files, summary });
		}
	} catch (err) {
		console.error('[e2e-testing load]', err);
	}

	return { runs };
};
