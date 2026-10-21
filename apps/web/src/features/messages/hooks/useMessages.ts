import { useState, useEffect, useCallback, useRef } from 'react';
import { messagesApi, type MessageDto } from '../../../services/messages-api';
import { messagesSocket } from '../../../services/messages-socket';
import { getActivePersona } from '../../../services/projects-api';

export function useMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const lastTimestampRef = useRef<string | null>(null);

  // Initialize socket and monitor connection status
  useEffect(() => {
    messagesSocket.connect();
    const unsubStatus = messagesSocket.onStatusChange((connected) => {
      setIsConnected(connected);
      // If reconnecting and we have an active conversation, sync missed messages
      if (connected && conversationId && lastTimestampRef.current) {
        messagesApi
          .syncReconnect(conversationId, lastTimestampRef.current)
          .then((missed) => {
            if (missed && missed.length > 0) {
              setMessages((prev) => {
                const existingIds = new Set(prev.map((m) => m.id));
                const newItems = missed.filter((m) => !existingIds.has(m.id));
                return [...prev, ...newItems];
              });
            }
          })
          .catch(() => {});
      }
    });

    return () => {
      unsubStatus();
    };
  }, [conversationId]);

  // Handle room joining and initial message fetching
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    messagesSocket.joinConversation(conversationId);
    setIsLoading(true);
    setError(null);

    messagesApi
      .getMessages(conversationId)
      .then((data) => {
        setMessages(data);
        if (data.length > 0) {
          lastTimestampRef.current = data[data.length - 1].createdAt;
        }
      })
      .catch((err) => {
        setError(err.message || 'Failed to load messages');
      })
      .finally(() => {
        setIsLoading(false);
      });

    // Listen for live messages
    const unsubMsg = messagesSocket.onMessage((newMsg) => {
      if (newMsg.conversationId === conversationId) {
        setMessages((prev) => {
          // Deduplicate by message ID or idempotencyKey
          const exists = prev.some(
            (m) =>
              m.id === newMsg.id ||
              (m.idempotencyKey && m.idempotencyKey === newMsg.idempotencyKey),
          );
          if (exists) {
            return prev.map((m) =>
              m.idempotencyKey === newMsg.idempotencyKey ? newMsg : m,
            );
          }
          lastTimestampRef.current = newMsg.createdAt;
          return [...prev, newMsg];
        });
      }
    });

    return () => {
      unsubMsg();
      messagesSocket.leaveConversation(conversationId);
    };
  }, [conversationId]);

  const sendMessage = useCallback(
    async (content: string, fileVersionIds?: string[]) => {
      if (!conversationId || !content.trim()) return;

      const persona = getActivePersona();
      const idempotencyKey = `idem-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      // Optimistic message
      const optimisticMessage: MessageDto = {
        id: `optimistic-${idempotencyKey}`,
        conversationId,
        senderId: persona.id,
        sender: {
          id: persona.id,
          name: persona.name,
          email: persona.email,
          role: persona.role,
        },
        content: content.trim(),
        idempotencyKey,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, optimisticMessage]);
      setIsSending(true);

      try {
        let confirmed: MessageDto;
        if (isConnected) {
          try {
            confirmed = await messagesSocket.sendMessage(
              conversationId,
              content.trim(),
              idempotencyKey,
              fileVersionIds,
            );
          } catch {
            // Fallback to HTTP if socket emit fails
            confirmed = await messagesApi.sendMessage(
              conversationId,
              content.trim(),
              idempotencyKey,
              fileVersionIds,
            );
          }
        } else {
          // Send over REST if socket is disconnected
          confirmed = await messagesApi.sendMessage(
            conversationId,
            content.trim(),
            idempotencyKey,
            fileVersionIds,
          );
        }

        // Replace optimistic entry with server-confirmed message
        setMessages((prev) =>
          prev.map((m) =>
            m.idempotencyKey === idempotencyKey ? confirmed : m,
          ),
        );
        lastTimestampRef.current = confirmed.createdAt;
        return confirmed;
      } catch (err: any) {
        // Remove optimistic message and show error
        setMessages((prev) =>
          prev.filter((m) => m.idempotencyKey !== idempotencyKey),
        );
        throw err;
      } finally {
        setIsSending(false);
      }
    },
    [conversationId, isConnected],
  );

  return {
    messages,
    isLoading,
    isSending,
    isConnected,
    error,
    sendMessage,
  };
}
