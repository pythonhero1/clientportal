import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { FixtureBadge } from '../../../components/ui/FixtureBadge';
import { PlusCircle, MessageSquare } from 'lucide-react';

export const SupportHelpPage: React.FC = () => {
  const tickets = [
    {
      id: 'TCK-101',
      subject: 'Question on Figma asset export formats',
      status: 'RESOLVED',
      date: 'Oct 17, 2026',
      priority: 'Normal',
    },
    {
      id: 'TCK-102',
      subject: 'Inquiry regarding custom Shopify checkout permissions',
      status: 'IN PROGRESS',
      date: 'Oct 18, 2026',
      priority: 'High',
    },
  ];

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto">
      <FixtureBadge phase="P08" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)]">
            Help Center & Tickets
          </h1>
          <p className="text-sm text-[var(--muted-text)] mt-1">
            Access portal support articles or open a dedicated assistance ticket directly with Stephen.
          </p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
          Open New Ticket
        </Button>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--muted-text)]">
          Your Support Tickets
        </h3>

        {tickets.map((t) => (
          <Card key={t.id}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center text-[var(--primary)] shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[var(--text)]">{t.subject}</span>
                    <Badge variant={t.status === 'RESOLVED' ? 'success' : 'warning'} size="sm">
                      {t.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-[var(--muted-text)] mt-0.5">
                    Ticket ID: {t.id} • Opened: {t.date} • Priority: {t.priority}
                  </p>
                </div>
              </div>

              <Button variant="outline" size="sm">
                View Thread
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
