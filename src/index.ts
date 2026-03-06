/**
 * Theme System Exports
 *
 * Central export point for all theme-related modules.
 */

// Hooks
export { useTheme, useThemeValue } from './hooks/useTheme';

// Store
export {
  themeSignal,
  oppositeTheme,
  toggleTheme,
  setTheme,
  initializeTheme
} from './lib/theme-store';

// Types
export type { Theme, ThemeContextType } from './types/theme';

// Components
export { ThemeToggle } from './components/ThemeToggle';

/**
 * Ollama Client Exports
 *
 * Central export point for Ollama API client and types.
 */

// Client functions
export {
  generate,
  translate,
  testConnection,
  isAuthConfigured,
  getEndpoint,
  buildTranslationPrompt
} from './lib/ollama';

// Types
export type {
  OllamaGenerateRequest,
  OllamaGenerateResponse,
  OllamaStreamResponse,
  OllamaOptions,
  OllamaClientConfig,
  OllamaErrorResponse,
  TranslationRequest,
  TranslationResponse
} from './types/ollama';
