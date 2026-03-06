import type { APIRoute } from 'astro';
import { getLanguages, getCacheStatus } from '../../lib/languages';

/**
 * Languages API Endpoint
 *
 * GET /api/languages
 * Returns a list of supported languages with ISO 639-1 codes.
 * Uses cached data when available, fetches from REST Countries API otherwise.
 *
 * Query Parameters:
 * - status: If 'true', returns cache status instead of languages list
 *
 * Response Format:
 * {
 *   success: boolean,
 *   data: Array<{ code: string, name: string }> | CacheStatus,
 *   timestamp: string (ISO 8601),
 *   cached: boolean
 * }
 */

export const GET: APIRoute = async ({ url }) => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  // Set CORS headers for cross-origin requests
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'public, max-age=3600' // Match cache TTL
  };

  try {
    // Check if requesting cache status instead of languages
    const isStatusRequest = url.searchParams.get('status') === 'true';

    if (isStatusRequest) {
      // Return cache status for debugging/monitoring
      const cacheStatus = getCacheStatus();

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            isValid: cacheStatus.isValid,
            expiresAt: cacheStatus.expiresAt,
            timeRemainingMs: cacheStatus.timeRemaining,
            timeRemainingMinutes: cacheStatus.timeRemaining !== null
              ? Math.round(cacheStatus.timeRemaining / 60000)
              : null,
            languageCount: cacheStatus.languageCount
          },
          timestamp,
          cached: cacheStatus.isValid
        }, null, 2),
        {
          status: 200,
          headers: corsHeaders
        }
      );
    }

    // Get languages (uses cache if valid, fetches otherwise)
    const cacheStatusBefore = getCacheStatus();
    const wasCached = cacheStatusBefore.isValid;

    const languages = await getLanguages();

    const cacheStatusAfter = getCacheStatus();
    const isNowCached = cacheStatusAfter.isValid;

    // Determine if we served from cache or fetched fresh
    const servedFromCache = wasCached && isNowCached;

    console.log(`[LanguagesAPI] Request completed in ${Date.now() - startTime}ms, servedFromCache: ${servedFromCache}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: languages,
        timestamp,
        cached: servedFromCache,
        count: languages.length
      }, null, 2),
      {
        status: 200,
        headers: corsHeaders
      }
    );
  } catch (error) {
    // Log error for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[LanguagesAPI] Error:', errorMessage);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch languages',
        message: errorMessage,
        timestamp
      }, null, 2),
      {
        status: 500,
        headers: corsHeaders
      }
    );
  }
};

/**
 * Handle OPTIONS requests for CORS preflight
 */
export const OPTIONS: APIRoute = () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400' // 24 hours
    }
  });
};
