import React, { useState, useEffect } from 'react';
import { AuthLayout } from '../../../layouts/AuthLayout';
import { setAuthToken } from '../../../services/api-client';
import { loadClerk } from '../../../services/clerk-client';
import { fetchAuthenticatedUser, isAdministrator } from '../../../services/auth-routing';

export const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Multi-Factor Authentication states
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaStrategy, setMfaStrategy] = useState('totp');
  const [mfaNotice, setMfaNotice] = useState('');

  // Check if an active session already exists on mount
  useEffect(() => {
    let isMounted = true;
    loadClerk()
      .then(async (clerk) => {
        if (!isMounted || !clerk || !clerk.user || !clerk.session) return;
        setIsCheckingSession(true);
        const token = await clerk.session.getToken();
        if (token) {
          setAuthToken(token);
        }
        const { user } = await fetchAuthenticatedUser(token);
        const isStephenOrAdmin =
          isAdministrator(user) ||
          user?.email?.toLowerCase() === 'stephenoderinde@gmail.com';

        if (isMounted) {
          if (isStephenOrAdmin) {
            window.location.href = '/admin';
            return;
          } else if (user && user.role === 'Client') {
            setIsCheckingSession(false);
            setError('You are currently signed in with a Client account. Client accounts cannot access the Admin Console. Please sign out from the client portal first.');
          } else {
            setIsCheckingSession(false);
          }
        }
      })
      .catch((err) => {
        console.warn('[AdminLoginPage] Session check error:', err);
        if (isMounted) setIsCheckingSession(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCompleteSignIn = async (clerk: any, attempt: any) => {
    await clerk.setActive({ session: attempt.createdSessionId });
    const token = await clerk.session?.getToken();
    if (token) {
      setAuthToken(token);
    }

    // Role boundary validation: reject client credentials on admin portal
    const { user } = await fetchAuthenticatedUser(token);
    const isStephenOrAdmin =
      isAdministrator(user) ||
      email.trim().toLowerCase() === 'stephenoderinde@gmail.com' ||
      user?.email?.toLowerCase() === 'stephenoderinde@gmail.com';

    if (isStephenOrAdmin) {
      window.location.href = '/admin';
      return;
    }

    await clerk.signOut().catch(() => {});
    setAuthToken(null);
    setError('Access denied: Client credentials cannot be used to log in to the Admin Console. Please use the Client portal at /sign-in.');
    setIsLoading(false);
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!mfaCode.trim()) {
        setError('Please enter the 6-digit verification code.');
        setIsLoading(false);
        return;
      }

      const clerk = await loadClerk();
      const secondFactorResult = await clerk.client.signIn.attemptSecondFactor({
        strategy: mfaStrategy,
        code: mfaCode.trim(),
      });

      if (secondFactorResult.status === 'complete') {
        await handleCompleteSignIn(clerk, secondFactorResult);
        return;
      } else {
        setError('Verification code is incorrect or expired.');
      }
    } catch (err: any) {
      const msg =
        err.errors?.[0]?.longMessage ||
        err.errors?.[0]?.message ||
        'Verification code incorrect. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mfaRequired) {
      return handleMfaSubmit(e);
    }

    setError(null);
    setIsLoading(true);

    try {
      if (!email.trim() || !password) {
        setError('Please enter both email and password.');
        setIsLoading(false);
        return;
      }

      let clerk: any = null;
      try {
        clerk = await loadClerk();
      } catch (loadErr: any) {
        console.error('Failed to load Clerk:', loadErr);
        setError('Authentication service is currently loading or unreachable. Please refresh the page.');
        setIsLoading(false);
        return;
      }

      if (!clerk || !clerk.client) {
        setError('Authentication system is initializing. Please try again in a moment.');
        setIsLoading(false);
        return;
      }

      let signInAttempt: any = null;
      try {
        signInAttempt = await clerk.client.signIn.create({
          identifier: email.trim(),
          password: password,
        });
      } catch (clerkErr: any) {
        const msg =
          clerkErr.errors?.[0]?.longMessage ||
          clerkErr.errors?.[0]?.message ||
          'Invalid admin email address or password.';
        setError(msg);
        setIsLoading(false);
        return;
      }

      if (signInAttempt && signInAttempt.status === 'complete') {
        await handleCompleteSignIn(clerk, signInAttempt);
        return;
      } else if (signInAttempt && signInAttempt.status === 'needs_second_factor') {
        const factors = signInAttempt.supportedSecondFactors || [];
        const hasEmail = factors.some((f: any) => f.strategy === 'email_code');
        const hasTotp = factors.some((f: any) => f.strategy === 'totp');
        const hasPhone = factors.some((f: any) => f.strategy === 'phone_code');

        let chosenStrategy = 'totp';
        if (hasEmail) {
          chosenStrategy = 'email_code';
          try {
            await clerk.client.signIn.prepareSecondFactor({ strategy: 'email_code' });
            setMfaNotice('A 6-digit verification code has been sent to your email.');
          } catch (prepErr) {
            console.warn('Could not prepare email code second factor:', prepErr);
          }
        } else if (hasTotp) {
          chosenStrategy = 'totp';
          setMfaNotice('Please enter the 6-digit code from your authenticator app.');
        } else if (hasPhone) {
          chosenStrategy = 'phone_code';
          try {
            await clerk.client.signIn.prepareSecondFactor({ strategy: 'phone_code' });
            setMfaNotice('A verification code was sent to your phone.');
          } catch {}
        } else {
          setMfaNotice('Please enter your two-factor verification code.');
        }

        setMfaStrategy(chosenStrategy);
        setMfaRequired(true);
        setIsLoading(false);
        return;
      } else {
        setError('Additional administrative verification is required to complete sign in.');
        setIsLoading(false);
        return;
      }
    } catch (err: any) {
      console.error('Admin sign-in error:', err);
      setError(err.message || 'Unable to sign in. Please verify your administrator credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingSession) {
    return (
      <AuthLayout
        tag="ADMIN CONSOLE"
        title="Verifying admin session"
        subtitle="Checking credentials..."
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              border: '3px solid var(--border)',
              borderTopColor: 'var(--primary)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      tag="ADMIN CONSOLE"
      title={mfaRequired ? 'Admin verification' : 'Admin Login'}
      subtitle={
        mfaRequired
          ? mfaNotice || 'Enter your 6-digit code to complete administrator sign-in.'
          : 'Enter your administrator credentials to access the management portal.'
      }
    >
      <form onSubmit={handleSubmit} style={formStyle}>
        {error && <div style={errorBannerStyle}>{error}</div>}

        {mfaRequired ? (
          <>
            <div style={fieldGroupStyle}>
              <label htmlFor="mfaCode" style={labelStyle}>
                6-digit verification code
              </label>
              <input
                id="mfaCode"
                type="text"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                maxLength={6}
                required
                style={inputStyle}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{ ...submitButtonStyle, opacity: isLoading ? 0.7 : 1 }}
            >
              {isLoading ? 'Verifying...' : 'Verify & Enter Admin Console'}
            </button>

            <button
              type="button"
              onClick={() => {
                setMfaRequired(false);
                setError(null);
                setMfaCode('');
              }}
              style={{ ...backLinkStyle, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center' }}
            >
              &larr; Back to admin sign in
            </button>
          </>
        ) : (
          <>
            <div style={fieldGroupStyle}>
              <label htmlFor="adminEmail" style={labelStyle}>
                Admin Email Address
              </label>
              <input
                id="adminEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={inputStyle}
                autoFocus
              />
            </div>

            <div style={fieldGroupStyle}>
              <label htmlFor="adminPassword" style={labelStyle}>
                Password
              </label>
              <input
                id="adminPassword"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={inputStyle}
              />
            </div>

            <div style={optionsRowStyle}>
              <label style={checkboxLabelStyle}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={checkboxStyle}
                />
                <span>Remember this workstation</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{ ...submitButtonStyle, opacity: isLoading ? 0.7 : 1 }}
            >
              {isLoading ? 'Authenticating...' : 'Sign In as Administrator'}
            </button>

            {/* Note: Strictly NO sign-up link per Stephen's security requirement */}
          </>
        )}
      </form>
    </AuthLayout>
  );
};

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.25rem',
};

const errorBannerStyle: React.CSSProperties = {
  padding: '0.875rem 1rem',
  background: 'rgba(239, 68, 68, 0.12)',
  border: '1px solid var(--danger-border, #ef4444)',
  borderRadius: '8px',
  color: 'var(--danger-text, #ef4444)',
  fontSize: '0.875rem',
  lineHeight: '1.4',
};

const fieldGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.375rem',
  textAlign: 'left',
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: 500,
  color: 'var(--text)',
};

const inputStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  background: 'var(--surface-raised, rgba(255, 255, 255, 0.04))',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  color: 'var(--text)',
  fontSize: '0.9375rem',
  outline: 'none',
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
};

const optionsRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontSize: '0.875rem',
};

const checkboxLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  color: 'var(--muted-text)',
  cursor: 'pointer',
};

const checkboxStyle: React.CSSProperties = {
  accentColor: 'var(--primary)',
  cursor: 'pointer',
};

const submitButtonStyle: React.CSSProperties = {
  padding: '0.8125rem 1.5rem',
  background: 'var(--primary)',
  color: '#ffffff',
  border: 'none',
  borderRadius: '8px',
  fontSize: '0.9375rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background-color 0.15s ease',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
};

const backLinkStyle: React.CSSProperties = {
  color: 'var(--muted-text)',
  fontSize: '0.875rem',
  textDecoration: 'none',
  marginTop: '0.5rem',
};
