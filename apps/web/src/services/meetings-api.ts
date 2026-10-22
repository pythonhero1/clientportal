import { getAuthHeaders } from './projects-api';
import { API_BASE_URL } from './api-client';

export interface Meeting {
  id: string;
  calBookingUid: string;
  calBookingId?: string | null;
  projectId?: string | null;
  clientId?: string | null;
  title: string;
  description?: string | null;
  status: 'ACCEPTED' | 'RESCHEDULED' | 'CANCELLED' | 'REJECTED';
  startTime: string;
  endTime: string;
  timezone: string;
  meetingUrl?: string | null;
  rescheduleUrl?: string | null;
  cancelUrl?: string | null;
  cancellationReason?: string | null;
  attendees?: Array<{ name: string; email: string; timeZone?: string }>;
  client?: { id: string; name: string | null; email: string };
  project?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface BookingTokenResponse {
  token: string;
  expiresAt: string;
  calUsername: string;
  eventSlug: string;
}

export async function fetchProjectMeetings(projectId: string): Promise<Meeting[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/projects/${projectId}/meetings`, {
      headers: getAuthHeaders(),
    });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || contentType.includes('text/html')) {
      return [];
    }
    return res.json();
  } catch {
    return [];
  }
}

export async function fetchClientMeetings(): Promise<Meeting[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/meetings`, {
      headers: getAuthHeaders(),
    });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || contentType.includes('text/html')) {
      return [];
    }
    return res.json();
  } catch {
    return [];
  }
}

export async function fetchBookingToken(projectId: string): Promise<BookingTokenResponse> {
  const res = await fetch(`${API_BASE_URL}/api/projects/${projectId}/meetings/booking-token`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error('Failed to generate Cal.com booking token.');
  }
  return res.json();
}

export async function fetchEventTypes(): Promise<
  Array<{ id: number; title: string; slug: string; lengthInMinutes: number; bookingUrl: string }>
> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/meetings/event-types`, {
      headers: getAuthHeaders(),
    });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || contentType.includes('text/html')) {
      return [
        {
          id: 4862054,
          title: 'Free Website Strategy Call (60 Minutes)',
          slug: 'free',
          lengthInMinutes: 60,
          bookingUrl: 'https://cal.com/oderinde/free',
        },
      ];
    }
    return res.json();
  } catch {
    return [
      {
        id: 4862054,
        title: 'Free Website Strategy Call (60 Minutes)',
        slug: 'free',
        lengthInMinutes: 60,
        bookingUrl: 'https://cal.com/oderinde/free',
      },
    ];
  }
}

export async function fetchOwnerMeetings(filters?: {
  projectId?: string;
  status?: string;
}): Promise<Meeting[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.projectId) params.set('projectId', filters.projectId);
    if (filters?.status) params.set('status', filters.status);

    const res = await fetch(`${API_BASE_URL}/api/admin/meetings?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || contentType.includes('text/html')) {
      return [];
    }
    return res.json();
  } catch {
    return [];
  }
}

export async function updateOwnerMeeting(
  meetingId: string,
  data: { projectId?: string; description?: string; status?: string },
): Promise<Meeting> {
  const res = await fetch(`${API_BASE_URL}/api/admin/meetings/${meetingId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error('Failed to update meeting.');
  }
  return res.json();
}
