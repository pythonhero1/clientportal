import { API_BASE_URL, getAuthToken } from './api-client';

/**
 * Determines the target redirect URL for an authenticated user based on:
 * - Owner role -> /owner
 * - Client role with completed onboarding -> /overview
 * - Client role with pending/incomplete onboarding -> /onboarding
 * - Account pending owner approval -> /pending-approval
 * - Inactive / unauthorized account -> /access-denied
 */
export async function determineAuthenticatedRedirect(token?: string | null): Promise<string> {
  const authToken = token || getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  };

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/me`, { headers });

    if (res.status === 403) {
      const data = await res.json().catch(() => ({}));
      if (data.code === 'ACCOUNT_PENDING_APPROVAL') {
        return '/pending-approval';
      }
      return '/access-denied';
    }

    if (res.ok) {
      const me = await res.json().catch(() => null);

      if (me?.role === 'Owner') {
        return '/owner';
      }

      // Check onboarding progress for Client users
      try {
        const ovRes = await fetch(`${API_BASE_URL}/api/client/overview`, { headers });
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

      // Default client landing when onboarding status is not yet finalized
      return '/onboarding';
    }
  } catch (err) {
    console.warn('[auth-routing] /api/auth/me resolution error:', err);
  }

  return '/overview';
}
