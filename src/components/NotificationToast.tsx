/**
 * NotificationToast Component
 *
 * Individual toast notification component with animations.
 * Features:
 * - Different styles based on notification type (success, error, info, warning)
 * - Auto-dismiss with progress bar
 * - Manual dismiss button
 * - Smooth enter/exit animations
 * - Accessible with ARIA live regions
 * - Mobile-first responsive design
 * - Mint-lime green theme integration
 */

import type { JSX } from 'preact';
import type { KeyboardEvent } from 'preact/compat';
import { useEffect, useRef, useState } from 'preact/hooks';
import type { Notification, NotificationType } from '../types/notification';
import { NOTIFICATION_ICONS, NOTIFICATION_CONFIG } from '../types/notification';
import { useTheme } from '../hooks/useTheme';

interface NotificationToastProps {
  /** Notification data */
  notification: Notification;
  /** Callback to dismiss the notification */
  onDismiss: (id: string) => void;
}

/**
 * Get icon path for notification type
 */
function getIconPath(type: NotificationType): string {
  return NOTIFICATION_ICONS[type];
}

/**
 * Get color scheme for notification type
 */
function getColorScheme(type: NotificationType): {
  borderColor: string;
  iconColor: string;
  bgColor: string;
} {
  switch (type) {
    case 'success':
      return {
        borderColor: '#10B981',
        iconColor: '#10B981',
        bgColor: 'rgba(16, 185, 129, 0.05)',
      };
    case 'error':
      return {
        borderColor: '#EF4444',
        iconColor: '#EF4444',
        bgColor: 'rgba(239, 68, 68, 0.05)',
      };
    case 'info':
      return {
        borderColor: '#3B82F6',
        iconColor: '#3B82F6',
        bgColor: 'rgba(59, 130, 246, 0.05)',
      };
    case 'warning':
      return {
        borderColor: '#F59E0B',
        iconColor: '#F59E0B',
        bgColor: 'rgba(245, 158, 11, 0.05)',
      };
  }
}

/**
 * NotificationToast Component
 */
export function NotificationToast({ notification, onDismiss }: NotificationToastProps) {
  const { theme } = useTheme();
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const progressIntervalRef = useRef<number | null>(null);
  const exitTimeoutRef = useRef<number | null>(null);

  const colors = getColorScheme(notification.type);
  const hasDuration = notification.duration && notification.duration > 0;
  const iconPath = getIconPath(notification.type);

  // Styles
  const containerStyles: JSX.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    maxWidth: '380px',
    backgroundColor: 'var(--bg-elevated)',
    border: `1px solid ${colors.borderColor}`,
    borderRadius: '0.75rem',
    boxShadow: 'var(--shadow-lg)',
    overflow: 'hidden',
    animation: isExiting ? 'slideOut 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards' : 'slideIn 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    transformOrigin: 'top right',
    pointerEvents: 'auto',
  };

  const contentStyles: JSX.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    padding: '0.875rem',
    paddingRight: '2.5rem',
  };

  const iconContainerStyles: JSX.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    flexShrink: 0,
    color: colors.iconColor,
  };

  const textContainerStyles: JSX.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    minWidth: 0,
  };

  const titleStyles: JSX.CSSProperties = {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    lineHeight: 1.4,
    wordBreak: 'break-word',
  };

  const messageStyles: JSX.CSSProperties = {
    fontSize: '0.8125rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
    wordBreak: 'break-word',
  };

  const closeButtonStyles: JSX.CSSProperties = {
    position: 'absolute',
    top: '0.5rem',
    right: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    padding: 0,
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '0.375rem',
    color: 'var(--text-tertiary)',
    cursor: 'pointer',
    transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  };

  const progressContainerStyles: JSX.CSSProperties = {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '3px',
    backgroundColor: 'var(--bg-tertiary)',
  };

  const progressBarStyles: JSX.CSSProperties = {
    height: '100%',
    width: `${progress}%`,
    backgroundColor: colors.borderColor,
    transition: hasDuration ? `width ${notification.duration}ms linear` : 'none',
  };

  // Handle dismiss with animation
  const handleDismiss = () => {
    if (isExiting) return;
    setIsExiting(true);
    if (progressIntervalRef.current) {
      window.clearInterval(progressIntervalRef.current);
    }
    exitTimeoutRef.current = window.setTimeout(() => {
      onDismiss(notification.id);
    }, NOTIFICATION_CONFIG.ANIMATION_DURATION);
  };

  // Handle keyboard interaction for close button
  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleDismiss();
    }
  };

  // Start progress bar and auto-dismiss timer
  useEffect(() => {
    if (hasDuration && notification.duration) {
      // Update progress bar
      const startTime = Date.now();
      const duration = notification.duration;

      progressIntervalRef.current = window.setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, duration - elapsed);
        const newProgress = (remaining / duration) * 100;
        setProgress(newProgress);

        if (remaining <= 0) {
          if (progressIntervalRef.current) {
            window.clearInterval(progressIntervalRef.current);
          }
        }
      }, 50);

      // Auto-dismiss
      exitTimeoutRef.current = window.setTimeout(() => {
        handleDismiss();
      }, duration);
    }

    return () => {
      if (progressIntervalRef.current) {
        window.clearInterval(progressIntervalRef.current);
      }
      if (exitTimeoutRef.current) {
        window.clearTimeout(exitTimeoutRef.current);
      }
    };
  }, [hasDuration, notification.duration]);

  // Handle hover pause for progress bar
  const handleMouseEnter = () => {
    if (progressIntervalRef.current) {
      window.clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const handleMouseLeave = () => {
    if (hasDuration && notification.duration && !isExiting) {
      const startTime = Date.now();
      const duration = notification.duration;
      const elapsed = ((100 - progress) / 100) * duration;

      progressIntervalRef.current = window.setInterval(() => {
        const currentElapsed = Date.now() - startTime;
        const remaining = Math.max(0, duration - currentElapsed);
        const newProgress = (remaining / duration) * 100;
        setProgress(newProgress);

        if (remaining <= 0) {
          if (progressIntervalRef.current) {
            window.clearInterval(progressIntervalRef.current);
          }
        }
      }, 50);
    }
  };

  return (
    <div
      style={containerStyles}
      role="alert"
      aria-live={notification.type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Content */}
      <div style={contentStyles}>
        {/* Icon */}
        <div style={iconContainerStyles} aria-hidden="true">
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
          >
            <path d={iconPath} />
          </svg>
        </div>

        {/* Text content */}
        <div style={textContainerStyles}>
          <span style={titleStyles}>{notification.title}</span>
          {notification.message && (
            <span style={messageStyles}>{notification.message}</span>
          )}
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={handleDismiss}
          onKeyDown={handleKeyDown}
          aria-label="Dismiss notification"
          style={closeButtonStyles}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--text-tertiary)';
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
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      {hasDuration && (
        <div style={progressContainerStyles} aria-hidden="true">
          <div style={progressBarStyles} />
        </div>
      )}
    </div>
  );
}

export default NotificationToast;
