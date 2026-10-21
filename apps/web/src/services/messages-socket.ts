import { io, Socket } from 'socket.io-client';
import { getAuthHeaders, getActivePersona } from './projects-api';
import type { MessageDto } from './messages-api';

class MessagesSocketClient {
  private socket: Socket | null = null;
  private currentConversationId: string | null = null;
  private messageListeners: ((msg: MessageDto) => void)[] = [];
  private statusListeners: ((connected: boolean) => void)[] = [];

  connect(): Socket {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    const persona = getActivePersona();
    const authHeaders = getAuthHeaders() as Record<string, string>;

    this.socket = io('/messages', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      auth: {
        'x-mock-user-id': persona.id,
        'x-mock-role': persona.role,
        'x-mock-status': 'ACTIVE',
        token: authHeaders['Authorization']?.replace('Bearer ', ''),
      },
      extraHeaders: authHeaders,
    });

    this.socket.on('connect', () => {
      this.notifyStatus(true);
      if (this.currentConversationId) {
        this.socket?.emit('join_conversation', {
          conversationId: this.currentConversationId,
        });
      }
    });

    this.socket.on('disconnect', () => {
      this.notifyStatus(false);
    });

    this.socket.on('connect_error', () => {
      this.notifyStatus(false);
    });

    this.socket.on('message_created', (msg: MessageDto) => {
      this.messageListeners.forEach((listener) => listener(msg));
    });

    return this.socket;
  }

  joinConversation(conversationId: string) {
    this.currentConversationId = conversationId;
    if (this.socket && this.socket.connected) {
      this.socket.emit('join_conversation', { conversationId });
    }
  }

  leaveConversation(conversationId: string) {
    if (this.currentConversationId === conversationId) {
      this.currentConversationId = null;
    }
    if (this.socket && this.socket.connected) {
      this.socket.emit('leave_conversation', { conversationId });
    }
  }

  sendMessage(
    conversationId: string,
    content: string,
    idempotencyKey: string,
    fileVersionIds?: string[],
  ): Promise<MessageDto> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.socket.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit(
        'send_message',
        { conversationId, content, idempotencyKey, fileVersionIds },
        (res: any) => {
          if (res?.status === 'OK' && res?.message) {
            resolve(res.message);
          } else {
            reject(new Error(res?.error || 'Failed to send message'));
          }
        },
      );
    });
  }

  onMessage(callback: (msg: MessageDto) => void): () => void {
    this.messageListeners.push(callback);
    return () => {
      this.messageListeners = this.messageListeners.filter((cb) => cb !== callback);
    };
  }

  onStatusChange(callback: (connected: boolean) => void): () => void {
    this.statusListeners.push(callback);
    // Notify immediate state
    callback(this.socket?.connected || false);
    return () => {
      this.statusListeners = this.statusListeners.filter((cb) => cb !== callback);
    };
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentConversationId = null;
    }
  }

  private notifyStatus(connected: boolean) {
    this.statusListeners.forEach((cb) => cb(connected));
  }
}

export const messagesSocket = new MessagesSocketClient();
