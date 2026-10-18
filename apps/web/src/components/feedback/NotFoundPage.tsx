import React from 'react';
import { Button } from '../ui/Button';
import { HelpCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6 text-center select-none">
      <div className="max-w-md w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 shadow-sm">
        <div className="w-14 h-14 rounded-full bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--muted-text)] flex items-center justify-center mx-auto mb-5">
          <HelpCircle className="w-7 h-7 text-[var(--primary-link)]" />
        </div>

        <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary-link)] mb-1 block">
          404 Not Found
        </span>
        <h2 className="text-xl font-bold mb-2 text-[var(--text)]">Page not found</h2>
        <p className="text-sm text-[var(--muted-text)] mb-6 leading-relaxed">
          The requested URL does not match any route in the portal. It may have moved or requires different authorization.
        </p>

        <Link to="/overview">
          <Button variant="primary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};
