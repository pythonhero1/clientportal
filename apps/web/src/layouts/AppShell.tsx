import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { MobileDrawer } from './components/MobileDrawer';
import { getAuthToken, setAuthToken, API_BASE_URL } from '../services/api-client';
import { loadClerk } from '../services/clerk-client';

export interface AppShellProps {
  role?: 'Admin' | 'Owner' | 'Client';
  userName?: string;
  userEmail?: string;
  children?: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  role = 'Client',
  userName = '',
  userEmail = '',
  children,
}) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState({ name: userName, email: userEmail });
  const [verifiedMe, setVerifiedMe] = useState<any>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Authentication check: executed once on mount to establish session
  useEffect(() => {
    let isMounted = true;

    loadClerk()
      .then((clerk) => {
        if (!isMounted) return;

        if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
          const token = getAuthToken();
          if (clerk && clerk.loaded && !clerk.user && !token) {
            const isTargetAdmin = location.pathname.startsWith('/admin') || location.pathname.startsWith('/owner');
            navigate(isTargetAdmin ? '/admin' : '/sign-in', { replace: true });
            return;
          }
        }
        if (clerk?.user) {
          const email =
            clerk.user.primaryEmailAddress?.emailAddress ||
            clerk.user.emailAddresses?.[0]?.emailAddress ||
            '';
          const name =
            clerk.user.fullName ||
            (clerk.user.firstName ? `${clerk.user.firstName} ${clerk.user.lastName || ''}`.trim() : '');
          if (isMounted) {
            setCurrentUser({ name, email });
          }
        }

        if (clerk?.session) {
          clerk.session.getToken().then((freshToken: string | null) => {
            if (freshToken) setAuthToken(freshToken);
          }).catch(() => {});
        }

        const token = getAuthToken();
        if (token && typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
          const authHeaders: Record<string, string> = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          };
          if (clerk?.user) {
            const email = clerk.user.primaryEmailAddress?.emailAddress || clerk.user.emailAddresses?.[0]?.emailAddress;
            if (email) authHeaders['x-user-email'] = email;
            const name = clerk.user.fullName;
            if (name) authHeaders['x-user-name'] = name;
          }

          fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: authHeaders,
          })
            .then((res) => {
              if (res.status === 403) {
                navigate('/pending-approval', { replace: true });
                return null;
              }
              if (res.ok) return res.json();
              return null;
            })
            .then((me) => {
              if (!isMounted || !me) return;
              setVerifiedMe(me);

              if (me.status === 'PENDING_APPROVAL') {
                navigate('/pending-approval', { replace: true });
                return;
              }
              if (me.status === 'SUSPENDED' || me.status === 'REJECTED') {
                navigate('/access-denied', { replace: true });
                return;
              }

              const verifiedEmail = (me.email || clerk?.user?.primaryEmailAddress?.emailAddress || '').toLowerCase().trim();
              const isUserAdmin =
                me.role === 'Admin' ||
                me.role === 'Owner' ||
                verifiedEmail === 'stephenoderinde@gmail.com';
              const isAdminRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/owner');

              if (!isUserAdmin && isAdminRoute) {
                navigate('/access-denied', { replace: true });
              } else if (isUserAdmin && !isAdminRoute) {
                navigate('/admin', { replace: true });
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {
        if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
          const token = getAuthToken();
          if (!token) {
            const isTargetAdmin = location.pathname.startsWith('/admin') || location.pathname.startsWith('/owner');
            navigate(isTargetAdmin ? '/admin' : '/sign-in', { replace: true });
          }
        }
      });

    const refreshTimer = setInterval(async () => {
      const win = window as any;
      if (win.Clerk?.session) {
        try {
          const fresh = await win.Clerk.session.getToken();
          if (fresh) setAuthToken(fresh);
        } catch {}
      }
    }, 45_000);

    return () => {
      isMounted = false;
      clearInterval(refreshTimer);
    };
  }, []);

  // Instant client-side route guard: runs on route change without any network call
  useEffect(() => {
    if (!verifiedMe) return;

    const verifiedEmail = (verifiedMe.email || currentUser.email || '').toLowerCase().trim();
    const isUserAdmin =
      verifiedMe.role === 'Admin' ||
      verifiedMe.role === 'Owner' ||
      verifiedEmail === 'stephenoderinde@gmail.com';
    const isAdminRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/owner');

    if (!isUserAdmin && isAdminRoute) {
      navigate('/access-denied', { replace: true });
    } else if (isUserAdmin && !isAdminRoute) {
      navigate('/admin', { replace: true });
    }
  }, [location.pathname, verifiedMe, currentUser.email, navigate]);

  // If user is Stephen or path starts with /admin, force role="Admin"
  const isStephen = currentUser.email?.toLowerCase() === 'stephenoderinde@gmail.com';
  const isAdminRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/owner');
  const activeRole: 'Admin' | 'Client' = isStephen || isAdminRoute || role === 'Admin' || role === 'Owner'
    ? 'Admin'
    : 'Client';

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
              {children || <Outlet />}
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
