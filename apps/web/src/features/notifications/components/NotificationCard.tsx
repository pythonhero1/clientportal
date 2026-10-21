import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import type { NotificationItem } from '../../../services/notifications-api';
import {
  FileCheck,
  MessageSquare,
  Receipt,
  Calendar,
  AlertTriangle,
  LifeBuoy,
  Bell,
  Check,
  ExternalLink,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NotificationCardProps {
  notification: NotificationItem;
  onMarkRead: (id: string) => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onMarkRead,
}) => {
  const navigate = useNavigate();

  const getIcon = (type: string) => {
    switch (type) {
      case 'FILE_DELIVERABLE_UPLOADED':
      case 'FILE_CHANGES_REQUESTED':
      case 'FILE_APPROVED':
        return FileCheck;
      case 'MESSAGE_RECEIVED':
        return MessageSquare;
      case 'INVOICE_ISSUED':
      case 'PAYMENT_CONFIRMED':
        return Receipt;
      case 'MEETING_SCHEDULED':
        return Calendar;
      case 'FILE_SOFT_DELETED':
      case 'FILE_RESTORED':
      case 'FILE_PERMANENTLY_DELETED':
        return AlertTriangle;
      case 'SUPPORT_TICKET_REPLIED':
      case 'SUPPORT_TICKET_RESOLVED':
        return LifeBuoy;
      default:
        return Bell;
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return '';
    }
  };

  const Icon = getIcon(notification.type);

  const handleAction = () => {
    if (!notification.isRead) {
      onMarkRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <Card
      className={`transition-colors ${
        notification.isRead
          ? 'opacity-80 bg-[var(--surface)] hover:bg-[var(--surface-raised)]'
          : 'border-l-4 border-l-[var(--primary)] bg-[var(--surface-raised)] shadow-sm'
      }`}
    >
      <div className="flex items-start gap-3.5">
        <div className="w-9 h-9 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--primary)] shrink-0 mt-0.5">
          <Icon className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-[var(--text)] truncate">
              {notification.title}
            </h3>
            <span className="text-[0.6875rem] text-[var(--muted-text)] shrink-0">
              {formatRelativeTime(notification.createdAt)}
            </span>
          </div>

          <p className="text-xs text-[var(--muted-text)] mt-1 line-clamp-2 leading-relaxed">
            {notification.message}
          </p>

          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-[var(--border)]">
            {notification.link && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAction}
                rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                className="text-xs h-7 px-2"
              >
                View Details
              </Button>
            )}

            {!notification.isRead && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onMarkRead(notification.id)}
                leftIcon={<Check className="w-3.5 h-3.5" />}
                className="text-xs h-7 px-2 ml-auto"
              >
                Mark as read
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
