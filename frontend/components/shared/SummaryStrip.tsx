'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface SummaryFigure {
  label: string;
  value: string | number;
  /** A qualifier under the figure, e.g. "of 200" — only when it is real data. */
  detail?: string;
}

/**
 * Replaces the row of four identical stat cards with gradient icon circles.
 *
 * Plain figures with labels, separated by a hairline. No icons, no trend chips:
 * the API returns no historical series, so a trend would have to be invented.
 * Figures count up once on first load and then stay still.
 */
export function SummaryStrip({
  figures,
  className,
}: {
  figures: SummaryFigure[];
  className?: string;
}) {
  if (!figures.length) return null;

  return (
    <dl
      className={cn(
        'grid grid-cols-2 gap-x-6 gap-y-5 border-b border-line pb-5 sm:flex sm:flex-wrap sm:gap-x-10',
        className
      )}
    >
      {figures.map((f) => (
        <div key={f.label} className="min-w-0">
          <dt className="text-meta text-ink-muted">{f.label}</dt>
          <dd className="mt-0.5 flex items-baseline gap-1.5">
            <CountUp value={f.value} />
            {f.detail && <span className="text-meta text-ink-subtle tabular">{f.detail}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function CountUp({ value }: { value: string | number }) {
  const reduce = useReducedMotion();
  const numeric = typeof value === 'number' ? value : Number(String(value).replace(/[^0-9.]/g, ''));
  const isNumeric = typeof value === 'number' || (!Number.isNaN(numeric) && /^\d/.test(String(value)));

  if (!isNumeric || reduce) {
    return <span className="text-2xl font-semibold text-ink tabular">{value}</span>;
  }

  const suffix = typeof value === 'string' ? String(value).replace(/^[\d.,]+/, '') : '';

  return (
    <motion.span
      className="text-2xl font-semibold text-ink tabular"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {value}
      <span className="sr-only">{suffix}</span>
    </motion.span>
  );
}
