import React from 'react';
import type { CalendarEvent } from '../../../services/calendar-api';
import { Video, Flag, Receipt } from 'lucide-react';

export interface CalendarMonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  activeTimezone: string;
  onSelectEvent: (event: CalendarEvent) => void;
}

export const CalendarMonthView: React.FC<CalendarMonthViewProps> = ({
  currentDate,
  events,
  activeTimezone,
  onSelectEvent,
}) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Map events by ISO date string (YYYY-MM-DD in activeTimezone)
  const eventsByDay = React.useMemo(() => {
    const map = new Map<number, CalendarEvent[]>();
    for (const evt of events) {
      const d = new Date(evt.date);
      let evtYear = d.getFullYear();
      let evtMonth = d.getMonth();
      let evtDay = d.getDate();

      try {
        const parts = new Intl.DateTimeFormat('en-US', {
          timeZone: activeTimezone,
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
        }).formatToParts(d);
        const yVal = parts.find((p) => p.type === 'year')?.value;
        const mVal = parts.find((p) => p.type === 'month')?.value;
        const dVal = parts.find((p) => p.type === 'day')?.value;
        if (yVal && mVal && dVal) {
          evtYear = parseInt(yVal, 10);
          evtMonth = parseInt(mVal, 10) - 1;
          evtDay = parseInt(dVal, 10);
        }
      } catch {
        // Fall back to local UTC/system extraction if timezone string is malformed
      }

      if (evtYear === year && evtMonth === month) {
        const list = map.get(evtDay) || [];
        list.push(evt);
        map.set(evtDay, list);
      }
    }
    return map;
  }, [events, year, month, activeTimezone]);

  const cells: React.ReactNode[] = [];

  // Padding cells before the 1st day of month
  for (let i = 0; i < firstDayOfMonth; i++) {
    cells.push(
      <div
        key={`pad-${i}`}
        className="min-h-24 sm:min-h-28 p-1.5 bg-[var(--surface-raised)]/30 border border-[var(--border)] opacity-30 select-none"
      />
    );
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayEvents = eventsByDay.get(day) || [];
    const isToday = day === 21 && month === 9 && year === 2026; // Oct 21, 2026 target

    cells.push(
      <div
        key={`day-${day}`}
        tabIndex={0}
        aria-label={`Day ${day}`}
        className={`min-h-24 sm:min-h-28 p-2 rounded-xl border flex flex-col justify-between transition-colors focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] ${
          isToday
            ? 'bg-[var(--primary)]/5 border-[var(--primary)]'
            : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-strong)]'
        }`}
      >
        <div className="flex items-center justify-between mb-1">
          <span
            className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
              isToday
                ? 'bg-[var(--primary)] text-white'
                : 'text-[var(--text)]'
            }`}
          >
            {day}
          </span>
          {dayEvents.length > 0 && (
            <span className="text-[10px] text-[var(--muted-text)] font-semibold hidden sm:inline">
              {dayEvents.length} {dayEvents.length === 1 ? 'item' : 'items'}
            </span>
          )}
        </div>

        <div className="space-y-1 overflow-y-auto max-h-20">
          {dayEvents.slice(0, 3).map((evt) => (
            <button
              key={evt.id}
              type="button"
              onClick={() => onSelectEvent(evt)}
              className={`w-full text-left px-1.5 py-1 rounded text-[11px] font-medium truncate flex items-center gap-1 transition-all cursor-pointer ${
                evt.type === 'MEETING'
                  ? 'bg-[var(--primary)]/15 text-[var(--text)] hover:bg-[var(--primary)]/25'
                  : evt.type === 'MILESTONE'
                  ? 'bg-purple-500/15 text-purple-300 hover:bg-purple-500/25'
                  : 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25'
              }`}
              title={`${evt.title} (${evt.type})`}
            >
              {evt.type === 'MEETING' && <Video className="w-2.5 h-2.5 shrink-0 text-[var(--primary)]" />}
              {evt.type === 'MILESTONE' && <Flag className="w-2.5 h-2.5 shrink-0 text-purple-400" />}
              {evt.type === 'INVOICE' && <Receipt className="w-2.5 h-2.5 shrink-0 text-amber-400" />}
              <span className="truncate">{evt.title}</span>
            </button>
          ))}
          {dayEvents.length > 3 && (
            <span className="text-[10px] text-[var(--muted-text)] block text-center">
              +{dayEvents.length - 3} more
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header Row */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-semibold text-[var(--muted-text)] py-1">
        {dayHeaders.map((dh) => (
          <div key={dh}>{dh}</div>
        ))}
      </div>

      {/* Grid Cells */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">{cells}</div>
    </div>
  );
};
