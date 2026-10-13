'use client';

import * as React from 'react';
import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';

import { cn } from '@/lib/utils';

interface TabsProps extends React.ComponentProps<'div'> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

function Tabs({ className, onValueChange, ...props }: TabsProps) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn('', className)}
      onValueChange={value => {
        if (typeof value === 'string') {
          onValueChange?.(value);
        }
      }}
      {...props}
    />
  );
}

function TabsList({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      activateOnFocus
      className={cn(
        'inline-flex h-10 items-stretch justify-start gap-1 text-muted-foreground shadow-[inset_0_-1px_0_var(--border)]',
        className
      )}
      {...props}
    />
  );
}

interface TabsTriggerProps extends React.ComponentProps<'button'> {
  value: string;
}

function TabsTrigger({ className, type = 'button', ...props }: TabsTriggerProps) {
  return (
    <TabsPrimitive.Tab
      type={type}
      data-slot="tabs-trigger"
      className={cn(
        'inline-flex items-center justify-center border-b-2 border-transparent px-3 text-sm font-semibold whitespace-nowrap transition-colors hover:text-foreground focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 aria-selected:border-primary aria-selected:text-foreground',
        className
      )}
      {...props}
    />
  );
}

interface TabsContentProps extends React.ComponentProps<'div'> {
  value: string;
}

function TabsContent({ className, ...props }: TabsContentProps) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      keepMounted
      className={cn(
        'mt-2 ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none',
        className
      )}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
