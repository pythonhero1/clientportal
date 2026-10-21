import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MessagesPage } from './MessagesPage';
import { ThemeProvider } from '../../../contexts/ThemeContext';
import { ToastProvider } from '../../../contexts/ToastContext';
import { messagesApi } from '../../../services/messages-api';
import { messagesSocket } from '../../../services/messages-socket';

vi.mock('../../../services/messages-api', () => ({
  messagesApi: {
    listConversations: vi.fn(),
    getConversation: vi.fn(),
    getMessages: vi.fn(),
    sendMessage: vi.fn(),
    syncReconnect: vi.fn(),
  },
}));

vi.mock('../../../services/messages-socket', () => ({
  messagesSocket: {
    connect: vi.fn(),
    joinConversation: vi.fn(),
    leaveConversation: vi.fn(),
    sendMessage: vi.fn(),
    onMessage: vi.fn(() => () => {}),
    onStatusChange: vi.fn((cb) => {
      cb(true);
      return () => {};
    }),
    disconnect: vi.fn(),
  },
}));

describe('MessagesPage (Screen 13)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (messagesApi.listConversations as any).mockResolvedValue([
      {
        id: 'conv_1',
        type: 'PROJECT',
        title: 'Showcase Deliverables Discussion',
        projectId: 'proj_1',
        project: { id: 'proj_1', name: 'Stephen Showcase Website' },
        createdById: 'owner_1',
        lastMessageAt: new Date().toISOString(),
        memberships: [
          {
            id: 'mem_1',
            conversationId: 'conv_1',
            userId: 'client_1',
            role: 'MEMBER',
            joinedAt: new Date().toISOString(),
            leftAt: null,
            user: { id: 'client_1', name: 'Client One', email: 'client@example.com', role: 'Client' },
          },
        ],
        messages: [
          {
            id: 'msg_1',
            conversationId: 'conv_1',
            senderId: 'owner_1',
            content: 'Wireframes are ready for inspection.',
            createdAt: new Date().toISOString(),
          },
        ],
      },
    ]);

    (messagesApi.getMessages as any).mockResolvedValue([
      {
        id: 'msg_1',
        conversationId: 'conv_1',
        senderId: 'owner_1',
        sender: { id: 'owner_1', name: 'Stephen Oderinde', email: 'stephen@example.com', role: 'Owner' },
        content: 'Wireframes are ready for inspection.',
        idempotencyKey: 'idem-1',
        createdAt: new Date().toISOString(),
      },
    ]);
  });

  const renderComponent = () => {
    return render(
      <ThemeProvider>
        <ToastProvider>
          <MessagesPage />
        </ToastProvider>
      </ThemeProvider>,
    );
  };

  it('renders messages page heading and connected badge', async () => {
    renderComponent();

    expect(screen.getByText('Messages & Communication')).toBeInTheDocument();
    expect(screen.getByText('Connected')).toBeInTheDocument();
    // Fixture badge must NOT be present
    expect(screen.queryByText('P05 Preview')).not.toBeInTheDocument();
  });

  it('displays conversations in channel list and loads active messages', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByText('Showcase Deliverables Discussion').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Wireframes are ready for inspection.').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('allows sending a message', async () => {
    (messagesSocket.sendMessage as any).mockResolvedValue({
      id: 'msg_new',
      conversationId: 'conv_1',
      senderId: 'client_a',
      sender: { id: 'client_a', name: 'Client', role: 'Client' },
      content: 'Reviewing wireframes now.',
      idempotencyKey: 'idem-new',
      createdAt: new Date().toISOString(),
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Type a message/i)).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/Type a message/i);
    fireEvent.change(input, { target: { value: 'Reviewing wireframes now.' } });

    const sendBtn = screen.getByRole('button', { name: /Send/i });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(messagesSocket.sendMessage).toHaveBeenCalledWith(
        'conv_1',
        'Reviewing wireframes now.',
        expect.any(String),
        [],
      );
    });
  });
});
