import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchProjectCalendar } from '../../../services/calendar-api';
import type { CalendarEvent, CalendarEventType } from '../../../services/calendar-api';

export function useProjectCalendar(projectId?: string) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [date, setDate] = useState<Date>(new Date(2026, 9, 21)); // October 2026 default (target release month)
  const [activeFilters, setActiveFilters] = useState<Set<CalendarEventType>>(
    new Set(['MEETING', 'MILESTONE', 'INVOICE', 'CHECKPOINT'])
  );

  // Timezone toggle: Stephen's default "Africa/Lagos" vs user's browser local
  const clientLocalTimezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  }, []);

  const [useStephenTimezone, setUseStephenTimezone] = useState<boolean>(true);
  const activeTimezone = useStephenTimezone ? 'Africa/Lagos' : clientLocalTimezone;

  const currentMonth = date.getMonth();
  const currentYear = date.getFullYear();

  const loadCalendar = useCallback(async () => {
    if (!projectId) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetchProjectCalendar(projectId, currentMonth + 1, currentYear);
      setEvents(res.events || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load project calendar');
    } finally {
      setIsLoading(false);
    }
  }, [projectId, currentMonth, currentYear]);

  useEffect(() => {
    loadCalendar();
  }, [loadCalendar]);

  const toggleFilter = (type: CalendarEventType) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        if (next.size > 1) next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const nextMonth = () => {
    setDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const resetToToday = () => {
    setDate(new Date(2026, 9, 21));
  };

  const filteredEvents = useMemo(() => {
    return events.filter((e) => activeFilters.has(e.type));
  }, [events, activeFilters]);

  const toggleTimezone = () => {
    setUseStephenTimezone((prev) => !prev);
  };

  return {
    events,
    filteredEvents,
    activeTimezone,
    useStephenTimezone,
    toggleTimezone,
    activeFilters,
    toggleFilter,
    currentMonth,
    currentYear,
    currentDate: date,
    nextMonth,
    prevMonth,
    resetToToday,
    isLoading,
    error,
    refetch: loadCalendar,
  };
}
