import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';
import { mediaUrl } from '@/lib/api/client';

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

/**
 * The school's uploaded logo (Settings → Website pictures), or the built-in
 * mark when none is set. `className` sizes the box it sits in.
 */
export function SchoolBadge({ logoUrl, className }: { logoUrl?: string | null; className?: string }) {
  const src = mediaUrl(logoUrl);
  if (src) {
    return (
      <span className={cn('flex shrink-0 items-center justify-center overflow-hidden rounded-btn bg-surface ring-1 ring-line', className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="h-full w-full object-contain" />
      </span>
    );
  }
  return (
    <span className={cn('flex shrink-0 items-center justify-center rounded-btn bg-brand text-brand-contrast', className)}>
      <LogoMark />
    </span>
  );
}

/** Logo mark plus the school's own name, which comes from settings. */
export function Logo({
  schoolName,
  logoUrl,
  className,
  compact,
}: {
  schoolName?: string | null;
  logoUrl?: string | null;
  className?: string;
  compact?: boolean;
}) {
  return (
    <span className={cn('flex min-w-0 items-center gap-2.5', className)}>
      <SchoolBadge logoUrl={logoUrl} className="h-8 w-8" />
      {!compact && (
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-dense font-semibold text-ink">{t('SchoolOS')}</span>
          {schoolName && (
            <span className="block truncate text-meta text-ink-subtle">{t(schoolName)}</span>
          )}
        </span>
      )}
    </span>
  );
}
