import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { SettingsPage } from './SettingsPage';

vi.mock('../../../hooks/useTheme', () => ({
  useTheme: () => ({
    theme: 'dark',
    setTheme: vi.fn(),
  }),
}));

vi.mock('../../../services/settings-api', () => ({
  fetchUserProfile: vi.fn().mockResolvedValue({
    id: 'usr_1',
    email: 'client@example.com',
    name: 'Acme Client',
    role: 'Client' as const,
    companyName: 'Acme Corp',
    phone: '+2348000000000',
    themePreference: 'system',
    mfaEnforced: false,
  }),
  updateUserProfile: vi.fn().mockImplementation((payload) => Promise.resolve(payload)),
  fetchNotificationPreferences: vi.fn().mockResolvedValue({
    inAppDeliverables: true,
    inAppMessages: true,
    inAppInvoices: true,
    inAppSupport: true,
    pushDeliverables: true,
    pushMessages: true,
    pushInvoices: false,
    pushSupport: true,
  }),
  updateNotificationPreferences: vi.fn(),
  fetchActiveSessions: vi.fn().mockResolvedValue([
    {
      id: 'sess_1',
      status: 'active',
      isCurrent: true,
      lastActiveAt: new Date().toISOString(),
      device: 'Desktop Chrome (Windows)',
    },
  ]),
  revokeSession: vi.fn(),
}));

describe('SettingsPage (Screen 16)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page heading and loads account settings', async () => {
    render(<SettingsPage />);

    expect(screen.getByText('Account & Security Settings')).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText('Contact Profile')).toBeDefined();
    });

    expect(screen.getByDisplayValue('Acme Client')).toBeDefined();
    expect(screen.getByDisplayValue('client@example.com')).toBeDefined();
  });

  it('displays theme switcher buttons', async () => {
    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Theme Appearance')).toBeDefined();
    });

    expect(screen.getByText('Dark Mode')).toBeDefined();
    expect(screen.getByText('Light Mode')).toBeDefined();
    expect(screen.getByText('System Default')).toBeDefined();
  });

  it('renders notification delivery preferences', async () => {
    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Notification Preferences')).toBeDefined();
    });

    await waitFor(() => {
      expect(screen.getByText('Deliverable Reviews & Feedback')).toBeDefined();
      expect(screen.getByText('Portal Messages & Discussions')).toBeDefined();
    });
  });

  it('renders authentication security and active sessions list', async () => {
    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Authentication & Multi-Factor Security')).toBeDefined();
    });

    await waitFor(() => {
      expect(screen.getByText('Active Devices & Sessions')).toBeDefined();
      expect(screen.getByText('Desktop Chrome (Windows)')).toBeDefined();
    });
  });
});
