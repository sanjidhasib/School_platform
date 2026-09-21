import { cn } from '@/lib/utils';
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
  const bn = subjectBn(subject);

  if (inline) {
    return (
      <span className={cn('inline-flex items-baseline gap-1.5', className)}>
        <span>{subject.name}</span>
        {bn && (
          <span lang="bn" className="font-bn text-meta text-ink-muted">
            {bn}
          </span>
        )}
      </span>
    );
  }

  return (
    <span className={cn('block', className)}>
      <span className="block truncate">{subject.name}</span>
      {bn && (
        <span lang="bn" className="block truncate font-bn text-meta text-ink-muted">
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
