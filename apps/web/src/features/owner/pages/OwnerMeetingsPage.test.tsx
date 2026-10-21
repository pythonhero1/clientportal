import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OwnerMeetingsPage } from './OwnerMeetingsPage';

vi.mock('../hooks/useOwnerMeetings', () => ({
  useOwnerMeetings: () => ({
    meetings: [
      {
        id: 'm_1',
        calBookingUid: 'cal_uid_101',
        title: 'Wireframe Review & Architecture Walkthrough',
        startTime: '2026-10-21T15:00:00.000Z',
        endTime: '2026-10-21T15:30:00.000Z',
        status: 'ACCEPTED',
        timezone: 'Africa/Lagos',
        meetingUrl: 'https://meet.google.com/abc-defg-hij',
        client: { name: 'Client A', email: 'client_a@example.com' },
        project: { name: 'Stephen Showcase Website' },
      },
      {
        id: 'm_2',
        calBookingUid: 'cal_uid_102',
        title: 'Milestone 2 Architecture Handoff',
        startTime: '2026-10-24T11:00:00.000Z',
        endTime: '2026-10-24T11:30:00.000Z',
        status: 'RESCHEDULED',
        timezone: 'Africa/Lagos',
        meetingUrl: 'https://meet.google.com/xyz-uvw-rst',
        client: { name: 'Client B', email: 'client_b@example.com' },
        project: null, // Unassigned
      },
    ],
    selectedProjectId: '',
    setSelectedProjectId: vi.fn(),
    selectedStatus: '',
    setSelectedStatus: vi.fn(),
    isLoading: false,
    reassignMeeting: vi.fn(),
  }),
}));

describe('OwnerMeetingsPage', () => {
  it('renders page title and Cal.com Host Dashboard action', () => {
    render(<OwnerMeetingsPage />);
    expect(screen.getByText('Meetings & Schedule')).toBeInTheDocument();
    expect(screen.getByText(/Cal\.com Host Dashboard/)).toBeInTheDocument();
  });

  it('renders metrics cards with correct counts', () => {
    render(<OwnerMeetingsPage />);
    expect(screen.getByText('Total Bookings')).toBeInTheDocument();
    expect(screen.getByText('Confirmed Calls')).toBeInTheDocument();
    expect(screen.getAllByText('Rescheduled')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Cancelled')[0]).toBeInTheDocument();
  });

  it('renders meeting rows with project and attendee details', () => {
    render(<OwnerMeetingsPage />);
    expect(screen.getByText('Wireframe Review & Architecture Walkthrough')).toBeInTheDocument();
    expect(screen.getByText('Client A')).toBeInTheDocument();
    expect(screen.getByText('Stephen Showcase Website')).toBeInTheDocument();
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
  });
});
