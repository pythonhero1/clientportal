import React, { useEffect, useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Globe, ArrowRight, FolderPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchProjects } from '../../../services/projects-api';

export const ProjectsListPage: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects()
      .then((data) => {
        if (Array.isArray(data)) setProjects(data);
      })
      .catch((err) => {
        console.warn('Projects fetch error:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 text-left">
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

      {loading ? (
        <div className="p-12 text-center text-[var(--muted-text)]">
          <p className="text-sm">Loading workspace projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="py-12 px-6 text-center border border-dashed border-[var(--border)] rounded-2xl max-w-xl mx-auto space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center mx-auto text-[var(--primary)]">
            <FolderPlus className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text)]">No Active Projects</h3>
            <p className="text-xs text-[var(--muted-text)] mt-1 max-w-sm mx-auto">
              You do not have an active engagement assigned to your account yet. Stephen assigns project workspaces explicitly.
            </p>
          </div>
          <div className="pt-2">
            <Link to="/messages">
              <Button variant="outline" size="sm">
                Message Stephen
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((project: any) => (
            <Card key={project.id} className="flex flex-col justify-between hover:border-[var(--primary)] transition-all">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[var(--primary-link)]" />
                    <span className="text-xs font-semibold text-[var(--muted-text)]">
                      {project.websites?.[0]?.url || 'Domain pending setup'}
                    </span>
                  </div>
                  <Badge variant="success" size="sm" dot>
                    {project.status || 'Active'}
                  </Badge>
                </div>

                <h3 className="text-lg font-bold text-[var(--text)] mb-2">{project.name}</h3>
                {project.description && (
                  <p className="text-xs text-[var(--muted-text)] mb-4">
                    {project.description}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between">
                <span className="text-xs text-[var(--muted-text)]">
                  {project.createdAt ? `Started ${new Date(project.createdAt).toLocaleDateString()}` : ''}
                </span>
                <Link to={`/projects/${project.id}`}>
                  <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Enter Workspace
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};