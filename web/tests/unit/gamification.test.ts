import { describe, it, expect } from 'vitest';
import {
	checkMilestones,
	getNewMilestones,
	calculateStreakBonus,
	getRewardCredits,
	getRewardBadge,
	MILESTONES,
	type UserStats
} from '$lib/gamification';

function makeStats(overrides: Partial<UserStats> = {}): UserStats {
	return {
		streakCount: 0,
		lessonsCompleted: 0,
		vocabMastered: 0,
		highestRoleplayScore: 0,
		weeksCompleted: [],
		earnedMilestoneIds: [],
		...overrides
	};
}

describe('checkMilestones', () => {
	it('returns no milestones for a brand new user', () => {
		const result = checkMilestones(makeStats());
		expect(result.length).toBe(0);
	});

	it('detects first lesson milestone', () => {
		const result = checkMilestones(makeStats({ lessonsCompleted: 1 }));
		const firstLesson = result.find(m => m.milestone.id === 'lessons_1');
		expect(firstLesson).toBeDefined();
		expect(firstLesson!.isNew).toBe(true);
	});

	it('marks already-earned milestones as not new', () => {
		const result = checkMilestones(makeStats({
			lessonsCompleted: 1,
			earnedMilestoneIds: ['lessons_1']
		}));
		const firstLesson = result.find(m => m.milestone.id === 'lessons_1');
		expect(firstLesson).toBeDefined();
		expect(firstLesson!.isNew).toBe(false);
	});

	it('detects 3-day streak milestone', () => {
		const result = checkMilestones(makeStats({ streakCount: 3 }));
		const streak3 = result.find(m => m.milestone.id === 'streak_3');
		expect(streak3).toBeDefined();
		expect(streak3!.isNew).toBe(true);
	});

	it('detects multiple streak milestones at 7 days', () => {
		const result = checkMilestones(makeStats({ streakCount: 7 }));
		const ids = result.map(m => m.milestone.id);
		expect(ids).toContain('streak_3');
		expect(ids).toContain('streak_7');
	});

	it('detects week completion milestones', () => {
		const result = checkMilestones(makeStats({ weeksCompleted: [1, 2] }));
		const ids = result.map(m => m.milestone.id);
		expect(ids).toContain('lessons_7');
		expect(ids).toContain('lessons_14');
		expect(ids).not.toContain('lessons_21');
	});

	it('detects vocab milestones', () => {
		const result = checkMilestones(makeStats({ vocabMastered: 50 }));
		const ids = result.map(m => m.milestone.id);
		expect(ids).toContain('vocab_10');
		expect(ids).toContain('vocab_50');
	});

	it('detects roleplay star milestone', () => {
		const result = checkMilestones(makeStats({ highestRoleplayScore: 92 }));
		const ids = result.map(m => m.milestone.id);
		expect(ids).toContain('roleplay_90');
	});

	it('does not trigger roleplay star below threshold', () => {
		const result = checkMilestones(makeStats({ highestRoleplayScore: 80 }));
		const ids = result.map(m => m.milestone.id);
		expect(ids).not.toContain('roleplay_90');
	});
});

describe('getNewMilestones', () => {
	it('returns only unclaimed milestones', () => {
		const newOnes = getNewMilestones(makeStats({
			streakCount: 7,
			earnedMilestoneIds: ['streak_3']
		}));
		const ids = newOnes.map(m => m.id);
		expect(ids).toContain('streak_7');
		expect(ids).not.toContain('streak_3');
	});

	it('returns empty when all are claimed', () => {
		const newOnes = getNewMilestones(makeStats({
			lessonsCompleted: 1,
			earnedMilestoneIds: ['lessons_1']
		}));
		expect(newOnes.length).toBe(0);
	});
});

describe('calculateStreakBonus', () => {
	it('gives 1 credit for streak of 0', () => {
		expect(calculateStreakBonus(0).credits).toBe(1);
	});

	it('gives 1 credit for streak of 1-2', () => {
		expect(calculateStreakBonus(1).credits).toBe(1);
		expect(calculateStreakBonus(2).credits).toBe(1);
	});

	it('gives 3 credits for streak of 3', () => {
		const bonus = calculateStreakBonus(3);
		expect(bonus.credits).toBe(3);
		expect(bonus.messageVi).toContain('3 ngày');
	});

	it('gives 4 credits for streak of 7', () => {
		expect(calculateStreakBonus(7).credits).toBe(4);
	});

	it('gives 6 credits for streak of 14', () => {
		expect(calculateStreakBonus(14).credits).toBe(6);
	});

	it('gives 11 credits for streak of 30+', () => {
		expect(calculateStreakBonus(30).credits).toBe(11);
		expect(calculateStreakBonus(45).credits).toBe(11);
	});
});

describe('getRewardCredits', () => {
	it('returns amount for credits reward', () => {
		expect(getRewardCredits({ type: 'credits', amount: 5 })).toBe(5);
	});

	it('returns amount for credits_and_badge', () => {
		expect(getRewardCredits({ type: 'credits_and_badge', amount: 10, badge: 'x' })).toBe(10);
	});

	it('returns 0 for badge-only reward', () => {
		expect(getRewardCredits({ type: 'badge', badge: 'x' })).toBe(0);
	});
});

describe('getRewardBadge', () => {
	it('returns null for credits-only reward', () => {
		expect(getRewardBadge({ type: 'credits', amount: 5 })).toBeNull();
	});

	it('returns badge for badge reward', () => {
		expect(getRewardBadge({ type: 'badge', badge: 'weekly_warrior' })).toBe('weekly_warrior');
	});

	it('returns badge for credits_and_badge', () => {
		expect(getRewardBadge({ type: 'credits_and_badge', amount: 10, badge: 'star' })).toBe('star');
	});
});

describe('MILESTONES constant', () => {
	it('has unique IDs', () => {
		const ids = MILESTONES.map(m => m.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('all milestones have Vietnamese labels', () => {
		for (const m of MILESTONES) {
			expect(m.labelVi.length).toBeGreaterThan(0);
		}
	});
});
