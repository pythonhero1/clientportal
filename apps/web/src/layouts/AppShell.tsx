import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { MobileDrawer } from './components/MobileDrawer';
import { getAuthToken } from '../services/api-client';
import { loadClerk } from '../services/clerk-client';

export interface AppShellProps {
  role?: 'Owner' | 'Client';
  userName?: string;
  userEmail?: string;
}

export const AppShell: React.FC<AppShellProps> = ({
  role = 'Client',
  userName = 'Stephen Oderinde',
  userEmail = 'stephenoderinde@gmail.com',
}) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState({ name: userName, email: userEmail });
  const location = useLocation();
  const navigate = useNavigate();

  // Authentication guard: in production, require valid Clerk session or token
  useEffect(() => {
    loadClerk()
      .then((clerk) => {
        if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
          const token = getAuthToken();
          if (clerk && clerk.loaded && !clerk.user && !token) {
            navigate('/sign-in', { replace: true });
            return;
          }
        }
        if (clerk?.user) {
          const email =
            clerk.user.primaryEmailAddress?.emailAddress ||
            clerk.user.emailAddresses?.[0]?.emailAddress ||
            userEmail;
          const name =
            clerk.user.fullName ||
            (clerk.user.firstName ? `${clerk.user.firstName} ${clerk.user.lastName || ''}`.trim() : userName);
          setCurrentUser({ name, email });
        }
      })
      .catch(() => {
        if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
          const token = getAuthToken();
          if (!token) {
            navigate('/sign-in', { replace: true });
          }
        }
      });
  }, [location.pathname, navigate, userName, userEmail]);

  // If path starts with /owner, force role="Owner"
  const activeRole: 'Owner' | 'Client' = location.pathname.startsWith('/owner')
    ? 'Owner'
    : role;

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--text)] flex flex-col font-sans antialiased">
      {/* Skip to Content for WCAG keyboard accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--primary)] focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-2 focus:outline-[var(--focus-ring)]"
      >
        Skip to main content
      </a>

      <div className="flex flex-1 h-screen overflow-hidden">
        {/* Desktop Persistent Sidebar (>= 1024px) */}
        <div className="hidden lg:flex shrink-0">
          <Sidebar role={activeRole} compact={false} />
        </div>

        {/* Tablet Compact Sidebar (768px - 1023px) */}
        <div className="hidden md:flex lg:hidden shrink-0">
          <Sidebar role={activeRole} compact={true} />
        </div>

        {/* Mobile Slide-over Drawer (< 768px) */}
        <MobileDrawer
          open={mobileNavOpen}
          onOpenChange={setMobileNavOpen}
          role={activeRole}
        />

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <TopBar
            onOpenMobileNav={() => setMobileNavOpen(true)}
            role={activeRole}
            userName={currentUser.name}
            userEmail={currentUser.email}
          />

          {/* Main Scrollable View */}
          <main
            id="main-content"
            tabIndex={-1}
            className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 outline-none"
          >
            <div className="max-w-7xl mx-auto w-full">
              <Outlet />
            </div>
          </main>

          {/* App Footer */}
          <footer className="h-10 px-6 border-t border-[var(--border)] bg-[var(--surface)] text-[var(--muted-text)] text-xs flex items-center justify-between shrink-0 select-none">
            <span>&copy; 2026 Oderinde Stephen. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <span>Timezone: Africa/Lagos</span>
              <span className="font-semibold text-[var(--accent-cyan)]">Antigravity Portal</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};
