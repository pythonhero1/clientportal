import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationsPage } from './NotificationsPage';

const mockNotifications = [
  {
    id: 'notif_1',
    userId: 'user_1',
    type: 'MESSAGE_RECEIVED' as const,
    title: 'New message received',
    message: 'Stephen sent a new message in project thread.',
    link: '/messages',
    isRead: false,
    readAt: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'notif_2',
    userId: 'user_1',
    type: 'FILE_DELIVERABLE_UPLOADED' as const,
    title: 'Deliverable ready for review',
    message: 'Figma wireframes updated.',
    link: '/files',
    isRead: true,
    readAt: new Date().toISOString(),
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

const mockMarkRead = vi.fn();
const mockMarkAllRead = vi.fn();
const mockRefetch = vi.fn();
const mockSetFilter = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('../hooks/useNotifications', () => ({
  useNotifications: () => ({
    notifications: mockNotifications,
    unreadCount: 1,
    isLoading: false,
    error: null,
    filter: {},
    setFilter: mockSetFilter,
    markRead: mockMarkRead,
    markAllRead: mockMarkAllRead,
    refetch: mockRefetch,
  }),
}));

vi.mock('../hooks/useWebPush', () => ({
  useWebPush: () => ({
    isSupported: true,
    isSubscribed: false,
    permission: 'default',
    isLoading: false,
    error: null,
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  }),
}));

describe('NotificationsPage (Screen 15)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders notification heading and unread count badge', () => {
    render(<NotificationsPage />);
    expect(screen.getByText('Notifications Center')).toBeDefined();
    expect(screen.getByText('Mark all as read')).toBeDefined();
  });

  it('displays notification items with titles and messages', () => {
    render(<NotificationsPage />);
    expect(screen.getByText('New message received')).toBeDefined();
    expect(screen.getByText('Deliverable ready for review')).toBeDefined();
    expect(screen.getByText('Stephen sent a new message in project thread.')).toBeDefined();
  });

  it('calls markAllRead when "Mark all read" button is clicked', () => {
    render(<NotificationsPage />);
    const markAllBtn = screen.getByText('Mark all as read');
    fireEvent.click(markAllBtn);
    expect(mockMarkAllRead).toHaveBeenCalledTimes(1);
  });

  it('renders web push banner when push is not yet enabled', () => {
    render(<NotificationsPage />);
    expect(screen.getByText('Enable Instant Push Notifications')).toBeDefined();
  });

  it('calls setFilter when Unread filter chip is clicked', () => {
    render(<NotificationsPage />);
    const unreadTab = screen.getByText('Unread (1)');
    fireEvent.click(unreadTab);
    expect(mockSetFilter).toHaveBeenCalledWith({ isRead: false });
  });
});
