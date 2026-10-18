import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { UploadCloud, Archive, Trash2 } from 'lucide-react';

export const OwnerFilesPage: React.FC = () => {
  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)]">
            Deliverables & Lifecycle Management
          </h1>
          <p className="text-sm text-[var(--muted-text)] mt-1">
            Upload new deliverable versions (up to 500 MB), manage feedback, and operate 90-day recovery policies.
          </p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<UploadCloud className="w-4 h-4" />}>
          Upload New Version
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>File Retention & Policy Notice</CardTitle>
          <CardDescription>
            Archived files are preserved. Permanent deletion requires Owner authorization and enforces the 90-day recovery window. No automatic purge is permitted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-[var(--text)]">Homepage_Design_v2.1.fig</h4>
              <p className="text-xs text-[var(--muted-text)] mt-0.5">42.8 MB • S3 Private Binary Storage • Status: Review Active</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" leftIcon={<Archive className="w-4 h-4" />}>
                Archive
              </Button>
              <Button variant="outline" size="sm" leftIcon={<Trash2 className="w-4 h-4 text-[var(--danger-text)]" />}>
                Soft Delete
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
