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

export const LEVEL_META: Record<UserLevel, { emoji: string; title: string; description: string }> = {
    survival: {
        emoji: '🌱',
        title: 'Survival Speaker',
        description: 'I struggle with basic English communication',
    },
    working: {
        emoji: '💼',
        title: 'Working VA',
        description: 'I can handle simple daily tasks in English',
    },
    client: {
        emoji: '🤝',
        title: 'Client Manager',
        description: 'I communicate with clients but want more confidence',
    },
    strategic: {
        emoji: '🚀',
        title: 'Strategic Partner',
        description: "I'm advanced but want to sound more natural",
    },
};

export const GOAL_META: Record<DailyGoal, { emoji: string; label: string }> = {
    5: { emoji: '☕', label: 'Casual' },
    15: { emoji: '🔥', label: 'Regular' },
    30: { emoji: '💪', label: 'Intense' },
};
