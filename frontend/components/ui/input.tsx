import * as React from 'react';
import { cn } from '@/lib/utils';
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input className={cn('flex h-9 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50', className)} ref={ref} {...props} />
  )
);
Input.displayName = 'Input';
export { Input };
