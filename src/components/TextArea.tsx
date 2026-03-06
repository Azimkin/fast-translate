/**
 * TextArea Component
 *
 * A large textarea component for entering source text.
 * Features:
 * - Large textarea for source text
 * - Character count display (e.g., "0 / 10000")
 * - Resize handle
 * - Placeholder text
 * - Error state styling
 * - Max length validation visual feedback
 * - Accessible (ARIA labels, keyboard navigation)
 * - Mobile-first responsive design
 * - Mint-lime green accent colors
 */

import type { JSX } from 'preact';
import type { TargetedEvent } from 'preact/compat';
import { useState, useMemo } from 'preact/hooks';
import { useTheme } from '../hooks/useTheme';

interface TextAreaProps {
  /** Current text value */
  value: string;
  /** Callback when text changes */
  onChange: (value: string) => void;
  /** Optional label text */
  label?: string;
  /** Optional placeholder text */
  placeholder?: string;
  /** Optional error message */
  error?: string;
  /** Whether the textarea is disabled */
  disabled?: boolean;
  /** Optional custom class name */
  class?: string;
  /** Maximum character count */
  maxLength?: number;
  /** Minimum character count */
  minLength?: number;
  /** Number of rows to display */
  rows?: number;
  /** Whether to show character count */
  showCharacterCount?: boolean;
  /** Whether the field is required */
  required?: boolean;
  /** Additional textarea attributes */
  [key: string]: unknown;
}

/**
 * TextArea Component
 */
export function TextArea({
  value,
  onChange,
  label = 'Source Text',
  placeholder = 'Enter text to translate...',
  error,
  disabled = false,
  class: className = '',
  maxLength = 10000,
  minLength = 1,
  rows = 6,
  showCharacterCount = true,
  required = true,
  ...props
}: TextAreaProps) {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const hasError = !!error;
  const characterCount = value.length;
  const remainingCharacters = maxLength - characterCount;
  const isOverLimit = characterCount > maxLength;
  const isUnderMinLength = characterCount > 0 && characterCount < minLength;

  // Calculate progress percentage for visual feedback
  const progressPercentage = useMemo(() => {
    return Math.min((characterCount / maxLength) * 100, 100);
  }, [characterCount, maxLength]);

  // Determine character count color
  const getCharacterCountColor = () => {
    if (isOverLimit) return '#EF4444';
    if (remainingCharacters < 100) return '#F59E0B';
    return 'var(--text-tertiary)';
  };

  // Styles
  const containerStyles: JSX.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    width: '100%',
  };

  const headerStyles: JSX.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
  };

  const labelStyles: JSX.CSSProperties = {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  };

  const requiredIndicatorStyles: JSX.CSSProperties = {
    color: 'var(--accent-primary)',
    fontWeight: 600,
  };

  const textareaWrapperStyles: JSX.CSSProperties = {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
  };

  const textareaStyles: JSX.CSSProperties = {
    width: '100%',
    padding: '0.875rem',
    fontSize: '0.875rem',
    lineHeight: 1.6,
    color: 'var(--text-primary)',
    backgroundColor: hasError
      ? 'rgba(239, 68, 68, 0.05)'
      : 'var(--bg-primary)',
    border: `1px solid ${hasError ? '#EF4444' : isFocused ? 'var(--accent-primary)' : 'var(--border-primary)'}`,
    borderRadius: '0.5rem',
    resize: 'vertical',
    minHeight: `${rows * 2.5}rem`,
    maxHeight: '400px',
    transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    outline: 'none',
    fontFamily: 'inherit',
  };

  const progressbarStyles: JSX.CSSProperties = {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '2px',
    backgroundColor: 'transparent',
    borderBottomLeftRadius: '0.5rem',
    borderBottomRightRadius: '0.5rem',
    overflow: 'hidden',
    pointerEvents: 'none',
  };

  const progressFillStyles: JSX.CSSProperties = {
    height: '100%',
    width: `${progressPercentage}%`,
    backgroundColor: isOverLimit
      ? '#EF4444'
      : remainingCharacters < 100
      ? '#F59E0B'
      : 'var(--accent-primary)',
    transition: 'width 150ms cubic-bezier(0.4, 0, 0.2, 1), background-color 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  };

  const footerStyles: JSX.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
  };

  const characterCountStyles: JSX.CSSProperties = {
    fontSize: '0.75rem',
    color: getCharacterCountColor(),
    fontWeight: 500,
    transition: 'color 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  };

  const errorTextStyles: JSX.CSSProperties = {
    fontSize: '0.75rem',
    color: '#EF4444',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  };

  const warningTextStyles: JSX.CSSProperties = {
    fontSize: '0.75rem',
    color: '#F59E0B',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  };

  // Handle text change
  const handleTextChange = (e: TargetedEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    const newValue = target.value;

    // Allow typing but visually indicate when over limit
    onChange(newValue);
  };

  // Handle focus
  const handleFocus = () => {
    setIsFocused(true);
  };

  // Handle blur
  const handleBlur = () => {
    setIsFocused(false);
  };

  return (
    <div style={containerStyles} className={className}>
      {/* Header with label */}
      <div style={headerStyles}>
        <label style={labelStyles} htmlFor="source-textarea">
          {label}
          {required && (
            <span style={requiredIndicatorStyles} aria-hidden="true">*</span>
          )}
        </label>
      </div>

      {/* Textarea wrapper */}
      <div style={textareaWrapperStyles}>
        <textarea
          id="source-textarea"
          value={value}
          onInput={handleTextChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          rows={rows}
          aria-label={label}
          aria-invalid={hasError || isOverLimit}
          aria-describedby={
            hasError
              ? 'textarea-error'
              : isOverLimit
              ? 'textarea-warning'
              : showCharacterCount
              ? 'textarea-character-count'
              : undefined
          }
          style={textareaStyles}
          {...props}
        />

        {/* Progress bar */}
        {showCharacterCount && (
          <div style={progressbarStyles} aria-hidden="true">
            <div style={progressFillStyles} />
          </div>
        )}
      </div>

      {/* Footer with character count and messages */}
      {showCharacterCount && (
        <div style={footerStyles}>
          {/* Character count */}
          <span
            id="textarea-character-count"
            style={characterCountStyles}
            aria-live="polite"
          >
            {characterCount} / {maxLength}
            {remainingCharacters > 0 && remainingCharacters <= 100 && (
              <span style={{ marginLeft: '0.25rem' }}>
                ({remainingCharacters} remaining)
              </span>
            )}
          </span>

          {/* Error message */}
          {hasError && (
            <span
              id="textarea-error"
              style={errorTextStyles}
              role="alert"
              aria-live="polite"
            >
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
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </span>
          )}

          {/* Over limit warning */}
          {!hasError && isOverLimit && (
            <span
              id="textarea-warning"
              style={errorTextStyles}
              role="alert"
              aria-live="polite"
            >
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
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {Math.abs(remainingCharacters)} characters over limit
            </span>
          )}

          {/* Under minimum length warning */}
          {!hasError && !isOverLimit && isUnderMinLength && (
            <span
              style={warningTextStyles}
              role="alert"
              aria-live="polite"
            >
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
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              Minimum {minLength} characters required
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default TextArea;
