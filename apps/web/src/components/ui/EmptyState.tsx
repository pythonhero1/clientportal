import React from 'react';
import { cn } from '../../utils/cn';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-xl',
        'border border-dashed border-[var(--border)] bg-[var(--surface)]',
        'min-h-[280px]',
        className
      )}
    >
      {icon && (
        <div className="w-12 h-12 rounded-full bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center text-[var(--muted-text)] mb-4 shrink-0">
          {icon}
        </div>
      )}
      <h4 className="text-base font-semibold text-[var(--text)] mb-1">{title}</h4>
      <p className="text-sm text-[var(--muted-text)] max-w-sm mb-5">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
