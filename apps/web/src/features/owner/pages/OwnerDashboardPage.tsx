import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Users, FolderKanban, FileCheck2, CreditCard, Shield, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../../../services/api-client';
import { getAuthHeaders } from '../../../services/projects-api';

export const OwnerDashboardPage: React.FC = () => {
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [projectsCount, setProjectsCount] = useState<number>(0);
  const [filesCount, setFilesCount] = useState<number>(0);
  const [billedTotal, setBilledTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadMetrics() {
      try {
        const headers = getAuthHeaders();
        const [usersRes, projsRes, filesRes, invRes] = await Promise.allSettled([
          fetch(`${API_BASE_URL}/api/admin/users/pending`, { headers }),
          fetch(`${API_BASE_URL}/api/admin/projects`, { headers }),
          fetch(`${API_BASE_URL}/api/admin/files/lifecycle`, { headers }),
          fetch(`${API_BASE_URL}/api/admin/invoices`, { headers }),
        ]);

        if (usersRes.status === 'fulfilled' && usersRes.value.ok) {
          const users = await usersRes.value.json();
          setPendingCount(Array.isArray(users) ? users.length : 0);
        }

        if (projsRes.status === 'fulfilled' && projsRes.value.ok) {
          const projs = await projsRes.value.json();
          setProjectsCount(Array.isArray(projs) ? projs.length : 0);
        }

        if (filesRes.status === 'fulfilled' && filesRes.value.ok) {
          const files = await filesRes.value.json();
          setFilesCount(Array.isArray(files) ? files.length : 0);
        }

        if (invRes.status === 'fulfilled' && invRes.value.ok) {
          const invoices = await invRes.value.json();
          if (Array.isArray(invoices)) {
            const sum = invoices.reduce((acc: number, inv: any) => {
              const amount = parseFloat(inv.totalAmount || inv.amountPaid || '0');
              return acc + (isNaN(amount) ? 0 : amount);
            }, 0);
            setBilledTotal(sum);
          }
        }
      } catch {
        // Fallback gracefully to live 0 counts
      } finally {
        setLoading(false);
      }
    }
    loadMetrics();
  }, []);

  const formatBilled = (val: number) => {
    return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6 text-left">
      {/* Admin Suite Banner */}
      <div className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--primary)]/40 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--text)]">Admin Executive Suite</h2>
            <p className="text-xs text-[var(--muted-text)]">
              Authorized management controls for client approvals, project assignments, deliverables, and billing.
            </p>
          </div>
        </div>
        <Badge variant="accent" size="sm">Stephen Privileged Access</Badge>
      </div>

      {/* Owner Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[var(--muted-text)] uppercase tracking-wider">
              Pending Approvals
            </span>
            <Users className="w-4 h-4 text-[var(--warning-text)]" />
          </div>
          <p className="text-2xl font-bold text-[var(--text)]">
            {loading ? '...' : `${pendingCount} ${pendingCount === 1 ? 'Registration' : 'Registrations'}`}
          </p>
          <Link to="/owner/clients" className="text-xs text-[var(--primary-link)] hover:underline flex items-center gap-1 mt-2">
            Review Queue <ArrowRight className="w-3 h-3" />
          </Link>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[var(--muted-text)] uppercase tracking-wider">
              Active Engagements
            </span>
            <FolderKanban className="w-4 h-4 text-[var(--primary)]" />
          </div>
          <p className="text-2xl font-bold text-[var(--text)]">
            {loading ? '...' : `${projectsCount} ${projectsCount === 1 ? 'Project' : 'Projects'}`}
          </p>
          <Link to="/owner/projects" className="text-xs text-[var(--primary-link)] hover:underline flex items-center gap-1 mt-2">
            Manage Projects <ArrowRight className="w-3 h-3" />
          </Link>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[var(--muted-text)] uppercase tracking-wider">
              Files Awaiting Review
            </span>
            <FileCheck2 className="w-4 h-4 text-[var(--accent-cyan)]" />
          </div>
          <p className="text-2xl font-bold text-[var(--text)]">
            {loading ? '...' : `${filesCount} ${filesCount === 1 ? 'Deliverable' : 'Deliverables'}`}
          </p>
          <Link to="/owner/files" className="text-xs text-[var(--primary-link)] hover:underline flex items-center gap-1 mt-2">
            View Files <ArrowRight className="w-3 h-3" />
          </Link>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[var(--muted-text)] uppercase tracking-wider">
              Billed This Month
            </span>
            <CreditCard className="w-4 h-4 text-[var(--success-text)]" />
          </div>
          <p className="text-2xl font-bold text-[var(--text)]">
            {loading ? '...' : formatBilled(billedTotal)}
          </p>
          <Link to="/owner/invoices" className="text-xs text-[var(--primary-link)] hover:underline flex items-center gap-1 mt-2">
            Invoice Ledger <ArrowRight className="w-3 h-3" />
          </Link>
        </Card>
      </div>

      {/* Quick Operations Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Administrative Workflows</CardTitle>
          <CardDescription>Direct shortcuts to privileged operations</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Link to="/owner/clients">
            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] hover:border-[var(--primary)] transition-all">
              <h4 className="text-sm font-bold text-[var(--text)]">Invite New Client</h4>
              <p className="text-xs text-[var(--muted-text)] mt-1">Generate verified invitation token for client onboarding.</p>
            </div>
          </Link>

          <Link to="/owner/projects">
            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] hover:border-[var(--primary)] transition-all">
              <h4 className="text-sm font-bold text-[var(--text)]">Create Project</h4>
              <p className="text-xs text-[var(--muted-text)] mt-1">Set up engagement, connect Drive materials, assign access.</p>
            </div>
          </Link>

          <Link to="/owner/invoices">
            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] hover:border-[var(--primary)] transition-all">
              <h4 className="text-sm font-bold text-[var(--text)]">Issue Milestone Invoice</h4>
              <p className="text-xs text-[var(--muted-text)] mt-1">Create PDF statement with unique number and itemized scope.</p>
            </div>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};