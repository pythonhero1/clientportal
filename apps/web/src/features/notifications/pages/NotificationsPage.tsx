import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { FixtureBadge } from '../../../components/ui/FixtureBadge';
import { FileCheck, MessageSquare, Receipt, CheckCircle } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const notifications = [
    {
      id: '1',
      title: 'New deliverable uploaded: Homepage Wireframe v2.1',
      desc: 'Stephen uploaded new design assets for review in Files & Feedback.',
      time: '1 hour ago',
      read: false,
      icon: FileCheck,
    },
    {
      id: '2',
      title: 'New message from Stephen',
      desc: 'Check out the new responsive layout tokens and dark/light options.',
      time: '3 hours ago',
      read: false,
      icon: MessageSquare,
    },
    {
      id: '3',
      title: 'Invoice Settled: INV-2026-001',
      desc: 'Payment confirmation recorded for Milestone 1 architecture deposit.',
      time: '1 day ago',
      read: true,
      icon: Receipt,
    },
  ];

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto">
      <FixtureBadge phase="P08" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)]">
            Notifications Center
          </h1>
          <p className="text-sm text-[var(--muted-text)] mt-1">
            Stay updated on file uploads, review requests, meeting reminders, and invoice receipts.
          </p>
        </div>
        <Button variant="outline" size="sm" leftIcon={<CheckCircle className="w-4 h-4" />}>
          Mark all as read
        </Button>
      </div>

      <div className="space-y-3">
        {notifications.map((n) => {
          const Icon = n.icon;
          return (
            <Card
              key={n.id}
              className={n.read ? 'opacity-80' : 'border-l-4 border-l-[var(--primary)]'}
            >
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center text-[var(--primary)] shrink-0 mt-0.5">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-[var(--text)]">{n.title}</h3>
                    <span className="text-[0.6875rem] text-[var(--muted-text)] shrink-0">{n.time}</span>
                  </div>
                  <p className="text-xs text-[var(--muted-text)] mt-1">{n.desc}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
