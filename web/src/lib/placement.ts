/**
 * Placement test scoring logic.
 * Pure functions — no DB or side effects. Fully testable.
 */

export type PlacementInput = {
	experience: 'none' | 'yes' | '';
	speaking: 'beginner' | 'intermediate' | 'advanced' | '';
	niche: string;
};

export type PlacementResult = {
	level: 'general' | 'working_va';
	niche: string;
	/** Human-readable label for the starting level */
	levelLabel: string;
	/** Suggested starting day */
	startDay: number;
};

/**
 * Determine the user's starting level based on placement answers.
 *
 * Rules:
 * - Beginner speaking → general level, start Day 1
 * - Intermediate/Advanced speaking → working_va level, start Day 1 (can skip general later)
 * - Experience='yes' + beginner speaking → still general (experience alone doesn't skip)
 * - Niche is passed through as-is (defaults to 'general')
 */
export function scorePlacement(input: PlacementInput): PlacementResult {
	const niche = input.niche || 'general';

	if (input.speaking === 'intermediate' || input.speaking === 'advanced') {
		return {
			level: 'working_va',
			niche,
			levelLabel: 'Working VA',
			startDay: 1
		};
	}

	return {
		level: 'general',
		niche,
		levelLabel: 'General Communication',
		startDay: 1
	};
}

/**
 * Validate placement form input.
 * Returns null if valid, or an error message string.
 */
export function validatePlacement(input: PlacementInput): string | null {
	if (!input.speaking) {
		return 'Vui lòng chọn trình độ nói hiện tại của bạn.';
	}
	if (!['beginner', 'intermediate', 'advanced'].includes(input.speaking)) {
		return 'Trình độ nói không hợp lệ.';
	}
	return null;
}
