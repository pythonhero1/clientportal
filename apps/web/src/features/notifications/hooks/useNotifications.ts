import { useState, useEffect, useCallback } from 'react';
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type NotificationItem,
  type NotificationFilterParams,
} from '../../../services/notifications-api';

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<NotificationFilterParams>({});

  const loadNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [listRes, count] = await Promise.all([
        fetchNotifications(filter),
        fetchUnreadCount(),
      ]);
      setNotifications(listRes.items || []);
      setUnreadCount(count);
    } catch (err: any) {
      setError(err.message || 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const markAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })),
      );
      setUnreadCount(0);
    } catch (err: any) {
      console.error('Failed to mark all notifications read:', err);
    }
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    filter,
    setFilter,
    markRead,
    markAllRead,
    refetch: loadNotifications,
  };
}
