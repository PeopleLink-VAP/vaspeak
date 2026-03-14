/**
 * Shared types for the admin activity sidebar.
 */

export type ActivityItem = {
    id: string;
    type: 'signup' | 'waitlist' | 'progress' | 'task_update' | 'task_created' | 'comment';
    timestamp: string;
    title: string;
    detail: string;
    actor?: string;
};
