import React from 'react';
import * as RadixTabs from '@radix-ui/react-tabs';
import { cn } from '../../utils/cn';

export interface TabItem {
  id: string;
  label: string;
  badge?: string | number;
  content: React.ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  defaultValue,
  value,
  onValueChange,
  className,
}) => {
  const initialValue = defaultValue || (items[0] ? items[0].id : '');

  return (
    <RadixTabs.Root
      value={value}
      defaultValue={initialValue}
      onValueChange={onValueChange}
      className={cn('flex flex-col w-full', className)}
    >
      <RadixTabs.List
        className="flex items-center gap-1 border-b border-[var(--border)] mb-4 overflow-x-auto"
        aria-label="Tabs"
      >
        {items.map((tab) => (
          <RadixTabs.Trigger
            key={tab.id}
            value={tab.id}
            className={cn(
              'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-[2px] cursor-pointer whitespace-nowrap',
              'text-[var(--muted-text)] border-transparent hover:text-[var(--text)]',
              'data-[state=active]:text-[var(--primary)] data-[state=active]:border-[var(--primary)] font-semibold',
              'focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] focus-visible:outline-offset-2'
            )}
          >
            <span className="flex items-center gap-2">
              {tab.label}
              {tab.badge !== undefined && (
                <span className="px-1.5 py-0.5 text-[0.625rem] rounded-full bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--muted-text)] font-semibold">
                  {tab.badge}
                </span>
              )}
            </span>
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>

      {items.map((tab) => (
        <RadixTabs.Content
          key={tab.id}
          value={tab.id}
          className="focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] focus-visible:outline-offset-2 rounded-lg"
        >
          {tab.content}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  );
};
