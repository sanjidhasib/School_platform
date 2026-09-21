import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * A card is for a thing that is genuinely a separate object — a teacher, an
 * achievement, a homework. Sections of a page are plain blocks with a heading
 * and a rule, not cards. There is no resting shadow; a border does the work.
 */
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }
>(({ className, interactive, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-card border border-line bg-surface',
      interactive &&
        'transition-colors hover:border-line-strong focus-within:border-brand cursor-pointer',
      className
    )}
    {...props}
  />
));
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-start justify-between gap-3 p-4 pb-0', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-dense font-semibold text-ink', className)} {...props} />
  )
);
CardTitle.displayName = 'CardTitle';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('p-4', className)} {...props} />
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center gap-2 border-t border-line p-3', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';

/**
 * A plain page section: heading, optional action, then content. Used instead of
 * wrapping everything on a dashboard in its own bordered box.
 */
const Panel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { title?: string; action?: React.ReactNode }
>(({ className, title, action, children, ...props }, ref) => (
  <div ref={ref} className={cn('overflow-hidden rounded-card border border-line bg-surface', className)} {...props}>
    {(title || action) && (
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        {title && <h2 className="text-dense font-semibold text-ink">{title}</h2>}
        {action}
      </div>
    )}
    {children}
  </div>
));
Panel.displayName = 'Panel';

export { Card, CardHeader, CardTitle, CardContent, CardFooter, Panel };
