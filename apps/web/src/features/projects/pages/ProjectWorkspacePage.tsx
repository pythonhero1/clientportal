import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Tabs } from '../../../components/ui/Tabs';
import { FileText, ArrowLeft, ArrowUpRight } from 'lucide-react';
import { fetchProjectWorkspace } from '../../../services/projects-api';

export const ProjectWorkspacePage: React.FC = () => {
  const { projectId = 'prj_demo1' } = useParams<{ projectId: string }>();
  const [workspace, setWorkspace] = useState<any>(null);

  useEffect(() => {
    fetchProjectWorkspace(projectId)
      .then((data) => setWorkspace(data))
      .catch((err) => console.warn('Workspace fetch fallback:', err));
  }, [projectId]);

  const project = workspace?.project;
  const milestones = workspace?.milestones || project?.milestones || [];
  const documents = workspace?.documents || project?.documents || [];

  const overviewTab = (
    <div className="space-y-6 text-left">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <span className="text-xs font-semibold text-[var(--muted-text)] uppercase tracking-wider block mb-1">
            Designated Approver
          </span>
          <p className="text-base font-bold text-[var(--text)]">
            {workspace?.isDesignatedApprover ? 'You (Approved Authority)' : 'Stephen Oderinde'}
          </p>
          <span className="text-xs text-[var(--muted-text)]">Project Authority</span>
        </Card>

        <Card>
          <span className="text-xs font-semibold text-[var(--muted-text)] uppercase tracking-wider block mb-1">
            Milestone Progress
          </span>
          <p className="text-base font-bold text-[var(--text)]">
            {milestones.length ? `${milestones.length} Milestones` : 'In Progress'}
          </p>
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
                  <div>
                    <p className="text-sm font-semibold text-[var(--text)]">{doc.title}</p>
                    <p className="text-xs text-[var(--muted-text)]">Drive link • Recipient access verified</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[var(--muted-text)] group-hover:text-[var(--text)]" />
              </a>
            ))
          ) : (
            <div className="p-4 text-center border border-dashed border-[var(--border)] rounded-lg">
              <p className="text-xs text-[var(--muted-text)]">No Drive documents linked to this project yet.</p>
            </div>
          )}
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
      <div className="flex items-center gap-3">
        <Link to="/projects">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">
              {project?.name || 'E-Commerce Redesign'}
            </h1>
            <Badge variant="success" size="sm">{project?.status || 'Active'}</Badge>
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
