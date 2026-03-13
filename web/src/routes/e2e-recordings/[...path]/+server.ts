import { error } from '@sveltejs/kit';
import { createReadStream, statSync, existsSync } from 'fs';
import { resolve, join } from 'path';
import type { RequestHandler } from './$types';

// Points to the real static directory regardless of build output
const RECORDINGS_DIR = resolve('static/e2e-recordings');

function getMimeType(fileName: string): string {
	if (fileName.endsWith('.webm')) return 'video/webm';
	if (fileName.endsWith('.png')) return 'image/png';
	if (fileName.endsWith('.json')) return 'application/json';
	if (fileName.endsWith('.log')) return 'text/plain';
	return 'application/octet-stream';
}

export const GET: RequestHandler = async ({ params }) => {
	// e.g. params.path = "2026-03-13T16-21-54Z/file.webm"
	if (!params.path) {
		throw error(400, 'Invalid path');
	}

	// Prevent directory traversal attacks
	if (params.path.includes('..')) {
		throw error(403, 'Forbidden path');
	}

	const absolutePath = join(RECORDINGS_DIR, params.path);

	if (!existsSync(absolutePath)) {
		throw error(404, 'File not found');
	}

	try {
		const stat = statSync(absolutePath);
		if (!stat.isFile()) {
			throw error(404, 'Not a file');
		}

		// Since we're dealing with videos/images we can return a stream directly
		// using SvelteKit's Response
		const stream = createReadStream(absolutePath);
		
		return new Response(stream as any, {
			headers: {
				'Content-Type': getMimeType(absolutePath),
				'Content-Length': String(stat.size),
				'Cache-Control': 'public, max-age=3600'
			}
		});
	} catch (err) {
		console.error('[e2e-recordings endpoint error]', err);
		throw error(500, 'Internal Server Error');
	}
};
