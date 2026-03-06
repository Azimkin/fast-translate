/**
 * Translation API Types
 *
 * Type definitions for the translation endpoint requests and responses.
 */

/**
 * Request body for the translation endpoint
 * All fields are required for a valid translation request
 */
export interface TranslateRequest {
  /** Name of the Ollama model to use for translation (e.g., 'llama2', 'mistral') */
  modelName: string;
  /** The text content to be translated */
  sourceText: string;
  /** Source language name or code (e.g., 'English', 'en') */
  sourceLang: string;
  /** Target language name or code (e.g., 'Spanish', 'es') */
  targetLang: string;
  /** CSRF token for request validation */
  csrfToken: string;
}

/**
 * Translated text data returned on successful translation
 */
export interface TranslationData {
  /** The translated text */
  translatedText: string;
  /** Model used for the translation */
  model: string;
  /** Source language of the original text */
  sourceLang: string;
  /** Target language of the translation */
  targetLang: string;
}

/**
 * Successful response from the translation endpoint
 */
export interface TranslateSuccessResponse {
  /** Indicates the request was successful */
  success: true;
  /** Translation result data */
  data: TranslationData;
  /** ISO 8601 timestamp of when the translation was completed */
  timestamp: string;
}

/**
 * Error response from the translation endpoint
 */
export interface TranslateErrorResponse {
  /** Indicates the request failed */
  success: false;
  /** Error code for programmatic handling */
  error: string;
  /** Human-readable error message */
  message: string;
  /** Optional additional error details */
  details?: Record<string, unknown>;
}

/**
 * Combined response type for the translation endpoint
 */
export type TranslateResponse = TranslateSuccessResponse | TranslateErrorResponse;

/**
 * Validation result for translate request body
 */
export interface TranslateValidationResult {
  /** Whether the request is valid */
  isValid: boolean;
  /** The parsed request data if valid */
  data?: TranslateRequest;
  /** Error message if validation failed */
  error?: string;
  /** Field that caused validation failure (if applicable) */
  field?: keyof TranslateRequest;
}

/**
 * Error codes for translation endpoint errors
 */
export const TranslateErrorCodes = {
  /** Request body is missing or invalid JSON */
  INVALID_JSON: 'INVALID_JSON',
  /** Required field is missing from request */
  MISSING_FIELD: 'MISSING_FIELD',
  /** Field value is empty or invalid */
  INVALID_FIELD: 'INVALID_FIELD',
  /** Source text exceeds maximum length */
  TEXT_TOO_LONG: 'TEXT_TOO_LONG',
  /** CSRF token validation failed */
  CSRF_INVALID: 'CSRF_INVALID',
  /** CSRF token is missing */
  CSRF_MISSING: 'CSRF_MISSING',
  /** Ollama API request failed */
  OLLAMA_ERROR: 'OLLAMA_ERROR',
  /** Model not found or not available */
  MODEL_NOT_FOUND: 'MODEL_NOT_FOUND',
  /** Internal server error */
  INTERNAL_ERROR: 'INTERNAL_ERROR'
} as const;

/**
 * Type for error code values
 */
export type TranslateErrorCode = (typeof TranslateErrorCodes)[keyof typeof TranslateErrorCodes];

/**
 * Configuration constants for translation validation
 */
export const TRANSLATE_CONFIG = {
  /** Maximum allowed length for source text (in characters) */
  MAX_TEXT_LENGTH: 10000,
  /** Minimum required length for source text (in characters) */
  MIN_TEXT_LENGTH: 1
} as const;
