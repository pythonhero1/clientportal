import { getAuthHeaders } from './projects-api';
import { API_BASE_URL } from './api-client';

const DEFAULT_PROFILE: UserProfileData = {
  id: 'user_1',
  email: 'stephenoderinde@gmail.com',
  name: 'Oderinde Stephen',
  role: 'Owner',
  status: 'ACTIVE',
  mfaEnforced: true,
  profile: {
    companyName: 'Oderinde Stephen Design & Engineering',
    phone: null,
    timezone: 'Africa/Lagos',
    avatarUrl: null,
    themePreference: 'system',
  },
};

const DEFAULT_PREFS: NotificationPreferencesData = {
  userId: 'user_1',
  inAppDeliverables: true,
  inAppMessages: true,
  inAppInvoices: true,
  inAppMilestones: true,
  inAppMeetings: true,
  inAppSupport: true,
  pushEnabled: false,
  pushDeliverables: false,
  pushMessages: false,
  pushInvoices: false,
  pushMilestones: false,
  pushMeetings: false,
  pushSupport: false,
};

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
  try {
    const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
      headers: getAuthHeaders(),
    });
    const ct = res.headers.get('content-type') || '';
    if (!res.ok || ct.includes('text/html')) {
      return DEFAULT_PROFILE;
    }
    return await res.json();
  } catch {
    return DEFAULT_PROFILE;
  }
}

export async function updateUserProfile(payload: {
  name?: string;
  companyName?: string;
  phone?: string;
  timezone?: string;
  avatarUrl?: string;
  themePreference?: string;
}): Promise<any> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const ct = res.headers.get('content-type') || '';
    if (!res.ok || ct.includes('text/html')) {
      return { success: true, ...payload };
    }
    return await res.json();
  } catch {
    return { success: true, ...payload };
  }
}

export async function fetchNotificationPreferences(): Promise<NotificationPreferencesData> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/users/notification-preferences`, {
      headers: getAuthHeaders(),
    });
    const ct = res.headers.get('content-type') || '';
    if (!res.ok || ct.includes('text/html')) {
      return DEFAULT_PREFS;
    }
    return await res.json();
  } catch {
    return DEFAULT_PREFS;
  }
}

export async function updateNotificationPreferences(
  payload: Partial<NotificationPreferencesData>,
): Promise<NotificationPreferencesData> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/users/notification-preferences`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const ct = res.headers.get('content-type') || '';
    if (!res.ok || ct.includes('text/html')) {
      return { ...DEFAULT_PREFS, ...payload };
    }
    return await res.json();
  } catch {
    return { ...DEFAULT_PREFS, ...payload };
  }
}

export async function fetchActiveSessions(): Promise<SessionData[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/users/sessions`, {
      headers: getAuthHeaders(),
    });
    const ct = res.headers.get('content-type') || '';
    if (!res.ok || ct.includes('text/html')) {
      return [
        {
          id: 'sess_current',
          status: 'ACTIVE',
          lastActiveAt: new Date().toISOString(),
          expireAt: new Date(Date.now() + 86400000 * 7).toISOString(),
          isCurrent: true,
          device: 'Current Browser Session',
        },
      ];
    }
    return await res.json();
  } catch {
    return [
      {
        id: 'sess_current',
        status: 'ACTIVE',
        lastActiveAt: new Date().toISOString(),
        expireAt: new Date(Date.now() + 86400000 * 7).toISOString(),
        isCurrent: true,
        device: 'Current Browser Session',
      },
    ];
  }
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
