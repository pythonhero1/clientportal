import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from './AppShell';
import { ThemeProvider } from '../contexts/ThemeContext';

const renderAppShell = (initialRoute = '/overview') => {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/overview" element={<div>Dashboard Content Test</div>} />
            <Route path="/owner" element={<div>Owner Dashboard Test</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );
};

describe('AppShell', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders skip to content link for accessibility', () => {
    renderAppShell();
    const skipLink = screen.getByText('Skip to main content');
    expect(skipLink).toBeInTheDocument();
    expect(skipLink.getAttribute('href')).toBe('#main-content');
  });

  it('renders topbar and outlet content', () => {
    renderAppShell();
    expect(screen.getByText('Dashboard Content Test')).toBeInTheDocument();
    expect(screen.getByText('ODERINDE STEPHEN')).toBeInTheDocument();
  });

  it('renders mobile navigation toggle button', () => {
    renderAppShell();
    const mobileButton = screen.getByLabelText('Open navigation menu');
    expect(mobileButton).toBeInTheDocument();
  });

  it('opens and closes mobile navigation drawer', () => {
    renderAppShell();
    const mobileButton = screen.getByLabelText('Open navigation menu');
    fireEvent.click(mobileButton);

    const closeButton = screen.getByLabelText('Close navigation');
    expect(closeButton).toBeInTheDocument();

    fireEvent.click(closeButton);
    expect(screen.queryByLabelText('Close navigation')).not.toBeInTheDocument();
  });
});
