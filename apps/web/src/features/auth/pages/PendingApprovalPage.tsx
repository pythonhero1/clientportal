import React from 'react';
import { AuthLayout } from '../../../layouts/AuthLayout';

export const PendingApprovalPage: React.FC = () => {
  return (
    <AuthLayout
      title="Account Pending Approval"
      subtitle="Stephen reviews and activates all new client accounts before project access is granted."
    >
      <div style={{ textAlign: 'center', padding: '1rem 0' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }} role="img" aria-label="Hourglass">
          ⏳
        </div>
        <p style={{ color: 'var(--muted-text)', fontSize: '0.9rem', lineHeight: 1.6 }}>
          Your registration is confirmed. In accordance with portal security policies, access to project files,
          conversations, and billing remains gated until Owner activation.
        </p>
        <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <a
            href="mailto:stephen@oderindestephen.com"
            style={{
              display: 'inline-block',
              backgroundColor: 'var(--primary)',
              color: '#FFFFFF',
              padding: '0.75rem 1.25rem',
              borderRadius: '8px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Contact Stephen
          </a>
          <button
            onClick={() => {
              window.location.href = '/sign-in';
            }}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              padding: '0.65rem 1.25rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Return to Sign In
          </button>
        </div>
      </div>
    </AuthLayout>
  );
};
