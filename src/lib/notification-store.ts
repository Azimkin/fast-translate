/**
 * Notification Store
 *
 * Centralized store for managing application notifications using Preact signals.
 * Provides reactive state management for toast notifications.
 */

import { signal, computed } from '@preact/signals';
import type { Notification, NotificationType } from '../types/notification';
import { NOTIFICATION_CONFIG } from '../types/notification';

/**
 * Signal containing array of active notifications
 */
const notificationsSignal = signal<Notification[]>([]);

/**
 * Computed signal for notifications sorted by creation time (newest first)
 */
export const notifications = computed(() => {
  return notificationsSignal.value.sort((a, b) => b.createdAt - a.createdAt);
});

/**
 * Generate a unique ID for notifications
 */
function generateId(): string {
  return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get default duration for notification type
 */
function getDefaultDuration(type: NotificationType): number {
  switch (type) {
    case 'success':
      return NOTIFICATION_CONFIG.SUCCESS_DURATION;
    case 'error':
      return NOTIFICATION_CONFIG.ERROR_DURATION;
    case 'info':
      return NOTIFICATION_CONFIG.INFO_DURATION;
    case 'warning':
      return NOTIFICATION_CONFIG.WARNING_DURATION;
    default:
      return NOTIFICATION_CONFIG.DEFAULT_DURATION;
  }
}

/**
 * Add a new notification
 *
 * @param type - Type of notification (success, error, info, warning)
 * @param title - Notification title
 * @param message - Optional detailed message
 * @param duration - Optional duration in ms (0 for no auto-dismiss)
 * @returns The created notification object
 */
export function addNotification(
  type: NotificationType,
  title: string,
  message?: string,
  duration?: number
): Notification {
  const notification: Notification = {
    id: generateId(),
    type,
    title,
    message,
    duration: duration ?? getDefaultDuration(type),
    createdAt: Date.now(),
  };

  notificationsSignal.value = [...notificationsSignal.value, notification];

  // Auto-dismiss if duration is set
  if (notification.duration && notification.duration > 0) {
    setTimeout(() => {
      dismissNotification(notification.id);
    }, notification.duration);
  }

  return notification;
}

/**
 * Add a success notification
 *
 * @param title - Notification title
 * @param message - Optional detailed message
 * @param duration - Optional duration in ms
 */
export function showSuccess(title: string, message?: string, duration?: number): Notification {
  return addNotification('success', title, message, duration);
}

/**
 * Add an error notification
 *
 * @param title - Notification title
 * @param message - Optional detailed message
 * @param duration - Optional duration in ms
 */
export function showError(title: string, message?: string, duration?: number): Notification {
  return addNotification('error', title, message, duration);
}

/**
 * Add an info notification
 *
 * @param title - Notification title
 * @param message - Optional detailed message
 * @param duration - Optional duration in ms
 */
export function showInfo(title: string, message?: string, duration?: number): Notification {
  return addNotification('info', title, message, duration);
}

/**
 * Add a warning notification
 *
 * @param title - Notification title
 * @param message - Optional detailed message
 * @param duration - Optional duration in ms
 */
export function showWarning(title: string, message?: string, duration?: number): Notification {
  return addNotification('warning', title, message, duration);
}

/**
 * Dismiss a notification by ID
 *
 * @param id - The notification ID to dismiss
 */
export function dismissNotification(id: string): void {
  notificationsSignal.value = notificationsSignal.value.filter(
    (notification) => notification.id !== id
  );
}

/**
 * Dismiss all notifications
 */
export function dismissAllNotifications(): void {
  notificationsSignal.value = [];
}

/**
 * Update a notification
 *
 * @param id - The notification ID to update
 * @param updates - Partial notification data to update
 */
export function updateNotification(
  id: string,
  updates: Partial<Omit<Notification, 'id' | 'createdAt'>>
): void {
  notificationsSignal.value = notificationsSignal.value.map((notification) =>
    notification.id === id
      ? { ...notification, ...updates }
      : notification
  );
}

/**
 * Get the count of active notifications
 */
export function getNotificationCount(): number {
  return notificationsSignal.value.length;
}
