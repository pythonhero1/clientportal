import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OwnerMessagesPage } from './OwnerMessagesPage';
import { ThemeProvider } from '../../../contexts/ThemeContext';
import { ToastProvider } from '../../../contexts/ToastContext';
import { messagesApi } from '../../../services/messages-api';

vi.mock('../../../services/messages-api', () => ({
  messagesApi: {
    listConversations: vi.fn(),
    getConversation: vi.fn(),
    getMessages: vi.fn(),
    sendMessage: vi.fn(),
    createConversation: vi.fn(),
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

vi.mock('../../../services/projects-api', () => ({
  fetchOwnerProjects: vi.fn().mockResolvedValue([
    { id: 'proj_1', name: 'Stephen Showcase Website' },
  ]),
  fetchProjects: vi.fn().mockResolvedValue([
    { id: 'proj_1', name: 'Stephen Showcase Website' },
  ]),
  getActivePersona: vi.fn().mockReturnValue({
    id: 'owner',
    name: 'Stephen Oderinde',
    role: 'Owner',
    email: 'owner@oderindestephen.com',
  }),
}));

describe('OwnerMessagesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (messagesApi.listConversations as any).mockResolvedValue([
      {
        id: 'conv_1',
        type: 'GROUP',
        title: 'Project Alpha Review',
        projectId: 'proj_1',
        project: { id: 'proj_1', name: 'Stephen Showcase Website' },
        createdById: 'owner',
        lastMessageAt: new Date().toISOString(),
        memberships: [
          {
            id: 'mem_1',
            conversationId: 'conv_1',
            userId: 'owner',
            role: 'OWNER',
            joinedAt: new Date().toISOString(),
            leftAt: null,
            user: { id: 'owner', name: 'Stephen Oderinde', role: 'Owner' },
          },
        ],
        messages: [
          {
            id: 'msg_1',
            conversationId: 'conv_1',
            senderId: 'owner',
            content: 'Kickoff review channel created.',
            createdAt: new Date().toISOString(),
          },
        ],
      },
    ]);

    (messagesApi.getMessages as any).mockResolvedValue([
      {
        id: 'msg_1',
        conversationId: 'conv_1',
        senderId: 'owner',
        sender: { id: 'owner', name: 'Stephen Oderinde', email: 'owner@oderindestephen.com', role: 'Owner' },
        content: 'Kickoff review channel created.',
        idempotencyKey: 'idem-owner-1',
        createdAt: new Date().toISOString(),
      },
    ]);
  });

  const renderComponent = () => {
    return render(
      <ThemeProvider>
        <ToastProvider>
          <OwnerMessagesPage />
        </ToastProvider>
      </ThemeProvider>,
    );
  };

  it('renders Owner Suite badge and messaging title', async () => {
    renderComponent();

    expect(screen.getByText('Messages & Channel Management')).toBeInTheDocument();
    expect(screen.getByText('Owner Suite')).toBeInTheDocument();
  });

  it('opens Create Group Channel modal when clicking New Group', async () => {
    renderComponent();

    const newGroupBtn = screen.getByRole('button', { name: /New Group/i });
    expect(newGroupBtn).toBeInTheDocument();

    fireEvent.click(newGroupBtn);

    await waitFor(() => {
      expect(screen.getByText('Create Project Group Channel')).toBeInTheDocument();
    });
  });
});
