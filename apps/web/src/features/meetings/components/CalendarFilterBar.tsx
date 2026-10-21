import React from 'react';
import type { CalendarEventType } from '../../../services/calendar-api';
import { Video, Flag, Receipt } from 'lucide-react';

export interface CalendarFilterBarProps {
  activeFilters: Set<CalendarEventType>;
  onToggleFilter: (type: CalendarEventType) => void;
  showInvoices?: boolean;
}

export const CalendarFilterBar: React.FC<CalendarFilterBarProps> = ({
  activeFilters,
  onToggleFilter,
  showInvoices = true,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => onToggleFilter('MEETING')}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
          activeFilters.has('MEETING')
            ? 'bg-[var(--primary)]/15 border-[var(--primary)] text-[var(--text)]'
            : 'bg-[var(--surface-raised)] border-[var(--border)] text-[var(--muted-text)] opacity-60'
        }`}
      >
        <Video className="w-3.5 h-3.5 text-[var(--primary)]" />
        Meetings
      </button>

      <button
        type="button"
        onClick={() => onToggleFilter('MILESTONE')}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
          activeFilters.has('MILESTONE')
            ? 'bg-purple-500/15 border-purple-500 text-[var(--text)]'
            : 'bg-[var(--surface-raised)] border-[var(--border)] text-[var(--muted-text)] opacity-60'
        }`}
      >
        <Flag className="w-3.5 h-3.5 text-purple-400" />
        Milestones
      </button>

      {showInvoices && (
        <button
          type="button"
          onClick={() => onToggleFilter('INVOICE')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
            activeFilters.has('INVOICE')
              ? 'bg-amber-500/15 border-amber-500 text-[var(--text)]'
              : 'bg-[var(--surface-raised)] border-[var(--border)] text-[var(--muted-text)] opacity-60'
          }`}
        >
          <Receipt className="w-3.5 h-3.5 text-amber-400" />
          Invoices
        </button>
      )}
    </div>
  );
};
