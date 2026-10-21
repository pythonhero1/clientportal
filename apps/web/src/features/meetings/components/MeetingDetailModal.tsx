import React from 'react';
import { Dialog } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import type { Meeting } from '../../../services/meetings-api';
import { Video, Clock, Calendar, ExternalLink, AlertTriangle } from 'lucide-react';

export interface MeetingDetailModalProps {
  meeting: Meeting | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeTimezone: string;
}

export const MeetingDetailModal: React.FC<MeetingDetailModalProps> = ({
  meeting,
  open,
  onOpenChange,
  activeTimezone,
}) => {
  if (!meeting) return null;

  const startDate = new Date(meeting.startTime);
  const endDate = new Date(meeting.endTime);

  const formatOptions: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: activeTimezone,
  };

  const formattedStart = startDate.toLocaleString('en-US', formatOptions);
  const formattedEndTime = endDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: activeTimezone,
  });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={meeting.title}
      description="Strategy session details and connection coordinates."
      className="max-w-lg"
    >
      <div className="space-y-4">
        {/* Status Badge */}
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
          <span className="text-xs text-[var(--muted-text)] font-medium">Session Status</span>
          <Badge
            variant={
              meeting.status === 'ACCEPTED'
                ? 'success'
                : meeting.status === 'RESCHEDULED'
                ? 'warning'
                : 'danger'
            }
          >
            {meeting.status}
          </Badge>
        </div>

        {/* Date and Time */}
        <div className="p-3.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] space-y-2">
          <div className="flex items-center gap-2.5 text-xs text-[var(--text)] font-medium">
            <Calendar className="w-4 h-4 text-[var(--primary)]" />
            <span>{formattedStart} - {formattedEndTime}</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-[var(--muted-text)]">
            <Clock className="w-4 h-4" />
            <span>Displayed in {activeTimezone}</span>
          </div>
        </div>

        {/* Meeting Video Coordinates */}
        {meeting.meetingUrl && meeting.status !== 'CANCELLED' && (
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/20">
            <div className="flex items-center gap-2.5">
              <Video className="w-5 h-5 text-[var(--primary-link)]" />
              <div>
                <p className="text-xs font-bold text-[var(--text)]">Google Meet Video Call</p>
                <p className="text-xs text-[var(--muted-text)] truncate max-w-xs">{meeting.meetingUrl}</p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => window.open(meeting.meetingUrl!, '_blank')}
              rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
            >
              Join Call
            </Button>
          </div>
        )}

        {/* Cancellation Notice */}
        {meeting.status === 'CANCELLED' && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Meeting Cancelled</p>
              {meeting.cancellationReason && (
                <p className="mt-0.5 text-xs opacity-90">{meeting.cancellationReason}</p>
              )}
            </div>
          </div>
        )}

        {/* Attendees */}
        {meeting.attendees && meeting.attendees.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="text-xs font-medium text-[var(--muted-text)]">Participants</span>
            <div className="text-xs text-[var(--text)] space-y-1">
              {meeting.attendees.map((a, i) => (
                <div key={i} className="flex items-center justify-between py-1 border-b border-[var(--border)] last:border-0">
                  <span className="font-medium">{a.name}</span>
                  <span className="text-[var(--muted-text)]">{a.email}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reschedule / Cancel actions */}
        {meeting.status !== 'CANCELLED' && (
          <div className="pt-3 border-t border-[var(--border)] flex items-center justify-end gap-2">
            {meeting.rescheduleUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(meeting.rescheduleUrl!, '_blank')}
              >
                Reschedule Session
              </Button>
            )}
            {meeting.cancelUrl && (
              <Button
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                onClick={() => window.open(meeting.cancelUrl!, '_blank')}
              >
                Cancel Session
              </Button>
            )}
          </div>
        )}
      </div>
    </Dialog>
  );
};
