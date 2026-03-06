/**
 * Theme System Types
 */

export type Theme = 'light' | 'dark';

export interface ThemeContextType {
  /** Current active theme */
  theme: Theme;
  /** Toggle between light and dark themes */
  toggleTheme: () => void;
  /** Set a specific theme */
  setTheme: (theme: Theme) => void;
}
