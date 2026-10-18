import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { LifeBuoy } from 'lucide-react';

export const OwnerSupportPage: React.FC = () => {
  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)]">
            Client Support Queue
          </h1>
          <p className="text-sm text-[var(--muted-text)] mt-1">
            Review incoming tickets from active clients and respond to assistance requests.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Open Ticket Queue</CardTitle>
          <CardDescription>Direct client support inquiries</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-between">
            <div className="flex items-start gap-3">
              <LifeBuoy className="w-5 h-5 text-[var(--warning-text)] shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[var(--text)]">Inquiry regarding custom Shopify checkout permissions</span>
                  <Badge variant="warning" size="sm">IN PROGRESS</Badge>
                </div>
                <p className="text-xs text-[var(--muted-text)] mt-0.5">Ticket TCK-102 • Priority: High • From: Client A</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Reply & Resolve
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
