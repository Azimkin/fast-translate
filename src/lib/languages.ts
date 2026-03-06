/**
 * Languages Service
 *
 * Provides language data from REST Countries API with in-memory caching.
 * Implements TTL-based cache invalidation and graceful fallback on API failures.
 *
 * @see https://restcountries.com/ - Free REST Countries API
 */

import type { Language, LanguageCache, RestCountriesResponse } from '../types/language';

/**
 * Cache configuration
 */
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * In-memory cache for language data
 * Stored at module level to persist across requests in the same process
 */
let languageCache: LanguageCache | null = null;

/**
 * Fallback language list (ISO 639-1 codes)
 * Used when the external API is unavailable
 * Includes major world languages by number of speakers
 */
const FALLBACK_LANGUAGES: Language[] = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'bn', name: 'Bengali' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'jv', name: 'Javanese' },
  { code: 'te', name: 'Telugu' },
  { code: 'mr', name: 'Marathi' },
  { code: 'ta', name: 'Tamil' },
  { code: 'tr', name: 'Turkish' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'pl', name: 'Polish' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'nl', name: 'Dutch' },
  { code: 'th', name: 'Thai' },
  { code: 'id', name: 'Indonesian' },
  { code: 'ms', name: 'Malay' },
  { code: 'ro', name: 'Romanian' },
  { code: 'el', name: 'Greek' },
  { code: 'cs', name: 'Czech' },
  { code: 'sv', name: 'Swedish' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'he', name: 'Hebrew' },
  { code: 'fi', name: 'Finnish' },
  { code: 'no', name: 'Norwegian' },
  { code: 'da', name: 'Danish' },
  { code: 'sk', name: 'Slovak' },
  { code: 'bg', name: 'Bulgarian' },
  { code: 'hr', name: 'Croatian' },
  { code: 'sr', name: 'Serbian' },
  { code: 'lt', name: 'Lithuanian' },
  { code: 'sl', name: 'Slovenian' },
  { code: 'lv', name: 'Latvian' },
  { code: 'et', name: 'Estonian' }
].sort((a, b) => a.name.localeCompare(b.name));

/**
 * Check if the current cache is valid (exists and not expired)
 * @returns true if cache is valid, false otherwise
 */
function isCacheValid(): boolean {
  if (!languageCache) {
    return false;
  }

  const now = Date.now();
  return now < languageCache.expiresAt;
}

/**
 * Parse languages from REST Countries API response
 * Extracts unique language codes and names from all countries
 * Note: REST Countries API uses ISO 639-2/3 codes (3 letters) like "eng", "spa"
 * We convert common ones to ISO 639-1 (2 letters) where possible
 * @param data - Array of country data from REST Countries API
 * @returns Array of unique Language objects sorted alphabetically
 */
function parseLanguagesFromApiResponse(data: RestCountriesResponse[]): Language[] {
  const languageMap = new Map<string, string>();

  // Common ISO 639-2/3 to ISO 639-1 mappings for major languages
  const codeMappings: Record<string, string> = {
    // Major languages
    'eng': 'en', 'spa': 'es', 'fra': 'fr', 'deu': 'de', 'ita': 'it',
    'por': 'pt', 'rus': 'ru', 'zho': 'zh', 'jpn': 'ja', 'kor': 'ko',
    'ara': 'ar', 'hin': 'hi', 'ben': 'bn', 'pan': 'pa', 'jav': 'jv',
    'tel': 'te', 'mar': 'mr', 'tam': 'ta', 'tur': 'tr', 'vie': 'vi',
    'pol': 'pl', 'ukr': 'uk', 'nld': 'nl', 'tha': 'th', 'ind': 'id',
    'msa': 'ms', 'ron': 'ro', 'ell': 'el', 'ces': 'cs', 'swe': 'sv',
    'hun': 'hu', 'heb': 'he', 'fin': 'fi', 'nor': 'no', 'dan': 'da',
    'slk': 'sk', 'bul': 'bg', 'hrv': 'hr', 'srp': 'sr', 'lit': 'lt',
    'slv': 'sl', 'lav': 'lv', 'est': 'et',
    // Additional mappings
    'cat': 'ca', 'glg': 'gl', 'eus': 'eu', 'afr': 'af', 'swa': 'sw',
    'urd': 'ur', 'nep': 'ne', 'sin': 'si', 'khm': 'km', 'lao': 'lo',
    'mya': 'my', 'kan': 'kn', 'mal': 'ml', 'guj': 'gu', 'ori': 'or',
    'amh': 'am', 'hau': 'ha', 'yor': 'yo', 'ibo': 'ig', 'zul': 'zu',
    'xho': 'xh', 'sot': 'st', 'tsn': 'tn', 'ssw': 'ss', 'ven': 've',
    'nso': 'n', 'nde': 'nd', 'nya': 'ny', 'sna': 'sn', 'ton': 'to',
    'fij': 'fj', 'smo': 'sm', 'haw': 'hw', 'mri': 'mi', 'fil': 'fl'
  };

  // Extract all unique languages from all countries
  for (const country of data) {
    if (country.languages) {
      for (const [code, name] of Object.entries(country.languages)) {
        // Skip if already have this language
        if (languageMap.has(code)) {
          continue;
        }

        // Convert to ISO 639-1 if mapping exists, otherwise use original code
        const normalizedCode = codeMappings[code] || code.toLowerCase();
        
        // Only add if we don't already have this normalized code
        if (!languageMap.has(normalizedCode)) {
          languageMap.set(normalizedCode, name);
        }
      }
    }
  }

  // Convert map to array and sort alphabetically by name
  const languages: Language[] = Array.from(languageMap.entries()).map(([code, name]) => ({
    code,
    name
  }));

  return languages.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Fetch languages from REST Countries API
 * Uses the /all endpoint to get all countries and extract unique languages
 * @returns Promise resolving to array of Language objects
 * @throws Error if API request fails
 */
async function fetchLanguagesFromApi(): Promise<Language[]> {
  const apiUrl = 'https://restcountries.com/v3.1/all?fields=languages,name';

  console.log('[LanguagesService] Fetching languages from REST Countries API...');

  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    },
    // Timeout after 10 seconds
    signal: AbortSignal.timeout(10000)
  });

  if (!response.ok) {
    throw new Error(`REST Countries API returned status ${response.status}: ${response.statusText}`);
  }

  const data = await response.json() as RestCountriesResponse[];
  
  // Debug logging
  console.log(`[LanguagesService] API returned ${Array.isArray(data) ? data.length : 'non-array'} items`);
  if (Array.isArray(data) && data.length > 0) {
    console.log('[LanguagesService] Sample country:', JSON.stringify(data[0]).substring(0, 200));
  }

  const languages = parseLanguagesFromApiResponse(data);

  console.log(`[LanguagesService] Successfully fetched ${languages.length} languages from API`);

  return languages;
}

/**
 * Get languages with caching support
 * Returns cached data if valid, otherwise fetches from API
 * Falls back to static list if API is unavailable
 * @returns Promise resolving to array of Language objects
 */
export async function getLanguages(): Promise<Language[]> {
  // Return cached data if valid
  if (isCacheValid()) {
    console.log('[LanguagesService] Returning cached languages');
    return languageCache!.data;
  }

  try {
    // Fetch from external API
    const languages = await fetchLanguagesFromApi();

    // Update cache with new data and expiration time
    languageCache = {
      data: languages,
      expiresAt: Date.now() + CACHE_TTL_MS
    };

    console.log(`[LanguagesService] Cache updated with ${languages.length} languages, expires in 1 hour`);

    return languages;
  } catch (error) {
    // Log the error for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[LanguagesService] API fetch failed:', errorMessage);
    console.log('[LanguagesService] Using fallback language list');

    // Return fallback list - don't cache failures, try again on next request
    return FALLBACK_LANGUAGES;
  }
}

/**
 * Clear the language cache
 * Useful for testing or manual cache invalidation
 */
export function clearCache(): void {
  languageCache = null;
  console.log('[LanguagesService] Cache cleared');
}

/**
 * Get cache status for debugging/monitoring
 * @returns Object with cache status information
 */
export function getCacheStatus(): {
  isValid: boolean;
  expiresAt: number | null;
  timeRemaining: number | null;
  languageCount: number | null;
} {
  if (!languageCache) {
    return {
      isValid: false,
      expiresAt: null,
      timeRemaining: null,
      languageCount: null
    };
  }

  const now = Date.now();
  const timeRemaining = Math.max(0, languageCache.expiresAt - now);

  return {
    isValid: now < languageCache.expiresAt,
    expiresAt: languageCache.expiresAt,
    timeRemaining,
    languageCount: languageCache.data.length
  };
}

/**
 * Get the fallback language list
 * Exported for testing purposes
 * @returns Array of fallback Language objects
 */
export function getFallbackLanguages(): Language[] {
  return FALLBACK_LANGUAGES;
}
