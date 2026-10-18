import React, { useState, useEffect } from 'react';
import { SignInPage } from '../features/auth/pages/SignInPage';
import { SignUpPage } from '../features/auth/pages/SignUpPage';
import { ForgotPasswordPage } from '../features/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../features/auth/pages/ResetPasswordPage';
import { VerifyEmailPage } from '../features/auth/pages/VerifyEmailPage';
import { PendingApprovalPage } from '../features/auth/pages/PendingApprovalPage';
import { AccessDeniedPage } from '../features/auth/pages/AccessDeniedPage';

export const AppRoutes: React.FC = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  switch (currentPath) {
    case '/sign-up':
      return <SignUpPage />;
    case '/forgot-password':
      return <ForgotPasswordPage />;
    case '/reset-password':
      return <ResetPasswordPage />;
    case '/verify-email':
      return <VerifyEmailPage />;
    case '/pending-approval':
      return <PendingApprovalPage />;
    case '/access-denied':
      return <AccessDeniedPage />;
    case '/overview':
      return (
        <div style={overviewPlaceholderStyle}>
          <h2>Dashboard Overview</h2>
          <p>Phase P01 Identity and Access verified. Phase P02 shell integration in progress.</p>
          <a href="/sign-in" style={{ color: 'var(--primary-link)' }}>Return to Sign In</a>
        </div>
      );
    case '/sign-in':
    case '/':
    default:
      return <SignInPage />;
  }
};

const overviewPlaceholderStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'var(--canvas)',
  color: 'var(--text)',
};
