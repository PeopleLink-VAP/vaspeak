import type { TranslationKey } from '$lib/i18n/en';

/**
 * Onboarding state store.
 *
 * Persists user selections across onboarding steps using sessionStorage.
 * Cleared after account creation or when session ends.
 */

const STORAGE_KEY = 'vaspeak_onboarding';

export type UserLevel = 'survival' | 'working' | 'client' | 'strategic';
export type DailyGoal = 5 | 15 | 30;

export interface OnboardingState {
    level: UserLevel | null;
    dailyGoal: DailyGoal;
    reminderEnabled: boolean;
    reminderTime: string;
}

const defaults: OnboardingState = {
    level: null,
    dailyGoal: 15,
    reminderEnabled: true,
    reminderTime: '09:00',
};

function loadState(): OnboardingState {
    if (typeof window === 'undefined') return { ...defaults };
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (raw) return { ...defaults, ...JSON.parse(raw) };
    } catch {
        // ignore parse errors
    }
    return { ...defaults };
}

function saveState(state: OnboardingState): void {
    if (typeof window === 'undefined') return;
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        // ignore storage errors
    }
}

/** Reactive onboarding state — call getOnboardingState() in components. */
let _state = $state<OnboardingState>(loadState());

export function getOnboardingState(): OnboardingState {
    return _state;
}

export function setLevel(level: UserLevel): void {
    _state.level = level;
    saveState(_state);
}

export function setDailyGoal(goal: DailyGoal): void {
    _state.dailyGoal = goal;
    saveState(_state);
}

export function setReminder(enabled: boolean, time?: string): void {
    _state.reminderEnabled = enabled;
    if (time) _state.reminderTime = time;
    saveState(_state);
}

export function clearOnboarding(): void {
    _state = { ...defaults };
    if (typeof window !== 'undefined') {
        sessionStorage.removeItem(STORAGE_KEY);
    }
}

export const LEVEL_META: Record<UserLevel, { emoji: string; titleKey: TranslationKey; descKey: TranslationKey }> = {
    survival: {
        emoji: '🌱',
        titleKey: 'level_survival_title',
        descKey: 'level_survival_desc',
    },
    working: {
        emoji: '💼',
        titleKey: 'level_working_title',
        descKey: 'level_working_desc',
    },
    client: {
        emoji: '🤝',
        titleKey: 'level_client_title',
        descKey: 'level_client_desc',
    },
    strategic: {
        emoji: '🚀',
        titleKey: 'level_strategic_title',
        descKey: 'level_strategic_desc',
    },
};

/** Type-safe lookup maps for level translation keys (avoids unsound template literals). */
export const LEVEL_TITLE_KEYS = {
    survival: 'level_survival_title',
    working: 'level_working_title',
    client: 'level_client_title',
    strategic: 'level_strategic_title',
} as const satisfies Record<UserLevel, TranslationKey>;

export const LEVEL_DESC_KEYS = {
    survival: 'level_survival_desc',
    working: 'level_working_desc',
    client: 'level_client_desc',
    strategic: 'level_strategic_desc',
} as const satisfies Record<UserLevel, TranslationKey>;

export const GOAL_META: Record<DailyGoal, { emoji: string; labelKey: 'goal_casual' | 'goal_regular' | 'goal_intense' }> = {
    5: { emoji: '☕', labelKey: 'goal_casual' },
    15: { emoji: '🔥', labelKey: 'goal_regular' },
    30: { emoji: '💪', labelKey: 'goal_intense' },
};
