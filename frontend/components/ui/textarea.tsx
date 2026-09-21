import * as React from 'react';
import { cn } from '@/lib/utils';
const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea className={cn('flex min-h-[80px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 resize-none', className)} ref={ref} {...props} />
  )
);
Textarea.displayName = 'Textarea';
export { Textarea };
