import React from 'react';
import type { NotificationFilterParams } from '../../../services/notifications-api';

interface NotificationFiltersProps {
  currentFilter?: NotificationFilterParams;
  onFilterChange: (filter: NotificationFilterParams) => void;
  unreadCount: number;
}

export const NotificationFilters: React.FC<NotificationFiltersProps> = ({
  currentFilter = {},
  onFilterChange,
  unreadCount,
}) => {
  const tabs = [
    { label: 'All', filter: {} },
    { label: `Unread (${unreadCount})`, filter: { isRead: false } },
    { label: 'Deliverables', filter: { type: 'FILE_DELIVERABLE_UPLOADED' } },
    { label: 'Messages', filter: { type: 'MESSAGE_RECEIVED' } },
    { label: 'Invoices', filter: { type: 'INVOICE_ISSUED' } },
    { label: 'Support', filter: { type: 'SUPPORT_TICKET_REPLIED' } },
  ];

  const isActive = (tabFilter: NotificationFilterParams) => {
    const filter = currentFilter || {};
    if (tabFilter.isRead !== undefined) {
      return filter.isRead === tabFilter.isRead;
    }
    if (tabFilter.type) {
      return filter.type === tabFilter.type;
    }
    return filter.isRead === undefined && filter.type === undefined;
  };

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
      {tabs.map((tab, idx) => {
        const active = isActive(tab.filter);
        return (
          <button
            key={idx}
            onClick={() => onFilterChange(tab.filter)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
              active
                ? 'bg-[var(--primary)] text-white shadow-xs'
                : 'bg-[var(--surface-raised)] text-[var(--muted-text)] hover:text-[var(--text)] border border-[var(--border)]'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
