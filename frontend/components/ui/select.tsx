'use client';
import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
const Select = SelectPrimitive.Root;
const SelectValue = SelectPrimitive.Value;
const SelectTrigger = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Trigger>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>>(
  ({ className, children, ...props }, ref) => (
    <SelectPrimitive.Trigger ref={ref} className={cn('flex h-9 w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50', className)} {...props}>
      {children}<ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Trigger>
  )
);
SelectTrigger.displayName = 'SelectTrigger';
const SelectContent = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Content>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>>(
  ({ className, children, ...props }, ref) => (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content ref={ref} className={cn('relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg', className)} {...props}>
        <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
);
SelectContent.displayName = 'SelectContent';
const SelectItem = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Item>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>>(
  ({ className, children, ...props }, ref) => (
    <SelectPrimitive.Item ref={ref} className={cn('relative flex w-full cursor-pointer select-none items-center rounded-lg py-1.5 pl-8 pr-2 text-sm hover:bg-slate-100 focus:bg-slate-100 outline-none', className)} {...props}>
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator><Check className="h-4 w-4" /></SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
);
SelectItem.displayName = 'SelectItem';
const SelectLabel = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Label>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>>(
  ({ className, ...props }, ref) => <SelectPrimitive.Label ref={ref} className={cn('py-1.5 pl-8 pr-2 text-xs font-semibold text-slate-500', className)} {...props} />
);
SelectLabel.displayName = 'SelectLabel';
export { Select, SelectValue, SelectTrigger, SelectContent, SelectItem, SelectLabel };
