/**
 * LanguageSelector Component
 *
 * A searchable dropdown component for selecting languages.
 * Features:
 * - Searchable dropdown for selecting languages
 * - Search/filter functionality
 * - Mobile-friendly (native select on mobile, custom dropdown on desktop)
 * - Error state styling
 * - Accessible (ARIA labels, keyboard navigation)
 * - Mobile-first responsive design
 * - Mint-lime green accent colors
 */

import type { JSX } from 'preact';
import type { KeyboardEvent, TargetedEvent } from 'preact/compat';
import { useState, useMemo, useEffect, useRef } from 'preact/hooks';
import { useTheme } from '../hooks/useTheme';
import type { Language } from '../types/language';

interface LanguageSelectorProps {
  /** Current selected language code */
  value: string;
  /** Callback when language selection changes */
  onChange: (languageCode: string) => void;
  /** Label text for the dropdown */
  label: string;
  /** Array of available languages */
  languages: Language[];
  /** Optional error message */
  error?: string;
  /** Whether the dropdown is disabled */
  disabled?: boolean;
  /** Optional custom class name */
  class?: string;
  /** Placeholder text when no language is selected */
  placeholder?: string;
  /** Whether to show search input (default: true for >10 languages) */
  searchable?: boolean;
}

/**
 * LanguageSelector Component
 */
export function LanguageSelector({
  value,
  onChange,
  label,
  languages,
  error,
  disabled = false,
  class: className = '',
  placeholder = 'Select a language',
  searchable,
}: LanguageSelectorProps) {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const hasError = !!error;

  // Determine if search should be shown (default: true for >10 languages)
  const shouldShowSearch = searchable ?? languages.length > 10;

  // Filter languages based on search query
  const filteredLanguages = useMemo(() => {
    if (!searchQuery.trim()) {
      return languages;
    }

    const query = searchQuery.toLowerCase().trim();
    return languages.filter(
      (lang) =>
        lang.name.toLowerCase().includes(query) ||
        lang.code.toLowerCase().includes(query)
    );
  }, [languages, searchQuery]);

  // Get selected language object
  const selectedLanguage = useMemo(
    () => languages.find((lang) => lang.code === value),
    [languages, value]
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && shouldShowSearch && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, shouldShowSearch]);

  // Reset highlighted index when filtered list changes
  useEffect(() => {
    setHighlightedIndex(filteredLanguages.length > 0 ? 0 : -1);
  }, [filteredLanguages.length]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (listRef.current && highlightedIndex >= 0) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        });
      }
    }
  }, [highlightedIndex]);

  // Styles
  const containerStyles: JSX.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    width: '100%',
    position: 'relative',
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

  const triggerStyles: JSX.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '0.75rem 0.875rem',
    fontSize: '0.875rem',
    lineHeight: 1.5,
    color: selectedLanguage ? 'var(--text-primary)' : 'var(--text-tertiary)',
    backgroundColor: hasError
      ? 'rgba(239, 68, 68, 0.05)'
      : 'var(--bg-primary)',
    border: `1px solid ${hasError ? '#EF4444' : 'var(--border-primary)'}`,
    borderRadius: '0.5rem',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    textAlign: 'left',
    outline: 'none',
  };

  const chevronStyles: JSX.CSSProperties = {
    width: '20px',
    height: '20px',
    color: 'var(--text-secondary)',
    transition: 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
    flexShrink: 0,
  };

  const dropdownStyles: JSX.CSSProperties = {
    position: 'absolute',
    top: 'calc(100% + 0.25rem)',
    left: 0,
    right: 0,
    backgroundColor: 'var(--bg-elevated)',
    border: `1px solid var(--border-primary)`,
    borderRadius: '0.5rem',
    boxShadow: 'var(--shadow-lg)',
    zIndex: 50,
    overflow: 'hidden',
    display: isOpen ? 'flex' : 'none',
    flexDirection: 'column',
    maxHeight: '300px',
  };

  const searchInputStyles: JSX.CSSProperties = {
    width: '100%',
    padding: '0.625rem 0.875rem',
    fontSize: '0.875rem',
    color: 'var(--text-primary)',
    backgroundColor: 'var(--bg-primary)',
    border: 'none',
    borderBottom: '1px solid var(--border-primary)',
    outline: 'none',
  };

  const listStyles: JSX.CSSProperties = {
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '0.25rem',
    maxHeight: '250px',
  };

  const optionStyles: (lang: Language, isHighlighted: boolean) => JSX.CSSProperties = (
    lang,
    isHighlighted
  ) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    color: 'var(--text-primary)',
    backgroundColor: isHighlighted ? 'var(--accent-muted)' : 'transparent',
    borderRadius: '0.25rem',
    cursor: 'pointer',
    transition: 'background-color 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    userSelect: 'none',
  });

  const checkIconStyles: JSX.CSSProperties = {
    width: '18px',
    height: '18px',
    color: 'var(--accent-primary)',
    flexShrink: 0,
  };

  const errorTextStyles: JSX.CSSProperties = {
    fontSize: '0.75rem',
    color: '#EF4444',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  };

  const noResultsStyles: JSX.CSSProperties = {
    padding: '1rem',
    textAlign: 'center',
    color: 'var(--text-tertiary)',
    fontSize: '0.875rem',
  };

  // Handle trigger click
  const handleTriggerClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      setSearchQuery('');
    }
  };

  // Handle language selection
  const handleSelectLanguage = (languageCode: string) => {
    onChange(languageCode);
    setIsOpen(false);
    setSearchQuery('');
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredLanguages.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredLanguages[highlightedIndex]) {
          handleSelectLanguage(filteredLanguages[highlightedIndex].code);
        }
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  // Handle search input
  const handleSearchChange = (e: TargetedEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    setSearchQuery(target.value);
    setHighlightedIndex(0);
  };

  return (
    <div
      ref={containerRef}
      style={containerStyles}
      className={className}
      onKeyDown={handleKeyDown}
    >
      {/* Label */}
      <label style={labelStyles} id={`${label.toLowerCase()}-label`}>
        {label}
        <span style={requiredIndicatorStyles} aria-hidden="true">*</span>
      </label>

      {/* Trigger button */}
      <button
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-labelledby={`${label.toLowerCase()}-label`}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${label.toLowerCase()}-error` : undefined}
        disabled={disabled}
        onClick={handleTriggerClick}
        style={triggerStyles}
      >
        <span>
          {selectedLanguage ? selectedLanguage.name : placeholder}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          style={chevronStyles}
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Dropdown */}
      <div style={dropdownStyles} role="listbox" aria-label={label}>
        {/* Search input */}
        {shouldShowSearch && (
          <input
            ref={inputRef}
            type="text"
            placeholder="Search languages..."
            value={searchQuery}
            onInput={handleSearchChange}
            style={searchInputStyles}
            aria-label="Search languages"
          />
        )}

        {/* Language list */}
        <div ref={listRef} style={listStyles}>
          {filteredLanguages.length === 0 ? (
            <div style={noResultsStyles}>
              No languages found for "{searchQuery}"
            </div>
          ) : (
            filteredLanguages.map((lang, index) => {
              const isHighlighted = index === highlightedIndex;
              const isSelected = lang.code === value;

              return (
                <div
                  key={lang.code}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelectLanguage(lang.code)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  style={optionStyles(lang, isHighlighted)}
                >
                  <span>{lang.name}</span>
                  {isSelected && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      style={checkIconStyles}
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Error message */}
      {hasError && (
        <div
          id={`${label.toLowerCase()}-error`}
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

export default LanguageSelector;
