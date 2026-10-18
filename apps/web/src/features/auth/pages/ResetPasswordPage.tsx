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
      // Simulate password reset confirmation
      setIsSuccess(true);
    } catch {
      setError('Invalid or expired reset code. Please request a new link.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create New Password"
      subtitle="Enter the code sent to your email along with your new password."
    >
      {isSuccess ? (
        <div style={successContainerStyle}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }} role="img" aria-label="Success">
            ✅
          </div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text)', fontSize: '1.1rem' }}>
            Password Updated
          </h3>
          <p style={{ color: 'var(--muted-text)', fontSize: '0.875rem', lineHeight: 1.5 }}>
            Your password has been reset successfully. You can now sign in with your new credentials.
          </p>
          <div style={{ marginTop: '1.5rem' }}>
            <a
              href="/sign-in"
              style={{
                display: 'inline-block',
                backgroundColor: 'var(--primary)',
                color: '#FFFFFF',
                padding: '0.75rem 1.25rem',
                borderRadius: '8px',
                fontWeight: 600,
                textAlign: 'center',
                textDecoration: 'none',
                fontSize: '0.875rem',
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              Sign In Now
            </a>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={formStyle}>
          {error && <div style={errorBannerStyle}>{error}</div>}

          <div style={fieldGroupStyle}>
            <label htmlFor="code" style={labelStyle}>
              Reset Verification Code
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
              New Password
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
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              minLength={8}
              required
              style={inputStyle}
            />
          </div>

          <button type="submit" disabled={isLoading} style={submitButtonStyle}>
            {isLoading ? 'Updating...' : 'Update Password'}
          </button>

          <div style={footerLinkContainerStyle}>
            <a href="/sign-in" style={backLinkStyle}>
              ← Return to Sign In
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
};

const successContainerStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '1rem 0',
};

const errorBannerStyle: React.CSSProperties = {
  backgroundColor: 'rgba(239, 68, 68, 0.1)',
  border: '1px solid var(--danger-text)',
  color: 'var(--danger-text)',
  padding: '0.75rem',
  borderRadius: '6px',
  fontSize: '0.875rem',
};

const fieldGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.35rem',
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: 500,
  color: 'var(--text)',
};

const inputStyle: React.CSSProperties = {
  backgroundColor: 'var(--inset-surface)',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  padding: '0.75rem',
  borderRadius: '8px',
  fontSize: '0.875rem',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

const submitButtonStyle: React.CSSProperties = {
  backgroundColor: 'var(--primary)',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '8px',
  padding: '0.85rem',
  fontWeight: 600,
  fontSize: '0.875rem',
  cursor: 'pointer',
  marginTop: '0.5rem',
};

const footerLinkContainerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginTop: '0.5rem',
};

const backLinkStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  color: 'var(--muted-text)',
  textDecoration: 'none',
};
