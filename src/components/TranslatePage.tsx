/**
 * TranslatePage Component
 *
 * Main translation page component that integrates all UI components.
 * Features:
 * - Mobile-first responsive layout
 * - Form state management with useState
 * - CSRF token fetching and handling
 * - Form submission to /api/translate
 * - Loading states during translation
 * - Error handling and display
 * - Success/error notifications
 * - Theme toggle integration
 * - Accessible form with proper labels and error messages
 */

import type { JSX } from "preact";
import { useState, useEffect, useCallback, useRef } from "preact/hooks";
import { useTheme } from "../hooks/useTheme";
import { ThemeToggle } from "./ThemeToggle";
import { ModelSelector } from "./ModelSelector";
import { LanguageSelector } from "./LanguageSelector";
import { TextArea } from "./TextArea";
import { TranslationResult } from "./TranslationResult";
import { NotificationContainer } from "./NotificationContainer";
import { showSuccess, showError } from "../lib/notification-store";
import { getLanguages } from "../lib/languages";
import type { Language } from "../types/language";
import type {
  TranslateSuccessResponse,
  TranslateErrorResponse,
} from "../types/translate";

/**
 * Form state interface
 */
interface TranslateFormState {
  /** Selected model name */
  model: string;
  /** Source language code */
  sourceLang: string;
  /** Target language code */
  targetLang: string;
  /** Source text to translate */
  sourceText: string;
}

/**
 * Form validation errors interface
 */
interface FormErrors {
  /** Model selection error */
  model?: string;
  /** Source language error */
  sourceLang?: string;
  /** Target language error */
  targetLang?: string;
  /** Source text error */
  sourceText?: string;
}

/**
 * Translation result data
 */
interface TranslationResultData {
  /** Translated text */
  translatedText: string;
  /** Model used for translation */
  model: string;
  /** Source language */
  sourceLang: string;
  /** Target language */
  targetLang: string;
}

/**
 * TranslatePage Component
 */
export function TranslatePage() {
  const { theme } = useTheme();

  // State: Languages
  const [languages, setLanguages] = useState<Language[]>([]);
  const [isLoadingLanguages, setIsLoadingLanguages] = useState(true);

  // State: Form
  const [formState, setFormState] = useState<TranslateFormState>({
    model: "translategemma:latest",
    sourceLang: "en",
    targetLang: "es",
    sourceText: "",
  });

  // State: UI
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [isLoadingCsrf, setIsLoadingCsrf] = useState(true);
  const [translationResult, setTranslationResult] =
    useState<TranslationResultData | null>(null);

  // Refs
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  // Computed: Form is ready (both languages and CSRF loaded)
  const isFormReady =
    !isLoadingLanguages && !isLoadingCsrf && csrfToken !== null;

  // Fetch languages on mount
  useEffect(() => {
    async function loadLanguages() {
      try {
        setIsLoadingLanguages(true);
        const langs = await getLanguages();
        setLanguages(langs);

        // Set default languages if available
        if (langs.length > 0) {
          const defaultSource = langs.find((l) => l.code === "en") || langs[0];
          const defaultTarget =
            langs.find((l) => l.code === "es") ||
            langs.find((l) => l.code !== defaultSource.code) ||
            langs[1] ||
            langs[0];

          setFormState((prev) => ({
            ...prev,
            sourceLang: defaultSource.code,
            targetLang: defaultTarget.code,
          }));
        }
      } catch (error) {
        console.error("Failed to load languages:", error);
        showError("Failed to load languages", "Using default language list");
      } finally {
        setIsLoadingLanguages(false);
      }
    }

    loadLanguages();
  }, []);

  // Fetch CSRF token on mount
  useEffect(() => {
    async function fetchCsrfToken() {
      try {
        console.log("[TranslatePage] Fetching CSRF token...");
        const response = await fetch("/api/csrf-token", {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch CSRF token: ${response.status}`);
        }

        const data = await response.json();
        setCsrfToken(data.token);
        console.log("[TranslatePage] CSRF token loaded successfully");
      } catch (error) {
        console.error("Failed to fetch CSRF token:", error);
        showError("Failed to initialize form", "Please refresh the page");
        // Set to false to indicate loading failed
        setIsLoadingCsrf(false);
      } finally {
        setIsLoadingCsrf(false);
      }
    }

    fetchCsrfToken();
  }, []);

  /**
   * Get language name by code
   */
  const getLanguageName = useCallback(
    (code: string): string => {
      const lang = languages.find((l) => l.code === code);
      return lang ? lang.name : code;
    },
    [languages],
  );

  /**
   * Validate form fields
   */
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    // Validate model
    if (!formState.model || formState.model.trim() === "") {
      newErrors.model = "Model name is required";
    }

    // Validate source language
    if (!formState.sourceLang) {
      newErrors.sourceLang = "Source language is required";
    }

    // Validate target language
    if (!formState.targetLang) {
      newErrors.targetLang = "Target language is required";
    }

    // Validate source and target are different
    if (formState.sourceLang === formState.targetLang) {
      newErrors.targetLang = "Target language must be different from source";
    }

    // Validate source text
    if (!formState.sourceText || formState.sourceText.trim() === "") {
      newErrors.sourceText = "Please enter text to translate";
    } else if (formState.sourceText.length > 10000) {
      newErrors.sourceText = "Text exceeds maximum length of 10,000 characters";
    } else if (formState.sourceText.trim().length < 1) {
      newErrors.sourceText = "Please enter at least one character";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formState]);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    async (e: Event) => {
      e.preventDefault();

      // Debug logging
      console.log("[TranslatePage] handleSubmit called");
      console.log("[TranslatePage] Form state:", formState);
      console.log(
        "[TranslatePage] CSRF token:",
        csrfToken ? "Present" : "Missing",
      );
      console.log("[TranslatePage] isFormReady:", isFormReady);
      console.log("[TranslatePage] isSubmitting:", isSubmitting);

      // Check if form is ready (CSRF + languages loaded)
      if (!isFormReady) {
        console.warn("[TranslatePage] Form not ready, blocking submission");
        showError(
          "Form not ready",
          "Please wait for the form to initialize...",
        );
        return;
      }

      // Validate form
      console.log("[TranslatePage] Validating form...");
      if (!validateForm()) {
        console.warn("[TranslatePage] Form validation failed", errors);
        showError(
          "Please fix the form errors",
          "Some fields need your attention",
        );
        return;
      }

      // Check CSRF token (double-check)
      if (!csrfToken) {
        console.error("[TranslatePage] CSRF token is null at submission time");
        showError("Form not ready", "Please wait for the form to initialize");
        return;
      }

      console.log("[TranslatePage] Form validation passed, submitting...");
      setIsSubmitting(true);
      setTranslationResult(null);
      setErrors({});

      try {
        // Prepare request body
        const requestBody = {
          modelName: formState.model.trim(),
          sourceText: formState.sourceText.trim(),
          sourceLang: getLanguageName(formState.sourceLang),
          targetLang: getLanguageName(formState.targetLang),
          csrfToken: csrfToken,
        };

        console.log("[TranslatePage] Sending translation request:", {
          ...requestBody,
          csrfToken: "[REDACTED]",
        });

        // Submit translation request
        const response = await fetch("/api/translate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        console.log(
          "[TranslatePage] Translation response status:",
          response.status,
        );

        const data = (await response.json()) as
          | TranslateSuccessResponse
          | TranslateErrorResponse;

        if (!response.ok || !data.success) {
          // Handle error response
          const errorMessage =
            "message" in data ? data.message : "Translation failed";
          const errorCode = "error" in data ? data.error : "UNKNOWN_ERROR";

          console.error(
            "[TranslatePage] Translation error:",
            errorCode,
            errorMessage,
          );
          showError("Translation failed", errorMessage);

          // Handle CSRF token expiration
          if (errorCode === "CSRF_INVALID" || errorCode === "CSRF_MISSING") {
            // Try to fetch a new CSRF token
            try {
              const tokenResponse = await fetch("/api/csrf-token", {
                method: "GET",
                headers: {
                  Accept: "application/json",
                },
              });

              if (tokenResponse.ok) {
                const tokenData = await tokenResponse.json();
                setCsrfToken(tokenData.token);
                console.log("[TranslatePage] CSRF token refreshed");
                showError("Session expired", "Please try submitting again");
              }
            } catch (tokenError) {
              console.error(
                "[TranslatePage] Failed to refresh CSRF token:",
                tokenError,
              );
            }
          }

          return;
        }

        // Handle success
        const successData = data as TranslateSuccessResponse;
        console.log(
          "[TranslatePage] Translation successful:",
          successData.data,
        );
        setTranslationResult({
          translatedText: successData.data.translatedText,
          model: successData.data.model,
          sourceLang: successData.data.sourceLang,
          targetLang: successData.data.targetLang,
        });

        showSuccess(
          "Translation complete",
          "Your text has been translated successfully",
        );
      } catch (error) {
        // Handle network errors
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        console.error("[TranslatePage] Translation request failed:", error);
        showError(
          "Network error",
          "Failed to connect to the translation service",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [formState, csrfToken, validateForm, getLanguageName, isFormReady],
  );

  /**
   * Handle clearing the form
   */
  const handleClear = useCallback(() => {
    setFormState((prev) => ({
      ...prev,
      sourceText: "",
    }));
    setTranslationResult(null);
    setErrors({});
  }, []);

  /**
   * Handle swapping source and target languages
   */
  const handleSwapLanguages = useCallback(() => {
    setFormState((prev) => ({
      ...prev,
      sourceLang: prev.targetLang,
      targetLang: prev.sourceLang,
    }));
    // Also swap the translation result if it exists
    setTranslationResult((prev) =>
      prev
        ? {
            ...prev,
            sourceLang: prev.targetLang,
            targetLang: prev.sourceLang,
          }
        : null,
    );
  }, []);

  // Styles
  const pageContainerStyles: JSX.CSSProperties = {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "var(--bg-primary)",
    transition: "background-color 250ms cubic-bezier(0.4, 0, 0.2, 1)",
  };

  const headerStyles: JSX.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem",
    borderBottom: "1px solid var(--border-primary)",
    backgroundColor: "var(--bg-primary)",
    position: "sticky",
    top: 0,
    zIndex: 50,
  };

  const logoStyles: JSX.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  };

  const logoTextStyles: JSX.CSSProperties = {
    fontSize: "1.25rem",
    fontWeight: 700,
    color: "var(--text-primary)",
  };

  const mainStyles: JSX.CSSProperties = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    padding: "1.5rem 1rem",
    maxWidth: "800px",
    width: "100%",
    margin: "0 auto",
  };

  const titleStyles: JSX.CSSProperties = {
    fontSize: "1.75rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    marginBottom: "0.25rem",
    textAlign: "center",
  };

  const subtitleStyles: JSX.CSSProperties = {
    fontSize: "0.875rem",
    color: "var(--text-secondary)",
    marginBottom: "1.5rem",
    textAlign: "center",
  };

  const formStyles: JSX.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
    width: "100%",
  };

  const languageRowStyles: JSX.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  };

  const swapButtonStyles: JSX.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "40px",
    padding: 0,
    backgroundColor: "var(--bg-secondary)",
    border: "1px solid var(--border-primary)",
    borderRadius: "50%",
    color: "var(--text-secondary)",
    cursor: "pointer",
    transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
    alignSelf: "center",
    margin: "-0.5rem 0",
  };

  const buttonGroupStyles: JSX.CSSProperties = {
    display: "flex",
    gap: "0.75rem",
    marginTop: "0.5rem",
  };

  const submitButtonStyles: JSX.CSSProperties = {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    padding: "0.875rem 1.5rem",
    fontSize: "0.9375rem",
    fontWeight: 600,
    color: "var(--text-inverse)",
    backgroundColor:
      isSubmitting || !isFormReady
        ? "var(--accent-active)"
        : "var(--accent-primary)",
    border: "none",
    borderRadius: "0.5rem",
    cursor: isSubmitting || !isFormReady ? "not-allowed" : "pointer",
    transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
    opacity: isSubmitting || !isFormReady ? 0.7 : 1,
  };

  const clearButtonStyles: JSX.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    padding: "0.875rem 1.5rem",
    fontSize: "0.9375rem",
    fontWeight: 500,
    color: "var(--text-secondary)",
    backgroundColor: "var(--bg-secondary)",
    border: "1px solid var(--border-primary)",
    borderRadius: "0.5rem",
    cursor: "pointer",
    transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
  };

  const spinnerStyles: JSX.CSSProperties = {
    width: "20px",
    height: "20px",
    border: "2px solid rgba(255, 255, 255, 0.3)",
    borderTopColor: "white",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  };

  // Get source and target language names for display
  const sourceLangName = getLanguageName(formState.sourceLang);
  const targetLangName = getLanguageName(formState.targetLang);

  return (
    <div style={pageContainerStyles}>
      {/* Notifications */}
      <NotificationContainer position="top-right" maxNotifications={3} />

      {/* Header */}
      <header style={headerStyles}>
        <div style={logoStyles}>
          <span style={logoTextStyles}>Fast Translate</span>
        </div>
        <ThemeToggle size="md" variant="button" />
      </header>

      {/* Main content */}
      <main style={mainStyles}>
        {/* Page title */}
        <h1 style={titleStyles}>Translate Text</h1>
        <p style={subtitleStyles}>
          Fast and accurate translations powered by AI
        </p>

        {/* Translation form */}
        <form style={formStyles} onSubmit={handleSubmit} noValidate>
          {/* Model selector */}
          <ModelSelector
            value={formState.model}
            onChange={(value) =>
              setFormState((prev) => ({ ...prev, model: value }))
            }
            label="Model"
            placeholder="Enter model name (e.g., translategemma:latest)"
            suggestions={["translategemma:latest", "llama3.2", "mistral-small3.2:latest", "qwen3.5:4b"]}
            error={errors.model}
            disabled={isSubmitting || !isFormReady}
          />

          {/* Language selectors */}
          <div style={languageRowStyles}>
            <LanguageSelector
              value={formState.sourceLang}
              onChange={(value) =>
                setFormState((prev) => ({ ...prev, sourceLang: value }))
              }
              label="From"
              languages={languages}
              error={errors.sourceLang}
              disabled={isSubmitting || !isFormReady}
              placeholder="Select source language"
            />

            {/* Swap languages button */}
            <button
              type="button"
              onClick={handleSwapLanguages}
              disabled={isSubmitting || !isFormReady}
              style={swapButtonStyles}
              aria-label="Swap source and target languages"
              title="Swap languages"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--hover-bg)";
                e.currentTarget.style.color = "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                width="20"
                height="20"
                aria-hidden="true"
              >
                <path d="M7 16V4M7 4L3 8M7 4L11 8M17 8V20M17 20L21 16M17 20L13 16" />
              </svg>
            </button>

            <LanguageSelector
              value={formState.targetLang}
              onChange={(value) =>
                setFormState((prev) => ({ ...prev, targetLang: value }))
              }
              label="To"
              languages={languages}
              error={errors.targetLang}
              disabled={isSubmitting || !isFormReady}
              placeholder="Select target language"
            />
          </div>

          {/* Source text input */}
          <TextArea
            value={formState.sourceText}
            onChange={(value) => {
              setFormState((prev) => ({ ...prev, sourceText: value }));
              // Clear error when user starts typing
              if (errors.sourceText) {
                setErrors((prev) => ({ ...prev, sourceText: undefined }));
              }
            }}
            label="Source Text"
            placeholder="Enter text to translate..."
            error={errors.sourceText}
            disabled={isSubmitting || !isFormReady}
            maxLength={10000}
            rows={6}
            required
          />

          {/* Action buttons */}
          <div style={buttonGroupStyles}>
            <button
              type="button"
              onClick={handleClear}
              disabled={isSubmitting || !formState.sourceText}
              style={clearButtonStyles}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--hover-bg)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                width="18"
                height="18"
                aria-hidden="true"
              >
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
              Clear
            </button>

            <button
              ref={submitButtonRef}
              type="submit"
              disabled={isSubmitting || !isFormReady}
              aria-disabled={isSubmitting || !isFormReady}
              style={submitButtonStyles}
              onMouseEnter={(e) => {
                if (!isSubmitting && isFormReady) {
                  e.currentTarget.style.backgroundColor = "var(--accent-hover)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting && isFormReady) {
                  e.currentTarget.style.backgroundColor =
                    "var(--accent-primary)";
                }
              }}
            >
              {isSubmitting || !isFormReady ? (
                <>
                  <div style={spinnerStyles} aria-hidden="true" />
                  {!isFormReady ? "Initializing..." : "Translating..."}
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    width="18"
                    height="18"
                    aria-hidden="true"
                  >
                    <path d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  Translate
                </>
              )}
            </button>
          </div>
        </form>

        {/* Translation result */}
        <TranslationResult
          translatedText={translationResult?.translatedText}
          isLoading={isSubmitting}
          sourceLang={translationResult?.sourceLang}
          targetLang={translationResult?.targetLang}
          model={translationResult?.model}
          showMetadata
          emptyPlaceholder="Translation will appear here"
        />
      </main>

      {/* Global CSS for spinner animation */}
      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* Mobile-first responsive adjustments */
        @media (max-width: 640px) {
          main {
            padding: 1rem 0.75rem;
          }

          h1 {
            font-size: 1.5rem;
          }

          .button-group {
            flex-direction: column;
          }

          .button-group button {
            width: 100%;
          }
        }

        /* Desktop adjustments */
        @media (min-width: 641px) {
          .language-row {
            flex-direction: row;
            align-items: flex-end;
          }

          .language-row > :first-child {
            flex: 1;
          }

          .language-row > :last-child {
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
}

export default TranslatePage;
