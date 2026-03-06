/**
 * Language System Types
 */

/**
 * Represents a language with ISO 639-1 code and display name
 */
export interface Language {
  /** ISO 639-1 two-letter language code (e.g., 'en', 'es', 'fr') */
  code: string;
  /** Human-readable language name (e.g., 'English', 'Spanish', 'French') */
  name: string;
}

/**
 * Cached language data with expiration timestamp
 */
export interface LanguageCache {
  /** Array of cached languages */
  data: Language[];
  /** Unix timestamp (ms) when the cache expires */
  expiresAt: number;
}

/**
 * Response from the REST Countries API for languages
 */
export interface RestCountriesResponse {
  /** Array of language codes as keys with language names as values */
  languages?: Record<string, string>;
  /** Country name for logging/debugging purposes */
  name?: {
    common: string;
  };
}
