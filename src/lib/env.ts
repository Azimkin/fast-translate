/**
 * Environment validation module
 *
 * Validates required environment variables at application startup.
 * Supports SKIP_ENV_VALIDATION=true to bypass validation (e.g., during build).
 */

interface EnvConfig {
  /** Ollama API endpoint - required, must be non-empty */
  ollamaApiEndpoint: string;
  /** Ollama auth token - optional, can be empty string */
  ollamaAuthToken: string | null;
}

/**
 * Check if validation should be skipped (e.g., during Docker build)
 * Set SKIP_ENV_VALIDATION=true to bypass validation
 */
const skipValidation = process.env.SKIP_ENV_VALIDATION === 'true';

/**
 * Validates the OLLAMA_API_ENDPOINT environment variable
 * Returns default value if SKIP_ENV_VALIDATION=true
 */
function validateOllamaApiEndpoint(): string {
  const endpoint = process.env.OLLAMA_API_ENDPOINT;

  if (!endpoint || endpoint.trim() === '') {
    if (skipValidation) {
      return 'http://localhost:11434'; // Default for build time
    }
    throw new Error(
      'Environment validation failed: OLLAMA_API_ENDPOINT is required but not set. ' +
      'Please set OLLAMA_API_ENDPOINT in your .env file or environment variables.'
    );
  }

  return endpoint.trim();
}

/**
 * Validates the OLLAMA_AUTH_TOKEN environment variable if provided
 * Returns null silently if SKIP_ENV_VALIDATION=true
 */
function validateOllamaAuthToken(): string | null {
  const token = process.env.OLLAMA_AUTH_TOKEN;

  // Token is optional - return null if not set
  if (!token) {
    return null;
  }

  const trimmedToken = token.trim();

  // If token is provided but empty/whitespace
  if (trimmedToken === '') {
    if (skipValidation) {
      return null; // Skip validation during build
    }
    throw new Error(
      'Environment validation failed: OLLAMA_AUTH_TOKEN is set but empty. ' +
      'Please either provide a valid token or remove the variable from your .env file.'
    );
  }

  return trimmedToken;
}

/**
 * Validates all environment variables and returns typed config
 * @throws {Error} If any required environment variable is missing or invalid
 */
export function validateEnv(): EnvConfig {
  const ollamaApiEndpoint = validateOllamaApiEndpoint();
  const ollamaAuthToken = validateOllamaAuthToken();

  return {
    ollamaApiEndpoint,
    ollamaAuthToken
  };
}

/**
 * Validated environment configuration
 * This is initialized at module load time and will throw if validation fails
 */
export const env = validateEnv();

/**
 * Log environment configuration at startup (for debugging)
 * AUTH_TOKEN is masked for security
 */
console.log('[env] Configuration loaded:');
console.log('[env]   OLLAMA_API_ENDPOINT:', env.ollamaApiEndpoint);
console.log('[env]   OLLAMA_AUTH_TOKEN:', env.ollamaAuthToken ? '***' + env.ollamaAuthToken.slice(-4) : '(not set)');
console.log('[env]   SKIP_ENV_VALIDATION:', skipValidation ? 'true' : 'false');
