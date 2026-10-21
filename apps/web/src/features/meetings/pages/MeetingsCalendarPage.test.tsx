import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MeetingsCalendarPage } from './MeetingsCalendarPage';

// Mock child components that make fetch calls or load iframes
vi.mock('../components/CalComEmbedModal', () => ({
  CalComEmbedModal: ({ open }: { open: boolean }) =>
    open ? <div data-testid="calcom-modal">CalCom Modal Open</div> : null,
}));

vi.mock('../components/MeetingDetailModal', () => ({
  MeetingDetailModal: ({ open }: { open: boolean }) =>
    open ? <div data-testid="detail-modal">Detail Modal Open</div> : null,
}));

// Mock hooks
vi.mock('../hooks/useMeetings', () => ({
  useMeetings: () => ({
    meetings: [
      {
        id: 'm_1',
        title: 'Wireframe Review & Architecture Walkthrough',
        startTime: '2026-10-21T15:00:00.000Z',
        endTime: '2026-10-21T15:30:00.000Z',
        status: 'ACCEPTED',
        timezone: 'Africa/Lagos',
      },
    ],
    isLoading: false,
    refetch: vi.fn(),
  }),
}));

vi.mock('../hooks/useProjectCalendar', () => ({
  useProjectCalendar: () => ({
    filteredEvents: [
      {
        id: 'meeting_1',
        type: 'MEETING',
        title: 'Wireframe Review & Architecture Walkthrough',
        date: '2026-10-21T15:00:00.000Z',
        status: 'ACCEPTED',
        colorVariant: 'primary',
        metadata: {},
      },
      {
        id: 'milestone_1',
        type: 'MILESTONE',
        title: 'Milestone: Architecture Approval',
        date: '2026-10-23T18:00:00.000Z',
        status: 'PLANNED',
        colorVariant: 'accent',
        metadata: {},
      },
    ],
    activeTimezone: 'Africa/Lagos',
    useStephenTimezone: true,
    toggleTimezone: vi.fn(),
    activeFilters: new Set(['MEETING', 'MILESTONE', 'INVOICE']),
    toggleFilter: vi.fn(),
    currentDate: new Date(2026, 9, 21),
    nextMonth: vi.fn(),
    prevMonth: vi.fn(),
    resetToToday: vi.fn(),
    isLoading: false,
    refetch: vi.fn(),
  }),
}));

describe('MeetingsCalendarPage (Screen 14)', () => {
  it('renders page title and subtitle', () => {
    render(<MeetingsCalendarPage />);
    expect(screen.getByText('Meetings & Calendar')).toBeInTheDocument();
    expect(
      screen.getByText(/Schedule strategy sessions with Stephen via Cal.com/)
    ).toBeInTheDocument();
  });

  it('renders "Schedule Strategy Call" button and opens booking modal', () => {
    render(<MeetingsCalendarPage />);
    const scheduleBtn = screen.getByRole('button', { name: /Schedule (30-Min Call|Strategy Call)/i });
    expect(scheduleBtn).toBeInTheDocument();

    fireEvent.click(scheduleBtn);
    expect(screen.getByTestId('calcom-modal')).toBeInTheDocument();
  });

  it('renders timezone badge showing Stephen\'s Africa/Lagos timezone', () => {
    render(<MeetingsCalendarPage />);
    expect(screen.getByText(/Africa\/Lagos/)).toBeInTheDocument();
  });

  it('toggles between Month grid and Agenda list view', () => {
    render(<MeetingsCalendarPage />);

    const agendaToggle = screen.getByRole('button', { name: /Agenda View/i });
    fireEvent.click(agendaToggle);

    // In agenda view, shows the grouped events
    expect(screen.getAllByText(/Wireframe Review & Architecture Walkthrough/)[0]).toBeInTheDocument();
  });
});
