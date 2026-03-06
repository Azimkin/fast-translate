/**
 * Theme Store using Preact Signals
 * 
 * Manages theme state with localStorage persistence and system preference detection.
 * Uses Preact signals for reactive state management across components.
 */

import { signal, computed } from '@preact/signals';
import type { Theme } from '../types/theme';

const THEME_STORAGE_KEY = 'fast-translate-theme';

/**
 * Get the initial theme based on:
 * 1. localStorage value (if previously set by user)
 * 2. System preference (prefers-color-scheme)
 * 3. Default to 'light' if neither is available
 */
function getInitialTheme(): Theme {
  // Only run on client side
  if (typeof window === 'undefined') {
    return 'light';
  }

  // Check localStorage first
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }

  // Fall back to system preference
  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return 'light';
}

/**
 * Signal holding the current theme state
 */
export const themeSignal = signal<Theme>(getInitialTheme());

/**
 * Computed signal that returns the opposite theme
 */
export const oppositeTheme = computed(() => 
  themeSignal.value === 'light' ? 'dark' : 'light'
);

/**
 * Toggle between light and dark themes
 */
export function toggleTheme(): void {
  themeSignal.value = oppositeTheme.value;
}

/**
 * Set a specific theme
 */
export function setTheme(theme: Theme): void {
  themeSignal.value = theme;
}

/**
 * Initialize theme on the document element
 * This should be called once when the app starts
 */
export function initializeTheme(): void {
  if (typeof document === 'undefined') {
    return;
  }

  // Apply initial theme
  document.documentElement.setAttribute('data-theme', themeSignal.value);

  // Listen for theme changes and update the DOM
  themeSignal.subscribe((newTheme) => {
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  });

  // Listen for system preference changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleChange = (e: MediaQueryListEvent) => {
    // Only auto-switch if user hasn't explicitly set a preference
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (!stored) {
      themeSignal.value = e.matches ? 'dark' : 'light';
    }
  };

  mediaQuery.addEventListener('change', handleChange);
}
