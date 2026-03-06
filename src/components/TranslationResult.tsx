/**
 * TranslationResult Component
 *
 * A display component for showing translated text results.
 * Features:
 * - Display area for translated text
 * - Copy-to-clipboard button with success feedback
 * - Loading state (skeleton loader)
 * - Empty state (show before translation)
 * - Error state display
 * - Accessible (ARIA labels, keyboard navigation)
 * - Mobile-first responsive design
 * - Mint-lime green accent colors
 */

import type { JSX } from 'preact';
import type { KeyboardEvent } from 'preact/compat';
import { useState, useRef, useEffect } from 'preact/hooks';
import { useTheme } from '../hooks/useTheme';

interface TranslationResultProps {
  /** Translated text content */
  translatedText?: string;
  /** Whether translation is in progress */
  isLoading?: boolean;
  /** Error message if translation failed */
  error?: string;
  /** Source language name */
  sourceLang?: string;
  /** Target language name */
  targetLang?: string;
  /** Model used for translation */
  model?: string;
  /** Optional custom class name */
  class?: string;
  /** Whether to show metadata (languages, model) */
  showMetadata?: boolean;
  /** Placeholder text for empty state */
  emptyPlaceholder?: string;
}

/**
 * TranslationResult Component
 */
export function TranslationResult({
  translatedText = '',
  isLoading = false,
  error,
  sourceLang,
  targetLang,
  model,
  class: className = '',
  showMetadata = true,
  emptyPlaceholder = 'Translation will appear here',
}: TranslationResultProps) {
  const { theme } = useTheme();
  const [copySuccess, setCopySuccess] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const copyTimeoutRef = useRef<number | null>(null);

  const hasContent = !!translatedText && !isLoading && !error;
  const hasError = !!error;
  const isEmpty = !translatedText && !isLoading && !error;

  // Styles
  const containerStyles: JSX.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    width: '100%',
    padding: '1rem',
    backgroundColor: 'var(--bg-elevated)',
    border: `1px solid ${hasError ? '#EF4444' : 'var(--border-primary)'}`,
    borderRadius: '0.75rem',
    minHeight: '200px',
    transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  };

  const headerStyles: JSX.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
    paddingBottom: '0.75rem',
    borderBottom: `1px solid var(--border-primary)`,
  };

  const titleStyles: JSX.CSSProperties = {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  };

  const metadataStyles: JSX.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.75rem',
    color: 'var(--text-tertiary)',
  };

  const metadataItemStyles: JSX.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  };

  const copyButtonStyles: JSX.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.375rem',
    padding: '0.5rem 0.75rem',
    fontSize: '0.75rem',
    fontWeight: 500,
    color: copySuccess ? 'var(--accent-primary)' : 'var(--text-secondary)',
    backgroundColor: copySuccess
      ? 'var(--accent-muted)'
      : 'var(--bg-tertiary)',
    border: `1px solid ${copySuccess ? 'var(--accent-primary)' : 'var(--border-primary)'}`,
    borderRadius: '0.375rem',
    cursor: hasContent && !isCopying ? 'pointer' : 'not-allowed',
    transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: hasContent ? 1 : 0.5,
  };

  const contentStyles: JSX.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  };

  const textStyles: JSX.CSSProperties = {
    fontSize: '0.875rem',
    lineHeight: 1.7,
    color: 'var(--text-primary)',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  };

  const emptyStateStyles: JSX.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    py: '2rem',
    color: 'var(--text-tertiary)',
    textAlign: 'center',
  };

  const emptyIconStyles: JSX.CSSProperties = {
    width: '48px',
    height: '48px',
    marginBottom: '0.75rem',
    opacity: 0.5,
  };

  const emptyTextStyles: JSX.CSSProperties = {
    fontSize: '0.875rem',
  };

  const errorStateStyles: JSX.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    padding: '2rem',
    color: '#EF4444',
    textAlign: 'center',
    gap: '0.75rem',
  };

  const errorIconStyles: JSX.CSSProperties = {
    width: '48px',
    height: '48px',
  };

  const errorTextStyles: JSX.CSSProperties = {
    fontSize: '0.875rem',
    fontWeight: 500,
  };

  const errorSubtextStyles: JSX.CSSProperties = {
    fontSize: '0.75rem',
    color: 'var(--text-tertiary)',
  };

  // Skeleton loader styles
  const skeletonStyles: JSX.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    flex: 1,
  };

  const skeletonLineStyles: (width: string) => JSX.CSSProperties = (width) => ({
    height: '1rem',
    width: width,
    backgroundColor: 'var(--bg-tertiary)',
    borderRadius: '0.25rem',
    animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  });

  // Handle copy to clipboard
  const handleCopy = async () => {
    if (!translatedText || isCopying) return;

    setIsCopying(true);

    try {
      await navigator.clipboard.writeText(translatedText);
      setCopySuccess(true);

      // Reset success state after 2 seconds
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = window.setTimeout(() => {
        setCopySuccess(false);
        setIsCopying(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
      setIsCopying(false);
    }
  };

  // Handle keyboard interaction for copy button
  const handleCopyKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCopy();
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div style={containerStyles} className={className}>
      {/* Header with title and copy button */}
      <div style={headerStyles}>
        <div style={titleStyles}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            width="18"
            height="18"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M7 2a2 2 0 10-4 0v2a1 1 0 001 1h2a1 1 0 100-2H4V2zm4 2a2 2 0 10-4 0v2a1 1 0 001 1h2a1 1 0 100-2h-2V4zm6 2a2 2 0 10-4 0v2a1 1 0 001 1h2a1 1 0 100-2h-2V6zm-4 4a2 2 0 10-4 0v2a1 1 0 001 1h2a1 1 0 100-2h-2v-2zm6 0a2 2 0 10-4 0v2a1 1 0 001 1h2a1 1 0 100-2h-2v-2z"
              clipRule="evenodd"
            />
          </svg>
          Translation
        </div>

        {/* Copy button */}
        {hasContent && (
          <button
            type="button"
            onClick={handleCopy}
            onKeyDown={handleCopyKeyDown}
            disabled={isCopying}
            aria-label={copySuccess ? 'Copied to clipboard' : 'Copy translation to clipboard'}
            aria-pressed={copySuccess}
            style={copyButtonStyles}
          >
            {copySuccess ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  width="16"
                  height="16"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  width="16"
                  height="16"
                  aria-hidden="true"
                >
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                  <path
                    fillRule="evenodd"
                    d="M6 3a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"
                    clipRule="evenodd"
                  />
                </svg>
                Copy
              </>
            )}
          </button>
        )}
      </div>

      {/* Content area */}
      <div style={contentStyles}>
        {/* Loading state - skeleton loader */}
        {isLoading && (
          <div style={skeletonStyles} aria-label="Loading translation" role="status">
            <div style={skeletonLineStyles('90%')} />
            <div style={skeletonLineStyles('95%')} />
            <div style={skeletonLineStyles('85%')} />
            <div style={skeletonLineStyles('75%')} />
            <div style={skeletonLineStyles('60%')} />
          </div>
        )}

        {/* Error state */}
        {hasError && (
          <div style={errorStateStyles} role="alert" aria-live="assertive">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              style={errorIconStyles}
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span style={errorTextStyles}>Translation failed</span>
            <span style={errorSubtextStyles}>{error}</span>
          </div>
        )}

        {/* Empty state */}
        {isEmpty && (
          <div style={emptyStateStyles} aria-label="No translation yet">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              style={emptyIconStyles}
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span style={emptyTextStyles}>{emptyPlaceholder}</span>
          </div>
        )}

        {/* Success state - translated text */}
        {hasContent && (
          <div style={textStyles} lang={targetLang?.split('-')[0]}>
            {translatedText}
          </div>
        )}
      </div>

      {/* Metadata footer */}
      {showMetadata && hasContent && (
        <div style={metadataStyles} aria-label="Translation metadata">
          {sourceLang && targetLang && (
            <span style={metadataItemStyles}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                width="14"
                height="14"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {sourceLang} → {targetLang}
            </span>
          )}
          {model && (
            <span style={metadataItemStyles}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                width="14"
                height="14"
                aria-hidden="true"
              >
                <path d="M10.393 2.132a1 1 0 011.214 0l5.25 3.5a1 1 0 01.443.832v7.071a1 1 0 01-.443.832l-5.25 3.5a1 1 0 01-1.214 0l-5.25-3.5a1 1 0 01-.443-.832V6.464a1 1 0 01.443-.832l5.25-3.5z" />
              </svg>
              {model}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default TranslationResult;
