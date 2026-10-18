import React from 'react';
import { Badge } from './Badge';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface FixtureBadgeProps {
  phase: string;
  className?: string;
  compact?: boolean;
}

export const FixtureBadge: React.FC<FixtureBadgeProps> = ({
  phase,
  className,
  compact = false,
}) => {
  if (compact) {
    return (
      <Badge variant="fixture" size="sm" dot className={className}>
        Preview Fixture ({phase})
      </Badge>
    );
  }

  return (
    <div
      className={cn(
        'w-full p-3 rounded-lg flex items-center justify-between gap-3 text-xs',
        'bg-[var(--fixture-bg)] text-[var(--fixture-text)] border border-[var(--fixture-border)]',
        'mb-6 shadow-sm',
        className
      )}
      role="alert"
    >
      <div className="flex items-center gap-2.5">
        <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span className="font-semibold uppercase tracking-wider">
          Preview Fixture: Live domain behavior is connected in Phase {phase}
        </span>
      </div>
      <Badge variant="fixture" size="sm">
        Figma Fixture Data
      </Badge>
    </div>
  );
};
