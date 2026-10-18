import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { FixtureBadge } from '../../../components/ui/FixtureBadge';
import { Receipt, Download } from 'lucide-react';

export const InvoicesPage: React.FC = () => {
  const invoices = [
    {
      id: 'INV-2026-001',
      date: 'Oct 18, 2026',
      due: 'Oct 25, 2026',
      amount: '$1,500.00',
      status: 'PAID',
      description: 'Initial Milestone Deposit: Architecture & Design System',
    },
    {
      id: 'INV-2026-002',
      date: 'Oct 28, 2026',
      due: 'Nov 04, 2026',
      amount: '$2,000.00',
      status: 'UPCOMING',
      description: 'Milestone 2: Frontend Implementation & Integration',
    },
  ];

  return (
    <div className="space-y-6 text-left">
      <FixtureBadge phase="P06" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)]">
            Invoices & Billing
          </h1>
          <p className="text-sm text-[var(--muted-text)] mt-1">
            View issued invoices, download official PDF statements, and inspect payment evidence.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {invoices.map((inv) => (
          <Card key={inv.id}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center text-[var(--primary)] shrink-0">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-[var(--text)]">{inv.id}</span>
                    <Badge variant={inv.status === 'PAID' ? 'success' : 'neutral'} size="sm">
                      {inv.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-[var(--muted-text)] mt-0.5">{inv.description}</p>
                  <p className="text-xs text-[var(--muted-text)] mt-1">
                    Issued: {inv.date} • Due: {inv.due}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 sm:justify-end shrink-0">
                <span className="text-lg font-bold text-[var(--text)]">{inv.amount}</span>
                <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
                  PDF
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
