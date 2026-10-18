import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { PlusCircle, Receipt } from 'lucide-react';

export const OwnerInvoicesPage: React.FC = () => {
  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)]">
            Billing & Invoice Issuance
          </h1>
          <p className="text-sm text-[var(--muted-text)] mt-1">
            Generate itemized invoices, produce official PDF deliverables, and record payment settlements.
          </p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
          Issue New Invoice
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Ledger</CardTitle>
          <CardDescription>Generated internally with unique serial numbering</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Receipt className="w-5 h-5 text-[var(--primary)]" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[var(--text)]">INV-2026-001</span>
                  <Badge variant="success" size="sm">PAID</Badge>
                </div>
                <p className="text-xs text-[var(--muted-text)] mt-0.5">Client A • $1,500.00 • Settled Oct 18, 2026</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              View Statement
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
