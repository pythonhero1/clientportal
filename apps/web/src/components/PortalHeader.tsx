import React, { useState, useEffect } from 'react';
import { getActivePersona } from '../services/projects-api';
import { Sun, Moon, LogOut, LayoutDashboard, CheckSquare, FolderGit2, ShieldAlert } from 'lucide-react';

export const PortalHeader: React.FC<{ activeTab?: string }> = ({ activeTab }) => {
  const persona = getActivePersona();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const savedTheme = (localStorage.getItem('portal_theme') as 'dark' | 'light') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('portal_theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  return (
    <header style={headerStyle}>
      <div style={headerInnerStyle}>
        <div style={brandContainerStyle}>
          <a href="/overview" style={brandLinkStyle}>
            <div style={logoIconStyle}>OS</div>
            <div style={brandTextContainerStyle}>
              <span style={brandTitleStyle}>Oderinde Stephen</span>
              <span style={brandSubtitleStyle}>Client Portal</span>
            </div>
          </a>
        </div>

        <nav style={navLinksStyle}>
          {persona.role === 'Owner' ? (
            <>
              <a href="/owner/projects" style={navItemStyle(activeTab === 'owner')}>
                <ShieldAlert size={16} />
                <span>Owner Workspace</span>
              </a>
              <a href="/overview" style={navItemStyle(activeTab === 'overview')}>
                <LayoutDashboard size={16} />
                <span>Client Preview</span>
              </a>
            </>
          ) : (
            <>
              <a href="/overview" style={navItemStyle(activeTab === 'overview')}>
                <LayoutDashboard size={16} />
                <span>Overview</span>
              </a>
              <a href="/onboarding" style={navItemStyle(activeTab === 'onboarding')}>
                <CheckSquare size={16} />
                <span>Onboarding</span>
              </a>
              <a href="/projects" style={navItemStyle(activeTab === 'projects')}>
                <FolderGit2 size={16} />
                <span>Projects</span>
              </a>
            </>
          )}
        </nav>

        <div style={actionsStyle}>
          <button onClick={toggleTheme} style={iconButtonStyle} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          <a href="/sign-in" style={signOutButtonStyle} title="Sign out">
            <LogOut size={16} />
            <span style={{ marginLeft: '4px' }}>Sign Out</span>
          </a>
        </div>
      </div>
    </header>
  );
};

const headerStyle: React.CSSProperties = {
  backgroundColor: 'var(--surface)',
  borderBottom: '1px solid var(--border)',
  position: 'sticky',
  top: '32px',
  zIndex: 100,
  padding: '0 1.5rem',
  transition: 'background-color 0.2s ease, border-color 0.2s ease',
};

const headerInnerStyle: React.CSSProperties = {
  maxWidth: '1280px',
  margin: '0 auto',
  height: '64px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const brandContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
};

const brandLinkStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  textDecoration: 'none',
  color: 'inherit',
};

const logoIconStyle: React.CSSProperties = {
  width: '34px',
  height: '34px',
  borderRadius: '8px',
  backgroundColor: 'var(--primary)',
  color: '#FFFFFF',
  fontWeight: 700,
  fontSize: '14px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  letterSpacing: '-0.5px',
};

const brandTextContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

const brandTitleStyle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: '14px',
  color: 'var(--text)',
  lineHeight: 1.2,
};

const brandSubtitleStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--muted-text)',
  letterSpacing: '0.3px',
};

const navLinksStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const navItemStyle = (active: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '6px 14px',
  borderRadius: '6px',
  fontSize: '13px',
  fontWeight: active ? 600 : 500,
  color: active ? 'var(--primary-link)' : 'var(--muted-text)',
  backgroundColor: active ? 'var(--surface-raised)' : 'transparent',
  textDecoration: 'none',
  transition: 'all 0.15s ease',
});

const actionsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
};

const iconButtonStyle: React.CSSProperties = {
  backgroundColor: 'var(--surface-raised)',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  padding: '8px',
  borderRadius: '8px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const signOutButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  backgroundColor: 'transparent',
  border: '1px solid var(--border)',
  color: 'var(--muted-text)',
  padding: '6px 12px',
  borderRadius: '6px',
  fontSize: '12px',
  textDecoration: 'none',
  fontWeight: 500,
  cursor: 'pointer',
};
