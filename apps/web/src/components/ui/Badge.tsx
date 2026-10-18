import React from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'neutral' | 'accent' | 'fixture';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'neutral',
  size = 'md',
  dot = false,
  ...props
}) => {
  const variantClasses = {
    success:
      'bg-[var(--success-bg)] text-[var(--success-text)] border border-[var(--success-border)]',
    warning:
      'bg-[var(--warning-bg)] text-[var(--warning-text)] border border-[var(--warning-border)]',
    danger:
      'bg-[var(--danger-bg)] text-[var(--danger-text)] border border-[var(--danger-border)]',
    neutral:
      'bg-[var(--surface-raised)] text-[var(--muted-text)] border border-[var(--border)]',
    accent:
      'bg-[rgba(56,189,248,0.1)] text-[var(--accent-cyan)] border border-[rgba(56,189,248,0.3)]',
    fixture:
      'bg-[var(--fixture-bg)] text-[var(--fixture-text)] border border-[var(--fixture-border)] font-bold tracking-wider',
  };

  const sizeClasses = {
    sm: 'text-[0.625rem] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full uppercase tracking-wider select-none shrink-0',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            variant === 'success' && 'bg-[var(--success-text)]',
            variant === 'warning' && 'bg-[var(--warning-text)]',
            variant === 'danger' && 'bg-[var(--danger-text)]',
            variant === 'neutral' && 'bg-[var(--muted-text)]',
            variant === 'accent' && 'bg-[var(--accent-cyan)]',
            variant === 'fixture' && 'bg-[var(--fixture-text)]'
          )}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
};
