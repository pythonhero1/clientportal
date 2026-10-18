import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { FixtureBadge } from '../../../components/ui/FixtureBadge';
import { useTheme } from '../../../hooks/useTheme';
import { Sun, Moon, Monitor, Key } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto">
      <FixtureBadge phase="P08" />

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)]">
          Account & Security Settings
        </h1>
        <p className="text-sm text-[var(--muted-text)] mt-1">
          Manage your contact profile, session authentication, and portal preferences.
        </p>
      </div>

      {/* Profile Details */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Profile</CardTitle>
          <CardDescription>Official client profile information registered with Stephen</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Full Name" defaultValue="Stephen Oderinde" />
            <Input label="Email Address" defaultValue="stephen@oderindestephen.com" disabled />
            <Input label="Company Name" defaultValue="Oderinde Stephen Studio" />
            <Input label="Preferred Timezone" defaultValue="Africa/Lagos (GMT+1)" disabled />
          </div>
          <div className="pt-2">
            <Button variant="primary" size="sm">
              Update Profile Details
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Theme Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Theme Appearance</CardTitle>
          <CardDescription>Select your interface appearance or follow your system preference</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-xl border text-left transition-all ${
                theme === 'dark'
                  ? 'border-[var(--primary)] bg-[var(--surface-raised)] ring-1 ring-[var(--primary)]'
                  : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-raised)]'
              }`}
            >
              <Moon className="w-5 h-5 text-[var(--primary)] mb-2" />
              <p className="text-sm font-bold text-[var(--text)]">Dark Mode</p>
              <p className="text-xs text-[var(--muted-text)] mt-0.5">High-contrast dark canvas</p>
            </button>

            <button
              onClick={() => setTheme('light')}
              className={`p-4 rounded-xl border text-left transition-all ${
                theme === 'light'
                  ? 'border-[var(--primary)] bg-[var(--surface-raised)] ring-1 ring-[var(--primary)]'
                  : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-raised)]'
              }`}
            >
              <Sun className="w-5 h-5 text-[var(--primary)] mb-2" />
              <p className="text-sm font-bold text-[var(--text)]">Light Mode</p>
              <p className="text-xs text-[var(--muted-text)] mt-0.5">Crisp light backgrounds</p>
            </button>

            <button
              onClick={() => setTheme('system')}
              className={`p-4 rounded-xl border text-left transition-all ${
                theme === 'system'
                  ? 'border-[var(--primary)] bg-[var(--surface-raised)] ring-1 ring-[var(--primary)]'
                  : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-raised)]'
              }`}
            >
              <Monitor className="w-5 h-5 text-[var(--primary)] mb-2" />
              <p className="text-sm font-bold text-[var(--text)]">System Default</p>
              <p className="text-xs text-[var(--muted-text)] mt-0.5">Matches OS setting</p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Security & MFA */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Two-Factor Authentication (MFA)</CardTitle>
              <CardDescription>Enhanced security for account protection</CardDescription>
            </div>
            <Badge variant="success" size="sm">MFA Protected</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-[var(--muted-text)] leading-relaxed">
            Authentication sessions and password credentials are managed securely via Clerk. Owner roles require mandatory MFA.
          </p>
          <Button variant="outline" size="sm" leftIcon={<Key className="w-4 h-4" />}>
            Manage Clerk Security Credentials
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
