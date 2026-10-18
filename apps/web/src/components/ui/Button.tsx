import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';
import { Spinner } from './Spinner';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center font-medium transition-colors rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] focus-visible:outline-offset-2';

    const variantClasses = {
      primary:
        'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] border border-transparent shadow-sm',
      secondary:
        'bg-[var(--surface-raised)] text-[var(--text)] hover:bg-[var(--inset-surface)] border border-[var(--border)]',
      outline:
        'bg-transparent text-[var(--text)] hover:bg-[var(--surface-raised)] border border-[var(--border)]',
      ghost:
        'bg-transparent text-[var(--text)] hover:bg-[var(--surface-raised)] border border-transparent',
      danger:
        'bg-[var(--danger-text)] text-white hover:opacity-90 border border-transparent',
      link:
        'bg-transparent text-[var(--primary-link)] hover:underline p-0 h-auto border-none',
    };

    const sizeClasses = {
      sm: 'text-xs px-2.5 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2 gap-2',
      lg: 'text-base px-5 py-2.5 gap-2.5',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(
          baseClasses,
          variantClasses[variant],
          variant !== 'link' && sizeClasses[size],
          className
        )}
        {...props}
      >
        {isLoading && <Spinner size={size === 'lg' ? 'md' : 'sm'} className="mr-1" />}
        {!isLoading && leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
