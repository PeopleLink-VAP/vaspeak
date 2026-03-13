import { db } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) throw redirect(302, '/login');
    
    try {
        const [progressRes, lessonsRes] = await Promise.all([
            db.execute({
                sql: 'SELECT lesson_id FROM user_progress WHERE user_id = ?',
                args: [locals.user.id]
            }),
            db.execute({
                sql: 'SELECT id, day_number, week_number, week_theme, title FROM lessons WHERE niche = ? AND is_published = 1 ORDER BY day_number ASC',
                args: ['general']
            })
        ]);
        
        const completedIds = new Set(progressRes.rows.map(r => String(r.lesson_id)));
        
        const lessons = lessonsRes.rows.map(row => ({
            id: String(row.id),
            day_number: Number(row.day_number),
            week_number: Number(row.week_number),
            week_theme: String(row.week_theme),
            title: String(row.title),
            completed: completedIds.has(String(row.id))
        }));

        // Group by week
        const weeksMap = new Map<number, { weekNumber: number, theme: string, lessons: any[] }>();
        
        let highestUnlockedDay = 1;
        
        for (const lesson of lessons) {
            if (lesson.completed && lesson.day_number + 1 > highestUnlockedDay) {
                highestUnlockedDay = lesson.day_number + 1;
            }
            
            if (!weeksMap.has(lesson.week_number)) {
                weeksMap.set(lesson.week_number, {
                    weekNumber: lesson.week_number,
                    theme: lesson.week_theme,
                    lessons: []
                });
            }
            weeksMap.get(lesson.week_number)!.lessons.push({
                ...lesson,
                locked: lesson.day_number > highestUnlockedDay
            });
        }
        
        const weeks = Array.from(weeksMap.values()).sort((a, b) => a.weekNumber - b.weekNumber);
        
        return { weeks, highestUnlockedDay };
    } catch (err) {
        console.error('[lessons load error]', err);
        return { weeks: [], highestUnlockedDay: 1 };
    }
};
