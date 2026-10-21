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
        console.warn('Overview fetch fallback:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (!loading && overview && !overview.hasActiveProject) {
    return <NoActiveProjectPage />;
  }

  const project = overview?.activeProject;

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
            {project?.name || 'Portal Implementation'}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="success" size="sm" dot>In Progress</Badge>
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
            {overview?.stats?.deliverablesNeedingReview ?? 1}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="warning" size="sm" dot>Action Required</Badge>
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
            {project?.websites?.length || 1} Live Staging
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="neutral" size="sm">Active Preview</Badge>
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
            {overview?.stats?.onboardingStepsCompleted ?? 4} / 6
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="success" size="sm">Step 4 Active</Badge>
            <span className="text-xs text-[var(--muted-text)]">Questionnaire Saved</span>
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
              <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)]">
                <CheckCircle2 className="w-5 h-5 text-[var(--success-text)] shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[var(--text)]">1. Onboarding & Requirements</span>
                    <Badge variant="success" size="sm">Completed</Badge>
                  </div>
                  <p className="text-xs text-[var(--muted-text)] mt-0.5">Brief approved, Drive assets linked, kickoff completed.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)]">
                <Clock className="w-5 h-5 text-[var(--primary)] shrink-0 mt-0.5 animate-pulse" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[var(--text)]">2. Design Systems & Responsive Wireframes</span>
                    <Badge variant="warning" size="sm" dot>Review Ready</Badge>
                  </div>
                  <p className="text-xs text-[var(--muted-text)] mt-0.5">Figma screens v2.1 uploaded. Feedback awaiting approval.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] opacity-60">
                <div className="w-5 h-5 rounded-full border-2 border-[var(--border)] shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[var(--text)]">3. Full-Stack Portal Implementation</span>
                    <Badge variant="neutral" size="sm">Upcoming</Badge>
                  </div>
                  <p className="text-xs text-[var(--muted-text)] mt-0.5">Scheduled after wireframe acceptance.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Quick Links & Drive Docs</CardTitle>
              <CardDescription>Authorized Google Drive materials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <a
                href="https://drive.google.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] hover:bg-[var(--inset-surface)] transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-[var(--primary-link)]" />
                  <span className="text-sm font-medium text-[var(--text)]">Brand Guidelines Drive</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[var(--muted-text)] group-hover:text-[var(--text)]" />
              </a>

              <a
                href="https://drive.google.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] hover:bg-[var(--inset-surface)] transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-[var(--primary-link)]" />
                  <span className="text-sm font-medium text-[var(--text)]">Project Scope Contract</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[var(--muted-text)] group-hover:text-[var(--text)]" />
              </a>

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
