import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Check, X, ShieldAlert, CheckCircle2, RefreshCw, CloudDownload } from 'lucide-react';
import { API_BASE_URL } from '../../../services/api-client';
import { getFreshAuthHeaders } from '../../../services/projects-api';

interface PendingUser {
  id: string;
  name: string;
  email: string;
  date?: string;
  status: string;
}

export const OwnerClientsPage: React.FC = () => {
  const [pendingApprovals, setPendingApprovals] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadPending = async (forceSync = false) => {
    setLoading(true);
    setActionError(null);
    try {
      const headers = await getFreshAuthHeaders();
      const url = `${API_BASE_URL}/api/admin/users/pending${forceSync ? '?sync=true' : ''}`;
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        setPendingApprovals(Array.isArray(data) ? data : []);
      } else {
        const errJson = await res.json().catch(() => ({}));
        setActionError(errJson.message || `Failed to fetch pending approvals (${res.status})`);
        setPendingApprovals([]);
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to connect to backend server');
      setPendingApprovals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncClerk = async () => {
    setIsSyncing(true);
    setActionError(null);
    setActionNotice(null);
    try {
      const headers = await getFreshAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/api/admin/users/sync-clerk`, {
        method: 'POST',
        headers,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || `Clerk sync failed (${res.status})`);
      }
      setActionNotice(`Clerk sync successful: ${data.totalClerkUsers ?? 0} total accounts scanned.`);
      await loadPending(true);
    } catch (err: any) {
      setActionError(err.message || 'Failed to sync with Clerk');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleActivate = async (userId: string, email: string) => {
    try {
      setActionError(null);
      const headers = await getFreshAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/activate`, {
        method: 'POST',
        headers,
      });
      if (!res.ok) throw new Error(`Activation failed: ${res.status}`);
      setActionNotice(`Account ${email} activated successfully.`);
      loadPending();
    } catch (err: any) {
      setActionError(err.message || 'Activation failed.');
    }
  };

  const handleReject = async (userId: string, email: string) => {
    if (!window.confirm(`Reject registration for ${email}?`)) return;
    try {
      setActionError(null);
      const headers = await getFreshAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/reject`, {
        method: 'POST',
        headers,
      });
      if (!res.ok) throw new Error(`Rejection failed: ${res.status}`);
      setActionNotice(`Registration for ${email} rejected.`);
      loadPending();
    } catch (err: any) {
      setActionError(err.message || 'Rejection failed.');
    }
  };

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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSyncClerk()}
            disabled={isSyncing}
            leftIcon={<CloudDownload className={`w-3.5 h-3.5 ${isSyncing ? 'animate-bounce' : ''}`} />}
          >
            {isSyncing ? 'Syncing...' : 'Sync from Clerk'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadPending(true)}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {actionError && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Pending Approvals Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Registration Approval Queue</CardTitle>
              <CardDescription>Accounts waiting for Owner activation</CardDescription>
            </div>
            <Badge variant={pendingApprovals.length > 0 ? 'warning' : 'neutral'} size="sm" dot={pendingApprovals.length > 0}>
              {pendingApprovals.length} Pending
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-[var(--muted-text)] py-4 text-center">Checking approval queue...</p>
          ) : pendingApprovals.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-[var(--border)] rounded-xl">
              <p className="text-sm font-medium text-[var(--text)]">No client registrations pending approval</p>
              <p className="text-xs text-[var(--muted-text)] mt-1">
                New signups requiring authorization will appear here for review.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingApprovals.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[var(--text)]">{user.name || user.email}</span>
                      <Badge variant="warning" size="sm">Pending Owner Review</Badge>
                    </div>
                    <p className="text-xs text-[var(--muted-text)] mt-0.5">
                      {user.email} {user.date ? `• Registered ${user.date}` : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReject(user.id, user.email)}
                      leftIcon={<X className="w-4 h-4 text-[var(--danger-text)]" />}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleActivate(user.id, user.email)}
                      leftIcon={<Check className="w-4 h-4" />}
                    >
                      Activate Account
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};