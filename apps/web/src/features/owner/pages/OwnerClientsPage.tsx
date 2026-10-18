import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { UserPlus, Check, X } from 'lucide-react';

export const OwnerClientsPage: React.FC = () => {
  const pendingApprovals = [
    {
      id: 'usr_new_1',
      name: 'David Adeleke',
      email: 'david@enterprise.com',
      date: 'Oct 18, 2026',
      status: 'PENDING_APPROVAL',
    },
  ];

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)]">
            Client Approvals & Invitations
          </h1>
          <p className="text-sm text-[var(--muted-text)] mt-1">
            Authorize new public signups and send verified access tokens to client contacts.
          </p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<UserPlus className="w-4 h-4" />}>
          Send Client Invite
        </Button>
      </div>

      {/* Pending Approvals Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Registration Approval Queue</CardTitle>
              <CardDescription>Accounts waiting for Owner activation</CardDescription>
            </div>
            <Badge variant="warning" size="sm" dot>1 Pending</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pendingApprovals.map((user) => (
              <div
                key={user.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[var(--text)]">{user.name}</span>
                    <Badge variant="warning" size="sm">Pending Owner Review</Badge>
                  </div>
                  <p className="text-xs text-[var(--muted-text)] mt-0.5">{user.email} • Registered {user.date}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="outline" size="sm" leftIcon={<X className="w-4 h-4 text-[var(--danger-text)]" />}>
                    Reject
                  </Button>
                  <Button variant="primary" size="sm" leftIcon={<Check className="w-4 h-4" />}>
                    Activate Account
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
