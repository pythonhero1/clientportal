import { API_BASE_URL, getAuthToken } from './api-client';

export interface UserProfileResponse {
  id: string;
  email: string;
  name: string | null;
  role: 'Admin' | 'Client' | string;
  status: 'ACTIVE' | 'PENDING_APPROVAL' | 'SUSPENDED' | 'REJECTED';
  mfaEnforced?: boolean;
}

/**
 * Retrieves the current authenticated user's profile and role from the API.
 */
export async function fetchAuthenticatedUser(token?: string | null): Promise<{
  user?: UserProfileResponse;
  errorStatus?: number;
  errorCode?: string;
}> {
  const authToken = token || getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  };

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/me`, { headers });
    if (res.status === 403) {
      const data = await res.json().catch(() => ({}));
      return { errorStatus: 403, errorCode: data.code || 'FORBIDDEN' };
    }
    if (res.ok) {
      const user = await res.json().catch(() => null);
      return { user };
    }
    return { errorStatus: res.status };
  } catch (err) {
    return { errorStatus: 500 };
  }
}

/**
 * Determines the target redirect URL for an authenticated user based on:
 * - Admin role -> /admin
 * - Client role with completed onboarding -> /overview
 * - Client role with pending/incomplete onboarding -> /onboarding
 * - Account pending approval -> /pending-approval
 * - Inactive / unauthorized account -> /access-denied
 */
export async function determineAuthenticatedRedirect(token?: string | null): Promise<string> {
  const { user, errorStatus, errorCode } = await fetchAuthenticatedUser(token);

  if (errorStatus === 403) {
    if (errorCode === 'ACCOUNT_PENDING_APPROVAL') {
      return '/pending-approval';
    }
    return '/access-denied';
  }

  if (user) {
    const isAdmin = user.role === 'Admin' || user.role === 'Owner';
    if (isAdmin) {
      return '/admin';
    }

    // Client user onboarding check
    const authToken = token || getAuthToken();
    try {
      const ovRes = await fetch(`${API_BASE_URL}/api/client/overview`, {
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
      });
      if (ovRes.ok) {
        const overview = await ovRes.json().catch(() => ({}));
        const isComplete =
          Boolean(overview.hasActiveProject) &&
          (overview.activeProject?.status === 'ACTIVE' || Boolean(overview.onboarding?.isKickoffApproved));

        return isComplete ? '/overview' : '/onboarding';
      }
    } catch (ovErr) {
      console.warn('[auth-routing] Client overview check error:', ovErr);
    }

    return '/onboarding';
  }

  return '/overview';
}
