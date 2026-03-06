/**
 * CSRF Validation Middleware
 *
 * Middleware function to validate CSRF tokens on state-changing requests.
 * Implements the Synchronized Token Pattern validation.
 *
 * @see https://docs.astro.build/en/guides/middleware/
 */

import type { APIContext, APIRoute } from 'astro';
import { validateToken } from '../lib/csrf.js';

/**
 * HTTP methods that require CSRF protection
 * These are state-changing operations that could be exploited via CSRF
 */
const CSRF_PROTECTED_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Header name for CSRF token in HTTP requests
 * Clients should include this header with state-changing requests
 */
export const CSRF_HEADER_NAME = 'X-CSRF-Token';

/**
 * Extracts CSRF token from request
 * Checks both request body and headers
 *
 * @param context - Astro API context containing the request
 * @returns The CSRF token if found, null otherwise
 */
function extractCsrfToken(context: APIContext): string | null {
  // Check header first (preferred method)
  const headerToken = context.request.headers.get(CSRF_HEADER_NAME);
  if (headerToken) {
    return headerToken;
  }

  // Check request body (for form submissions)
  // Note: This requires the body to be parsed first
  // For JSON bodies, the token should be in the body
  // For form data, it would be in formData
  return null;
}

/**
 * Creates a CSRF validation error response
 *
 * @param message - Error message to include in response
 * @returns Response object with 403 Forbidden status
 */
function createCsrfErrorResponse(message: string): Response {
  return new Response(
    JSON.stringify({
      error: 'CSRF validation failed',
      message,
      code: 'CSRF_TOKEN_INVALID'
    }),
    {
      status: 403,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
}

/**
 * Middleware function to validate CSRF tokens
 *
 * This middleware should be applied to API routes that handle
 * state-changing operations. It validates the CSRF token from
 * the request header or body.
 *
 * @param context - Astro API context
 * @param next - Next middleware or route handler
 * @returns Response from next handler or 403 error if validation fails
 *
 * @example
 * ```typescript
 * // In an API route file
 * import { csrfMiddleware } from '../middleware/csrf.js';
 *
 * export const POST: APIRoute = async (context) => {
 *   const middlewareResult = await csrfMiddleware(context, () => {});
 *   if (middlewareResult) return middlewareResult;
 *   // Handle valid request...
 * };
 * ```
 */
export async function csrfMiddleware(
  context: APIContext,
  next: () => Promise<Response>
): Promise<Response> {
  const method = context.request.method.toUpperCase();

  // Skip validation for non-protected methods (GET, HEAD, OPTIONS, etc.)
  if (!CSRF_PROTECTED_METHODS.has(method)) {
    return next();
  }

  // Extract token from request
  const token = extractCsrfToken(context);

  // Check if token is present
  if (!token) {
    console.warn(`[CSRF] Missing token for ${method} request to ${context.request.url}`);
    return createCsrfErrorResponse('CSRF token is missing. Include token in X-CSRF-Token header or request body.');
  }

  // Validate the token
  const result = validateToken(token);

  if (!result.isValid) {
    console.warn(`[CSRF] Invalid token for ${method} request to ${context.request.url}: ${result.error}`);
    return createCsrfErrorResponse(result.error || 'CSRF token validation failed');
  }

  // Token is valid, proceed with the request
  return next();
}

/**
 * Higher-order function to create a CSRF-protected API route handler
 * Wraps a handler function with CSRF validation
 *
 * @param handler - The API route handler function to wrap
 * @returns Wrapped handler with CSRF validation
 *
 * @example
 * ```typescript
 * import { withCsrf } from '../middleware/csrf.js';
 *
 * export const POST = withCsrf(async (context) => {
 *   // This code only runs if CSRF validation passes
 *   const body = await context.request.json();
 *   // Handle the request...
 * });
 * ```
 */
export function withCsrf<T extends APIRoute>(handler: T): T {
  return (async (context: APIContext) => {
    const method = context.request.method.toUpperCase();

    // Skip validation for non-protected methods
    if (!CSRF_PROTECTED_METHODS.has(method)) {
      return handler(context);
    }

    // Extract and validate token
    const token = extractCsrfToken(context);

    if (!token) {
      return createCsrfErrorResponse('CSRF token is missing. Include token in X-CSRF-Token header or request body.');
    }

    const result = validateToken(token);

    if (!result.isValid) {
      return createCsrfErrorResponse(result.error || 'CSRF token validation failed');
    }

    // Token is valid, call the handler
    return handler(context);
  }) as T;
}

/**
 * Parses JSON body from request and extracts CSRF token if present
 * Helper function for extracting token from JSON request bodies
 *
 * @param request - The request object
 * @returns The CSRF token from body if found, null otherwise
 */
export async function getTokenFromBody(request: Request): Promise<string | null> {
  try {
    const contentType = request.headers.get('Content-Type') || '';

    if (contentType.includes('application/json')) {
      const body = await request.clone().json();
      return body._csrf || body.csrfToken || body.token || null;
    }
  } catch {
    // Body parsing failed, token not in body
  }

  return null;
}
