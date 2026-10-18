import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { FixtureBadge } from '../../../components/ui/FixtureBadge';
import { Video, Clock, ExternalLink } from 'lucide-react';

export const MeetingsCalendarPage: React.FC = () => {
  return (
    <div className="space-y-6 text-left">
      <FixtureBadge phase="P07" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)]">
            Meetings & Calendar
          </h1>
          <p className="text-sm text-[var(--muted-text)] mt-1">
            Schedule strategy sessions with Stephen via Cal.com and review upcoming project milestones.
          </p>
        </div>
        <Button variant="primary" leftIcon={<Video className="w-4 h-4" />}>
          Schedule 30-Min Call
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Scheduled Calls</CardTitle>
              <CardDescription>Synchronized from Stephen&apos;s verified Cal.com availability</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)]">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 text-[var(--primary-link)] flex items-center justify-center shrink-0">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text)]">Wireframe Review & Architecture Walkthrough</h4>
                    <p className="text-xs text-[var(--muted-text)] flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3.5 h-3.5" />
                      Oct 21, 2026 at 4:00 PM (Africa/Lagos)
                    </p>
                  </div>
                </div>
                <Badge variant="success" size="sm">Confirmed</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Calendar Integration</CardTitle>
              <CardDescription>Cal.com Provider Link</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-[var(--muted-text)] leading-relaxed">
                Connect your Google or Outlook calendar to automatically synchronize project deadlines and milestone checkpoints.
              </p>
              <Button variant="outline" size="sm" className="w-full" rightIcon={<ExternalLink className="w-4 h-4" />}>
                Open Cal.com Booking
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
