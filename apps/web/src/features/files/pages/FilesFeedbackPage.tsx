import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { FixtureBadge } from '../../../components/ui/FixtureBadge';
import { FileText, Download, CheckCircle } from 'lucide-react';

export const FilesFeedbackPage: React.FC = () => {
  return (
    <div className="space-y-6 text-left">
      <FixtureBadge phase="P04" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)]">
            Files & Deliverables
          </h1>
          <p className="text-sm text-[var(--muted-text)] mt-1">
            Review immutable deliverable versions, leave targeted feedback, and grant milestone approvals.
          </p>
        </div>
      </div>

      <Card>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-[var(--border)] mb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center text-[var(--primary)] shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[var(--text)]">Homepage_Design_v2.1.fig</h3>
                <Badge variant="warning" size="sm" dot>Review Pending</Badge>
              </div>
              <p className="text-xs text-[var(--muted-text)] mt-0.5">
                Version 2.1 • Uploaded Oct 18, 2026 by Stephen • 42.8 MB
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
              Download File
            </Button>
            <Button variant="primary" size="sm" leftIcon={<CheckCircle className="w-4 h-4" />}>
              Approve Version
            </Button>
          </div>
        </div>

        {/* Feedback Section */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-text)]">
            Version Feedback & Comments
          </h4>
          <div className="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-xs text-[var(--muted-text)]">
            <p className="font-semibold text-[var(--text)] mb-1">Stephen Oderinde (Oct 18, 2026, 3:30 PM):</p>
            Updated hero section responsive layout, aligned navigation breakpoints to 48rem and 64rem.
          </div>
        </div>
      </Card>
    </div>
  );
};
