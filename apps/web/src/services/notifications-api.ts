import { getAuthHeaders } from './projects-api';

export interface NotificationItem {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  data?: any;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type NotificationRecord = NotificationItem;

export interface NotificationListResponse {
  items: NotificationItem[];
  total: number;
  unreadCount: number;
}

export interface NotificationFilterParams {
  isRead?: boolean;
  type?: string;
  limit?: number;
}

export async function fetchNotifications(
  filter?: NotificationFilterParams,
): Promise<NotificationListResponse> {
  const params = new URLSearchParams();
  if (filter?.isRead !== undefined) {
    params.set('isRead', String(filter.isRead));
  }
  if (filter?.type) {
    params.set('type', filter.type);
  }
  if (filter?.limit) {
    params.set('limit', String(filter.limit));
  }

  const queryString = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`/api/notifications${queryString}`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error('Failed to fetch notifications');
  }

  return res.json();
}

export async function fetchUnreadCount(): Promise<number> {
  const res = await fetch('/api/notifications/unread-count', {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    return 0;
  }

  const data = await res.json();
  return data.unreadCount || 0;
}

export async function markNotificationAsRead(id: string): Promise<NotificationItem> {
  const res = await fetch(`/api/notifications/${id}/read`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error('Failed to mark notification as read');
  }

  return res.json();
}

export async function markAllNotificationsAsRead(): Promise<{ count: number }> {
  const res = await fetch('/api/notifications/mark-all-read', {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error('Failed to mark all notifications as read');
  }

  return res.json();
}

export async function fetchPushPublicKey(): Promise<string | null> {
  const res = await fetch('/api/notifications/push/public-key', {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    return null;
  }

  const data = await res.json();
  return data.publicKey || null;
}

export async function subscribePush(subscriptionPayload: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userAgent?: string;
}): Promise<void> {
  const res = await fetch('/api/notifications/push/subscribe', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(subscriptionPayload),
  });

  if (!res.ok) {
    throw new Error('Failed to register push subscription');
  }
}

export async function unsubscribePush(endpoint: string): Promise<void> {
  const res = await fetch('/api/notifications/push/unsubscribe', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ endpoint }),
  });

  if (!res.ok) {
    throw new Error('Failed to unregister push subscription');
  }
}

export async function updateNotificationPreferences(prefs: { pushEnabled: boolean }): Promise<void> {
  try {
    localStorage.setItem('portal_push_preference', JSON.stringify(prefs));
  } catch (err) {
    console.warn('Could not save notification preferences:', err);
  }
}

export const notificationsApi = {
  listNotifications: async (filter?: NotificationFilterParams): Promise<NotificationItem[]> => {
    try {
      const res = await fetchNotifications(filter);
      return res?.items || [];
    } catch {
      return [];
    }
  },
  markAsRead: markNotificationAsRead,
  markAllAsRead: markAllNotificationsAsRead,
};

