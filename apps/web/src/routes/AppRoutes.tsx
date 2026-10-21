import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '../layouts/AppShell';

// Auth Pages (Screens 01 - 05 + Status Pages)
import { SignInPage } from '../features/auth/pages/SignInPage';
import { SignUpPage } from '../features/auth/pages/SignUpPage';
import { ForgotPasswordPage } from '../features/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../features/auth/pages/ResetPasswordPage';
import { VerifyEmailPage } from '../features/auth/pages/VerifyEmailPage';
import { PendingApprovalPage } from '../features/auth/pages/PendingApprovalPage';
import { AccessDeniedPage } from '../features/auth/pages/AccessDeniedPage';

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

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/sign-up" element={<SignUpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/pending-approval" element={<PendingApprovalPage />} />
      <Route path="/access-denied" element={<AccessDeniedPage />} />
      <Route path="/403" element={<ForbiddenPage />} />

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

      {/* Authenticated Owner Shell Routes */}
      <Route element={<AppShell role="Owner" />}>
        <Route path="/owner" element={<OwnerDashboardPage />} />
        <Route path="/owner/clients" element={<OwnerClientsPage />} />
        <Route path="/owner/projects" element={<OwnerProjectsPage />} />
        <Route path="/owner/projects/:projectId" element={<OwnerProjectDetailPage />} />
        <Route path="/owner/files" element={<OwnerFilesPage />} />
        <Route path="/owner/messages" element={<OwnerMessagesPage />} />
        <Route path="/owner/invoices" element={<OwnerInvoicesPage />} />
        <Route path="/owner/support" element={<OwnerSupportPage />} />
        <Route path="/owner/meetings" element={<OwnerMeetingsPage />} />
        <Route path="/owner/notifications" element={<NotificationsPage />} />
      </Route>

      {/* 404 Catch-All in Shell */}
      <Route element={<AppShell role="Client" />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};
