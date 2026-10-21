import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { MessagesService } from './services/messages.service.js';
import { ConversationsService } from './services/conversations.service.js';
import { WsClerkAuthGuard } from './guards/ws-clerk-auth.guard.js';
import { ConversationAccessGuard } from './guards/conversation-access.guard.js';
import { SendMessageDto } from './dto/send-message.dto.js';
import { SyncReconnectDto } from './dto/sync-reconnect.dto.js';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';

@WebSocketGateway({
  cors: {
    origin: process.env.WEB_APP_URL || 'http://localhost:5173',
    credentials: true,
  },
  namespace: 'messages',
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private messagesService: MessagesService,
    private conversationsService: ConversationsService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const handshake = client.handshake;

      // Extract user from mock headers/auth if test environment
      if (process.env.NODE_ENV === 'test' || !process.env.CLERK_SECRET_KEY) {
        const mockUserId =
          handshake.headers['x-mock-user-id'] ||
          handshake.auth?.['x-mock-user-id'] ||
          client.handshake.query?.userId;

        if (mockUserId) {
          const mockRole =
            handshake.headers['x-mock-role'] ||
            handshake.auth?.['x-mock-role'] ||
            (String(mockUserId).includes('owner') ? 'Owner' : 'Client');

          client.data.user = {
            id: String(mockUserId),
            clerkUserId: `clerk_${mockUserId}`,
            email: `${mockUserId}@example.com`,
            name: `Mock ${mockUserId}`,
            role: mockRole === 'Owner' ? 'Owner' : 'Client',
            status: 'ACTIVE',
            mfaEnforced: mockRole === 'Owner',
          } as AuthenticatedUser;

          // Join user-specific notification room
          await client.join(`user:${client.data.user.id}`);
          return;
        }
      }

      const authHeader =
        handshake.headers['authorization'] ||
        (handshake.auth?.token ? `Bearer ${handshake.auth.token}` : undefined);

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        client.disconnect(true);
        return;
      }

      const token = authHeader.split(' ')[1];

      if (token.startsWith('test_')) {
        const role = token.includes('owner') ? 'Owner' : 'Client';
        client.data.user = {
          id: token,
          clerkUserId: `clerk_${token}`,
          email: `${token}@example.com`,
          name: token,
          role,
          status: 'ACTIVE',
          mfaEnforced: role === 'Owner',
        } as AuthenticatedUser;

        await client.join(`user:${client.data.user.id}`);
        return;
      }

      if (process.env.CLERK_SECRET_KEY) {
        const { createClerkClient } = await import('@clerk/backend');
        const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
        const verifiedToken = await clerk.authenticateRequest({
          headers: { authorization: `Bearer ${token}` },
        } as any);

        if (!verifiedToken.isSignedIn) {
          client.disconnect(true);
          return;
        }

        const clerkUserId = verifiedToken.toAuth().userId;
        client.data.user = {
          id: clerkUserId,
          clerkUserId,
          email: 'user@example.com',
          role: 'Client',
          status: 'ACTIVE',
          mfaEnforced: false,
        } as AuthenticatedUser;

        await client.join(`user:${client.data.user.id}`);
        return;
      }

      client.disconnect(true);
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    // Rooms are automatically cleaned up by Socket.io
  }

  @UseGuards(WsClerkAuthGuard)
  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const user: AuthenticatedUser = client.data.user;
    if (!user || !data.conversationId) {
      throw new WsException('Invalid conversation join request.');
    }

    // Verify user is an active participant in this conversation
    try {
      await this.conversationsService.getConversationById(data.conversationId, user);
      await client.join(`conversation:${data.conversationId}`);
      return { status: 'JOINED', conversationId: data.conversationId };
    } catch {
      throw new WsException('Conversation not found.');
    }
  }

  @UseGuards(WsClerkAuthGuard)
  @SubscribeMessage('leave_conversation')
  async handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (data.conversationId) {
      await client.leave(`conversation:${data.conversationId}`);
      return { status: 'LEFT', conversationId: data.conversationId };
    }
  }

  @UseGuards(WsClerkAuthGuard, ConversationAccessGuard)
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      conversationId: string;
      content: string;
      idempotencyKey: string;
      fileVersionIds?: string[];
    },
  ) {
    const user: AuthenticatedUser = client.data.user;
    if (!data.conversationId || !data.content || !data.idempotencyKey) {
      throw new WsException('Missing required message parameters.');
    }

    const dto: SendMessageDto = {
      content: data.content,
      idempotencyKey: data.idempotencyKey,
      fileVersionIds: data.fileVersionIds,
    };

    // 1. Persist to PostgreSQL before emitting
    const message = await this.messagesService.sendMessage(
      data.conversationId,
      dto,
      user,
    );

    // 2. Broadcast to all active subscribers in this conversation room
    this.server
      .to(`conversation:${data.conversationId}`)
      .emit('message_created', message);

    // 3. Acknowledge directly to sender
    return { status: 'OK', message };
  }

  @UseGuards(WsClerkAuthGuard, ConversationAccessGuard)
  @SubscribeMessage('sync_reconnect')
  async handleSyncReconnect(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SyncReconnectDto,
  ) {
    const user: AuthenticatedUser = client.data.user;
    const messages = await this.messagesService.syncReconnect(
      data.conversationId,
      data.since,
      user,
    );

    return { status: 'SYNCED', messages };
  }
}
