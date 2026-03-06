/**
 * Ollama API Types
 *
 * Type definitions for Ollama API requests and responses.
 * @see https://github.com/ollama/ollama/blob/main/docs/api.md
 */

/**
 * Request body for Ollama generate API endpoint
 */
export interface OllamaGenerateRequest {
  /** Model name to use for generation (e.g., 'llama2', 'mistral') */
  model: string;
  /** Prompt to generate response for */
  prompt: string;
  /** System prompt to set behavior */
  system?: string;
  /** Options for the generation */
  options?: OllamaOptions;
  /** Whether to stream the response (default: false) */
  stream?: boolean;
  /** Additional context for multi-turn conversations */
  context?: number[];
}

/**
 * Ollama generation options
 */
export interface OllamaOptions {
  /** Temperature for sampling (default: 0.8) */
  temperature?: number;
  /** Maximum number of tokens to generate (default: 2048) */
  num_predict?: number;
  /** Top K sampling (default: 40) */
  top_k?: number;
  /** Top P sampling (default: 0.9) */
  top_p?: number;
  /** Random seed for reproducibility */
  seed?: number;
  /** Stop sequences to halt generation */
  stop?: string[];
}

/**
 * Response from Ollama generate API endpoint
 */
export interface OllamaGenerateResponse {
  /** Generated text response */
  response: string;
  /** Model used for generation */
  model: string;
  /** Timestamp of when the response was generated */
  created_at: string;
  /** Whether the response is complete */
  done: boolean;
  /** Token usage statistics (only present when done: true) */
  eval_count?: number;
  /** Time spent evaluating tokens (only present when done: true) */
  eval_duration?: number;
  /** Time spent loading the model (only present when done: true) */
  load_duration?: number;
  /** Number of tokens in the prompt (only present when done: true) */
  prompt_eval_count?: number;
  /** Time spent evaluating the prompt (only present when done: true) */
  prompt_eval_duration?: number;
  /** Total time spent generating the response (only present when done: true) */
  total_duration?: number;
  /** Context tokens for multi-turn conversations (only present when done: true) */
  context?: number[];
}

/**
 * Streaming response chunk from Ollama API
 * Same structure as OllamaGenerateResponse but streamed in chunks
 */
export type OllamaStreamResponse = OllamaGenerateResponse;

/**
 * Internal translation request type
 */
export interface TranslationRequest {
  /** Source text to translate */
  text: string;
  /** Source language code (e.g., 'en', 'es') */
  sourceLang: string;
  /** Target language code (e.g., 'en', 'es') */
  targetLang: string;
  /** Model to use for translation */
  model: string;
  /** Whether to stream the response */
  stream?: boolean;
}

/**
 * Translation result type
 */
export interface TranslationResponse {
  /** Translated text */
  translatedText: string;
  /** Source language code */
  sourceLang: string;
  /** Target language code */
  targetLang: string;
  /** Model used for translation */
  model: string;
  /** Whether the translation was successful */
  success: boolean;
  /** Error message if translation failed */
  error?: string;
  /** Token usage statistics */
  stats?: {
    /** Number of tokens in the source text */
    promptTokens: number;
    /** Number of tokens in the translated text */
    completionTokens: number;
    /** Total time spent in milliseconds */
    totalDurationMs: number;
  };
}

/**
 * Error response from Ollama API
 */
export interface OllamaErrorResponse {
  /** Error message */
  error: string;
}

/**
 * Ollama client configuration
 */
export interface OllamaClientConfig {
  /** API endpoint URL */
  endpoint: string;
  /** Optional authentication token */
  authToken: string | null;
  /** Request timeout in milliseconds (default: 60000) */
  timeout: number;
}
