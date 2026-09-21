import { cn } from '@/lib/utils';

/**
 * The mark is an open exercise book seen from above — the object every student
 * in the school actually carries — drawn in one stroke weight to match the icon
 * set. It is deliberately not a generic abstract glyph.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn('h-5 w-5', className)}
      aria-hidden="true"
      strokeWidth={1.75}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 6.5C10.6 5.2 8.7 4.5 6.5 4.5H3.5v13H6.5c2.2 0 4.1.7 5.5 2" />
      <path d="M12 6.5c1.4-1.3 3.3-2 5.5-2h3v13h-3c-2.2 0-4.1.7-5.5 2" />
      <path d="M12 6.5v15" />
    </svg>
  );
}

/** Logo mark plus the school's own name, which comes from settings. */
export function Logo({
  schoolName,
  className,
  compact,
}: {
  schoolName?: string | null;
  className?: string;
  compact?: boolean;
}) {
  return (
    <span className={cn('flex min-w-0 items-center gap-2.5', className)}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-btn bg-brand text-brand-contrast">
        <LogoMark />
      </span>
      {!compact && (
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-dense font-semibold text-ink">SchoolOS</span>
          {schoolName && (
            <span className="block truncate text-meta text-ink-subtle">{schoolName}</span>
          )}
        </span>
      )}
    </span>
  );
}
