'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Label } from './label';

interface FieldProps {
  label: string;
  /** Sits under the label, before the control — for units, limits or a hint. */
  description?: string;
  error?: string | null;
  required?: boolean;
  className?: string;
  children: (props: {
    id: string;
    'aria-invalid'?: boolean;
    'aria-describedby'?: string;
  }) => React.ReactNode;
}

/**
 * Keeps label, description, control and error wired together in one place, so
 * every form in the app gets the same aria-describedby / aria-invalid plumbing
 * without each page having to remember it.
 */
export function Field({ label, description, error, required, className, children }: FieldProps) {
  const reactId = React.useId();
  const id = `field-${reactId}`;
  const descId = description ? `${id}-desc` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const describedBy = [descId, errId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={id}>
        {label}
        {required && (
          <span className="ml-0.5 text-danger" aria-hidden="true">
            *
          </span>
        )}
      </Label>
      {description && (
        <p id={descId} className="text-meta text-ink-subtle">
          {description}
        </p>
      )}
      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy,
      })}
      {error && (
        <p id={errId} className="text-meta text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
