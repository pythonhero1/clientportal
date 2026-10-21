import React from 'react';
import { Globe, RefreshCw } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';

export interface TimezoneBadgeProps {
  activeTimezone: string;
  isStephenTimezone: boolean;
  onToggle: () => void;
  className?: string;
}

export const TimezoneBadge: React.FC<TimezoneBadgeProps> = ({
  activeTimezone,
  isStephenTimezone,
  onToggle,
  className = '',
}) => {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <Badge variant="neutral" size="md" className="flex items-center gap-1.5 py-1 px-2.5">
        <Globe className="w-3.5 h-3.5 text-[var(--primary)]" />
        <span className="text-xs font-medium text-[var(--text)]">
          {isStephenTimezone ? "Stephen's Time: Africa/Lagos (WAT)" : `Your Time: ${activeTimezone}`}
        </span>
      </Badge>
      <button
        type="button"
        onClick={onToggle}
        title="Toggle between Stephen's local time (Africa/Lagos) and your local timezone"
        className="text-xs text-[var(--muted-text)] hover:text-[var(--text)] hover:underline inline-flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded cursor-pointer"
      >
        <RefreshCw className="w-3 h-3" />
        <span>Switch to {isStephenTimezone ? 'Local Time' : 'Lagos Time'}</span>
      </button>
    </div>
  );
};
