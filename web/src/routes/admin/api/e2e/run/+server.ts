import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { spawn } from 'child_process';
import { resolve } from 'path';

const SCRIPT = resolve('scripts/run-e2e-record.sh');

// Prevent concurrent runs
let running = false;

export const POST: RequestHandler = async ({ request }) => {
	if (running) {
		return json({ error: 'A run is already in progress. Please wait.' }, { status: 409 });
	}

	let body: { grep?: string; baseUrl?: string } = {};
	try { body = await request.json(); } catch { /* ok — no body */ }

	const args: string[] = [];
	if (body.grep)    args.push(`--grep=${body.grep}`);
	if (body.baseUrl) args.push(`--base-url=${body.baseUrl}`);

	running = true;

	return new Promise((resolve_) => {
		const proc = spawn('bash', [SCRIPT, ...args], {
			cwd: resolve('..'),   // project root
			env: { ...process.env },
			stdio: ['ignore', 'pipe', 'pipe']
		});

		let stdout = '';
		let stderr = '';

		proc.stdout?.on('data', (d: Buffer) => { stdout += d.toString(); });
		proc.stderr?.on('data', (d: Buffer) => { stderr += d.toString(); });

		proc.on('close', (code) => {
			running = false;
			resolve_(json({
				ok:       code === 0,
				exitCode: code,
				stdout:   stdout.slice(-3000),  // last 3 KB — avoid huge responses
				stderr:   stderr.slice(-1000)
			}));
		});

		proc.on('error', (err) => {
			running = false;
			resolve_(json({ error: String(err) }, { status: 500 }));
		});
	});
};

// GET returns whether a run is currently in progress
export const GET: RequestHandler = async () => {
	return json({ running });
};
