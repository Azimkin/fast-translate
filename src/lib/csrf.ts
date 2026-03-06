/**
 * CSRF Protection Service
 *
 * Implements the Synchronized Token Pattern for CSRF protection.
 * Tokens are stored server-side with expiration and automatically cleaned up.
 *
 * @see https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#synchronizer-token-pattern
 */

import crypto from 'node:crypto';
import type { CsrfTokenData, CsrfValidationResult } from '../types/csrf.js';

/**
 * Configuration constants for CSRF token management
 */
const CSRF_CONFIG = {
  /** Token size in bytes (32 bytes = 256 bits of entropy) */
  TOKEN_SIZE: 32,
  /** Token expiration time in milliseconds (1 hour) */
  TOKEN_TTL_MS: 60 * 60 * 1000,
  /** Cleanup interval in milliseconds (5 minutes) */
  CLEANUP_INTERVAL_MS: 5 * 60 * 1000
} as const;

/**
 * Server-side storage for CSRF tokens
 * Maps token string to token metadata (creation and expiration times)
 */
const tokenStore: Map<string, CsrfTokenData> = new Map();

/**
 * Generates a cryptographically secure random token
 * Uses Bun's crypto module (compatible with Node.js crypto API)
 *
 * @returns Hex-encoded token string (64 characters for 32 bytes)
 */
function generateSecureToken(): string {
  return crypto.randomBytes(CSRF_CONFIG.TOKEN_SIZE).toString('hex');
}

/**
 * Gets the current Unix timestamp in milliseconds
 *
 * @returns Current time as Unix timestamp (ms)
 */
function getCurrentTimestamp(): number {
  return Date.now();
}

/**
 * Cleans up expired tokens from the token store
 * Called automatically on each generate/validate operation
 * to prevent memory leaks from accumulated expired tokens
 */
export function cleanupExpiredTokens(): void {
  const now = getCurrentTimestamp();
  const expiredTokens: string[] = [];

  // Identify expired tokens
  for (const [token, data] of tokenStore.entries()) {
    if (data.expiresAt <= now) {
      expiredTokens.push(token);
    }
  }

  // Remove expired tokens
  for (const token of expiredTokens) {
    tokenStore.delete(token);
  }

  if (expiredTokens.length > 0) {
    console.debug(`[CSRF] Cleaned up ${expiredTokens.length} expired token(s)`);
  }
}

/**
 * Generates a new CSRF token and stores it server-side
 * Automatically cleans up expired tokens before generating
 *
 * @returns Object containing the token and its expiration timestamp
 *
 * @example
 * ```typescript
 * const { token, expiresAt } = generateToken();
 * // Send token to client (e.g., in response body or cookie)
 * ```
 */
export function generateToken(): { token: string; expiresAt: number } {
  // Cleanup expired tokens first
  cleanupExpiredTokens();

  const now = getCurrentTimestamp();
  const token = generateSecureToken();
  const expiresAt = now + CSRF_CONFIG.TOKEN_TTL_MS;

  // Store token with metadata
  tokenStore.set(token, {
    createdAt: now,
    expiresAt
  });

  console.debug(`[CSRF] Generated new token, expires at ${new Date(expiresAt).toISOString()}`);

  return {
    token,
    expiresAt
  };
}

/**
 * Validates a CSRF token against the server-side store
 * Automatically cleans up expired tokens before validation
 *
 * @param token - The CSRF token to validate
 * @returns Validation result with isValid flag and optional error message
 *
 * @example
 * ```typescript
 * const result = validateToken(userProvidedToken);
 * if (!result.isValid) {
 *   throw new Error(result.error);
 * }
 * // Token is valid, proceed with request
 * ```
 */
export function validateToken(token: string): CsrfValidationResult {
  // Cleanup expired tokens first
  cleanupExpiredTokens();

  // Check if token is provided
  if (!token || typeof token !== 'string') {
    return {
      isValid: false,
      error: 'CSRF token is missing or invalid'
    };
  }

  // Check if token exists in store
  const tokenData = tokenStore.get(token);
  if (!tokenData) {
    return {
      isValid: false,
      error: 'CSRF token not found or has expired'
    };
  }

  // Check if token has expired (double-check in case cleanup hasn't run)
  const now = getCurrentTimestamp();
  if (tokenData.expiresAt <= now) {
    // Token expired, remove it from store
    tokenStore.delete(token);
    return {
      isValid: false,
      error: 'CSRF token has expired'
    };
  }

  // Token is valid
  return {
    isValid: true
  };
}

/**
 * Revokes a CSRF token, removing it from the server-side store
 * Useful for invalidating tokens after use or on logout
 *
 * @param token - The CSRF token to revoke
 * @returns True if token was found and revoked, false if token didn't exist
 *
 * @example
 * ```typescript
 * // Revoke token after successful form submission (single-use tokens)
 * revokeToken(token);
 *
 * // Or revoke all tokens on logout
 * revokeToken(currentToken);
 * ```
 */
export function revokeToken(token: string): boolean {
  if (!token) {
    return false;
  }

  const existed = tokenStore.has(token);
  tokenStore.delete(token);

  if (existed) {
    console.debug(`[CSRF] Revoked token`);
  }

  return existed;
}

/**
 * Gets the count of currently stored tokens (for debugging/monitoring)
 *
 * @returns Number of tokens currently in the store
 */
export function getTokenCount(): number {
  return tokenStore.size;
}

/**
 * Clears all tokens from the store (for testing or emergency reset)
 *
 * @warning This will invalidate all active CSRF tokens
 */
export function clearAllTokens(): void {
  const count = tokenStore.size;
  tokenStore.clear();
  console.debug(`[CSRF] Cleared all ${count} tokens from store`);
}
