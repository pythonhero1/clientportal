import React from 'react';
import { AuthLayout } from '../../../layouts/AuthLayout';

export const AccessDeniedPage: React.FC = () => {
  return (
    <AuthLayout
      tag="ACCESS STATUS"
      title="Access restricted"
      subtitle="Your account does not have permission to view this resource."
    >
      <div style={containerStyle}>
        <p style={descriptionStyle}>
          This portal enforces strict project boundary isolation. If your account is suspended or you require access
          to a specific project, please contact Stephen.
        </p>
        <div style={actionContainerStyle}>
          <button
            onClick={() => {
              window.location.href = '/sign-in';
            }}
            style={primaryButtonStyle}
          >
            Sign in with different account
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
  backgroundColor: 'var(--primary)',
  color: '#FFFFFF',
  padding: '0.875rem',
  borderRadius: '8px',
  border: 'none',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '0.9375rem',
  width: '100%',
  textAlign: 'center',
};
