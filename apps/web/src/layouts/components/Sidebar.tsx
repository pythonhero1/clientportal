import React from 'react';
import { NavItem } from './NavItem';
import { Badge } from '../../components/ui/Badge';
import {
  LayoutDashboard,
  Sparkles,
  FolderGit2,
  FileText,
  Receipt,
  MessageSquare,
  Calendar,
  Bell,
  Settings,
  HelpCircle,
  Users,
  ShieldAlert,
  FolderKanban,
  FileCheck2,
  CreditCard,
  LifeBuoy,
  ArrowLeftRight,
} from 'lucide-react';
import { cn } from '../../utils/cn';

export interface SidebarProps {
  role?: 'Owner' | 'Client';
  compact?: boolean;
  onItemClick?: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  role = 'Client',
  compact = false,
  onItemClick,
  className,
}) => {
  const clientNav = [
    { to: '/overview', label: 'Dashboard Overview', icon: LayoutDashboard },
    { to: '/onboarding', label: 'Client Onboarding', icon: Sparkles, badge: '6 Steps' },
    { to: '/projects', label: 'Projects & Websites', icon: FolderGit2 },
    { to: '/files', label: 'Files & Feedback', icon: FileText },
    { to: '/invoices', label: 'Invoices & Billing', icon: Receipt },
    { to: '/messages', label: 'Messages & Support', icon: MessageSquare },
    { to: '/meetings', label: 'Meetings & Calendar', icon: Calendar },
    { to: '/notifications', label: 'Notifications', icon: Bell, badge: 3 },
    { to: '/settings', label: 'Profile & Security', icon: Settings },
    { to: '/support', label: 'Help & Tickets', icon: HelpCircle },
  ];

  const ownerNav = [
    { to: '/owner', label: 'Owner Overview', icon: ShieldAlert },
    { to: '/owner/clients', label: 'Clients & Invitations', icon: Users, badge: 'Pending' },
    { to: '/owner/projects', label: 'Projects & Assignment', icon: FolderKanban },
    { to: '/owner/files', label: 'Deliverables & Lifecycle', icon: FileCheck2 },
    { to: '/owner/invoices', label: 'Billing & Invoices', icon: CreditCard },
    { to: '/owner/support', label: 'Support Queue', icon: LifeBuoy },
    { to: '/overview', label: 'Switch to Client View', icon: ArrowLeftRight },
  ];

  const navItems = role === 'Owner' ? ownerNav : clientNav;

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-[var(--surface)] border-r border-[var(--border)] transition-all select-none',
        compact ? 'w-20 p-2.5 items-center' : 'w-64 p-4',
        className
      )}
    >
      {/* Brand Header */}
      <div className={cn('flex items-center gap-3 mb-6 pt-1', compact && 'justify-center')}>
        <img
          src="/logo.png"
          alt="Oderinde Stephen Logo"
          className="w-9 h-9 rounded-lg object-cover shrink-0"
        />
        {!compact && (
          <div className="flex flex-col min-w-0 text-left">
            <span className="font-bold text-xs tracking-wider uppercase text-[var(--text)] truncate">
              ODERINDE STEPHEN
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[0.625rem] font-semibold tracking-wider text-[var(--accent-cyan)] uppercase">
                {role === 'Owner' ? 'OWNER SUITE' : 'CLIENT PORTAL'}
              </span>
              <Badge variant={role === 'Owner' ? 'accent' : 'neutral'} size="sm">
                {role}
              </Badge>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 overflow-y-auto pr-1" aria-label="Main Navigation">
        {navItems.map((item) => (
          <NavItem
            key={item.to}
            to={item.to}
            label={item.label}
            icon={item.icon}
            badge={item.badge}
            compact={compact}
            onClick={onItemClick}
          />
        ))}
      </nav>

      {/* Role Switcher Quick Pill (for Owner in development) */}
      {!compact && role === 'Client' && (
        <div className="pt-3 border-t border-[var(--border)] mt-auto">
          <NavItem
            to="/owner"
            label="Switch to Owner View"
            icon={ArrowLeftRight}
            onClick={onItemClick}
          />
        </div>
      )}
    </aside>
  );
};
