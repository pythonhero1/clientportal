/**
 * Authoritative API Client for Oderinde Stephen Client Portal
 * Connects to live Render backend in production and Vite proxy in local dev.
 */

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? 'https://api-portal.oderindestephen.com'
    : '')
).replace(/\/$/, '');

// Store the active auth token (from Clerk or dev persona)
let activeAuthToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('portal_auth_token') : null;

export function setAuthToken(token: string | null) {
  activeAuthToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('portal_auth_token', token);
    } else {
      localStorage.removeItem('portal_auth_token');
    }
  }
}

export function getAuthToken(): string | null {
  return activeAuthToken || (typeof window !== 'undefined' ? localStorage.getItem('portal_auth_token') : null);
}

export function apiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}

export interface ApiFetchOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function apiFetch<T = any>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const url = apiUrl(path);
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Attach Bearer token if available
  const token = getAuthToken();
  if (token && !options.skipAuth && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Attach mock headers ONLY if unauthenticated in local development
  if (!token && typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    const activePersonaKey = localStorage.getItem('portal_dev_user') || 'owner';
    headers.set('x-mock-user-id', activePersonaKey);
    headers.set('x-mock-role', activePersonaKey === 'owner' ? 'Owner' : 'Client');
    headers.set('x-mock-status', 'ACTIVE');
    headers.set('x-mock-mfa', activePersonaKey === 'owner' ? 'true' : 'false');
    headers.set('x-mock-billing-contact', activePersonaKey === 'client_c' ? 'false' : 'true');
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  const contentType = res.headers.get('content-type') || '';

  // Handle HTML returned by SPA fallback or proxy errors
  if (!contentType.includes('application/json')) {
    const text = await res.text();
    if (!res.ok) {
      const err = new Error(`Server error (${res.status}): ${text.slice(0, 100)}`);
      (err as any).status = res.status;
      throw err;
    }
    // If HTTP 200 but content is HTML on an API route, it was intercepted by SPA fallback!
    const err = new Error(`RECEIVED_HTML_FALLBACK`);
    (err as any).status = 200;
    (err as any).isHtmlFallback = true;
    throw err;
  }

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    const message = errorJson.message || `Request failed (${res.status})`;
    const err = new Error(Array.isArray(message) ? message.join(', ') : message);
    (err as any).status = res.status;
    (err as any).data = errorJson;
    throw err;
  }

  return await res.json();
}
