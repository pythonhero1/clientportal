import { getAuthHeaders } from './projects-api';

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

  const res = await fetch(`/api/projects/${projectId}/calendar?${params.toString()}`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    if (res.status === 404) {
      return { events: [], timezone: 'Africa/Lagos', projectId };
    }
    throw new Error('Failed to load project calendar events.');
  }

  return res.json();
}

export async function fetchOwnerCalendar(projectId?: string): Promise<ProjectCalendarResponse> {
  const params = new URLSearchParams();
  if (projectId) params.set('projectId', projectId);

  const res = await fetch(`/api/admin/calendar?${params.toString()}`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error('Failed to load owner calendar events.');
  }

  return res.json();
}
