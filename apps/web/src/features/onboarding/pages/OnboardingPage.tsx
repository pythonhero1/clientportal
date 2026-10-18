import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { FixtureBadge } from '../../../components/ui/FixtureBadge';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const OnboardingPage: React.FC = () => {
  const steps = [
    { number: 1, title: 'Identity & Access Verification', status: 'completed', desc: 'Clerk account authentication and activation confirmed.' },
    { number: 2, title: 'Project Brief & Questionnaire', status: 'current', desc: 'Fill out design preferences, brand guidelines, and target goals.', link: '/onboarding/questionnaire' },
    { number: 3, title: 'Asset & Drive Access Connection', status: 'pending', desc: 'Connect Google Drive folder with high-res logos and imagery.' },
    { number: 4, title: 'Credential Exchange via Bitwarden Send', status: 'pending', desc: 'Securely share staging or domain credentials without password storage in portal.' },
    { number: 5, title: 'Discovery & Kickoff Call', status: 'pending', desc: 'Schedule initial alignment session on Cal.com.', link: '/meetings' },
    { number: 6, title: 'Milestone Roadmap Acceptance', status: 'pending', desc: 'Review project timeline, delivery dates, and designated approver.' },
  ];

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto">
      <FixtureBadge phase="P03" />

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)]">
          Client Onboarding
        </h1>
        <p className="text-sm text-[var(--muted-text)] mt-1">
          Complete these 6 steps to kick off your project with Stephen.
        </p>
      </div>

      <div className="space-y-4">
        {steps.map((step) => (
          <Card key={step.number} className={step.status === 'current' ? 'border-[var(--primary)] ring-1 ring-[var(--primary)]' : undefined}>
            <div className="flex items-start gap-4">
              <div className="shrink-0 mt-1">
                {step.status === 'completed' ? (
                  <CheckCircle2 className="w-6 h-6 text-[var(--success-text)]" />
                ) : step.status === 'current' ? (
                  <div className="w-6 h-6 rounded-full bg-[var(--primary)] text-white text-xs font-bold flex items-center justify-center">
                    {step.number}
                  </div>
                ) : (
                  <Circle className="w-6 h-6 text-[var(--muted-text)] opacity-40" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="text-base font-semibold text-[var(--text)]">
                    Step {step.number}: {step.title}
                  </h3>
                  <Badge
                    variant={
                      step.status === 'completed'
                        ? 'success'
                        : step.status === 'current'
                        ? 'warning'
                        : 'neutral'
                    }
                    size="sm"
                  >
                    {step.status === 'completed'
                      ? 'Completed'
                      : step.status === 'current'
                      ? 'In Progress'
                      : 'Pending'}
                  </Badge>
                </div>
                <p className="text-sm text-[var(--muted-text)]">{step.desc}</p>

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
