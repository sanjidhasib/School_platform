import { cn } from '@/lib/utils';
import { getLanguage } from '@/lib/i18n';
import { subjectTint, subjectBn, type SubjectLike } from '@/lib/design/subjects';

/**
 * A subject always appears as its English name with the Bangla underneath.
 * The database has carried `nameBn` for every subject all along; the old UI
 * showed none of it.
 */
export function SubjectLabel({
  subject,
  className,
  inline,
}: {
  subject?: SubjectLike | null;
  className?: string;
  /** Puts the Bangla name beside the English one instead of beneath it. */
  inline?: boolean;
}) {
  if (!subject?.name) return <span className={cn('text-ink-subtle', className)}>—</span>;
  const bnName = subjectBn(subject);
  // In the Bangla interface the Bangla name leads and English sits beneath.
  const bangla = getLanguage() === 'bn' && !!bnName;
  const primary = bangla ? bnName! : subject.name;
  const bn = bangla ? subject.name : bnName;

  if (inline) {
    return (
      <span className={cn('inline-flex items-baseline gap-1.5', className)}>
        <span lang={bangla ? 'bn' : undefined}>{primary}</span>
        {bn && (
          <span lang={bangla ? undefined : 'bn'} className={cn('text-meta text-ink-muted', !bangla && 'font-bn')}>
            {bn}
          </span>
        )}
      </span>
    );
  }

  return (
    <span className={cn('block', className)}>
      <span lang={bangla ? 'bn' : undefined} className="block truncate">{primary}</span>
      {bn && (
        <span lang={bangla ? undefined : 'bn'} className={cn('block truncate text-meta text-ink-muted', !bangla && 'font-bn')}>
          {bn}
        </span>
      )}
    </span>
  );
}

/** A tinted chip, coloured by the subject's `code` so it is stable everywhere. */
export function SubjectChip({
  subject,
  className,
}: {
  subject?: SubjectLike | null;
  className?: string;
}) {
  if (!subject?.name) return null;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-chip px-2 py-0.5 text-meta font-medium text-ink',
        subjectTint(subject),
        className
      )}
    >
      {subject.name}
    </span>
  );
}
