/**
 * useTheme Hook
 * 
 * Custom hook for accessing and manipulating theme state in Preact components.
 * Uses Preact signals for reactive updates.
 */

import { useEffect } from 'preact/hooks';
import { useComputed } from '@preact/signals';
import { themeSignal, toggleTheme as storeToggleTheme, setTheme as storeSetTheme, initializeTheme } from '../lib/theme-store';
import type { Theme } from '../types/theme';

/**
 * Hook to access theme state and controls
 * 
 * @returns Object containing current theme, toggle function, and setTheme function
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { theme, toggleTheme, setTheme } = useTheme();
 *   
 *   return (
 *     <div>
 *       <p>Current theme: {theme}</p>
 *       <button onClick={toggleTheme}>Toggle Theme</button>
 *       <button onClick={() => setTheme('dark')}>Dark</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useTheme() {
  // Subscribe to theme signal for reactive updates
  const theme = useComputed(() => themeSignal.value).value;

  // Initialize theme on mount (apply to document, set up listeners)
  useEffect(() => {
    initializeTheme();
  }, []);

  return {
    /** Current active theme ('light' or 'dark') */
    theme,
    /** Toggle between light and dark themes */
    toggleTheme: storeToggleTheme,
    /** Set a specific theme */
    setTheme: storeSetTheme,
  };
}

/**
 * Hook to get just the current theme value
 * Useful when you only need to read the theme without controls
 */
export function useThemeValue(): Theme {
  return useComputed(() => themeSignal.value).value;
}
