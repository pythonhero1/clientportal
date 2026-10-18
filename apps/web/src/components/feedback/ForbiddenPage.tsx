import React from 'react';
import { Button } from '../ui/Button';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface ForbiddenPageProps {
  requiredRole?: string;
  message?: string;
}

export const ForbiddenPage: React.FC<ForbiddenPageProps> = ({
  requiredRole = 'Owner',
  message = 'Your active account role does not have authorization to view this administrative management surface.',
}) => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6 text-center select-none">
      <div className="max-w-md w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 shadow-sm">
        <div className="w-14 h-14 rounded-full bg-[var(--danger-bg)] border border-[var(--danger-border)] text-[var(--danger-text)] flex items-center justify-center mx-auto mb-5">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <span className="text-xs font-bold uppercase tracking-wider text-[var(--danger-text)] mb-1 block">
          403 Access Forbidden
        </span>
        <h2 className="text-xl font-bold mb-2 text-[var(--text)]">Restricted Access</h2>
        <p className="text-sm text-[var(--muted-text)] mb-2 leading-relaxed">
          {message}
        </p>
        <p className="text-xs font-medium text-[var(--muted-text)] mb-6">
          Requires role: <span className="font-bold text-[var(--text)]">{requiredRole}</span>
        </p>

        <Link to="/overview">
          <Button variant="primary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Return to Authorized Portal
          </Button>
        </Link>
      </div>
    </div>
  );
};
