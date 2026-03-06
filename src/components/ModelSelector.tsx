/**
 * ModelSelector Component
 *
 * A text input component for selecting the Ollama model name.
 * Features:
 * - Text input for entering model name (e.g., "llama2", "mistral")
 * - Label and placeholder
 * - Error state styling
 * - Accessible (aria-labels, keyboard navigation)
 * - Mobile-first responsive design
 * - Mint-lime green accent colors
 */

import type { JSX } from 'preact';
import type { KeyboardEvent, TargetedEvent } from 'preact/compat';
import { useTheme } from '../hooks/useTheme';

interface ModelSelectorProps {
  /** Current model name value */
  value: string;
  /** Callback when model name changes */
  onChange: (value: string) => void;
  /** Optional label text */
  label?: string;
  /** Optional placeholder text */
  placeholder?: string;
  /** Optional error message */
  error?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Optional custom class name */
  class?: string;
  /** List of suggested model names for autocomplete */
  suggestions?: string[];
  /** Additional input attributes */
  [key: string]: unknown;
}

/**
 * ModelSelector Component
 */
export function ModelSelector({
  value,
  onChange,
  label = 'Model',
  placeholder = 'Enter model name (e.g., llama2, mistral)',
  error,
  disabled = false,
  class: className = '',
  suggestions = ['llama2', 'mistral', 'codellama', 'gemma', 'phi', 'llama3'],
  ...props
}: ModelSelectorProps) {
  const { theme } = useTheme();
  const hasError = !!error;
  const showSuggestions = !hasError && !disabled;

  // Styles
  const containerStyles: JSX.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    width: '100%',
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

  const inputWrapperStyles: JSX.CSSProperties = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  };

  const inputStyles: JSX.CSSProperties = {
    width: '100%',
    padding: '0.75rem 0.875rem',
    fontSize: '0.875rem',
    lineHeight: 1.5,
    color: 'var(--text-primary)',
    backgroundColor: hasError
      ? 'rgba(239, 68, 68, 0.05)'
      : 'var(--bg-primary)',
    border: `1px solid ${hasError ? '#EF4444' : 'var(--border-primary)'}`,
    borderRadius: '0.5rem',
    transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    outline: 'none',
  };

  const errorTextStyles: JSX.CSSProperties = {
    fontSize: '0.75rem',
    color: '#EF4444',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  };

  const suggestionsContainerStyles: JSX.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.375rem',
    marginTop: '0.25rem',
  };

  const suggestionChipStyles: (model: string) => JSX.CSSProperties = (model) => ({
    padding: '0.25rem 0.625rem',
    fontSize: '0.75rem',
    fontWeight: 500,
    color: value === model ? 'var(--text-inverse)' : 'var(--text-secondary)',
    backgroundColor: value === model
      ? 'var(--accent-primary)'
      : 'var(--bg-tertiary)',
    border: `1px solid ${value === model ? 'var(--accent-primary)' : 'var(--border-primary)'}`,
    borderRadius: '9999px',
    cursor: 'pointer',
    transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    userSelect: 'none',
  });

  // Handle input change
  const handleInputChange = (e: TargetedEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    onChange(target.value);
  };

  // Handle suggestion click
  const handleSuggestionClick = (model: string) => {
    if (!disabled) {
      onChange(model);
    }
  };

  // Handle keyboard navigation for suggestions
  const handleSuggestionKeyDown = (
    e: KeyboardEvent<HTMLSpanElement>,
    model: string
  ) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSuggestionClick(model);
    }
  };

  return (
    <div style={containerStyles} className={className}>
      {/* Label */}
      <label style={labelStyles} htmlFor="model-selector-input">
        {label}
        <span style={requiredIndicatorStyles} aria-hidden="true">*</span>
      </label>

      {/* Input wrapper */}
      <div style={inputWrapperStyles}>
        <input
          id="model-selector-input"
          type="text"
          value={value}
          onInput={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          aria-label={label}
          aria-invalid={hasError}
          aria-describedby={hasError ? 'model-selector-error' : undefined}
          style={inputStyles}
          {...props}
        />
      </div>

      {/* Suggestions chips */}
      {showSuggestions && (
        <div
          style={suggestionsContainerStyles}
          role="group"
          aria-label="Model suggestions"
        >
          {suggestions.map((model) => (
            <span
              key={model}
              role="button"
              tabIndex={disabled ? -1 : 0}
              aria-pressed={value === model}
              onClick={() => handleSuggestionClick(model)}
              onKeyDown={(e) => handleSuggestionKeyDown(e, model)}
              style={suggestionChipStyles(model)}
              onMouseEnter={(e) => {
                if (!disabled && value !== model) {
                  e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                  e.currentTarget.style.borderColor = 'var(--border-secondary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!disabled && value !== model) {
                  e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                  e.currentTarget.style.borderColor = 'var(--border-primary)';
                }
              }}
            >
              {model}
            </span>
          ))}
        </div>
      )}

      {/* Error message */}
      {hasError && (
        <div
          id="model-selector-error"
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
        </div>
      )}
    </div>
  );
}

export default ModelSelector;
