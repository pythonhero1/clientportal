import React, { useState } from 'react';
import { AuthLayout } from '../../../layouts/AuthLayout';

export const ResetPasswordPage: React.FC = () => {
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!code || !newPassword || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      setIsSuccess(true);
    } catch {
      setError('Invalid or expired reset code. Please request a new link.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      tag="ACCOUNT SECURITY"
      title="Reset password"
      subtitle="Enter the code sent to your email along with your new password."
    >
      {isSuccess ? (
        <div style={successContainerStyle}>
          <h3 style={successTitleStyle}>
            Password updated successfully
          </h3>
          <p style={successBodyStyle}>
            Your password has been changed. You can now use your new password to sign in to your client workspace.
          </p>
          <div style={{ marginTop: '1.5rem' }}>
            <a href="/sign-in" style={actionButtonStyle}>
              Sign in to portal &rarr;
            </a>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={formStyle}>
          {error && <div style={errorBannerStyle}>{error}</div>}

          <div style={fieldGroupStyle}>
            <label htmlFor="code" style={labelStyle}>
              Reset code
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter 6-digit code"
              required
              style={inputStyle}
            />
          </div>

          <div style={fieldGroupStyle}>
            <label htmlFor="newPassword" style={labelStyle}>
              New password
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              minLength={8}
              required
              style={inputStyle}
            />
          </div>

          <div style={fieldGroupStyle}>
            <label htmlFor="confirmPassword" style={labelStyle}>
              Confirm new password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              minLength={8}
              required
              style={inputStyle}
            />
          </div>

          <button type="submit" disabled={isLoading} style={submitButtonStyle}>
            {isLoading ? 'Updating password...' : 'Update password'}
          </button>

          <div style={footerLinkContainerStyle}>
            <a href="/sign-in" style={returnLinkStyle}>
              Back to sign in &rarr;
            </a>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.25rem',
  textAlign: 'left',
};

const errorBannerStyle: React.CSSProperties = {
  backgroundColor: 'rgba(239, 68, 68, 0.1)',
  color: 'var(--danger-text)',
  padding: '0.75rem 1rem',
  borderRadius: '8px',
  fontSize: '0.8125rem',
  textAlign: 'left',
};

const fieldGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.4rem',
  textAlign: 'left',
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  fontWeight: 500,
  color: 'var(--muted-text)',
  textAlign: 'left',
  display: 'block',
};

const inputStyle: React.CSSProperties = {
  backgroundColor: 'var(--inset-surface)',
  border: '1px solid var(--border-subtle)',
  color: 'var(--text)',
  padding: '0.85rem 1rem',
  borderRadius: '8px',
  fontSize: '0.875rem',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  textAlign: 'left',
};

const submitButtonStyle: React.CSSProperties = {
  backgroundColor: 'var(--primary)',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '8px',
  padding: '0.875rem',
  fontWeight: 600,
  fontSize: '0.9375rem',
  cursor: 'pointer',
  width: '100%',
  marginTop: '0.5rem',
  transition: 'background-color 0.15s ease',
};

const footerLinkContainerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginTop: '0.75rem',
};

const returnLinkStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  fontWeight: 500,
  color: 'var(--primary-link)',
};

const successContainerStyle: React.CSSProperties = {
  textAlign: 'left',
};

const successTitleStyle: React.CSSProperties = {
  margin: '0 0 0.75rem 0',
  color: 'var(--text)',
  fontSize: '1.125rem',
  fontWeight: 600,
};

const successBodyStyle: React.CSSProperties = {
  color: 'var(--muted-text)',
  fontSize: '0.875rem',
  lineHeight: 1.6,
  margin: 0,
};

const actionButtonStyle: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: 'var(--primary)',
  color: '#FFFFFF',
  padding: '0.875rem',
  borderRadius: '8px',
  fontWeight: 600,
  textAlign: 'center',
  textDecoration: 'none',
  fontSize: '0.9375rem',
  width: '100%',
  boxSizing: 'border-box',
};
