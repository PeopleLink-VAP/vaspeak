import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import { statSync } from 'fs';
import { resolve } from 'path';
import { db } from '$lib/server/db';

const execAsync = promisify(exec);
const DB_PATH = resolve('../db/local.db');

export async function load() {
    const totalMem = os.totalmem();
    const freeMem  = os.freemem();
    const usedMem  = totalMem - freeMem;
    const cpus     = os.cpus();
    const loadAvg  = os.loadavg();

    let dbSizeBytes = 0;
    try { dbSizeBytes = statSync(DB_PATH).size; } catch { /* remote */ }

    const tables = ['profiles', 'lessons', 'user_progress', 'user_credits', 'vocabulary_bank'];
    const counts: Record<string, number> = {};
    await Promise.all(
        tables.map(async (t) => {
            try {
                const r = await db.execute(`SELECT COUNT(*) as c FROM ${t}`);
                counts[t] = Number(r.rows[0]?.c ?? 0);
            } catch { counts[t] = 0; }
        })
    );

    let git = { hash: 'N/A', message: '', date: '', author: '' };
    try {
        const { stdout } = await execAsync('git log -1 --format="%H|%s|%ai|%an"', {
            cwd: '/media/dev/PROJECTS/LAB/vaspeak'
        });
        const [hash, message, date, author] = stdout.trim().replace(/^"|"$/g, '').split('|');
        git = { hash: hash?.slice(0, 8) ?? 'N/A', message: message ?? '', date: date ?? '', author: author ?? '' };
    } catch { /* ok */ }

    return {
        system: {
            hostname:   os.hostname(),
            platform:   `${os.type()} ${os.release()}`,
            arch:       os.arch(),
            cpuModel:   cpus[0]?.model ?? 'Unknown',
            cpuCount:   cpus.length,
            totalMemGB: (totalMem / 1073741824).toFixed(1),
            usedMemGB:  (usedMem  / 1073741824).toFixed(1),
            freeMemGB:  (freeMem  / 1073741824).toFixed(1),
            memPercent: Math.round((usedMem / totalMem) * 100),
            uptimeS:    os.uptime(),
            loadAvg1:   loadAvg[0].toFixed(2),
            loadAvg5:   loadAvg[1].toFixed(2),
            loadAvg15:  loadAvg[2].toFixed(2),
            nodeVersion: process.version,
        },
        db:  { sizeBytes: dbSizeBytes, counts },
        git,
        env: {
            NODE_ENV:          process.env.NODE_ENV ?? 'unknown',
            groqConfigured:    !!process.env.GROQ_API_KEY,
            tursoConfigured:   !!process.env.TURSO_DB_URL,
            resendConfigured:  !!process.env.RESEND_API_KEY,
        }
    };
}
