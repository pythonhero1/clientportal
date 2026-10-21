import React from 'react';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Button } from '../../../components/ui/Button';
import { FolderPlus, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

export const NoActiveProjectPage: React.FC = () => {
  return (
    <div className="space-y-6 text-left max-w-2xl mx-auto">

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">
          Welcome to the Client Portal
        </h1>
        <p className="text-xs text-[var(--muted-text)] mt-1">
          Your portal access is activated. Stephen assigns projects explicitly to client accounts.
        </p>
      </div>

      <EmptyState
        icon={<FolderPlus className="w-6 h-6 text-[var(--primary)]" />}
        title="No Active Project Assigned"
        description="You do not currently have an active engagement assigned to your account. Reach out to Stephen or submit an onboarding questionnaire to start a new project."
        actionLabel="Start Onboarding Brief"
        onAction={() => {
          window.location.href = '/onboarding/questionnaire';
        }}
      />

      <div className="flex items-center justify-center gap-3">
        <Link to="/messages">
          <Button variant="outline" size="sm" leftIcon={<MessageSquare className="w-4 h-4" />}>
            Contact Stephen Directly
          </Button>
        </Link>
      </div>
    </div>
  );
};
