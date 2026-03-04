/**
 * i18n store.
 *
 * Locale defaults to English. Persisted to localStorage.
 * Import `t` and `setLocale` anywhere in the app.
 */

import { en } from '$lib/i18n/en';
import { vi } from '$lib/i18n/vi';
import type { TranslationKey } from '$lib/i18n/en';

export type Locale = 'en' | 'vi';

const STORAGE_KEY = 'vaspeak_locale';

const DICTS: Record<Locale, Record<TranslationKey, string>> = { en, vi };

function loadLocale(): Locale {
    if (typeof window === 'undefined') return 'en';
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'vi') return stored;
    return 'en';
}

let _locale = $state<Locale>(loadLocale());

/** Reactive locale — use in components that need to display the current locale. */
export function getLocale(): Locale {
    return _locale;
}

/** Change the active locale and persist the choice. */
export function setLocale(locale: Locale): void {
    _locale = locale;
    if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, locale);
    }
}

/** Look up a translation key in the current locale. */
export function t(key: TranslationKey): string {
    return DICTS[_locale][key] ?? DICTS['en'][key] ?? key;
}
