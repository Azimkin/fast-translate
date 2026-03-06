/**
 * CSRF Token System Types
 */

/**
 * Internal storage format for CSRF tokens in the server-side Map
 * Stores creation and expiration timestamps for TTL management
 */
export interface CsrfTokenData {
  /** Unix timestamp (ms) when the token was created */
  createdAt: number;
  /** Unix timestamp (ms) when the token expires */
  expiresAt: number;
}

/**
 * Response format for the CSRF token endpoint
 * Returned when a client requests a new token
 */
export interface CsrfTokenResponse {
  /** The generated CSRF token string */
  token: string;
  /** ISO 8601 timestamp when the token expires */
  expiresAt: string;
}

/**
 * Validation result for CSRF token verification
 */
export interface CsrfValidationResult {
  /** Whether the token is valid */
  isValid: boolean;
  /** Error message if validation failed, undefined if valid */
  error?: string;
}
