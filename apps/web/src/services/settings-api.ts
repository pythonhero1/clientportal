import { getAuthHeaders } from './projects-api';

export interface UserProfileData {
  id: string;
  clerkUserId?: string;
  email: string;
  name: string | null;
  role: 'Owner' | 'Client';
  status: string;
  mfaEnforced: boolean;
  profile: {
    companyName: string | null;
    phone: string | null;
    timezone: string;
    avatarUrl: string | null;
    themePreference: string;
  } | null;
}

export interface NotificationPreferencesData {
  userId: string;
  inAppDeliverables: boolean;
  inAppMessages: boolean;
  inAppInvoices: boolean;
  inAppMilestones: boolean;
  inAppMeetings: boolean;
  inAppSupport: boolean;
  pushEnabled: boolean;
  pushDeliverables: boolean;
  pushMessages: boolean;
  pushInvoices: boolean;
  pushMilestones: boolean;
  pushMeetings: boolean;
  pushSupport: boolean;
}

export interface SessionData {
  id: string;
  status: string;
  lastActiveAt: string;
  expireAt: string;
  isCurrent: boolean;
  device: string;
}

export async function fetchUserProfile(): Promise<UserProfileData> {
  const res = await fetch('/api/users/profile', {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error('Failed to fetch user profile');
  }

  return res.json();
}

export async function updateUserProfile(payload: {
  name?: string;
  companyName?: string;
  phone?: string;
  timezone?: string;
  avatarUrl?: string;
  themePreference?: string;
}): Promise<any> {
  const res = await fetch('/api/users/profile', {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error('Failed to update user profile');
  }

  return res.json();
}

export async function fetchNotificationPreferences(): Promise<NotificationPreferencesData> {
  const res = await fetch('/api/users/notification-preferences', {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error('Failed to fetch notification preferences');
  }

  return res.json();
}

export async function updateNotificationPreferences(
  payload: Partial<NotificationPreferencesData>,
): Promise<NotificationPreferencesData> {
  const res = await fetch('/api/users/notification-preferences', {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error('Failed to update notification preferences');
  }

  return res.json();
}

export async function fetchActiveSessions(): Promise<SessionData[]> {
  const res = await fetch('/api/users/sessions', {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error('Failed to fetch active sessions');
  }

  return res.json();
}

export async function revokeSession(sessionId: string): Promise<void> {
  const res = await fetch(`/api/users/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error('Failed to revoke session');
  }
}
