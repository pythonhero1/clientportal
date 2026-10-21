import { useState, useEffect, useCallback } from 'react';
import { messagesApi, type ConversationDto } from '../../../services/messages-api';

export function useConversations() {
  const [conversations, setConversations] = useState<ConversationDto[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await messagesApi.listConversations();
      setConversations(data);
      setActiveConversationId((prev) => prev || (data.length > 0 ? data[0].id : null));
    } catch (err: any) {
      setError(err.message || 'Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId,
  ) || null;

  return {
    conversations,
    activeConversation,
    activeConversationId,
    setActiveConversationId,
    isLoading,
    error,
    refresh: fetchConversations,
  };
}
