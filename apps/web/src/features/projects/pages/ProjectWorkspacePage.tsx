import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Tabs } from '../../../components/ui/Tabs';
import { FixtureBadge } from '../../../components/ui/FixtureBadge';
import { FileText, ArrowLeft, ArrowUpRight } from 'lucide-react';

export const ProjectWorkspacePage: React.FC = () => {
  const { projectId = 'prj_demo1' } = useParams<{ projectId: string }>();

  const overviewTab = (
    <div className="space-y-6 text-left">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <span className="text-xs font-semibold text-[var(--muted-text)] uppercase tracking-wider block mb-1">
            Designated Approver
          </span>
          <p className="text-base font-bold text-[var(--text)]">Stephen Oderinde</p>
          <span className="text-xs text-[var(--muted-text)]">Client Authority</span>
        </Card>

        <Card>
          <span className="text-xs font-semibold text-[var(--muted-text)] uppercase tracking-wider block mb-1">
            Milestone Progress
          </span>
          <p className="text-base font-bold text-[var(--text)]">50% Complete</p>
          <span className="text-xs text-[var(--success-text)] font-medium">On Schedule</span>
        </Card>

        <Card>
          <span className="text-xs font-semibold text-[var(--muted-text)] uppercase tracking-wider block mb-1">
            Target Completion
          </span>
          <p className="text-base font-bold text-[var(--text)]">Oct 31, 2026</p>
          <span className="text-xs text-[var(--muted-text)]">Phase 1 Launch</span>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connected Google Drive Documents</CardTitle>
          <CardDescription>Official materials linked to this project scope</CardDescription>
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
              <div>
                <p className="text-sm font-semibold text-[var(--text)]">Project Scope Document.pdf</p>
                <p className="text-xs text-[var(--muted-text)]">View permissions managed via Google Drive</p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-[var(--muted-text)] group-hover:text-[var(--text)]" />
          </a>
        </CardContent>
      </Card>
    </div>
  );

  const deliverablesTab = (
    <div className="space-y-4 text-left">
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-base font-bold text-[var(--text)]">v2.1 Wireframes & Component Specs</h4>
            <p className="text-xs text-[var(--muted-text)]">Uploaded Oct 18, 2026 • 24.5 MB</p>
          </div>
          <Link to="/files">
            <Button variant="outline" size="sm">
              Review File & Feedback
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6 text-left">
      <FixtureBadge phase="P03" />

      <div className="flex items-center gap-3">
        <Link to="/projects">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">
              E-Commerce Redesign
            </h1>
            <Badge variant="success" size="sm">Active</Badge>
          </div>
          <p className="text-xs text-[var(--muted-text)] mt-0.5">Project ID: {projectId}</p>
        </div>
      </div>

      <Tabs
        items={[
          { id: 'overview', label: 'Overview', content: overviewTab },
          { id: 'deliverables', label: 'Deliverables', badge: 1, content: deliverablesTab },
        ]}
      />
    </div>
  );
};
