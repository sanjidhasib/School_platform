import { cn } from '@/lib/utils';
import { statusMeta, TONE_CLASSES } from '@/lib/design/status';
import { t } from '@/lib/i18n';

/**
 * The single way a status is shown anywhere in SchoolOS: always an icon and a
 * word, so meaning never rests on colour alone.
 */
export function StatusPill({
  status,
  className,
  iconOnly,
}: {
  status?: string | null;
  className?: string;
  iconOnly?: boolean;
}) {
  const { label, icon: Icon, tone } = statusMeta(status);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-chip px-2 py-0.5 text-meta font-medium',
        TONE_CLASSES[tone],
        className
      )}
      title={iconOnly ? t(label) : undefined}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
      {iconOnly ? <span className="sr-only">{t(label)}</span> : t(label)}
    </span>
  );
}
