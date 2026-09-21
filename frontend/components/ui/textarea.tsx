import * as React from 'react';
import { cn } from '@/lib/utils';
import { inputClasses } from './input';

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    className={cn(inputClasses, 'h-auto min-h-[80px] resize-y py-2 leading-relaxed', className)}
    ref={ref}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

export { Textarea };
