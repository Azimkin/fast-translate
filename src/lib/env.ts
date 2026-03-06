/**
 * Environment validation module
 * 
 * Validates required environment variables at application startup.
 * Throws errors if validation fails to prevent the app from running
 * with invalid configuration.
 */

interface EnvConfig {
  /** Ollama API endpoint - required, must be non-empty */
  ollamaApiEndpoint: string;
  /** Ollama auth token - optional, can be empty string */
  ollamaAuthToken: string | null;
}

/**
 * Validates the OLLAMA_API_ENDPOINT environment variable
 * @throws {Error} If OLLAMA_API_ENDPOINT is not set or is empty
 */
function validateOllamaApiEndpoint(): string {
  const endpoint = process.env.OLLAMA_API_ENDPOINT;

  if (!endpoint || endpoint.trim() === '') {
    throw new Error(
      'Environment validation failed: OLLAMA_API_ENDPOINT is required but not set. ' +
      'Please set OLLAMA_API_ENDPOINT in your .env file or environment variables.'
    );
  }

  return endpoint.trim();
}

/**
 * Validates the OLLAMA_AUTH_TOKEN environment variable if provided
 * @returns The token if set, null if not provided
 * @throws {Error} If OLLAMA_AUTH_TOKEN is set but empty (whitespace only)
 */
function validateOllamaAuthToken(): string | null {
  const token = process.env.OLLAMA_AUTH_TOKEN;

  // Token is optional - return null if not set
  if (!token) {
    return null;
  }

  const trimmedToken = token.trim();

  // If token is provided but empty/whitespace, that's a configuration error
  if (trimmedToken === '') {
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
