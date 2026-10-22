import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '../layouts/AppShell';

// Auth Pages (Screens 01 - 05 + Status Pages)
import { SignInPage } from '../features/auth/pages/SignInPage';
import { SignUpPage } from '../features/auth/pages/SignUpPage';
import { AdminLoginPage } from '../features/auth/pages/AdminLoginPage';
import { ForgotPasswordPage } from '../features/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../features/auth/pages/ResetPasswordPage';
import { VerifyEmailPage } from '../features/auth/pages/VerifyEmailPage';
import { PendingApprovalPage } from '../features/auth/pages/PendingApprovalPage';
import { AccessDeniedPage } from '../features/auth/pages/AccessDeniedPage';
import { getAuthToken } from '../services/api-client';
import { loadClerk } from '../services/clerk-client';

// Client Portal Pages (Screens 06 - 18)
import { OverviewPage } from '../features/dashboard/pages/OverviewPage';
import { OnboardingPage } from '../features/onboarding/pages/OnboardingPage';
import { ProjectsListPage } from '../features/projects/pages/ProjectsListPage';
import { ProjectWorkspacePage } from '../features/projects/pages/ProjectWorkspacePage';
import { FilesFeedbackPage } from '../features/files/pages/FilesFeedbackPage';
import { InvoicesPage } from '../features/invoices/pages/InvoicesPage';
import { QuestionnairePage } from '../features/onboarding/pages/QuestionnairePage';
import { MessagesPage } from '../features/messages/pages/MessagesPage';
import { MeetingsCalendarPage } from '../features/meetings/pages/MeetingsCalendarPage';
import { NotificationsPage } from '../features/notifications/pages/NotificationsPage';
import { SettingsPage } from '../features/settings/pages/SettingsPage';
import { SupportHelpPage } from '../features/support/pages/SupportHelpPage';
import { NoActiveProjectPage } from '../features/dashboard/pages/NoActiveProjectPage';

// Owner Management Pages
import { OwnerDashboardPage } from '../features/owner/pages/OwnerDashboardPage';
import { OwnerClientsPage } from '../features/owner/pages/OwnerClientsPage';
import { OwnerProjectsPage } from '../features/owner/pages/OwnerProjectsPage';
import { OwnerProjectDetailPage } from '../features/owner/pages/OwnerProjectDetailPage';
import { OwnerFilesPage } from '../features/owner/pages/OwnerFilesPage';
import { OwnerInvoicesPage } from '../features/owner/pages/OwnerInvoicesPage';
import { OwnerSupportPage } from '../features/owner/pages/OwnerSupportPage';
import { OwnerMessagesPage } from '../features/owner/pages/OwnerMessagesPage';
import { OwnerMeetingsPage } from '../features/owner/pages/OwnerMeetingsPage';

// Feedback & Boundary Pages
import { NotFoundPage } from '../components/feedback/NotFoundPage';
import { ForbiddenPage } from '../components/feedback/ForbiddenPage';

const AdminGatewayRoute: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(() => {
    const token = getAuthToken();
    return token ? true : null;
  });

  React.useEffect(() => {
    loadClerk()
      .then((clerk) => {
        const token = getAuthToken();
        if (clerk?.user || token) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      })
      .catch(() => {
        const token = getAuthToken();
        setIsAuthenticated(Boolean(token));
      });
  }, []);

  if (isAuthenticated === null) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--canvas)' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLoginPage />;
  }

  return (
    <AppShell role="Admin">
      <OwnerDashboardPage />
    </AppShell>
  );
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Client Auth Routes */}
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/sign-up" element={<SignUpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/pending-approval" element={<PendingApprovalPage />} />
      <Route path="/access-denied" element={<AccessDeniedPage />} />
      <Route path="/403" element={<ForbiddenPage />} />

      {/* Dedicated Admin Portal Routes */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<AdminGatewayRoute />} />

      {/* Authenticated Client Shell Routes */}
      <Route element={<AppShell role="Client" />}>
        <Route path="/" element={<Navigate to="/overview" replace />} />
        <Route path="/overview" element={<OverviewPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/onboarding/questionnaire" element={<QuestionnairePage />} />
        <Route path="/projects" element={<ProjectsListPage />} />
        <Route path="/projects/:projectId" element={<ProjectWorkspacePage />} />
        <Route path="/files" element={<FilesFeedbackPage />} />
        <Route path="/invoices" element={<InvoicesPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/meetings" element={<MeetingsCalendarPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/support" element={<SupportHelpPage />} />
        <Route path="/no-project" element={<NoActiveProjectPage />} />
      </Route>

      {/* Authenticated Admin Management Suite Routes */}
      <Route element={<AppShell role="Admin" />}>
        <Route path="/admin/clients" element={<OwnerClientsPage />} />
        <Route path="/admin/projects" element={<OwnerProjectsPage />} />
        <Route path="/admin/projects/:projectId" element={<OwnerProjectDetailPage />} />
        <Route path="/admin/files" element={<OwnerFilesPage />} />
        <Route path="/admin/messages" element={<OwnerMessagesPage />} />
        <Route path="/admin/invoices" element={<OwnerInvoicesPage />} />
        <Route path="/admin/support" element={<OwnerSupportPage />} />
        <Route path="/admin/meetings" element={<OwnerMeetingsPage />} />
        <Route path="/admin/notifications" element={<NotificationsPage />} />
      </Route>

      {/* Legacy /owner Redirects for Backward Compatibility */}
      <Route path="/owner" element={<Navigate to="/admin" replace />} />
      <Route path="/owner/clients" element={<Navigate to="/admin/clients" replace />} />
      <Route path="/owner/projects" element={<Navigate to="/admin/projects" replace />} />
      <Route path="/owner/projects/:projectId" element={<Navigate to="/admin/projects/:projectId" replace />} />
      <Route path="/owner/files" element={<Navigate to="/admin/files" replace />} />
      <Route path="/owner/messages" element={<Navigate to="/admin/messages" replace />} />
      <Route path="/owner/invoices" element={<Navigate to="/admin/invoices" replace />} />
      <Route path="/owner/support" element={<Navigate to="/admin/support" replace />} />
      <Route path="/owner/meetings" element={<Navigate to="/admin/meetings" replace />} />
      <Route path="/owner/notifications" element={<Navigate to="/admin/notifications" replace />} />
      <Route path="/owner/*" element={<Navigate to="/admin" replace />} />

      {/* 404 Catch-All in Shell */}
      <Route element={<AppShell role="Client" />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};
