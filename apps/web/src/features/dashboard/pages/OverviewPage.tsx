import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { FolderGit2, FileText, ArrowUpRight, CheckCircle2, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchClientOverview } from '../../../services/projects-api';
import { NoActiveProjectPage } from './NoActiveProjectPage';

export const OverviewPage: React.FC = () => {
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClientOverview()
      .then((data) => {
        setOverview(data);
      })
      .catch((err) => {
        console.warn('Overview fetch error:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (!loading && (!overview || !overview.hasActiveProject || !overview.activeProject)) {
    return <NoActiveProjectPage />;
  }

  const project = overview?.activeProject;
  const milestones = project?.milestones || overview?.milestones || [];
  const documents = project?.documents || overview?.documents || [];

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)]">
            {overview?.clientName ? `Welcome back, ${overview.clientName}` : 'Welcome back'}
          </h1>
          <p className="text-sm text-[var(--muted-text)] mt-1">
            Here is what is currently active across your website design and engineering projects.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link to="/projects">
            <Button variant="outline" size="sm" leftIcon={<FolderGit2 className="w-4 h-4" />}>
              All Projects
            </Button>
          </Link>
          <Link to="/messages">
            <Button variant="primary" size="sm">
              Send Message
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[var(--muted-text)] uppercase tracking-wider">
              Active Project
            </span>
            <FolderGit2 className="w-4 h-4 text-[var(--primary)]" />
          </div>
          <p className="text-2xl font-bold text-[var(--text)] truncate">
            {project?.name || 'Project Workspace'}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="success" size="sm" dot>
              {project?.status || 'Active'}
            </Badge>
            <span className="text-xs text-[var(--muted-text)]">Active Engagement</span>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[var(--muted-text)] uppercase tracking-wider">
              Deliverables for Review
            </span>
            <FileText className="w-4 h-4 text-[var(--warning-text)]" />
          </div>
          <p className="text-2xl font-bold text-[var(--text)]">
            {overview?.stats?.deliverablesNeedingReview ?? 0}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={overview?.stats?.deliverablesNeedingReview ? 'warning' : 'neutral'} size="sm" dot={Boolean(overview?.stats?.deliverablesNeedingReview)}>
              {overview?.stats?.deliverablesNeedingReview ? 'Action Required' : 'Up to Date'}
            </Badge>
            <span className="text-xs text-[var(--muted-text)]">Files & Feedback</span>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[var(--muted-text)] uppercase tracking-wider">
              Websites & Staging
            </span>
            <ArrowUpRight className="w-4 h-4 text-[var(--primary-link)]" />
          </div>
          <p className="text-2xl font-bold text-[var(--text)]">
            {project?.websites?.length || 0} Environments
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="neutral" size="sm">
              {project?.websites?.length ? 'Active Preview' : 'Pending Staging'}
            </Badge>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[var(--muted-text)] uppercase tracking-wider">
              Onboarding Progress
            </span>
            <CheckCircle2 className="w-4 h-4 text-[var(--success-text)]" />
          </div>
          <p className="text-2xl font-bold text-[var(--text)]">
            {overview?.stats?.onboardingStepsCompleted ?? 0} / 6
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="neutral" size="sm">
              {overview?.stats?.onboardingStepsCompleted ? 'In Progress' : 'Not Started'}
            </Badge>
          </div>
        </Card>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Milestones & Deliverables</CardTitle>
              <CardDescription>Track key milestones and approve submitted assets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {milestones.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-[var(--border)] rounded-xl">
                  <p className="text-xs text-[var(--muted-text)]">
                    No delivery milestones have been configured for this project yet.
                  </p>
                </div>
              ) : (
                milestones.map((ms: any, idx: number) => (
                  <div
                    key={ms.id || idx}
                    className="flex items-start gap-3 p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)]"
                  >
                    {ms.status === 'APPROVED' ? (
                      <CheckCircle2 className="w-5 h-5 text-[var(--success-text)] shrink-0 mt-0.5" />
                    ) : ms.status === 'AWAITING_REVIEW' || ms.status === 'IN_PROGRESS' ? (
                      <Clock className="w-5 h-5 text-[var(--primary)] shrink-0 mt-0.5 animate-pulse" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-[var(--border)] shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-[var(--text)]">
                          {idx + 1}. {ms.title}
                        </span>
                        <Badge
                          variant={
                            ms.status === 'APPROVED'
                              ? 'success'
                              : ms.status === 'AWAITING_REVIEW'
                              ? 'warning'
                              : 'neutral'
                          }
                          size="sm"
                        >
                          {ms.status}
                        </Badge>
                      </div>
                      {ms.description && (
                        <p className="text-xs text-[var(--muted-text)] mt-0.5">{ms.description}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Quick Links & Drive Docs</CardTitle>
              <CardDescription>Authorized project materials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {documents.length > 0 ? (
                documents.map((doc: any) => (
                  <a
                    key={doc.id}
                    href={doc.driveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] hover:bg-[var(--inset-surface)] transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-[var(--primary-link)]" />
                      <span className="text-sm font-medium text-[var(--text)]">{doc.title}</span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-[var(--muted-text)] group-hover:text-[var(--text)]" />
                  </a>
                ))
              ) : (
                <div className="p-4 text-center border border-dashed border-[var(--border)] rounded-xl">
                  <p className="text-xs text-[var(--muted-text)]">No Drive documents linked yet.</p>
                </div>
              )}

              <Link
                to="/onboarding/questionnaire"
                className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] hover:bg-[var(--inset-surface)] transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-[var(--accent-cyan)]" />
                  <span className="text-sm font-medium text-[var(--text)]">View Questionnaire</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[var(--muted-text)] group-hover:text-[var(--text)]" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};