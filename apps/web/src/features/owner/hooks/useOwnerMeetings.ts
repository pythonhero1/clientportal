import { useState, useEffect, useCallback } from 'react';
import { fetchOwnerMeetings, updateOwnerMeeting } from '../../../services/meetings-api';
import type { Meeting } from '../../../services/meetings-api';

export function useOwnerMeetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadMeetings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchOwnerMeetings({
        projectId: selectedProjectId || undefined,
        status: selectedStatus || undefined,
      });
      setMeetings(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load meetings');
    } finally {
      setIsLoading(false);
    }
  }, [selectedProjectId, selectedStatus]);

  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  const reassignMeeting = async (meetingId: string, projectId: string, description?: string) => {
    const updated = await updateOwnerMeeting(meetingId, { projectId, description });
    setMeetings((prev) => prev.map((m) => (m.id === meetingId ? updated : m)));
    return updated;
  };

  return {
    meetings,
    selectedProjectId,
    setSelectedProjectId,
    selectedStatus,
    setSelectedStatus,
    isLoading,
    error,
    refetch: loadMeetings,
    reassignMeeting,
  };
}
