/**
 * CSRF Token Endpoint
 *
 * GET endpoint to retrieve a new CSRF token for client-side forms
 * and state-changing operations.
 *
 * @example
 * ```typescript
 * // Fetch a new CSRF token
 * const response = await fetch('/api/csrf-token');
 * const { token, expiresAt } = await response.json();
 *
 * // Use token in subsequent requests
 * await fetch('/api/some-action', {
 *   method: 'POST',
 *   headers: {
 *     'X-CSRF-Token': token,
 *     'Content-Type': 'application/json'
 *   },
 *   body: JSON.stringify({ data: 'value' })
 * });
 * ```
 */

import type { APIRoute } from 'astro';
import { generateToken } from '../../lib/csrf.js';
import type { CsrfTokenResponse } from '../../types/csrf.js';

/**
 * Allowed origins for CORS
 * In production, this should be configured via environment variables
 */
const ALLOWED_ORIGINS = process.env.CSRF_ALLOWED_ORIGINS?.split(',') || ['*'];

/**
 * Generates CORS headers for the response
 * Allows cross-origin requests from configured origins
 *
 * @param origin - The request origin
 * @returns Headers object with CORS configuration
 */
function getCorsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };

  // Set CORS headers
  if (origin) {
    // In development or if wildcard is allowed, allow any origin
    if (ALLOWED_ORIGINS.includes('*') || ALLOWED_ORIGINS.includes(origin)) {
      headers['Access-Control-Allow-Origin'] = origin;
    }
  } else {
    // No origin header (same-origin request)
    if (ALLOWED_ORIGINS.includes('*')) {
      headers['Access-Control-Allow-Origin'] = '*';
    }
  }

  headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS';
  headers['Access-Control-Allow-Headers'] = 'Content-Type, X-CSRF-Token';
  headers['Access-Control-Max-Age'] = '86400'; // 24 hours

  return headers;
}

/**
 * GET handler - Generate and return a new CSRF token
 *
 * Returns a JSON response with:
 * - token: The CSRF token string
 * - expiresAt: ISO 8601 timestamp when the token expires
 */
export const GET: APIRoute = async ({ request }) => {
  const origin = request.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  try {
    // Generate new CSRF token
    const { token, expiresAt } = generateToken();

    // Create response object
    const response: CsrfTokenResponse = {
      token,
      expiresAt: new Date(expiresAt).toISOString()
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    console.error('[CSRF] Error generating token:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to generate CSRF token',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: corsHeaders
      }
    );
  }
};

/**
 * OPTIONS handler - Handle CORS preflight requests
 */
export const OPTIONS: APIRoute = async ({ request }) => {
  const origin = request.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
};
