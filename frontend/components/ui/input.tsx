import * as React from 'react';
import { cn } from '@/lib/utils';

export const inputClasses =
  'h-9 w-full rounded-chip border border-line bg-surface px-3 text-dense text-ink ' +
  'placeholder:text-ink-subtle transition-colors ' +
  'focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25 ' +
  'disabled:cursor-not-allowed disabled:opacity-60 ' +
  'aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger/25';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input className={cn(inputClasses, className)} ref={ref} {...props} />
);
Input.displayName = 'Input';

export { Input };
