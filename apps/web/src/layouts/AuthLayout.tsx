import React, { useState, useEffect } from 'react';
import '../styles/tokens.css';

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div style={brandStyle}>
          <span style={logoBadgeStyle}>OS</span>
          <span style={brandTextStyle}>Oderinde Stephen Portal</span>
        </div>
        <button
          onClick={toggleTheme}
          style={themeToggleStyle}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
        </button>
      </header>

      <main style={mainContentStyle}>
        <div style={cardStyle}>
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
  padding: '1.25rem 2rem',
  borderBottom: '1px solid var(--border)',
};

const brandStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
};

const logoBadgeStyle: React.CSSProperties = {
  backgroundColor: 'var(--primary)',
  color: '#FFFFFF',
  fontWeight: 700,
  fontSize: '0.875rem',
  padding: '0.35rem 0.6rem',
  borderRadius: '6px',
  letterSpacing: '0.05em',
};

const brandTextStyle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: '1rem',
  color: 'var(--text)',
};

const themeToggleStyle: React.CSSProperties = {
  background: 'var(--surface-raised)',
  color: 'var(--text)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  padding: '0.5rem 0.85rem',
  cursor: 'pointer',
  fontSize: '0.875rem',
  fontWeight: 500,
};

const mainContentStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem 1rem',
};

const cardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '28rem', // ~448px matching desktop Figma card
  backgroundColor: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  padding: '2rem',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
};

const titleStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 700,
  margin: '0 0 0.5rem 0',
  color: 'var(--text)',
  textAlign: 'center',
};

const subtitleStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  color: 'var(--muted-text)',
  margin: '0 0 1.5rem 0',
  textAlign: 'center',
  lineHeight: 1.5,
};

const contentAreaStyle: React.CSSProperties = {
  marginTop: '1rem',
};

const footerStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '1.5rem',
  borderTop: '1px solid var(--border)',
};

const footerTextStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '0.75rem',
  color: 'var(--muted-text)',
};
