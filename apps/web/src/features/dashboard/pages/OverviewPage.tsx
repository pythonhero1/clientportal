import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { FixtureBadge } from '../../../components/ui/FixtureBadge';
import { FolderGit2, FileText, Receipt, ArrowUpRight, CheckCircle2, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export const OverviewPage: React.FC = () => {
  return (
    <div className="space-y-6 text-left">
      <FixtureBadge phase="P03" />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)]">
            Welcome back, Stephen
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
          <p className="text-2xl font-bold text-[var(--text)]">E-Commerce Redesign</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="success" size="sm" dot>In Progress</Badge>
            <span className="text-xs text-[var(--muted-text)]">Milestone 2 of 4</span>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[var(--muted-text)] uppercase tracking-wider">
              Deliverables for Review
            </span>
            <FileText className="w-4 h-4 text-[var(--warning-text)]" />
          </div>
          <p className="text-2xl font-bold text-[var(--text)]">2 Files</p>
          <p className="text-xs text-[var(--muted-text)] mt-2">v2.1 Homepage & Checkout Flow</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[var(--muted-text)] uppercase tracking-wider">
              Next Milestone
            </span>
            <Clock className="w-4 h-4 text-[var(--accent-cyan)]" />
          </div>
          <p className="text-2xl font-bold text-[var(--text)]">Oct 24, 2026</p>
          <p className="text-xs text-[var(--muted-text)] mt-2">Figma Component Sign-off</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[var(--muted-text)] uppercase tracking-wider">
              Outstanding Invoices
            </span>
            <Receipt className="w-4 h-4 text-[var(--success-text)]" />
          </div>
          <p className="text-2xl font-bold text-[var(--text)]">$0.00</p>
          <p className="text-xs text-[var(--muted-text)] mt-2">All issued payments settled</p>
        </Card>
      </div>

      {/* Main Panels: Project Status & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Project Milestones</CardTitle>
                <CardDescription>Track deliverable reviews and production phases</CardDescription>
              </div>
              <Link to="/projects/prj_demo1" className="text-xs font-semibold text-[var(--primary-link)] hover:underline flex items-center gap-1">
                Workspace <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
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
