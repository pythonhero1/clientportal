import React from 'react';
import { AuthLayout } from '../../../layouts/AuthLayout';

export const AccessDeniedPage: React.FC = () => {
  return (
    <AuthLayout
      title="Access Restricted"
      subtitle="Your account does not have permission to view this resource."
    >
      <div style={{ textAlign: 'center', padding: '1rem 0' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }} role="img" aria-label="Lock">
          🔒
        </div>
        <p style={{ color: 'var(--muted-text)', fontSize: '0.9rem', lineHeight: 1.6 }}>
          This portal enforces project boundary isolation. If your account is suspended or you require access
          to a specific project, please contact Stephen.
        </p>
        <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            onClick={() => {
              window.location.href = '/sign-in';
            }}
            style={{
              backgroundColor: 'var(--primary)',
              color: '#FFFFFF',
              padding: '0.75rem 1.25rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Sign In with Different Account
          </button>
        </div>
      </div>
    </AuthLayout>
  );
};
