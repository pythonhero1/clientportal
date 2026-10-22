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
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useNotifications } from '../../features/notifications/hooks/useNotifications';

export interface SidebarProps {
  role?: 'Admin' | 'Owner' | 'Client';
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
  const { unreadCount } = useNotifications();
  const isAdmin = role === 'Admin' || role === 'Owner';

  const clientNav = [
    { to: '/overview', label: 'Dashboard Overview', icon: LayoutDashboard },
    { to: '/onboarding', label: 'Client Onboarding', icon: Sparkles, badge: '6 Steps' },
    { to: '/projects', label: 'Projects & Websites', icon: FolderGit2 },
    { to: '/files', label: 'Files & Feedback', icon: FileText },
    { to: '/invoices', label: 'Invoices & Billing', icon: Receipt },
    { to: '/messages', label: 'Messages & Support', icon: MessageSquare },
    { to: '/meetings', label: 'Meetings & Calendar', icon: Calendar },
    { to: '/notifications', label: 'Notifications', icon: Bell, badge: unreadCount > 0 ? unreadCount : undefined },
    { to: '/settings', label: 'Profile & Security', icon: Settings },
    { to: '/support', label: 'Help & Tickets', icon: HelpCircle },
  ];

  const adminNav = [
    { to: '/admin', label: 'Admin Overview', icon: ShieldAlert },
    { to: '/admin/clients', label: 'Clients & Invitations', icon: Users, badge: 'Pending' },
    { to: '/admin/projects', label: 'Projects & Assignment', icon: FolderKanban },
    { to: '/admin/files', label: 'Deliverables & Lifecycle', icon: FileCheck2 },
    { to: '/admin/messages', label: 'Messages & Channels', icon: MessageSquare },
    { to: '/admin/invoices', label: 'Billing & Invoices', icon: CreditCard },
    { to: '/admin/support', label: 'Support Queue', icon: LifeBuoy },
    { to: '/admin/meetings', label: 'Meetings & Schedule', icon: Calendar },
    { to: '/admin/notifications', label: 'Notifications', icon: Bell, badge: unreadCount > 0 ? unreadCount : undefined },
  ];

  const navItems = isAdmin ? adminNav : clientNav;

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
                {isAdmin ? 'ADMIN SUITE' : 'CLIENT PORTAL'}
              </span>
              <Badge variant={isAdmin ? 'accent' : 'neutral'} size="sm">
                {isAdmin ? 'Admin' : 'Client'}
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
    </aside>
  );
};
