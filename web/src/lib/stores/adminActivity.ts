/**
 * Shared store for the admin activity sidebar.
 * Lives here so both the layout (which renders the sidebar outside .admin-main)
 * and individual pages (which own the toggle button) can share state.
 */
import { writable } from 'svelte/store';

export const activitySidebarOpen = writable(false);

export type ActivityItem = {
    id: string;
    type: 'signup' | 'waitlist' | 'progress' | 'task_update' | 'task_created' | 'comment';
    timestamp: string;
    title: string;
    detail: string;
    actor?: string;
};
