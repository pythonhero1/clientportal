import React from 'react';
import { useTheme } from '../hooks/useTheme';
import '../styles/tokens.css';

interface AuthLayoutProps {
  children: React.ReactNode;
  tag?: string;
  title?: string;
  subtitle?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  tag,
  title,
  subtitle,
}) => {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div style={brandStyle}>
          <img
            src="/logo.png"
            alt="Oderinde Stephen Logo"
            style={logoImageStyle}
          />
          <div style={brandInfoStyle}>
            <span style={brandNameStyle}>ODERINDE STEPHEN</span>
            <span style={brandSubtitleStyle}>CLIENT PORTAL</span>
          </div>
        </div>

        <div style={headerRightStyle}>
          <div style={securityBadgeStyle}>
            SECURE CLIENT ACCESS
          </div>
          <button
            onClick={toggleTheme}
            style={themeToggleStyle}
            aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {resolvedTheme === 'dark' ? 'LIGHT' : 'DARK'}
          </button>
        </div>
      </header>

      <main style={mainContentStyle}>
        <div style={cardStyle}>
          {tag && <div style={tagStyle}>{tag}</div>}
          {title && <h1 style={titleStyle}>{title}</h1>}
          {subtitle && <p style={subtitleStyle}>{subtitle}</p>}
          <div style={contentAreaStyle}>{children}</div>
        </div>
      </main>

      <footer style={footerStyle}>
        <p style={footerTextStyle}>
          &copy; 2026 Oderinde Stephen. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: 'var(--canvas)',
  color: 'var(--text)',
  transition: 'background-color 0.2s ease, color 0.2s ease',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '1.5rem 2.5rem',
  border: 'none',
};

const brandStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.85rem',
};

const logoImageStyle: React.CSSProperties = {
  width: '38px',
  height: '38px',
  borderRadius: '8px',
  objectFit: 'cover',
  display: 'block',
};

const brandInfoStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  lineHeight: 1.2,
};

const brandNameStyle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: '0.875rem',
  letterSpacing: '0.06em',
  color: 'var(--text)',
  textTransform: 'uppercase',
};

const brandSubtitleStyle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: '0.6875rem',
  letterSpacing: '0.08em',
  color: 'var(--accent-cyan)',
  textTransform: 'uppercase',
  marginTop: '2px',
};

const headerRightStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
};

const securityBadgeStyle: React.CSSProperties = {
  border: '1px solid var(--badge-border)',
  backgroundColor: 'var(--badge-bg)',
  color: 'var(--badge-text)',
  fontSize: '0.6875rem',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  padding: '0.4rem 0.9rem',
  borderRadius: '9999px',
};

const themeToggleStyle: React.CSSProperties = {
  background: 'transparent',
  color: 'var(--muted-text)',
  border: 'none',
  padding: '0.4rem 0.6rem',
  cursor: 'pointer',
  fontSize: '0.75rem',
  fontWeight: 600,
  letterSpacing: '0.06em',
  borderRadius: '6px',
  transition: 'color 0.15s ease',
};

const mainContentStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem 1.5rem',
};

const cardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '28rem',
  backgroundColor: 'var(--surface)',
  borderRadius: '18px',
  padding: '2.5rem 2.25rem',
  boxShadow: '0 12px 36px rgba(0, 0, 0, 0.45)',
  border: 'none',
  textAlign: 'left',
};

const tagStyle: React.CSSProperties = {
  color: 'var(--primary-link)',
  fontSize: '0.6875rem',
  fontWeight: 700,
  letterSpacing: '0.09em',
  textTransform: 'uppercase',
  marginBottom: '0.6rem',
  textAlign: 'left',
};

const titleStyle: React.CSSProperties = {
  fontSize: '1.75rem',
  fontWeight: 700,
  margin: '0 0 0.5rem 0',
  color: 'var(--text)',
  textAlign: 'left',
  letterSpacing: '-0.02em',
};

const subtitleStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  color: 'var(--muted-text)',
  margin: '0 0 1.75rem 0',
  textAlign: 'left',
  lineHeight: 1.5,
};

const contentAreaStyle: React.CSSProperties = {
  textAlign: 'left',
};

const footerStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '1.5rem',
  border: 'none',
};

const footerTextStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '0.75rem',
  color: 'var(--muted-text)',
};
