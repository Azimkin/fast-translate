/**
 * ThemeToggle Component
 * 
 * A button component that toggles between light and dark themes.
 * Features:
 * - Sun icon for light theme, moon icon for dark theme
 * - Smooth icon transition animation
 * - Accessible with keyboard navigation and ARIA labels
 * - Persists theme preference in localStorage
 * - Respects system preference on first load
 */

import type { JSX } from 'preact';
import type { KeyboardEvent } from 'preact/compat';
import { useTheme } from '../hooks/useTheme';

interface ThemeToggleProps extends JSX.HTMLAttributes<HTMLButtonElement> {
  /** Optional custom class name */
  class?: string;
  /** Size variant: 'sm' | 'md' | 'lg' */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show the icon only (no background) */
  variant?: 'button' | 'icon';
}

/**
 * Sun icon SVG component
 */
function SunIcon(props: JSX.SVGAttributes<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="M4.93 4.93l1.41 1.41" />
      <path d="M17.66 17.66l1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="M6.34 17.66l-1.41 1.41" />
      <path d="M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

/**
 * Moon icon SVG component
 */
function MoonIcon(props: JSX.SVGAttributes<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

/**
 * ThemeToggle Component
 */
export function ThemeToggle({ 
  class: className = '', 
  size = 'md',
  variant = 'button',
  ...props 
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  // Size configuration
  const sizeConfig = {
    sm: { iconSize: 18, buttonSize: '32px' },
    md: { iconSize: 22, buttonSize: '40px' },
    lg: { iconSize: 28, buttonSize: '48px' },
  };

  const { iconSize, buttonSize } = sizeConfig[size];

  // Styles
  const baseStyles: JSX.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: variant === 'icon' ? 'auto' : buttonSize,
    height: buttonSize,
    padding: variant === 'icon' ? '8px' : '0',
    border: '1px solid var(--border-primary)',
    borderRadius: '9999px',
    backgroundColor: variant === 'button' ? 'var(--bg-secondary)' : 'transparent',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden',
  };

  const iconStyles: JSX.CSSProperties = {
    width: `${iconSize}px`,
    height: `${iconSize}px`,
    transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'absolute',
  };

  // Icon transition based on current theme
  const sunIconStyles: JSX.CSSProperties = {
    ...iconStyles,
    opacity: theme === 'light' ? 1 : 0,
    transform: theme === 'light' 
      ? 'rotate(0deg) scale(1)' 
      : 'rotate(-90deg) scale(0.8)',
  };

  const moonIconStyles: JSX.CSSProperties = {
    ...iconStyles,
    opacity: theme === 'dark' ? 1 : 0,
    transform: theme === 'dark' 
      ? 'rotate(0deg) scale(1)' 
      : 'rotate(90deg) scale(0.8)',
  };

  // Handle keyboard interaction
  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleTheme();
    }
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      onKeyDown={handleKeyDown}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      aria-pressed={theme === 'dark'}
      title={`Current theme: ${theme}. Click to switch.`}
      style={baseStyles}
      className={className}
      {...props}
    >
      {/* Sun icon - visible in light theme */}
      <span style={sunIconStyles}>
        <SunIcon width={iconSize} height={iconSize} />
      </span>
      
      {/* Moon icon - visible in dark theme */}
      <span style={moonIconStyles}>
        <MoonIcon width={iconSize} height={iconSize} />
      </span>
      
      {/* Invisible text for screen readers to announce current state */}
      <span style={{ 
        position: 'absolute', 
        width: '1px', 
        height: '1px', 
        padding: '0', 
        margin: '-1px', 
        overflow: 'hidden', 
        clip: 'rect(0, 0, 0, 0)', 
        whiteSpace: 'nowrap', 
        border: '0' 
      }}>
        {theme === 'light' ? 'Light theme active' : 'Dark theme active'}
      </span>
    </button>
  );
}

export default ThemeToggle;
