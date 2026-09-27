'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';

/**
 * Fills once on mount and then stays put. Progress is not ambient decoration;
 * it moves only when the underlying number does.
 */
export function Progress({
  value,
  className,
  tone = 'brand',
  label,
}: {
  value?: number | null;
  className?: string;
  tone?: 'brand' | 'success' | 'warning' | 'danger';
  label?: string;
}) {
  const reduce = useReducedMotion();
  const pct = Math.max(0, Math.min(100, value ?? 0));
  const toneClass = {
    brand: 'bg-brand',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
  }[tone];

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-line', className)}
    >
      <motion.div
        className={cn('h-full rounded-full', toneClass)}
        initial={reduce ? false : { width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}

/**
 * Class capacity, which the school caps at 40. The bar turns amber as a class
 * fills and red once it is full, so the office can see at a glance which
 * classes can still take an admission.
 */
export function CapacityBar({
  enrolled,
  capacity,
  className,
  showLabel = true,
}: {
  enrolled: number;
  capacity: number;
  className?: string;
  showLabel?: boolean;
}) {
  const safeCapacity = capacity || 40;
  const pct = safeCapacity ? (enrolled / safeCapacity) * 100 : 0;
  const full = enrolled >= safeCapacity;
  const nearlyFull = !full && pct >= 90;
  const tone = full ? 'danger' : nearlyFull ? 'warning' : 'brand';

  return (
    <div className={cn('space-y-1', className)}>
      {showLabel && (
        <div className="flex items-baseline justify-between gap-2 text-meta tabular">
          <span className={cn(full ? 'font-medium text-danger' : 'text-ink-muted')}>
            {t('{enrolled} of {safeCapacity}', { enrolled, safeCapacity })}
          </span>
          {full && <span className="font-medium text-danger">{t('Full')}</span>}
        </div>
      )}
      <Progress
        value={pct}
        tone={tone}
        label={t('{enrolled} of {safeCapacity} places filled', { enrolled, safeCapacity })}
      />
    </div>
  );
}
