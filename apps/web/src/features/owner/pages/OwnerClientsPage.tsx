import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import {
  Check,
  X,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  CloudDownload,
  Trash2,
  PauseCircle,
  PlayCircle,
  Search,
  Users,
  UserCheck,
  UserX,
  AlertTriangle,
  Mail,
  Building2,
  Calendar,
} from 'lucide-react';
import { API_BASE_URL } from '../../../services/api-client';
import { getFreshAuthHeaders } from '../../../services/projects-api';

interface PendingUser {
  id: string;
  name: string;
  email: string;
  date?: string;
  status: string;
}

interface ClientUser {
  id: string;
  name: string | null;
  email: string;
  status: 'ACTIVE' | 'PENDING_APPROVAL' | 'SUSPENDED' | 'REJECTED' | string;
  createdAt?: string;
  dateJoined?: string;
  companyName?: string | null;
  phone?: string | null;
}

export const OwnerClientsPage: React.FC = () => {
  const [pendingApprovals, setPendingApprovals] = useState<PendingUser[]>([]);
  const [clients, setClients] = useState<ClientUser[]>([]);
  const [loadingPending, setLoadingPending] = useState(true);
  const [loadingClients, setLoadingClients] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Directory filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');

  // Deletion modal state
  const [deleteTarget, setDeleteTarget] = useState<ClientUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadPending = async (forceSync = false) => {
    setLoadingPending(true);
    try {
      const headers = await getFreshAuthHeaders();
      const url = `${API_BASE_URL}/api/admin/users/pending${forceSync ? '?sync=true' : ''}`;
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        setPendingApprovals(Array.isArray(data) ? data : []);
      } else {
        setPendingApprovals([]);
      }
    } catch {
      setPendingApprovals([]);
    } finally {
      setLoadingPending(false);
    }
  };

  const loadClients = async () => {
    setLoadingClients(true);
    try {
      const headers = await getFreshAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/api/admin/users/clients`, { headers });
      if (res.ok) {
        const data = await res.json();
        setClients(Array.isArray(data) ? data : []);
      } else {
        setClients([]);
      }
    } catch {
      setClients([]);
    } finally {
      setLoadingClients(false);
    }
  };

  const loadAll = async (forceSync = false) => {
    setActionError(null);
    await Promise.all([loadPending(forceSync), loadClients()]);
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
      await loadAll(true);
    } catch (err: any) {
      setActionError(err.message || 'Failed to sync with Clerk');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadAll(true);
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
      await loadAll();
    } catch (err: any) {
      setActionError(err.message || 'Activation failed.');
    }
  };

  const handleSuspend = async (userId: string, email: string) => {
    if (!window.confirm(`Suspend access for ${email}? The client will be locked out until reactivated.`)) return;
    try {
      setActionError(null);
      const headers = await getFreshAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/suspend`, {
        method: 'POST',
        headers,
      });
      if (!res.ok) throw new Error(`Suspension failed: ${res.status}`);
      setActionNotice(`Account ${email} has been suspended.`);
      await loadAll();
    } catch (err: any) {
      setActionError(err.message || 'Failed to suspend user.');
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
      await loadAll();
    } catch (err: any) {
      setActionError(err.message || 'Rejection failed.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setActionError(null);
    try {
      const headers = await getFreshAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${deleteTarget.id}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `Failed to delete client account (${res.status})`);
      }
      setActionNotice(`Client ${deleteTarget.email} has been permanently deleted.`);
      setDeleteTarget(null);
      await loadAll();
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete client account.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter clients
  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.companyName || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'ALL') return true;
    return c.status === statusFilter;
  });

  const activeCount = clients.filter((c) => c.status === 'ACTIVE').length;
  const suspendedCount = clients.filter((c) => c.status === 'SUSPENDED' || c.status === 'REJECTED').length;

  return (
    <div className="space-y-6 text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)]">
            Client Approvals & Directory
          </h1>
          <p className="text-sm text-[var(--muted-text)] mt-1">
            Review new client registrations, manage active client permissions, and suspend or remove accounts.
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
            onClick={() => loadAll(true)}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Alert Notices */}
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)]">
          <div className="flex items-center justify-between text-[var(--muted-text)]">
            <span className="text-xs font-medium">Total Clients</span>
            <Users className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-[var(--text)] mt-1">{clients.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)]">
          <div className="flex items-center justify-between text-emerald-500">
            <span className="text-xs font-medium">Active</span>
            <UserCheck className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-emerald-500 mt-1">{activeCount}</p>
        </div>
        <div className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)]">
          <div className="flex items-center justify-between text-amber-500">
            <span className="text-xs font-medium">Pending Review</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-amber-500 mt-1">{pendingApprovals.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)]">
          <div className="flex items-center justify-between text-rose-500">
            <span className="text-xs font-medium">Suspended</span>
            <UserX className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-rose-500 mt-1">{suspendedCount}</p>
        </div>
      </div>

      {/* Pending Approvals Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Registration Approval Queue</CardTitle>
              <CardDescription>Accounts waiting for Administrator activation</CardDescription>
            </div>
            <Badge variant={pendingApprovals.length > 0 ? 'warning' : 'neutral'} size="sm" dot={pendingApprovals.length > 0}>
              {pendingApprovals.length} Pending
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loadingPending ? (
            <p className="text-sm text-[var(--muted-text)] py-4 text-center">Checking approval queue...</p>
          ) : pendingApprovals.length === 0 ? (
            <div className="py-6 text-center border border-dashed border-[var(--border)] rounded-xl">
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
                      <Badge variant="warning" size="sm">Pending Admin Review</Badge>
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

      {/* Managed Clients Directory */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Managed Clients Directory</CardTitle>
              <CardDescription>All client accounts registered on the portal</CardDescription>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-text)]" />
                <input
                  type="text"
                  placeholder="Search client or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--primary)] w-full sm:w-56"
                />
              </div>

              <div className="flex items-center rounded-lg border border-[var(--border)] p-0.5 bg-[var(--surface)]">
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                    statusFilter === 'ALL'
                      ? 'bg-[var(--surface-raised)] text-[var(--text)] shadow-xs'
                      : 'text-[var(--muted-text)] hover:text-[var(--text)]'
                  }`}
                >
                  All ({clients.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('ACTIVE')}
                  className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                    statusFilter === 'ACTIVE'
                      ? 'bg-[var(--surface-raised)] text-emerald-500 shadow-xs'
                      : 'text-[var(--muted-text)] hover:text-emerald-500'
                  }`}
                >
                  Active ({activeCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('SUSPENDED')}
                  className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                    statusFilter === 'SUSPENDED'
                      ? 'bg-[var(--surface-raised)] text-rose-500 shadow-xs'
                      : 'text-[var(--muted-text)] hover:text-rose-500'
                  }`}
                >
                  Suspended ({suspendedCount})
                </button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingClients ? (
            <p className="text-sm text-[var(--muted-text)] py-8 text-center">Loading client directory...</p>
          ) : filteredClients.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-[var(--border)] rounded-xl">
              <p className="text-sm font-medium text-[var(--text)]">No clients found</p>
              <p className="text-xs text-[var(--muted-text)] mt-1">
                {searchTerm ? 'Try adjusting your search criteria.' : 'Approved client accounts will appear here.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredClients.map((client) => {
                const isActive = client.status === 'ACTIVE';
                const isSuspended = client.status === 'SUSPENDED' || client.status === 'REJECTED';

                return (
                  <div
                    key={client.id}
                    className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] gap-4 hover:border-[var(--border-hover)] transition-colors"
                  >
                    {/* Client Information */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center font-bold text-xs text-[var(--text)] shrink-0">
                        {(client.name?.[0] || client.email?.[0] || 'C').toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-[var(--text)] truncate">
                            {client.name || 'Unnamed Client'}
                          </span>
                          {isActive ? (
                            <Badge variant="success" size="sm">Active</Badge>
                          ) : isSuspended ? (
                            <Badge variant="danger" size="sm">Suspended</Badge>
                          ) : (
                            <Badge variant="warning" size="sm">{client.status}</Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-[var(--muted-text)] mt-1 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5" />
                            {client.email}
                          </span>
                          {client.companyName && (
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5" />
                              {client.companyName}
                            </span>
                          )}
                          {client.dateJoined && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              Joined {client.dateJoined}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Management Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                      {isActive ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSuspend(client.id, client.email)}
                          leftIcon={<PauseCircle className="w-3.5 h-3.5 text-amber-500" />}
                        >
                          Suspend Access
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleActivate(client.id, client.email)}
                          leftIcon={<PlayCircle className="w-3.5 h-3.5 text-emerald-500" />}
                        >
                          Reactivate
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteTarget(client)}
                        leftIcon={<Trash2 className="w-3.5 h-3.5 text-[var(--danger-text)]" />}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-left">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[var(--text)]">Delete Client Account</h3>
                <p className="text-xs text-[var(--muted-text)]">Permanent administrative action</p>
              </div>
            </div>

            <p className="text-sm text-[var(--text)] leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-[var(--text)] font-semibold">{deleteTarget.name || deleteTarget.email}</strong> (
              <span className="font-mono text-xs">{deleteTarget.email}</span>)?
            </p>

            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 space-y-1">
              <p className="font-semibold">This action cannot be undone:</p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                <li>Removes the user account and credentials from Clerk.</li>
                <li>Deletes client profile, notifications, and portal access.</li>
                <li>The client will be unable to log in to the portal.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="bg-rose-600 hover:bg-rose-700 text-white border-transparent"
                leftIcon={<Trash2 className="w-4 h-4" />}
              >
                {isDeleting ? 'Deleting Client...' : 'Permanently Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
