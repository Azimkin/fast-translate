/**
 * Ollama Client
 *
 * Client library for interacting with the Ollama API for text generation
 * and translation tasks. Supports both streaming and non-streaming responses.
 *
 * @see https://github.com/ollama/ollama/blob/main/docs/api.md
 */

import { env } from './env';
import type {
  OllamaClientConfig,
  OllamaGenerateRequest,
  OllamaGenerateResponse,
  OllamaStreamResponse,
  TranslationRequest,
  TranslationResponse
} from '../types/ollama';

/**
 * Default request timeout in milliseconds (60 seconds)
 */
const DEFAULT_TIMEOUT_MS = 60000;

/**
 * Default model for translations if not specified
 */
const DEFAULT_MODEL = 'llama2';

/**
 * Creates the Ollama client configuration from environment variables
 * @returns OllamaClientConfig with endpoint and optional auth token
 */
function createClientConfig(): OllamaClientConfig {
  return {
    endpoint: env.ollamaApiEndpoint,
    authToken: env.ollamaAuthToken,
    timeout: DEFAULT_TIMEOUT_MS
  };
}

/**
 * Builds the request headers for Ollama API calls
 * Includes Bearer token authentication when configured
 * @param config - Client configuration
 * @returns Headers object for fetch requests
 */
function buildHeaders(config: OllamaClientConfig): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  // Add Bearer token authentication if configured
  if (config.authToken) {
    headers['Authorization'] = `Bearer ${config.authToken}`;
  }

  return headers;
}

/**
 * Builds a translation prompt for the Ollama model
 * @param sourceText - Text to translate
 * @param sourceLang - Source language code or name
 * @param targetLang - Target language code or name
 * @returns Formatted translation prompt
 */
export function buildTranslationPrompt(
  sourceText: string,
  sourceLang: string,
  targetLang: string
): string {
  return `You are a professional translator. Translate the following text from ${sourceLang} to ${targetLang}.
Only provide the translation, no explanations.

Text: ${sourceText}

Translation:`;
}

/**
 * Creates an AbortSignal with timeout for fetch requests
 * @param timeoutMs - Timeout in milliseconds
 * @returns AbortSignal that will abort after the specified timeout
 */
function createTimeoutSignal(timeoutMs: number): AbortSignal {
  return AbortSignal.timeout(timeoutMs);
}

/**
 * Constructs a descriptive error message from Ollama API errors
 * @param error - The error object or message
 * @param context - Additional context about what operation failed
 * @returns Formatted error message
 */
function buildErrorMessage(error: unknown, context: string): string {
  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      return `${context}: Request timed out after ${DEFAULT_TIMEOUT_MS}ms`;
    }
    return `${context}: ${error.message}`;
  }

  if (typeof error === 'string') {
    return `${context}: ${error}`;
  }

  return `${context}: An unknown error occurred`;
}

/**
 * Makes a POST request to the Ollama API
 * @param endpoint - Ollama API endpoint
 * @param request - Request body
 * @param config - Client configuration
 * @returns Promise resolving to the API response
 * @throws Error if the request fails
 */
async function postToOllama(
  endpoint: string,
  request: OllamaGenerateRequest,
  config: OllamaClientConfig
): Promise<OllamaGenerateResponse> {
  const url = `${endpoint}/api/generate`;
  const headers = buildHeaders(config);

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
    signal: createTimeoutSignal(config.timeout)
  });

  if (!response.ok) {
    let errorDetails = '';
    try {
      const errorData = await response.json();
      errorDetails = errorData.error || response.statusText;
    } catch {
      errorDetails = response.statusText;
    }
    throw new Error(
      `Ollama API request failed with status ${response.status}: ${errorDetails}`
    );
  }

  const data = await response.json() as OllamaGenerateResponse;
  return data;
}

/**
 * Makes a streaming POST request to the Ollama API
 * Returns an async generator that yields response chunks
 * @param endpoint - Ollama API endpoint
 * @param request - Request body with stream: true
 * @param config - Client configuration
 * @returns AsyncGenerator yielding stream response chunks
 * @throws Error if the request fails
 */
async function* streamFromOllama(
  endpoint: string,
  request: OllamaGenerateRequest,
  config: OllamaClientConfig
): AsyncGenerator<OllamaStreamResponse> {
  const url = `${endpoint}/api/generate`;
  const headers = buildHeaders(config);

  // Enable streaming
  const streamRequest: OllamaGenerateRequest = {
    ...request,
    stream: true
  };

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(streamRequest),
    signal: createTimeoutSignal(config.timeout)
  });

  if (!response.ok) {
    let errorDetails = '';
    try {
      const errorData = await response.json();
      errorDetails = errorData.error || response.statusText;
    } catch {
      errorDetails = response.statusText;
    }
    throw new Error(
      `Ollama API request failed with status ${response.status}: ${errorDetails}`
    );
  }

  if (!response.body) {
    throw new Error('Ollama API returned no response body for streaming request');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      const chunk = decoder.decode(value, { stream: true });

      // Ollama streams newline-separated JSON
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        try {
          const data = JSON.parse(line) as OllamaStreamResponse;
          yield data;
        } catch (parseError) {
          console.warn('[OllamaClient] Failed to parse stream chunk:', parseError);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Generates text using the Ollama API
 * @param prompt - The prompt to generate text for
 * @param model - Model to use (default: 'llama2')
 * @param systemPrompt - Optional system prompt to set behavior
 * @returns Promise resolving to the generated text
 * @throws Error if generation fails
 *
 * @example
 * ```typescript
 * const text = await generate('What is the capital of France?');
 * console.log(text); // "The capital of France is Paris."
 * ```
 */
export async function generate(
  prompt: string,
  model: string = DEFAULT_MODEL,
  systemPrompt?: string
): Promise<string> {
  const config = createClientConfig();

  const request: OllamaGenerateRequest = {
    model,
    prompt,
    system: systemPrompt,
    stream: false
  };

  try {
    console.log('[OllamaClient] Generating text with model:', model);

    const response = await postToOllama(config.endpoint, request, config);

    console.log('[OllamaClient] Generation complete');

    return response.response;
  } catch (error) {
    const errorMessage = buildErrorMessage(error, 'Text generation failed');
    console.error('[OllamaClient]', errorMessage);
    throw new Error(errorMessage);
  }
}

/**
 * Translates text using the Ollama API
 * @param request - Translation request with text, source/target languages, and model
 * @returns Promise resolving to TranslationResponse with translated text
 * @throws Error if translation fails
 *
 * @example
 * ```typescript
 * const result = await translate({
 *   text: 'Hello, world!',
 *   sourceLang: 'en',
 *   targetLang: 'es',
 *   model: 'llama2'
 * });
 * console.log(result.translatedText); // "¡Hola, mundo!"
 * ```
 */
export async function translate(request: TranslationRequest): Promise<TranslationResponse> {
  const config = createClientConfig();
  const { text, sourceLang, targetLang, model = DEFAULT_MODEL, stream = false } = request;

  const translationPrompt = buildTranslationPrompt(text, sourceLang, targetLang);

  const ollamaRequest: OllamaGenerateRequest = {
    model,
    prompt: translationPrompt,
    stream: stream
  };

  try {
    console.log('[OllamaClient] Translating from', sourceLang, 'to', targetLang);

    if (stream) {
      // Handle streaming response
      let translatedText = '';
      let stats = undefined;

      for await (const chunk of streamFromOllama(config.endpoint, ollamaRequest, config)) {
        translatedText += chunk.response;

        // Capture stats from the final chunk
        if (chunk.done) {
          stats = {
            promptTokens: chunk.prompt_eval_count || 0,
            completionTokens: chunk.eval_count || 0,
            totalDurationMs: chunk.total_duration || 0
          };
        }
      }

      console.log('[OllamaClient] Streaming translation complete');

      return {
        translatedText: translatedText.trim(),
        sourceLang,
        targetLang,
        model,
        success: true,
        stats
      };
    } else {
      // Handle non-streaming response
      const response = await postToOllama(config.endpoint, ollamaRequest, config);

      console.log('[OllamaClient] Translation complete');

      const stats = response.done ? {
        promptTokens: response.prompt_eval_count || 0,
        completionTokens: response.eval_count || 0,
        totalDurationMs: response.total_duration || 0
      } : undefined;

      return {
        translatedText: response.response.trim(),
        sourceLang,
        targetLang,
        model,
        success: true,
        stats
      };
    }
  } catch (error) {
    const errorMessage = buildErrorMessage(error, 'Translation failed');
    console.error('[OllamaClient]', errorMessage);

    return {
      translatedText: '',
      sourceLang,
      targetLang,
      model,
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Tests the connection to the Ollama API
 * @param model - Model to test with (default: 'llama2')
 * @returns Promise resolving to true if connection is successful
 * @throws Error if connection fails
 *
 * @example
 * ```typescript
 * try {
 *   await testConnection();
 *   console.log('Ollama is connected!');
 * } catch (error) {
 *   console.error('Ollama connection failed:', error);
 * }
 * ```
 */
export async function testConnection(model: string = DEFAULT_MODEL): Promise<boolean> {
  const config = createClientConfig();

  try {
    console.log('[OllamaClient] Testing connection to Ollama API...');

    // Simple prompt to test connectivity
    const testRequest: OllamaGenerateRequest = {
      model,
      prompt: '.',
      stream: false
    };

    await postToOllama(config.endpoint, testRequest, config);

    console.log('[OllamaClient] Connection test successful');
    return true;
  } catch (error) {
    const errorMessage = buildErrorMessage(error, 'Ollama connection test failed');
    console.error('[OllamaClient]', errorMessage);
    throw new Error(errorMessage);
  }
}

/**
 * Checks if authentication is configured
 * @returns true if auth token is set, false otherwise
 */
export function isAuthConfigured(): boolean {
  const config = createClientConfig();
  return config.authToken !== null && config.authToken.length > 0;
}

/**
 * Gets the current Ollama API endpoint
 * @returns The configured endpoint URL
 */
export function getEndpoint(): string {
  const config = createClientConfig();
  return config.endpoint;
}
