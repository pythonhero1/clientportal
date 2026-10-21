import React from 'react';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { CheckCircle, Bell, Loader2 } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationCard } from '../components/NotificationCard';
import { NotificationFilters } from '../components/NotificationFilters';
import { PushBanner } from '../components/PushBanner';

export const NotificationsPage: React.FC = () => {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    filter,
    setFilter,
    markRead,
    markAllRead,
  } = useNotifications();

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)]">
            Notifications Center
          </h1>
          <p className="text-sm text-[var(--muted-text)] mt-1">
            Stay updated on deliverables, review requests, discussions, milestones, and invoice receipts.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllRead}
            leftIcon={<CheckCircle className="w-4 h-4" />}
          >
            Mark all as read
          </Button>
        )}
      </div>

      {/* Web Push Banner */}
      <PushBanner />

      {/* Filter Tabs */}
      <NotificationFilters
        currentFilter={filter}
        onFilterChange={setFilter}
        unreadCount={unreadCount}
      />

      {/* List / Loading / Empty */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-[var(--muted-text)]">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span className="text-sm">Loading notifications...</span>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 text-xs text-[var(--danger)]">
          {error}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-8 h-8 text-[var(--muted-text)]" />}
          title={filter.isRead === false ? 'No unread notifications' : 'No notifications yet'}
          description={
            filter.isRead === false
              ? "You are completely caught up! We'll notify you as new activity happens."
              : 'Updates regarding project files, communications, and invoice settlements will appear here.'
          }
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onMarkRead={markRead}
            />
          ))}
        </div>
      )}
    </div>
  );
};
