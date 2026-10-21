import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../utils/cn';

export interface NavItemProps {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  badge?: string | number;
  compact?: boolean;
  onClick?: () => void;
}

export const NavItem: React.FC<NavItemProps> = ({
  to,
  label,
  icon: Icon,
  badge,
  compact = false,
  onClick,
}) => {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      title={compact ? label : undefined}
      style={({ isActive }) => (isActive ? { color: '#ffffff' } : undefined)}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center transition-all rounded-lg font-medium text-sm select-none no-underline',
          'focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] focus-visible:outline-offset-1',
          compact ? 'justify-center p-3 w-12 h-12 mx-auto' : 'px-3.5 py-2.5 gap-3 w-full',
          isActive
            ? 'bg-[var(--primary)] text-white shadow-xs font-semibold'
            : 'text-[var(--muted-text)] hover:text-[var(--text)] hover:bg-[var(--surface-raised)]'
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={cn(
              'w-5 h-5 shrink-0 transition-colors',
              isActive ? 'text-white' : 'text-[var(--muted-text)] group-hover:text-[var(--text)]'
            )}
            style={isActive ? { color: '#ffffff' } : undefined}
          />

          {!compact && (
            <span
              className={cn(
                'flex-1 text-left truncate transition-colors',
                isActive
                  ? 'text-white font-semibold'
                  : 'text-[var(--muted-text)] group-hover:text-[var(--text)]'
              )}
              style={isActive ? { color: '#ffffff' } : undefined}
            >
              {label}
            </span>
          )}

          {!compact && badge !== undefined && (
            <span
              className={cn(
                'ml-auto text-[0.6875rem] px-2 py-0.5 rounded-full font-bold transition-colors',
                isActive
                  ? 'bg-white/20 text-white'
                  : 'bg-[var(--surface-raised)] text-[var(--muted-text)] border border-[var(--border)]'
              )}
              style={isActive ? { color: '#ffffff' } : undefined}
            >
              {badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
};
