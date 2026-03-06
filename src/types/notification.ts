/**
 * Notification/Toast System Types
 */

/**
 * Type of notification
 */
export type NotificationType = 'success' | 'error' | 'info' | 'warning';

/**
 * Notification data structure
 */
export interface Notification {
  /** Unique identifier for the notification */
  id: string;
  /** Type of notification (success, error, info, warning) */
  type: NotificationType;
  /** Notification title */
  title: string;
  /** Optional detailed message */
  message?: string;
  /** Duration in milliseconds before auto-dismiss (0 = no auto-dismiss) */
  duration?: number;
  /** Timestamp when notification was created */
  createdAt: number;
}

/**
 * Props for the NotificationContainer component
 */
export interface NotificationContainerProps {
  /** Optional custom class name */
  class?: string;
  /** Maximum number of notifications to display (default: 3) */
  maxNotifications?: number;
  /** Position of notifications: 'top-right', 'top-left', 'bottom-right', 'bottom-left' */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

/**
 * Props for individual NotificationToast component
 */
export interface NotificationToastProps {
  /** Notification data */
  notification: Notification;
  /** Callback to dismiss the notification */
  onDismiss: (id: string) => void;
}

/**
 * Configuration for notification types
 */
export const NOTIFICATION_CONFIG = {
  /** Default duration for success notifications (ms) */
  SUCCESS_DURATION: 3000,
  /** Default duration for error notifications (ms) */
  ERROR_DURATION: 5000,
  /** Default duration for info notifications (ms) */
  INFO_DURATION: 4000,
  /** Default duration for warning notifications (ms) */
  WARNING_DURATION: 4000,
  /** Default duration if not specified (ms) */
  DEFAULT_DURATION: 4000,
  /** Animation duration for enter/exit (ms) */
  ANIMATION_DURATION: 300,
} as const;

/**
 * Icon paths for different notification types
 */
export const NOTIFICATION_ICONS = {
  success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  error: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
  info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
} as const;
