import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from './AppRoutes';
import { ThemeProvider } from '../contexts/ThemeContext';
import { ToastProvider } from '../contexts/ToastContext';

const renderWithRouter = (initialEntry: string) => {
  return render(
    <ThemeProvider>
      <ToastProvider>
        <MemoryRouter initialEntries={[initialEntry]}>
          <AppRoutes />
        </MemoryRouter>
      </ToastProvider>
    </ThemeProvider>
  );
};

describe('AppRoutes Integration Suite (All 18 Screens & Owner Views)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Auth Routes (Screens 01-05 + Status)', () => {
    it('renders /sign-in (Screen 01 Login)', () => {
      renderWithRouter('/sign-in');
      expect(screen.getAllByText('Welcome back')[0]).toBeInTheDocument();
    });

    it('renders /sign-up (Screen 02 Sign Up)', () => {
      renderWithRouter('/sign-up');
      expect(screen.getAllByText('Create account')[0]).toBeInTheDocument();
    });

    it('renders /forgot-password (Screen 03 Forgot Password)', () => {
      renderWithRouter('/forgot-password');
      expect(screen.getAllByText('Forgot password')[0]).toBeInTheDocument();
    });

    it('renders /reset-password (Screen 04 Reset Password)', () => {
      renderWithRouter('/reset-password');
      expect(screen.getAllByText('Reset password')[0]).toBeInTheDocument();
    });

    it('renders /verify-email (Screen 05 Verify Email)', () => {
      renderWithRouter('/verify-email');
      expect(screen.getAllByText('Verify your email')[0]).toBeInTheDocument();
    });

    it('renders /pending-approval', () => {
      renderWithRouter('/pending-approval');
      expect(screen.getAllByText('Approval pending')[0]).toBeInTheDocument();
    });

    it('renders /access-denied', () => {
      renderWithRouter('/access-denied');
      expect(screen.getAllByText('Access restricted')[0]).toBeInTheDocument();
    });
  });

  describe('Client Portal Routes (Screens 06-18)', () => {
    it('renders /overview (Screen 07 Overview)', () => {
      renderWithRouter('/overview');
      expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
    });

    it('renders /onboarding (Screen 06 Onboarding)', () => {
      renderWithRouter('/onboarding');
      expect(screen.getAllByText('Client Onboarding')[0]).toBeInTheDocument();
    });

    it('renders /projects (Screen 08 Projects & Websites)', () => {
      renderWithRouter('/projects');
      expect(screen.getAllByText('Projects & Websites')[0]).toBeInTheDocument();
    });

    it('renders /projects/:projectId (Screen 09 Project Workspace)', () => {
      renderWithRouter('/projects/prj_demo1');
      expect(screen.getAllByText('E-Commerce Redesign')[0]).toBeInTheDocument();
    });

    it('renders /files (Screen 10 Files & Feedback)', () => {
      renderWithRouter('/files');
      expect(screen.getAllByText('Files & Deliverables')[0]).toBeInTheDocument();
    });

    it('renders /invoices (Screen 11 Invoices)', () => {
      renderWithRouter('/invoices');
      expect(screen.getAllByText('Invoices & Billing')[0]).toBeInTheDocument();
    });

    it('renders /onboarding/questionnaire (Screen 12 Questionnaire)', () => {
      renderWithRouter('/onboarding/questionnaire');
      expect(screen.getAllByText('Onboarding Questionnaire')[0]).toBeInTheDocument();
    });

    it('renders /messages (Screen 13 Messages & Support)', () => {
      renderWithRouter('/messages');
      expect(screen.getAllByText('Messages & Communication')[0]).toBeInTheDocument();
    });

    it('renders /meetings (Screen 14 Meetings & Calendar)', () => {
      renderWithRouter('/meetings');
      expect(screen.getAllByText('Meetings & Calendar')[0]).toBeInTheDocument();
    });

    it('renders /notifications (Screen 15 Notifications)', () => {
      renderWithRouter('/notifications');
      expect(screen.getAllByText('Notifications Center')[0]).toBeInTheDocument();
    });

    it('renders /settings (Screen 16 Profile & Security)', () => {
      renderWithRouter('/settings');
      expect(screen.getAllByText('Account & Security Settings')[0]).toBeInTheDocument();
    });

    it('renders /support (Screen 17 Help Center & Ticket)', () => {
      renderWithRouter('/support');
      expect(screen.getAllByText(/Help Center/i)[0]).toBeInTheDocument();
    });

    it('renders /no-project (Screen 18 No Active Project)', () => {
      renderWithRouter('/no-project');
      expect(screen.getAllByText('No Active Project Assigned')[0]).toBeInTheDocument();
    });
  });

  describe('Owner Management Surfaces', () => {
    it('renders /owner (Owner Overview)', () => {
      renderWithRouter('/owner');
      expect(screen.getAllByText('Owner Executive Suite')[0]).toBeInTheDocument();
    });

    it('renders /owner/clients (Client Approvals)', () => {
      renderWithRouter('/owner/clients');
      expect(screen.getAllByText('Client Approvals & Invitations')[0]).toBeInTheDocument();
    });

    it('renders /owner/projects (Project Assignment)', () => {
      renderWithRouter('/owner/projects');
      expect(screen.getAllByText('Project Creation & Assignment')[0]).toBeInTheDocument();
    });

    it('renders /owner/files (Deliverables Lifecycle)', () => {
      renderWithRouter('/owner/files');
      expect(screen.getAllByText('Deliverables & Lifecycle Management')[0]).toBeInTheDocument();
    });

    it('renders /owner/invoices (Billing & Invoices)', () => {
      renderWithRouter('/owner/invoices');
      expect(screen.getAllByText('Billing & Invoice Issuance')[0]).toBeInTheDocument();
    });

    it('renders /owner/support (Support Queue)', () => {
      renderWithRouter('/owner/support');
      expect(screen.getAllByText(/Client Support/i)[0]).toBeInTheDocument();
    });

    it('renders /owner/meetings (Meetings & Schedule)', () => {
      renderWithRouter('/owner/meetings');
      expect(screen.getAllByText('Meetings & Schedule')[0]).toBeInTheDocument();
    });
  });

  describe('Fallback & Error Routes', () => {
    it('renders 404 NotFoundPage on invalid path', () => {
      renderWithRouter('/some-nonexistent-path-xyz');
      expect(screen.getAllByText('404 Not Found')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Page not found')[0]).toBeInTheDocument();
    });
  });
});
