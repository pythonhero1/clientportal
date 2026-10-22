import { getAuthHeaders } from './projects-api';
import { API_BASE_URL } from './api-client';

export type CalendarEventType = 'MEETING' | 'MILESTONE' | 'INVOICE' | 'CHECKPOINT';

export interface CalendarEvent {
  id: string;
  type: CalendarEventType;
  title: string;
  description?: string;
  date: string;
  endDate?: string;
  status: string;
  colorVariant: 'primary' | 'accent' | 'warning' | 'success' | 'danger' | 'neutral';
  metadata: Record<string, any>;
}

export interface ProjectCalendarResponse {
  events: CalendarEvent[];
  timezone: string;
  projectId?: string;
}

export async function fetchProjectCalendar(
  projectId: string,
  month?: number,
  year?: number,
): Promise<ProjectCalendarResponse> {
  const params = new URLSearchParams();
  if (month !== undefined) params.set('month', String(month));
  if (year !== undefined) params.set('year', String(year));

  const res = await fetch(`${API_BASE_URL}/api/projects/${projectId}/calendar?${params.toString()}`, {
    headers: getAuthHeaders(),
  });

  const ct = res.headers.get('content-type') || '';
  if (!res.ok || ct.includes('text/html')) {
    return { events: [], timezone: 'Africa/Lagos', projectId };
  }

  return res.json();
}

export async function fetchOwnerCalendar(projectId?: string): Promise<ProjectCalendarResponse> {
  const params = new URLSearchParams();
  if (projectId) params.set('projectId', projectId);

  const res = await fetch(`${API_BASE_URL}/api/admin/calendar?${params.toString()}`, {
    headers: getAuthHeaders(),
  });

  const ct = res.headers.get('content-type') || '';
  if (!res.ok || ct.includes('text/html')) {
    return { events: [], timezone: 'Africa/Lagos' };
  }

  return res.json();
}
