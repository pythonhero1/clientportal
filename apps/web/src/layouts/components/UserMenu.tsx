import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useTheme } from '../../hooks/useTheme';
import { Badge } from '../../components/ui/Badge';
import { Sun, Moon, Monitor, LogOut, Check } from 'lucide-react';
import { cn } from '../../utils/cn';

import { loadClerk } from '../../services/clerk-client';

export interface UserMenuProps {
  name?: string;
  email?: string;
  role?: 'Admin' | 'Owner' | 'Client';
}

export const UserMenu: React.FC<UserMenuProps> = ({
  name = 'Stephen Oderinde',
  email = 'stephenoderinde@gmail.com',
  role = 'Admin',
}) => {
  const { theme, setTheme } = useTheme();
  const isAdmin = role === 'Admin' || role === 'Owner';

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleSignOut = async () => {
    try {
      const clerk = await loadClerk();
      if (clerk) {
        await clerk.signOut();
      }
    } catch {}
    localStorage.removeItem('portal_auth_token');
    window.location.href = isAdmin ? '/admin' : '/sign-in';
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className={cn(
            'flex items-center gap-2.5 p-1 rounded-full cursor-pointer transition-all select-none',
            'hover:ring-2 hover:ring-[var(--border)]',
            'focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] focus-visible:outline-offset-2'
          )}
          aria-label="Open user profile menu"
        >
          <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white font-semibold text-xs flex items-center justify-center shadow-xs">
            {initials}
          </div>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className={cn(
            'z-50 min-w-[240px] rounded-xl p-2 shadow-xl border text-left',
            'bg-[var(--surface)] text-[var(--text)] border-[var(--border)]',
            'animate-in fade-in-80 zoom-in-95'
          )}
        >
          <div className="px-3 py-2 border-b border-[var(--border)] mb-1">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold truncate text-[var(--text)]">{name}</p>
              <Badge variant={isAdmin ? 'accent' : 'neutral'} size="sm">
                {isAdmin ? 'Admin' : 'Client'}
              </Badge>
            </div>
            <p className="text-xs text-[var(--muted-text)] truncate">{email}</p>
          </div>

          <div className="py-1">
            <div className="px-3 py-1.5 text-[0.6875rem] font-bold uppercase tracking-wider text-[var(--muted-text)]">
              Appearance
            </div>

            <DropdownMenu.Item
              onClick={() => setTheme('light')}
              className={cn(
                'flex items-center justify-between px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors outline-none',
                'hover:bg-[var(--surface-raised)] text-[var(--text)]'
              )}
            >
              <span className="flex items-center gap-2.5">
                <Sun className="w-4 h-4 text-[var(--muted-text)]" />
                Light mode
              </span>
              {theme === 'light' && <Check className="w-4 h-4 text-[var(--primary)]" />}
            </DropdownMenu.Item>

            <DropdownMenu.Item
              onClick={() => setTheme('dark')}
              className={cn(
                'flex items-center justify-between px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors outline-none',
                'hover:bg-[var(--surface-raised)] text-[var(--text)]'
              )}
            >
              <span className="flex items-center gap-2.5">
                <Moon className="w-4 h-4 text-[var(--muted-text)]" />
                Dark mode
              </span>
              {theme === 'dark' && <Check className="w-4 h-4 text-[var(--primary)]" />}
            </DropdownMenu.Item>

            <DropdownMenu.Item
              onClick={() => setTheme('system')}
              className={cn(
                'flex items-center justify-between px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors outline-none',
                'hover:bg-[var(--surface-raised)] text-[var(--text)]'
              )}
            >
              <span className="flex items-center gap-2.5">
                <Monitor className="w-4 h-4 text-[var(--muted-text)]" />
                System preference
              </span>
              {theme === 'system' && <Check className="w-4 h-4 text-[var(--primary)]" />}
            </DropdownMenu.Item>
          </div>

          <DropdownMenu.Separator className="h-px bg-[var(--border)] my-1" />

          <DropdownMenu.Item
            onClick={handleSignOut}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors outline-none',
              'text-[var(--danger-text)] hover:bg-[var(--danger-bg)]'
            )}
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
