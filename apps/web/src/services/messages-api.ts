import { getAuthHeaders, getActivePersona } from './projects-api';
import { API_BASE_URL } from './api-client';

export interface MessageAttachmentDto {
  id: string;
  messageId: string;
  fileVersionId: string;
  fileVersion: {
    id: string;
    fileName: string;
    fileExtension: string;
    byteSize: number | string;
    scanStatus: 'QUARANTINED' | 'CLEAN' | 'INFECTED' | 'FAILED';
    fileId: string;
  };
}

export interface MessageDto {
  id: string;
  conversationId: string;
  senderId: string;
  sender: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
  content: string;
  idempotencyKey: string | null;
  attachments?: MessageAttachmentDto[];
  createdAt: string;
}

export interface ConversationMembershipDto {
  id: string;
  conversationId: string;
  userId: string;
  role: 'OWNER' | 'MEMBER';
  joinedAt: string;
  leftAt: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
}

export interface ConversationDto {
  id: string;
  type: 'PROJECT' | 'DIRECT' | 'GENERAL' | 'GROUP';
  title: string | null;
  projectId: string | null;
  project?: {
    id: string;
    name: string;
  } | null;
  createdById: string;
  lastMessageAt: string | null;
  memberships: ConversationMembershipDto[];
  messages?: MessageDto[];
}

const API_BASE = `${API_BASE_URL}/api`;

export const messagesApi = {
  async listConversations(): Promise<ConversationDto[]> {
    try {
      const res = await fetch(`${API_BASE}/conversations`, {
        headers: getAuthHeaders(),
      });
      const ct = res.headers.get('content-type') || '';
      if (!res.ok || ct.includes('text/html')) throw new Error('Failed to fetch conversations');
      return await res.json();    } catch {
      return [];
    }
  },

  async getConversation(id: string): Promise<ConversationDto> {
    const res = await fetch(`${API_BASE}/conversations/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Conversation not found');
    return await res.json();
  },

  async getMessages(
    conversationId: string,
    cursor?: string,
    limit: number = 50,
  ): Promise<MessageDto[]> {
    try {
      const url = new URL(
        `${window.location.origin}${API_BASE}/conversations/${conversationId}/messages`,
      );
      if (cursor) url.searchParams.set('cursor', cursor);
      if (limit) url.searchParams.set('limit', limit.toString());

      const res = await fetch(url.toString(), {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch messages');
      return await res.json();
    } catch {
      const persona = getActivePersona();
      return [
        {
          id: 'msg_1',
          conversationId,
          senderId: 'owner_1',
          sender: {
            id: 'owner_1',
            name: 'Stephen Oderinde',
            email: 'stephen@example.com',
            role: 'Owner',
          },
          content: 'Welcome to the client portal! I have uploaded the updated v2.1 wireframes to the Files section for your review.',
          idempotencyKey: 'mock-1',
          createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        },
        {
          id: 'msg_2',
          conversationId,
          senderId: persona.id,
          sender: {
            id: persona.id,
            name: persona.name,
            email: persona.email,
            role: persona.role,
          },
          content: 'Thanks Stephen! Reviewing the desktop and tablet compositions now.',
          idempotencyKey: 'mock-2',
          createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        },
      ];
    }
  },

  async sendMessage(
    conversationId: string,
    content: string,
    idempotencyKey: string,
    fileVersionIds?: string[],
  ): Promise<MessageDto> {
    try {
      const res = await fetch(
        `${API_BASE}/conversations/${conversationId}/messages`,
        {
          method: 'POST',
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content,
            idempotencyKey,
            fileVersionIds,
          }),
        },
      );
      if (!res.ok) throw new Error('Failed to send message');
      return await res.json();
    } catch {
      const persona = getActivePersona();
      return {
        id: `msg_mock_${Date.now()}`,
        conversationId,
        senderId: persona.id,
        sender: {
          id: persona.id,
          name: persona.name,
          email: persona.email,
          role: persona.role,
        },
        content,
        idempotencyKey,
        createdAt: new Date().toISOString(),
      };
    }
  },

  async syncReconnect(
    conversationId: string,
    since: string,
  ): Promise<MessageDto[]> {
    const url = new URL(
      `${window.location.origin}${API_BASE}/conversations/${conversationId}/sync`,
    );
    url.searchParams.set('since', since);
    const res = await fetch(url.toString(), {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to sync reconnect');
    return await res.json();
  },

  async createConversation(data: {
    type: 'PROJECT' | 'DIRECT' | 'GENERAL' | 'GROUP';
    title?: string;
    projectId?: string;
    participantUserIds: string[];
  }): Promise<ConversationDto> {
    const res = await fetch(`${API_BASE}/admin/conversations`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create conversation');
    return await res.json();
  },

  async manageMember(
    conversationId: string,
    action: 'ADD' | 'REMOVE',
    userId: string,
  ): Promise<any> {
    const res = await fetch(
      `${API_BASE}/admin/conversations/${conversationId}/members`,
      {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, userId }),
      },
    );
    if (!res.ok) throw new Error('Failed to update membership');
    return await res.json();
  },
};
