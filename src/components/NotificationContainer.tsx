/**
 * NotificationContainer Component
 *
 * Container component for managing and displaying toast notifications.
 * Features:
 * - Renders all active notifications
 * - Configurable position (top-right, top-left, bottom-right, bottom-left)
 * - Maximum notification limit
 * - Stacked layout with proper spacing
 * - Mobile-first responsive design
 * - Mint-lime green theme integration
 */

import type { JSX } from 'preact';
import { useSignal } from '@preact/signals';
import { useTheme } from '../hooks/useTheme';
import { notifications, dismissNotification } from '../lib/notification-store';
import { NotificationToast } from './NotificationToast';
import type { NotificationContainerProps } from '../types/notification';

/**
 * NotificationContainer Component
 */
export function NotificationContainer({
  class: className = '',
  maxNotifications = 3,
  position = 'top-right',
}: NotificationContainerProps) {
  const { theme } = useTheme();

  // Get visible notifications (limited by maxNotifications)
  const visibleNotifications = useSignal(
    notifications.value.slice(0, maxNotifications)
  );

  // Update visible notifications when the signal changes
  useSignal(() => {
    visibleNotifications.value = notifications.value.slice(0, maxNotifications);
  });

  // Styles
  const containerStyles: JSX.CSSProperties = {
    position: 'fixed',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    padding: '1rem',
    pointerEvents: 'none',
    // Position based on prop
    ...(position === 'top-right' && {
      top: 0,
      right: 0,
    }),
    ...(position === 'top-left' && {
      top: 0,
      left: 0,
    }),
    ...(position === 'bottom-right' && {
      bottom: 0,
      right: 0,
    }),
    ...(position === 'bottom-left' && {
      bottom: 0,
      left: 0,
    }),
  };

  // Handle dismiss
  const handleDismiss = (id: string) => {
    dismissNotification(id);
  };

  return (
    <div
      style={containerStyles}
      className={className}
      aria-label="Notifications"
    >
      {visibleNotifications.value.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onDismiss={handleDismiss}
        />
      ))}

      {/* Global CSS for animations */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(${position.includes('right') ? '100%' : '-100%'}) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0) translateY(0);
          }
        }

        @keyframes slideOut {
          from {
            opacity: 1;
            transform: translateX(0) translateY(0);
          }
          to {
            opacity: 0;
            transform: translateX(${position.includes('right') ? '100%' : '-100%'}) translateY(-10px);
          }
        }

        @media (max-width: 640px) {
          [aria-label="Notifications"] {
            left: 0.5rem !important;
            right: 0.5rem !important;
            max-width: calc(100% - 1rem) !important;
          }
        }
      `}</style>
    </div>
  );
}

export default NotificationContainer;
