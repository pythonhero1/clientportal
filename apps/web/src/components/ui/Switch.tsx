import React from 'react';
import { cn } from '../../utils/cn';

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  className?: string;
  id?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onCheckedChange,
  disabled = false,
  label,
  description,
  className,
  id,
}) => {
  const switchId = id || (label ? `switch-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className={cn('flex items-start justify-between gap-3', className)}>
      {(label || description) && (
        <div className="flex-1 text-left">
          {label && (
            <label
              htmlFor={switchId}
              className={cn(
                'text-sm font-medium text-[var(--text)] select-none cursor-pointer',
                disabled && 'opacity-60 cursor-not-allowed',
              )}
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-xs text-[var(--muted-text)] mt-0.5 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        role="switch"
        id={switchId}
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onCheckedChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
          'focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]',
          checked ? 'bg-[var(--primary)]' : 'bg-[var(--border)]',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out',
            checked ? 'translate-x-5' : 'translate-x-0',
          )}
        />
      </button>
    </div>
  );
};
