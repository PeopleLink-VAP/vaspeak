/**
 * Gamification logic for VASpeak.
 * 
 * Pure functions for milestone detection, streak rewards, and daily bonuses.
 * All DB-free — call these with user data and apply the returned actions.
 */

// ── Milestone Definitions ──────────────────────────────────────────────

export interface Milestone {
	id: string;
	label: string;
	labelVi: string;
	icon: string;
	requirement: MilestoneRequirement;
	reward: MilestoneReward;
}

export type MilestoneRequirement =
	| { type: 'lessons_completed'; count: number }
	| { type: 'streak_days'; count: number }
	| { type: 'vocab_mastered'; count: number }
	| { type: 'roleplay_score'; minScore: number }
	| { type: 'week_completed'; week: number };

export type MilestoneReward =
	| { type: 'credits'; amount: number }
	| { type: 'badge'; badge: string }
	| { type: 'credits_and_badge'; amount: number; badge: string };

export const MILESTONES: Milestone[] = [
	// ── Streak Milestones ──
	{
		id: 'streak_3', label: '3-Day Streak', labelVi: '3 Ngày Liên Tiếp',
		icon: '🔥', requirement: { type: 'streak_days', count: 3 },
		reward: { type: 'credits', amount: 5 }
	},
	{
		id: 'streak_7', label: '7-Day Streak', labelVi: '1 Tuần Liên Tiếp',
		icon: '🔥', requirement: { type: 'streak_days', count: 7 },
		reward: { type: 'credits_and_badge', amount: 10, badge: 'weekly_warrior' }
	},
	{
		id: 'streak_14', label: '14-Day Streak', labelVi: '2 Tuần Liên Tiếp',
		icon: '🔥', requirement: { type: 'streak_days', count: 14 },
		reward: { type: 'credits_and_badge', amount: 15, badge: 'dedication_star' }
	},
	{
		id: 'streak_30', label: '30-Day Streak', labelVi: '1 Tháng Liên Tiếp',
		icon: '🏆', requirement: { type: 'streak_days', count: 30 },
		reward: { type: 'credits_and_badge', amount: 25, badge: 'monthly_champion' }
	},
	// ── Lesson Milestones ──
	{
		id: 'lessons_1', label: 'First Lesson', labelVi: 'Bài Học Đầu Tiên',
		icon: '🎓', requirement: { type: 'lessons_completed', count: 1 },
		reward: { type: 'credits', amount: 3 }
	},
	{
		id: 'lessons_7', label: 'Week 1 Done', labelVi: 'Hoàn Thành Tuần 1',
		icon: '📚', requirement: { type: 'week_completed', week: 1 },
		reward: { type: 'credits_and_badge', amount: 10, badge: 'week1_complete' }
	},
	{
		id: 'lessons_14', label: 'Week 2 Done', labelVi: 'Hoàn Thành Tuần 2',
		icon: '📚', requirement: { type: 'week_completed', week: 2 },
		reward: { type: 'credits_and_badge', amount: 10, badge: 'week2_complete' }
	},
	{
		id: 'lessons_21', label: 'Week 3 Done', labelVi: 'Hoàn Thành Tuần 3',
		icon: '📚', requirement: { type: 'week_completed', week: 3 },
		reward: { type: 'credits_and_badge', amount: 15, badge: 'week3_complete' }
	},
	// ── Vocab Milestones ──
	{
		id: 'vocab_10', label: '10 Words Mastered', labelVi: '10 Từ Thành Thạo',
		icon: '📖', requirement: { type: 'vocab_mastered', count: 10 },
		reward: { type: 'credits', amount: 5 }
	},
	{
		id: 'vocab_50', label: '50 Words Mastered', labelVi: '50 Từ Thành Thạo',
		icon: '📖', requirement: { type: 'vocab_mastered', count: 50 },
		reward: { type: 'credits_and_badge', amount: 10, badge: 'vocab_master' }
	},
	// ── Roleplay Milestones ──
	{
		id: 'roleplay_90', label: 'Roleplay Star', labelVi: 'Ngôi Sao Roleplay',
		icon: '⭐', requirement: { type: 'roleplay_score', minScore: 90 },
		reward: { type: 'credits_and_badge', amount: 5, badge: 'roleplay_star' }
	}
];

// ── User Stats Shape ──────────────────────────────────────────────

export interface UserStats {
	streakCount: number;
	lessonsCompleted: number;
	vocabMastered: number;
	highestRoleplayScore: number;
	weeksCompleted: number[];  // e.g. [1, 2] if weeks 1 and 2 are fully done
	earnedMilestoneIds: string[];  // already claimed
}

export interface MilestoneCheck {
	milestone: Milestone;
	isNew: boolean;  // true if just earned (not previously claimed)
}

/**
 * Check which milestones a user qualifies for.
 * Returns all qualifying milestones, with `isNew` flagging unclaimed ones.
 */
export function checkMilestones(stats: UserStats): MilestoneCheck[] {
	return MILESTONES.map(m => {
		const qualifies = meetsRequirement(m.requirement, stats);
		return {
			milestone: m,
			isNew: qualifies && !stats.earnedMilestoneIds.includes(m.id)
		};
	}).filter(mc => meetsRequirement(mc.milestone.requirement, stats));
}

/**
 * Get only newly earned milestones (for triggering rewards).
 */
export function getNewMilestones(stats: UserStats): Milestone[] {
	return checkMilestones(stats)
		.filter(mc => mc.isNew)
		.map(mc => mc.milestone);
}

function meetsRequirement(req: MilestoneRequirement, stats: UserStats): boolean {
	switch (req.type) {
		case 'lessons_completed':
			return stats.lessonsCompleted >= req.count;
		case 'streak_days':
			return stats.streakCount >= req.count;
		case 'vocab_mastered':
			return stats.vocabMastered >= req.count;
		case 'roleplay_score':
			return stats.highestRoleplayScore >= req.minScore;
		case 'week_completed':
			return stats.weeksCompleted.includes(req.week);
		default:
			return false;
	}
}

// ── Streak Bonus Calculator ────────────────────────────────────────

export interface StreakBonus {
	credits: number;
	message: string;
	messageVi: string;
}

/**
 * Calculate the daily login/streak bonus credits.
 * 
 * Rules:
 * - Daily completion: +1 credit
 * - 3-day streak: +2 bonus
 * - 7-day streak: +3 bonus
 * - 14-day streak: +5 bonus
 * - 30-day streak: +10 bonus
 */
export function calculateStreakBonus(currentStreak: number): StreakBonus {
	let credits = 1; // base daily bonus
	let message = 'Daily completion bonus';
	let messageVi = 'Thưởng hoàn thành hàng ngày';

	if (currentStreak >= 30) {
		credits += 10;
		message = '30-day streak bonus!';
		messageVi = 'Thưởng streak 30 ngày!';
	} else if (currentStreak >= 14) {
		credits += 5;
		message = '14-day streak bonus!';
		messageVi = 'Thưởng streak 14 ngày!';
	} else if (currentStreak >= 7) {
		credits += 3;
		message = '7-day streak bonus!';
		messageVi = 'Thưởng streak 7 ngày!';
	} else if (currentStreak >= 3) {
		credits += 2;
		message = '3-day streak bonus!';
		messageVi = 'Thưởng streak 3 ngày!';
	}

	return { credits, message, messageVi };
}

// ── Reward Calculation ────────────────────────────────────────────

/**
 * Calculate total credits from a milestone reward.
 */
export function getRewardCredits(reward: MilestoneReward): number {
	switch (reward.type) {
		case 'credits':
			return reward.amount;
		case 'credits_and_badge':
			return reward.amount;
		case 'badge':
			return 0;
	}
}

/**
 * Get badge name from a milestone reward, if any.
 */
export function getRewardBadge(reward: MilestoneReward): string | null {
	switch (reward.type) {
		case 'badge':
			return reward.badge;
		case 'credits_and_badge':
			return reward.badge;
		case 'credits':
			return null;
	}
}
