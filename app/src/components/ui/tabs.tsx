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
        'inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground',
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
        'inline-flex items-center justify-center rounded-md px-3 py-1 text-sm font-medium whitespace-nowrap ring-offset-background transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 aria-selected:bg-background aria-selected:text-foreground aria-selected:shadow-sm',
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
