import React from 'react';
import type { CalendarEvent } from '../../../services/calendar-api';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Video, Flag, Receipt, Clock, ExternalLink } from 'lucide-react';

export interface CalendarAgendaViewProps {
  events: CalendarEvent[];
  activeTimezone: string;
  onSelectEvent: (event: CalendarEvent) => void;
}

export const CalendarAgendaView: React.FC<CalendarAgendaViewProps> = ({
  events,
  activeTimezone,
  onSelectEvent,
}) => {
  // Group events by formatted date string
  const groupedEvents = React.useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const evt of events) {
      const d = new Date(evt.date);
      const dateKey = d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: activeTimezone,
      });

      const list = map.get(dateKey) || [];
      list.push(evt);
      map.set(dateKey, list);
    }
    return Array.from(map.entries());
  }, [events, activeTimezone]);

  if (events.length === 0) {
    return (
      <div className="text-center py-12 border border-[var(--border)] rounded-2xl bg-[var(--surface)] p-6">
        <p className="text-sm font-semibold text-[var(--text)]">No events scheduled</p>
        <p className="text-xs text-[var(--muted-text)] mt-1">
          There are no upcoming meetings, milestones, or due invoices matching your selected filters.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groupedEvents.map(([dateKey, dayEvents]) => (
        <div key={dateKey} className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">
              {dateKey}
            </h3>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>

          <div className="space-y-2">
            {dayEvents.map((evt) => {
              const d = new Date(evt.date);
              const timeString = d.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: activeTimezone,
              });

              return (
                <div
                  key={evt.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border-strong)] transition-colors gap-3"
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        evt.type === 'MEETING'
                          ? 'bg-[var(--primary)]/10 text-[var(--primary-link)]'
                          : evt.type === 'MILESTONE'
                          ? 'bg-purple-500/10 text-purple-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}
                    >
                      {evt.type === 'MEETING' && <Video className="w-5 h-5" />}
                      {evt.type === 'MILESTONE' && <Flag className="w-5 h-5" />}
                      {evt.type === 'INVOICE' && <Receipt className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-[var(--text)]">{evt.title}</h4>
                        <Badge
                          size="sm"
                          variant={
                            evt.status === 'ACCEPTED' || evt.status === 'APPROVED' || evt.status === 'PAID'
                              ? 'success'
                              : evt.status === 'CANCELLED' || evt.status === 'OVERDUE'
                              ? 'danger'
                              : 'warning'
                          }
                        >
                          {evt.status}
                        </Badge>
                      </div>

                      {evt.description && (
                        <p className="text-xs text-[var(--muted-text)] mt-0.5 max-w-xl">
                          {evt.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-1.5 text-xs text-[var(--muted-text)]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {timeString} ({activeTimezone})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {evt.type === 'MEETING' && evt.metadata?.meetingUrl && evt.status !== 'CANCELLED' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => window.open(evt.metadata.meetingUrl, '_blank')}
                        rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                      >
                        Join Call
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSelectEvent(evt)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
