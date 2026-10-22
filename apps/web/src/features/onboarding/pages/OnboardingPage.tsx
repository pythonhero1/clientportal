import React, { useEffect, useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchOnboarding } from '../../../services/projects-api';

export const OnboardingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const urlProjectId = searchParams.get('projectId');
  const [projectId, setProjectId] = useState<string>(urlProjectId || '');
  const [onboardingData, setOnboardingData] = useState<any>(null);

  useEffect(() => {
    if (!urlProjectId) {
      import('../../../services/projects-api').then(({ fetchProjects }) => {
        fetchProjects()
          .then((projs) => {
            if (Array.isArray(projs) && projs.length > 0) {
              setProjectId(projs[0].id);
            }
          })
          .catch(() => {});
      });
    }
  }, [urlProjectId]);

  useEffect(() => {
    if (projectId) {
      fetchOnboarding(projectId)
        .then((data) => setOnboardingData(data))
        .catch((err) => console.warn('Onboarding fetch error:', err));
    }
  }, [projectId]);

  const defaultSteps = [
    { number: 1, title: 'Identity & Access Verification', status: 'completed', desc: 'Clerk account authentication and activation confirmed.' },
    { number: 2, title: 'Project Brief & Questionnaire', status: 'current', desc: 'Fill out design preferences, brand guidelines, and target goals.', link: '/onboarding/questionnaire' },
    { number: 3, title: 'Asset & Drive Access Connection', status: 'pending', desc: 'Connect Google Drive folder with high-res logos and imagery.' },
    { number: 4, title: 'Credential Exchange via Bitwarden Send', status: 'pending', desc: 'Securely share staging or domain credentials without password storage in portal.' },
    { number: 5, title: 'Discovery & Kickoff Call', status: 'pending', desc: 'Schedule initial alignment session on Cal.com.', link: '/meetings' },
    { number: 6, title: 'Milestone Roadmap Acceptance', status: 'pending', desc: 'Review project timeline, delivery dates, and designated approver.' },
  ];

  const steps = onboardingData?.steps || defaultSteps;

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)]">
          Client Onboarding
        </h1>
        <p className="text-sm text-[var(--muted-text)] mt-1">
          Complete these 6 steps to kick off your project with Stephen.
        </p>
      </div>

      <div className="space-y-4">
        {steps.map((step: any) => (
          <Card key={step.number || step.id} className={step.status === 'current' ? 'border-[var(--primary)] ring-1 ring-[var(--primary)]' : undefined}>
            <div className="flex items-start gap-4">
              <div className="shrink-0 mt-1">
                {step.status === 'completed' || step.status === 'COMPLETED' ? (
                  <CheckCircle2 className="w-6 h-6 text-[var(--success-text)]" />
                ) : step.status === 'current' || step.status === 'IN_PROGRESS' ? (
                  <div className="w-6 h-6 rounded-full bg-[var(--primary)] text-white text-xs font-bold flex items-center justify-center">
                    {step.number || 2}
                  </div>
                ) : (
                  <Circle className="w-6 h-6 text-[var(--muted-text)] opacity-40" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="text-base font-semibold text-[var(--text)]">
                    Step {step.number || ''}: {step.title}
                  </h3>
                  <Badge
                    variant={
                      step.status === 'completed' || step.status === 'COMPLETED'
                        ? 'success'
                        : step.status === 'current' || step.status === 'IN_PROGRESS'
                        ? 'warning'
                        : 'neutral'
                    }
                    size="sm"
                  >
                    {step.status === 'completed' || step.status === 'COMPLETED'
                      ? 'Completed'
                      : step.status === 'current' || step.status === 'IN_PROGRESS'
                      ? 'In Progress'
                      : 'Pending'}
                  </Badge>
                </div>
                <p className="text-sm text-[var(--muted-text)]">{step.desc || step.description}</p>

                {step.link && (
                  <div className="mt-3">
                    <Link to={step.link}>
                      <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                        Continue Step
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
