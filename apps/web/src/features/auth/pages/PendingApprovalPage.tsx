import React, { useEffect } from 'react';
import { AuthLayout } from '../../../layouts/AuthLayout';
import { API_BASE_URL } from '../../../services/api-client';
import { loadClerk } from '../../../services/clerk-client';

export const PendingApprovalPage: React.FC = () => {
  useEffect(() => {
    loadClerk().then(async (clerk) => {
      if (clerk?.user) {
        const email =
          clerk.user.primaryEmailAddress?.emailAddress ||
          clerk.user.emailAddresses?.[0]?.emailAddress;
        if (email) {
          fetch(`${API_BASE_URL}/api/auth/register-client`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email,
              name: clerk.user.fullName || undefined,
              clerkUserId: clerk.user.id || undefined,
            }),
          }).catch(() => {});
        }
      }
    }).catch(() => {});
  }, []);

  return (
    <AuthLayout
      tag="ACCESS STATUS"
      title="Approval pending"
      subtitle="Your registration is confirmed. Stephen reviews and activates all new client accounts before project access is granted."
    >
      <div style={containerStyle}>
        <p style={descriptionStyle}>
          In accordance with portal security policies, access to project files,
          conversations, invoices, and deliverables remains gated until Owner activation.
        </p>
        <div style={actionContainerStyle}>
          <a
            href="mailto:stephen@oderindestephen.com"
            style={primaryButtonStyle}
          >
            Contact Stephen
          </a>
          <button
            onClick={() => {
              window.location.href = '/sign-in';
            }}
            style={secondaryButtonStyle}
          >
            Return to sign in &rarr;
          </button>
        </div>
      </div>
    </AuthLayout>
  );
};

const containerStyle: React.CSSProperties = {
  textAlign: 'left',
};

const descriptionStyle: React.CSSProperties = {
  color: 'var(--muted-text)',
  fontSize: '0.875rem',
  lineHeight: 1.6,
  margin: '0 0 1.75rem 0',
};

const actionContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.85rem',
  alignItems: 'stretch',
};

const primaryButtonStyle: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: 'var(--primary)',
  color: '#FFFFFF',
  padding: '0.875rem',
  borderRadius: '8px',
  fontWeight: 600,
  textAlign: 'center',
  textDecoration: 'none',
  fontSize: '0.9375rem',
};

const secondaryButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--primary-link)',
  padding: '0.5rem',
  cursor: 'pointer',
  fontWeight: 500,
  fontSize: '0.8125rem',
  textAlign: 'center',
};
