import React from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { Sidebar } from './Sidebar';
import { X } from 'lucide-react';

export interface MobileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: 'Owner' | 'Client';
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  open,
  onOpenChange,
  role = 'Client',
}) => {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 md:hidden animate-in fade-in" />
        <RadixDialog.Content
          className="fixed inset-y-0 left-0 z-50 w-72 bg-[var(--surface)] border-r border-[var(--border)] shadow-2xl md:hidden flex flex-col focus:outline-none animate-in slide-in-from-left duration-200"
          aria-describedby={undefined}
        >
          <RadixDialog.Title className="sr-only">Mobile Navigation Menu</RadixDialog.Title>

          <div className="absolute top-4 right-3 z-10">
            <RadixDialog.Close asChild>
              <button
                className="p-2 rounded-lg text-[var(--muted-text)] hover:text-[var(--text)] hover:bg-[var(--surface-raised)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </RadixDialog.Close>
          </div>

          <Sidebar
            role={role}
            compact={false}
            onItemClick={() => onOpenChange(false)}
            className="w-full h-full border-r-0"
          />
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
};
