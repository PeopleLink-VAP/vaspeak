import { db } from '$lib/server/db';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';
import os from 'os';

const execAsync = promisify(exec);
// Resolve repo root relative to this file (web/src/routes/admin → ../../../../)
const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '../../../../..');

export async function load() {
    // System stats
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const uptime = os.uptime();
    const cpus = os.cpus();
    const loadAvg = os.loadavg();

    const system = {
        hostname: os.hostname(),
        platform: `${os.type()} ${os.release()}`,
        arch: os.arch(),
        cpuModel: cpus[0]?.model ?? 'Unknown',
        cpuCount: cpus.length,
        totalMemGB: (totalMem / 1073741824).toFixed(1),
        usedMemGB: (usedMem / 1073741824).toFixed(1),
        memPercent: Math.round((usedMem / totalMem) * 100),
        uptimeHours: Math.round(uptime / 3600),
        loadAvg1: loadAvg[0].toFixed(2),
        nodeVersion: process.version
    };

    // Latest git commit
    let gitCommit = { hash: 'N/A', message: 'No git info', date: '', author: '' };
    try {
        const { stdout } = await execAsync(
            'git log -1 --format="%H|%s|%ai|%an"',
            { cwd: REPO_ROOT }
        );
        const [hash, message, date, author] = stdout.trim().split('|');
        gitCommit = { hash: hash.slice(0, 8), message, date, author };
    } catch {
        // git not available or not a repo
    }

    // DB stats
    let dbStats = { profiles: 0, lessons: 0, vocab: 0 };
    try {
        const [profiles, lessons, vocab] = await Promise.all([
            db.execute('SELECT COUNT(*) as count FROM profiles'),
            db.execute('SELECT COUNT(*) as count FROM lessons'),
            db.execute('SELECT COUNT(*) as count FROM vocabulary_bank')
        ]);
        dbStats = {
            profiles: Number(profiles.rows[0]?.count ?? 0),
            lessons: Number(lessons.rows[0]?.count ?? 0),
            vocab: Number(vocab.rows[0]?.count ?? 0)
        };
    } catch {
        // tables may not exist yet
    }

    return { system, gitCommit, dbStats };
}
