/**
 * Translation API Endpoint
 *
 * POST endpoint to translate text using Ollama AI models.
 * Implements CSRF protection, input validation, and proper error handling.
 *
 * @example
 * ```typescript
 * // Request
 * fetch('/api/translate', {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     'X-CSRF-Token': 'abc123...'
 *   },
 *   body: JSON.stringify({
 *     modelName: 'llama2',
 *     sourceText: 'Hello, world!',
 *     sourceLang: 'English',
 *     targetLang: 'Spanish'
 *   })
 * });
 *
 * // Response (success)
 * {
 *   success: true,
 *   data: {
 *     translatedText: '¡Hola, mundo!',
 *     model: 'llama2',
 *     sourceLang: 'English',
 *     targetLang: 'Spanish'
 *   },
 *   timestamp: '2026-03-06T18:00:00.000Z'
 * }
 *
 * // Response (error)
 * {
 *   success: false,
 *   error: 'INVALID_FIELD',
 *   message: 'sourceText is required and cannot be empty'
 * }
 * ```
 */

import type { APIRoute } from 'astro';
import { validateToken } from '../../lib/csrf.js';
import { translate as translateWithOllama } from '../../lib/ollama.js';
import type {
  TranslateRequest,
  TranslateResponse,
  TranslateSuccessResponse,
  TranslateErrorResponse,
  TranslateValidationResult,
  TranslateErrorCode
} from '../../types/translate.js';
import {
  TRANSLATE_CONFIG,
  TranslateErrorCodes
} from '../../types/translate.js';

/**
 * Allowed origins for CORS
 * Configured via environment variable or defaults to allow all in development
 */
const ALLOWED_ORIGINS = process.env.TRANSLATE_ALLOWED_ORIGINS?.split(',') || ['*'];

/**
 * Generates CORS headers for the response
 * Allows cross-origin requests from configured origins
 *
 * @param origin - The request origin from headers
 * @returns Headers object with CORS configuration
 */
function getCorsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-CSRF-Token',
    'Access-Control-Max-Age': '86400' // 24 hours
  };

  // Set CORS origin header
  if (origin) {
    if (ALLOWED_ORIGINS.includes('*') || ALLOWED_ORIGINS.includes(origin)) {
      headers['Access-Control-Allow-Origin'] = origin;
    }
  } else {
    // No origin header (same-origin request)
    if (ALLOWED_ORIGINS.includes('*')) {
      headers['Access-Control-Allow-Origin'] = '*';
    }
  }

  return headers;
}

/**
 * Creates an error response for the translation endpoint
 *
 * @param errorCode - Error code for programmatic handling
 * @param message - Human-readable error message
 * @param details - Optional additional error details
 * @param status - HTTP status code (default: 400)
 * @param origin - Request origin for CORS headers
 * @returns Response object with error JSON
 */
function createErrorResponse(
  errorCode: TranslateErrorCode,
  message: string,
  details?: Record<string, unknown>,
  status: number = 400,
  origin: string | null = null
): Response {
  const corsHeaders = getCorsHeaders(origin);

  const errorResponse: TranslateErrorResponse = {
    success: false,
    error: errorCode,
    message,
    ...(details && { details })
  };

  return new Response(JSON.stringify(errorResponse), {
    status,
    headers: corsHeaders
  });
}

/**
 * Creates a success response for the translation endpoint
 *
 * @param data - Translation result data
 * @param origin - Request origin for CORS headers
 * @returns Response object with success JSON
 */
function createSuccessResponse(
  data: TranslateSuccessResponse['data'],
  origin: string | null = null
): Response {
  const corsHeaders = getCorsHeaders(origin);

  const successResponse: TranslateSuccessResponse = {
    success: true,
    data,
    timestamp: new Date().toISOString()
  };

  return new Response(JSON.stringify(successResponse), {
    status: 200,
    headers: corsHeaders
  });
}

/**
 * Validates the translation request body
 * Checks for required fields, text length, and data types
 *
 * @param body - Parsed request body
 * @returns Validation result with parsed data or error
 */
function validateTranslateRequest(body: unknown): TranslateValidationResult {
  // Check if body is an object
  if (!body || typeof body !== 'object') {
    return {
      isValid: false,
      error: 'Request body must be a valid JSON object',
      field: undefined
    };
  }

  const request = body as Record<string, unknown>;

  // Validate modelName
  if (!('modelName' in request)) {
    return {
      isValid: false,
      error: 'modelName is required',
      field: 'modelName'
    };
  }
  if (typeof request.modelName !== 'string' || request.modelName.trim() === '') {
    return {
      isValid: false,
      error: 'modelName must be a non-empty string',
      field: 'modelName'
    };
  }

  // Validate sourceText
  if (!('sourceText' in request)) {
    return {
      isValid: false,
      error: 'sourceText is required',
      field: 'sourceText'
    };
  }
  if (typeof request.sourceText !== 'string') {
    return {
      isValid: false,
      error: 'sourceText must be a string',
      field: 'sourceText'
    };
  }
  if (request.sourceText.length < TRANSLATE_CONFIG.MIN_TEXT_LENGTH) {
    return {
      isValid: false,
      error: 'sourceText cannot be empty',
      field: 'sourceText'
    };
  }
  if (request.sourceText.length > TRANSLATE_CONFIG.MAX_TEXT_LENGTH) {
    return {
      isValid: false,
      error: `sourceText exceeds maximum length of ${TRANSLATE_CONFIG.MAX_TEXT_LENGTH} characters`,
      field: 'sourceText'
    };
  }

  // Validate sourceLang
  if (!('sourceLang' in request)) {
    return {
      isValid: false,
      error: 'sourceLang is required',
      field: 'sourceLang'
    };
  }
  if (typeof request.sourceLang !== 'string' || request.sourceLang.trim() === '') {
    return {
      isValid: false,
      error: 'sourceLang must be a non-empty string',
      field: 'sourceLang'
    };
  }

  // Validate targetLang
  if (!('targetLang' in request)) {
    return {
      isValid: false,
      error: 'targetLang is required',
      field: 'targetLang'
    };
  }
  if (typeof request.targetLang !== 'string' || request.targetLang.trim() === '') {
    return {
      isValid: false,
      error: 'targetLang must be a non-empty string',
      field: 'targetLang'
    };
  }

  // Validate csrfToken (optional - can be provided in header or body)
  let csrfToken: string | undefined;
  if ('csrfToken' in request) {
    if (typeof request.csrfToken !== 'string' || request.csrfToken.trim() === '') {
      return {
        isValid: false,
        error: 'csrfToken must be a non-empty string',
        field: 'csrfToken'
      };
    }
    csrfToken = request.csrfToken;
  }

  // All validations passed
  return {
    isValid: true,
    data: {
      modelName: request.modelName.trim(),
      sourceText: request.sourceText,
      sourceLang: request.sourceLang.trim(),
      targetLang: request.targetLang.trim(),
      csrfToken
    }
  };
}

/**
 * Validates CSRF token from request
 * Checks both header and body for the token
 *
 * @param request - The incoming request
 * @param bodyToken - Token from request body (if provided)
 * @returns Validation result
 */
function validateCsrfToken(request: Request, bodyToken?: string): { isValid: boolean; error?: string } {
  // First check the header (preferred method)
  const headerToken = request.headers.get('X-CSRF-Token');

  if (headerToken) {
    const result = validateToken(headerToken);
    if (!result.isValid) {
      return { isValid: false, error: result.error };
    }
    return { isValid: true };
  }

  // Fall back to body token if header not present
  if (bodyToken) {
    const result = validateToken(bodyToken);
    if (!result.isValid) {
      return { isValid: false, error: result.error };
    }
    return { isValid: true };
  }

  // No token found in either header or body
  return { isValid: false, error: 'CSRF token is missing. Include token in X-CSRF-Token header or request body.' };
}

/**
 * POST handler - Translate text using Ollama
 *
 * Validates the request, checks CSRF token, calls Ollama for translation,
 * and returns the result.
 */
export const POST: APIRoute = async ({ request }) => {
  const origin = request.headers.get('Origin');
  const contentType = request.headers.get('Content-Type') || '';

  // Validate Content-Type
  if (!contentType.includes('application/json')) {
    console.warn('[Translate] Invalid Content-Type:', contentType);
    return createErrorResponse(
      TranslateErrorCodes.INVALID_JSON,
      'Content-Type must be application/json',
      undefined,
      400,
      origin
    );
  }

  // Parse request body
  let body: unknown;
  try {
    body = await request.json();
  } catch (parseError) {
    console.warn('[Translate] Failed to parse request body:', parseError);
    return createErrorResponse(
      TranslateErrorCodes.INVALID_JSON,
      'Invalid JSON in request body',
      undefined,
      400,
      origin
    );
  }

  // Validate request body
  const validation = validateTranslateRequest(body);
  if (!validation.isValid) {
    console.warn('[Translate] Validation failed:', validation.error, 'field:', validation.field);

    // Determine appropriate error code
    let errorCode: TranslateErrorCode = TranslateErrorCodes.INVALID_FIELD;
    if (validation.field === 'sourceText' && validation.error?.includes('maximum length')) {
      errorCode = TranslateErrorCodes.TEXT_TOO_LONG;
    }

    return createErrorResponse(
      errorCode,
      validation.error || 'Validation failed',
      validation.field ? { field: validation.field } : undefined,
      400,
      origin
    );
  }

  // Validate CSRF token
  const csrfResult = validateCsrfToken(request, validation.data?.csrfToken);
  if (!csrfResult.isValid) {
    console.warn('[Translate] CSRF validation failed:', csrfResult.error);
    return createErrorResponse(
      TranslateErrorCodes.CSRF_INVALID,
      csrfResult.error || 'CSRF token validation failed',
      undefined,
      403,
      origin
    );
  }

  // Perform translation
  const { modelName, sourceText, sourceLang, targetLang } = validation.data!;

  try {
    const result = await translateWithOllama({
      text: sourceText,
      sourceLang,
      targetLang,
      model: modelName,
      stream: false
    });

    // Check if translation was successful
    if (!result.success) {
      console.error('[Translate] Ollama translation failed:', result.error);

      // Check for model-related errors
      const errorMessage = result.error || 'Translation failed';
      let errorCode: TranslateErrorCode = TranslateErrorCodes.OLLAMA_ERROR;

      if (errorMessage.toLowerCase().includes('model') &&
          (errorMessage.toLowerCase().includes('not found') ||
           errorMessage.toLowerCase().includes('not available'))) {
        errorCode = TranslateErrorCodes.MODEL_NOT_FOUND;
      }

      return createErrorResponse(
        errorCode,
        errorMessage,
        { model: modelName },
        500,
        origin
      );
    }

    // Return successful translation
    console.log('[Translate] Translation successful');
    return createSuccessResponse({
      translatedText: result.translatedText,
      model: result.model,
      sourceLang: result.sourceLang,
      targetLang: result.targetLang
    }, origin);

  } catch (error) {
    // Handle unexpected errors
    console.error('[Translate] Unexpected error:', error);

    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

    return createErrorResponse(
      TranslateErrorCodes.INTERNAL_ERROR,
      errorMessage,
      { model: modelName },
      500,
      origin
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
