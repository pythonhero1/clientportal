import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { FixtureBadge } from '../../../components/ui/FixtureBadge';
import { Globe, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ProjectsListPage: React.FC = () => {
  const projects = [
    {
      id: 'prj_demo1',
      name: 'E-Commerce Website Redesign',
      domain: 'mystore.com',
      status: 'In Progress',
      milestone: 'Design System & Checkout Wireframes',
      due: 'Oct 24, 2026',
      badge: 'Active',
    },
    {
      id: 'prj_demo2',
      name: 'Client Portal Full-Stack Engineering',
      domain: 'portal.oderindestephen.com',
      status: 'Active Development',
      milestone: 'Phase P02 Responsive Shell',
      due: 'Oct 21, 2026',
      badge: 'Active',
    },
  ];

  return (
    <div className="space-y-6 text-left">
      <FixtureBadge phase="P03" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)]">
            Projects & Websites
          </h1>
          <p className="text-sm text-[var(--muted-text)] mt-1">
            Access your active website projects, deliverable history, and live environments.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map((project) => (
          <Card key={project.id} className="flex flex-col justify-between hover:border-[var(--primary)] transition-all">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[var(--primary-link)]" />
                  <span className="text-xs font-semibold text-[var(--muted-text)]">{project.domain}</span>
                </div>
                <Badge variant="success" size="sm" dot>{project.status}</Badge>
              </div>

              <h3 className="text-lg font-bold text-[var(--text)] mb-2">{project.name}</h3>
              <p className="text-xs text-[var(--muted-text)] mb-4">
                Current Focus: <span className="text-[var(--text)] font-medium">{project.milestone}</span>
              </p>
            </div>

            <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between">
              <span className="text-xs text-[var(--muted-text)]">Due: {project.due}</span>
              <Link to={`/projects/${project.id}`}>
                <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Enter Workspace
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
