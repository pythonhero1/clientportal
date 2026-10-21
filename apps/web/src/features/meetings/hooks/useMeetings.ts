import { useState, useEffect, useCallback } from 'react';
import { fetchProjectMeetings, fetchClientMeetings } from '../../../services/meetings-api';
import type { Meeting } from '../../../services/meetings-api';

export function useMeetings(projectId?: string) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadMeetings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = projectId
        ? await fetchProjectMeetings(projectId)
        : await fetchClientMeetings();
      setMeetings(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load scheduled calls');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  return {
    meetings,
    isLoading,
    error,
    refetch: loadMeetings,
  };
}
