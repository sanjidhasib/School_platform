import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Every empty state names the thing that is missing and offers the one action
 * that fixes it. The illustration is a plain outlined mark on a wash, specific
 * to the subject — not a stock 3D graphic.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'gap-2 px-4 py-8' : 'gap-3 px-6 py-14',
        className
      )}
    >
      {Icon && (
        <span
          className={cn(
            'flex items-center justify-center rounded-full bg-wash text-brand',
            compact ? 'h-9 w-9' : 'h-11 w-11'
          )}
        >
          <Icon className={compact ? 'h-4 w-4' : 'h-5 w-5'} strokeWidth={1.5} aria-hidden="true" />
        </span>
      )}
      <div className="space-y-1">
        <p className="text-dense font-medium text-ink">{title}</p>
        {description && <p className="max-w-sm text-dense text-ink-muted">{description}</p>}
      </div>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}

/** Says what failed and offers a retry, rather than a bare error string. */
export function ErrorState({
  title = 'Could not load this',
  description,
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-card border border-line bg-surface shadow-card px-6 py-12 text-center',
        className
      )}
    >
      <div className="space-y-1">
        <p className="text-dense font-medium text-ink">{title}</p>
        {description && <p className="max-w-sm text-dense text-ink-muted">{description}</p>}
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-btn border border-line px-3 py-1.5 text-dense font-medium text-ink transition-colors hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          Try again
        </button>
      )}
    </div>
  );
}
