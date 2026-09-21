'use client';

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn('scrollbar-thin flex items-center gap-1 overflow-x-auto border-b border-line', className)}
    {...props}
  />
));
TabsList.displayName = 'TabsList';

/**
 * The active indicator is a single shared element that slides between tabs via
 * `layoutId`, rather than each tab fading its own underline in and out.
 */
const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & { indicatorId?: string }
>(({ className, children, indicatorId = 'tab-indicator', ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'relative whitespace-nowrap px-3 py-2 text-dense font-medium text-ink-muted transition-colors',
      'hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
      'data-[state=active]:text-ink',
      className
    )}
    {...props}
  >
    {children}
    <TabIndicator id={indicatorId} />
  </TabsPrimitive.Trigger>
));
TabsTrigger.displayName = 'TabsTrigger';

function TabIndicator({ id }: { id: string }) {
  return (
    <span className="pointer-events-none absolute inset-x-0 -bottom-px hidden h-0.5 [[data-state=active]_&]:block">
      <motion.span
        layoutId={id}
        className="block h-full w-full bg-brand"
        transition={{ type: 'spring', stiffness: 520, damping: 40 }}
      />
    </span>
  );
}

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn('focus-visible:outline-none', className)}
    {...props}
  />
));
TabsContent.displayName = 'TabsContent';

export { Tabs, TabsList, TabsTrigger, TabsContent };
