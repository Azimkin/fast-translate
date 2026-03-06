/**
 * LocalStorage utilities for Fast Translate
 *
 * Provides persistent storage for user preferences and recent selections.
 */

import type { Language } from '../types/language';

/**
 * Storage keys
 */
const STORAGE_KEYS = {
  /** Recently used language pair */
  RECENT_LANGUAGES: 'fast-translate-recent-langs',
} as const;

/**
 * Recent languages data structure
 */
export interface RecentLanguages {
  /** Source language code */
  sourceLang: string;
  /** Target language code */
  targetLang: string;
  /** Last used timestamp (ISO 8601) */
  lastUsed: string;
}

/**
 * Get recent languages from localStorage
 * @returns Recent languages object or null if not found
 */
export function getRecentLanguages(): RecentLanguages | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.RECENT_LANGUAGES);
    if (!data) {
      return null;
    }
    return JSON.parse(data) as RecentLanguages;
  } catch (error) {
    console.warn('[storage] Failed to read recent languages:', error);
    return null;
  }
}

/**
 * Save recent languages to localStorage
 * @param sourceLang - Source language code
 * @param targetLang - Target language code
 */
export function saveRecentLanguages(
  sourceLang: string,
  targetLang: string
): void {
  try {
    const data: RecentLanguages = {
      sourceLang,
      targetLang,
      lastUsed: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.RECENT_LANGUAGES, JSON.stringify(data));
  } catch (error) {
    console.warn('[storage] Failed to save recent languages:', error);
  }
}

/**
 * Clear recent languages from localStorage
 */
export function clearRecentLanguages(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.RECENT_LANGUAGES);
  } catch (error) {
    console.warn('[storage] Failed to clear recent languages:', error);
  }
}

/**
 * Validate if a language code exists in the available languages list
 * @param code - Language code to validate
 * @param availableLanguages - List of available languages
 * @returns true if language is available
 */
export function isLanguageAvailable(
  code: string,
  availableLanguages: Language[]
): boolean {
  return availableLanguages.some((lang) => lang.code === code);
}
