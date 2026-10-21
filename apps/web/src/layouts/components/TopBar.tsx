import React from 'react';
import { Menu, Bell, Sun, Moon } from 'lucide-react';
import { UserMenu } from './UserMenu';
import { useTheme } from '../../hooks/useTheme';
import { useNotifications } from '../../features/notifications/hooks/useNotifications';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';

export interface TopBarProps {
  onOpenMobileNav: () => void;
  role?: 'Owner' | 'Client';
  userName?: string;
  userEmail?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenMobileNav,
  role = 'Client',
  userName = 'Stephen Oderinde',
  userEmail = 'stephen@oderindestephen.com',
}) => {
  const { resolvedTheme, toggleTheme } = useTheme();
  const { unreadCount } = useNotifications();
  const location = useLocation();

  const getPageTitle = (pathname: string): string => {
    switch (pathname) {
      case '/overview':
        return 'Dashboard Overview';
      case '/onboarding':
        return 'Client Onboarding';
      case '/projects':
        return 'Projects & Websites';
      case '/files':
        return 'Files & Deliverables';
      case '/invoices':
        return 'Invoices & Billing';
      case '/onboarding/questionnaire':
        return 'Project Brief Questionnaire';
      case '/messages':
        return 'Messages & Communication';
      case '/meetings':
        return 'Meetings & Project Calendar';
      case '/notifications':
        return 'Notifications Center';
      case '/settings':
        return 'Account & Security Settings';
      case '/support':
        return 'Help Center & Ticket Support';
      case '/no-project':
        return 'Overview (No Active Project)';
      case '/owner':
        return 'Owner Command Overview';
      case '/owner/clients':
        return 'Client Approvals & Invitations';
      case '/owner/projects':
        return 'Project Creation & Assignment';
      case '/owner/files':
        return 'File Review & 90-Day Lifecycle';
      case '/owner/invoices':
        return 'Billing & Invoice Issuance';
      case '/owner/support':
        return 'Client Ticket Support Queue';
      default:
        if (pathname.startsWith('/projects/')) {
          return 'Project Workspace';
        }
        return 'Client Portal';
    }
  };

  const title = getPageTitle(location.pathname);

  return (
    <header className="h-16 px-4 md:px-6 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-4 sticky top-0 z-30 select-none">
      {/* Left: Mobile Menu Trigger + Breadcrumb Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileNav}
          className="md:hidden p-2 rounded-lg text-[var(--muted-text)] hover:text-[var(--text)] hover:bg-[var(--surface-raised)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-base text-[var(--text)]">{title}</span>
        </div>
      </div>

      {/* Right: Quick Actions + Theme + Profile */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Quick Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-[var(--muted-text)] hover:text-[var(--text)] hover:bg-[var(--surface-raised)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
          aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>

        {/* Notifications Bell */}
        <Link
          to="/notifications"
          className={cn(
            'relative p-2 rounded-lg text-[var(--muted-text)] hover:text-[var(--text)] hover:bg-[var(--surface-raised)] transition-colors',
            'focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]'
          )}
          aria-label="View notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--primary)]" />
          )}
        </Link>

        {/* User Menu */}
        <div className="pl-1 md:pl-2 border-l border-[var(--border)]">
          <UserMenu name={userName} email={userEmail} role={role} />
        </div>
      </div>
    </header>
  );
};
