import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Spinner } from '../../../components/ui/Spinner';
import { useOwnerMeetings } from '../hooks/useOwnerMeetings';
import { AssignMeetingProjectModal } from '../components/AssignMeetingProjectModal';
import { MeetingDetailModal } from '../../meetings/components/MeetingDetailModal';
import type { Meeting } from '../../../services/meetings-api';
import { fetchOwnerProjects } from '../../../services/projects-api';
import { Video, Calendar, Clock, Filter, ExternalLink, Link2, ShieldCheck } from 'lucide-react';

export const OwnerMeetingsPage: React.FC = () => {
  const {
    meetings,
    selectedProjectId,
    setSelectedProjectId,
    selectedStatus,
    setSelectedStatus,
    isLoading,
    reassignMeeting,
  } = useOwnerMeetings();

  const [projectOptions, setProjectOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [triageMeeting, setTriageMeeting] = useState<Meeting | null>(null);
  const [isAssignOpen, setIsAssignOpen] = useState<boolean>(false);
  const [detailMeeting, setDetailMeeting] = useState<Meeting | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  useEffect(() => {
    fetchOwnerProjects()
      .then((data) => {
        if (Array.isArray(data)) setProjectOptions(data);
      })
      .catch(() => {});
  }, []);

  const activeMeetings = meetings.filter((m) => m.status === 'ACCEPTED').length;
  const rescheduledMeetings = meetings.filter((m) => m.status === 'RESCHEDULED').length;
  const cancelledMeetings = meetings.filter((m) => m.status === 'CANCELLED').length;

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)]">
            Meetings & Schedule
          </h1>
          <p className="text-sm text-[var(--muted-text)] mt-1">
            Stephen&apos;s verified Cal.com booking ledger, attendee reconciliation, and cross-project calendar administration.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('https://app.cal.com/bookings/upcoming', '_blank')}
            rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
          >
            Cal.com Host Dashboard
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-[var(--surface)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[var(--muted-text)] font-medium">Total Bookings</p>
              <h3 className="text-2xl font-bold text-[var(--text)] mt-1">{meetings.length}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 text-[var(--primary-link)] flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-[var(--surface)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[var(--muted-text)] font-medium">Confirmed Calls</p>
              <h3 className="text-2xl font-bold text-emerald-500 mt-1">{activeMeetings}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Video className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-[var(--surface)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[var(--muted-text)] font-medium">Rescheduled</p>
              <h3 className="text-2xl font-bold text-amber-500 mt-1">{rescheduledMeetings}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-[var(--surface)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[var(--muted-text)] font-medium">Cancelled</p>
              <h3 className="text-2xl font-bold text-red-500 mt-1">{cancelledMeetings}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-[var(--muted-text)] font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] cursor-pointer"
          >
            <option value="">All Client Projects</option>
            {projectOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="ACCEPTED">Confirmed</option>
            <option value="RESCHEDULED">Rescheduled</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <span className="text-xs text-[var(--muted-text)]">
          Timezone: <strong>Africa/Lagos (WAT)</strong>
        </span>
      </div>

      {/* Meetings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Synchronized Cal.com Bookings</CardTitle>
          <CardDescription>Verified provider events with attendee identity mapping.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 flex justify-center">
              <Spinner size="lg" />
            </div>
          ) : meetings.length === 0 ? (
            <div className="text-center py-12 text-xs text-[var(--muted-text)]">
              No meetings found matching your filter criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--muted-text)] font-semibold">
                    <th className="py-3 px-3">Session Title</th>
                    <th className="py-3 px-3">Client / Attendee</th>
                    <th className="py-3 px-3">Project</th>
                    <th className="py-3 px-3">Scheduled Time (Lagos)</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {meetings.map((m) => {
                    const d = new Date(m.startTime);
                    const formattedTime = d.toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'Africa/Lagos',
                    });

                    return (
                      <tr key={m.id} className="hover:bg-[var(--surface-raised)] transition-colors">
                        <td className="py-3.5 px-3">
                          <p className="font-bold text-[var(--text)]">{m.title}</p>
                          <p className="text-[11px] text-[var(--muted-text)] font-mono">UID: {m.calBookingUid}</p>
                        </td>

                        <td className="py-3.5 px-3">
                          <p className="font-medium text-[var(--text)]">{m.client?.name || 'Guest Client'}</p>
                          <p className="text-[11px] text-[var(--muted-text)]">{m.client?.email || 'External'}</p>
                        </td>

                        <td className="py-3.5 px-3">
                          {m.project ? (
                            <span className="font-medium text-[var(--text)]">{m.project.name}</span>
                          ) : (
                            <span className="text-amber-500 font-semibold flex items-center gap-1">
                              Unassigned
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-[var(--text)]">
                          {formattedTime}
                        </td>

                        <td className="py-3.5 px-3">
                          <Badge
                            size="sm"
                            variant={
                              m.status === 'ACCEPTED'
                                ? 'success'
                                : m.status === 'RESCHEDULED'
                                ? 'warning'
                                : 'danger'
                            }
                          >
                            {m.status}
                          </Badge>
                        </td>

                        <td className="py-3.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {m.meetingUrl && m.status !== 'CANCELLED' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(m.meetingUrl!, '_blank')}
                                title="Join Google Meet Video Call"
                              >
                                <Video className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setTriageMeeting(m);
                                setIsAssignOpen(true);
                              }}
                              title="Link to Client Project"
                            >
                              <Link2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setDetailMeeting(m);
                                setIsDetailOpen(true);
                              }}
                            >
                              Details
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <AssignMeetingProjectModal
        open={isAssignOpen}
        onOpenChange={setIsAssignOpen}
        meeting={triageMeeting}
        onSave={reassignMeeting}
      />

      <MeetingDetailModal
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        meeting={detailMeeting}
        activeTimezone="Africa/Lagos"
      />
    </div>
  );
};
