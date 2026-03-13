import { json } from '@sveltejs/kit';
import { readdirSync, readFileSync, statSync, existsSync } from 'fs';
import { resolve, join } from 'path';

const RECORDINGS_DIR = resolve('static/e2e-recordings');

export type RunMeta = {
	timestamp: string;
	status: 'passed' | 'failed' | 'unknown';
	exitCode: number;
	baseUrl: string;
	grepFilter: string;
	runBy: string;
};

export type RecordingFile = {
	name: string;
	url: string;       // relative URL accessible via /e2e-recordings/...
	type: 'video' | 'screenshot' | 'log' | 'json' | 'other';
	sizeBytes: number;
};

export type RunResult = {
	id: string;        // = timestamp folder name
	meta: RunMeta;
	files: RecordingFile[];
	summary?: {
		total: number;
		passed: number;
		failed: number;
		skipped: number;
	};
};

function fileType(name: string): RecordingFile['type'] {
	if (name.endsWith('.webm'))  return 'video';
	if (name.endsWith('.png'))   return 'screenshot';
	if (name.endsWith('.log'))   return 'log';
	if (name.endsWith('.json'))  return 'json';
	return 'other';
}

function parseSummary(runDir: string): RunResult['summary'] | undefined {
	const p = join(runDir, 'results.json');
	if (!existsSync(p)) return undefined;
	try {
		const raw = JSON.parse(readFileSync(p, 'utf-8'));
		// Playwright JSON reporter shape
		const suites: any[] = raw.suites ?? [];
		let total = 0, passed = 0, failed = 0, skipped = 0;
		function walk(specs: any[]) {
			for (const s of specs) {
				if (s.specs) walk(s.specs);
				if (s.tests) {
					for (const t of s.tests) {
						total++;
						const status = t.results?.[0]?.status ?? 'skipped';
						if (status === 'passed')  passed++;
						else if (status === 'failed' || status === 'timedOut') failed++;
						else skipped++;
					}
				}
			}
		}
		walk(suites);
		return { total, passed, failed, skipped };
	} catch { return undefined; }
}

export async function GET() {
	if (!existsSync(RECORDINGS_DIR)) {
		return json({ runs: [] });
	}

	const runs: RunResult[] = [];

	try {
		const dirs = readdirSync(RECORDINGS_DIR)
			.filter(d => {
				try { return statSync(join(RECORDINGS_DIR, d)).isDirectory(); } catch { return false; }
			})
			.sort((a, b) => b.localeCompare(a)) // newest first
			.slice(0, 20);                       // keep last 20 runs max

		for (const dir of dirs) {
			const runDir = join(RECORDINGS_DIR, dir);
			const metaPath = join(runDir, 'meta.json');

			let meta: RunMeta = {
				timestamp: dir,
				status: 'unknown',
				exitCode: -1,
				baseUrl: '',
				grepFilter: '',
				runBy: 'unknown'
			};

			if (existsSync(metaPath)) {
				try { meta = JSON.parse(readFileSync(metaPath, 'utf-8')); } catch { /* ok */ }
			}

			const files: RecordingFile[] = readdirSync(runDir)
				.filter(f => f !== 'meta.json')
				.map(f => {
					const size = statSync(join(runDir, f)).size;
					return {
						name: f,
						url: `/e2e-recordings/${dir}/${f}`,
						type: fileType(f),
						sizeBytes: size
					};
				})
				.sort((a, b) => {
					// Videos first, then screenshots, then logs
					const order = { video: 0, screenshot: 1, log: 2, json: 3, other: 4 };
					return order[a.type] - order[b.type];
				});

			runs.push({ id: dir, meta, files, summary: parseSummary(runDir) });
		}
	} catch (err) {
		console.error('[e2e/results]', err);
	}

	return json({ runs });
}
