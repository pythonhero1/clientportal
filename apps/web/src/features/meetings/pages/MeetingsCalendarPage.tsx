import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Spinner } from '../../../components/ui/Spinner';
import { useMeetings } from '../hooks/useMeetings';
import { useProjectCalendar } from '../hooks/useProjectCalendar';
import { TimezoneBadge } from '../components/TimezoneBadge';
import { CalendarFilterBar } from '../components/CalendarFilterBar';
import { CalendarMonthView } from '../components/CalendarMonthView';
import { CalendarAgendaView } from '../components/CalendarAgendaView';
import { CalComEmbedModal } from '../components/CalComEmbedModal';
import { MeetingDetailModal } from '../components/MeetingDetailModal';
import type { Meeting } from '../../../services/meetings-api';
import type { CalendarEvent } from '../../../services/calendar-api';
import { fetchProjects } from '../../../services/projects-api';
import { Video, Clock, ChevronLeft, ChevronRight, LayoutGrid, List, Calendar as CalendarIcon, ExternalLink } from 'lucide-react';

export const MeetingsCalendarPage: React.FC = () => {
  const [projectId, setProjectId] = useState<string>('proj_1');
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);

  React.useEffect(() => {
    fetchProjects()
      .then((projs) => {
        if (projs && projs.length > 0) {
          setProjects(projs);
          setProjectId(projs[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const {
    meetings,
    isLoading: isMeetingsLoading,
    refetch: refetchMeetings,
  } = useMeetings(projectId);

  const {
    filteredEvents,
    activeTimezone,
    useStephenTimezone,
    toggleTimezone,
    activeFilters,
    toggleFilter,
    currentDate,
    nextMonth,
    prevMonth,
    resetToToday,
    isLoading: isCalendarLoading,
    refetch: refetchCalendar,
  } = useProjectCalendar(projectId);

  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');
  const [isBookingOpen, setIsBookingOpen] = useState<boolean>(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  const monthName = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const handleSelectEvent = (event: CalendarEvent) => {
    if (event.type === 'MEETING' && event.metadata.meetingId) {
      const match = meetings.find((m) => m.id === event.metadata.meetingId);
      if (match) {
        setSelectedMeeting(match);
        setIsDetailOpen(true);
        return;
      }
    }

    // Synthesize meeting from event metadata if not found in list
    setSelectedMeeting({
      id: event.id,
      calBookingUid: event.metadata.calBookingUid || 'uid_' + event.id,
      title: event.title,
      description: event.description,
      status: (event.status as any) || 'ACCEPTED',
      startTime: event.date,
      endTime: event.endDate || event.date,
      timezone: activeTimezone,
      meetingUrl: event.metadata.meetingUrl,
      rescheduleUrl: event.metadata.rescheduleUrl,
      cancelUrl: event.metadata.cancelUrl,
      cancellationReason: event.metadata.cancellationReason,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setIsDetailOpen(true);
  };

  const handleBookingSuccess = () => {
    refetchMeetings();
    refetchCalendar();
  };

  return (
    <div className="space-y-6 text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)]">
            Meetings & Calendar
          </h1>
          <p className="text-sm text-[var(--muted-text)] mt-1">
            Schedule strategy sessions with Stephen via Cal.com and review upcoming project milestones.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {projects.length > 1 && (
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="text-xs bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text)] rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
          <Button
            variant="primary"
            onClick={() => setIsBookingOpen(true)}
            leftIcon={<Video className="w-4 h-4" />}
          >
            Schedule Strategy Call
          </Button>
        </div>
      </div>

      {/* Control Bar: Month Navigation, Filters, Timezone Badge & View Toggle */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
        <div className="flex flex-wrap items-center gap-3">
          {/* Month Stepper */}
          <div className="flex items-center gap-1.5 bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-1">
            <button
              type="button"
              onClick={prevMonth}
              aria-label="Previous month"
              className="p-1.5 rounded-lg text-[var(--muted-text)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-[var(--text)] px-2 select-none min-w-28 text-center">
              {monthName}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              aria-label="Next month"
              className="p-1.5 rounded-lg text-[var(--muted-text)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <Button variant="ghost" size="sm" onClick={resetToToday}>
            Today
          </Button>

          {/* Timezone Badge */}
          <TimezoneBadge
            activeTimezone={activeTimezone}
            isStephenTimezone={useStephenTimezone}
            onToggle={toggleTimezone}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Event Filter Pills */}
          <CalendarFilterBar
            activeFilters={activeFilters}
            onToggleFilter={toggleFilter}
            showInvoices={true}
          />

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-1">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              aria-label="Month View"
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'month'
                  ? 'bg-[var(--surface)] text-[var(--text)] shadow-xs font-bold'
                  : 'text-[var(--muted-text)] hover:text-[var(--text)]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Month</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('agenda')}
              aria-label="Agenda View"
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'agenda'
                  ? 'bg-[var(--surface)] text-[var(--text)] shadow-xs font-bold'
                  : 'text-[var(--muted-text)] hover:text-[var(--text)]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Agenda</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Calendar Container + Quick Actions Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View Area */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-[var(--primary)]" />
                  <span>Project Schedule</span>
                </CardTitle>
                <CardDescription>
                  Meetings, milestone checkpoints, and authorized invoice dates.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {isCalendarLoading ? (
                <div className="h-80 flex flex-col items-center justify-center gap-3">
                  <Spinner size="lg" />
                  <p className="text-xs text-[var(--muted-text)]">Loading project events...</p>
                </div>
              ) : viewMode === 'month' ? (
                <CalendarMonthView
                  currentDate={currentDate}
                  events={filteredEvents}
                  activeTimezone={activeTimezone}
                  onSelectEvent={handleSelectEvent}
                />
              ) : (
                <CalendarAgendaView
                  events={filteredEvents}
                  activeTimezone={activeTimezone}
                  onSelectEvent={handleSelectEvent}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Upcoming Confirmed Meetings & Cal.com Status */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Scheduled Calls</CardTitle>
              <CardDescription>Synchronized from Stephen&apos;s verified Cal.com availability</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isMeetingsLoading ? (
                <div className="py-6 flex justify-center">
                  <Spinner size="md" />
                </div>
              ) : meetings.length === 0 ? (
                <div className="text-center py-6 text-xs text-[var(--muted-text)]">
                  No upcoming calls scheduled with Stephen.
                </div>
              ) : (
                meetings.map((m) => {
                  const d = new Date(m.startTime);
                  const formattedTime = d.toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: activeTimezone,
                  });

                  return (
                    <div
                      key={m.id}
                      onClick={() => {
                        setSelectedMeeting(m);
                        setIsDetailOpen(true);
                      }}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] hover:border-[var(--border-strong)] transition-colors cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[var(--primary)]/10 text-[var(--primary-link)] flex items-center justify-center shrink-0">
                          <Video className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-[var(--text)] line-clamp-1">{m.title}</h4>
                          <p className="text-[11px] text-[var(--muted-text)] flex items-center gap-1.5 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {formattedTime}
                          </p>
                        </div>
                      </div>
                      <Badge variant="success" size="sm">
                        {m.status}
                      </Badge>
                    </div>
                  );
                })
              )}

              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={() => setIsBookingOpen(true)}
                leftIcon={<Video className="w-4 h-4" />}
              >
                Schedule New Session
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Calendar Integration</CardTitle>
              <CardDescription>Cal.com Provider Link</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-[var(--muted-text)] leading-relaxed">
                Connect your Google or Outlook calendar to automatically synchronize project deadlines and milestone checkpoints.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                rightIcon={<ExternalLink className="w-4 h-4" />}
                onClick={() => window.open('https://cal.com/oderinde/free', '_blank')}
              >
                Open Cal.com Booking
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <CalComEmbedModal
        open={isBookingOpen}
        onOpenChange={setIsBookingOpen}
        projectId={projectId}
        onBookingSuccess={handleBookingSuccess}
      />

      <MeetingDetailModal
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        meeting={selectedMeeting}
        activeTimezone={activeTimezone}
      />
    </div>
  );
};
