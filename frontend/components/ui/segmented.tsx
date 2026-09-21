'use client';

import * as React from 'react';
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import { cn } from '@/lib/utils';
import { statusMeta } from '@/lib/design/status';

export interface SegmentedOption {
  value: string;
  label?: string;
}

/**
 * A three-way control for attendance. Every state is visible and one click
 * away, which the previous cycling badge could not manage — marking a student
 * absent took two clicks and gave no hint that it would.
 */
export function StatusSegmented({
  value,
  onValueChange,
  options,
  ariaLabel,
  size = 'md',
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: SegmentedOption[];
  ariaLabel: string;
  size?: 'sm' | 'md';
}) {
  return (
    <ToggleGroupPrimitive.Root
      type="single"
      value={value}
      aria-label={ariaLabel}
      onValueChange={(next) => {
        // Radix emits "" when the active item is clicked again; keep the
        // current value rather than leaving a student unmarked.
        if (next) onValueChange(next);
      }}
      className="inline-flex shrink-0 rounded-btn border border-line bg-surface p-0.5"
    >
      {options.map((opt) => {
        const meta = statusMeta(opt.value);
        const Icon = meta.icon;
        const activeTone = {
          success: 'data-[state=on]:bg-success-bg data-[state=on]:text-success',
          danger: 'data-[state=on]:bg-danger-bg data-[state=on]:text-danger',
          warning: 'data-[state=on]:bg-warning-bg data-[state=on]:text-warning',
          info: 'data-[state=on]:bg-info-bg data-[state=on]:text-info',
          neutral: 'data-[state=on]:bg-surface-sunken data-[state=on]:text-ink',
        }[meta.tone];

        return (
          <ToggleGroupPrimitive.Item
            key={opt.value}
            value={opt.value}
            aria-label={opt.label ?? meta.label}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-chip font-medium transition-colors',
              'text-ink-subtle hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
              'data-[state=on]:font-semibold',
              size === 'sm' ? 'h-7 px-2 text-meta' : 'h-8 px-2.5 text-meta',
              activeTone
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span className="hidden sm:inline">{opt.label ?? meta.label}</span>
          </ToggleGroupPrimitive.Item>
        );
      })}
    </ToggleGroupPrimitive.Root>
  );
}
