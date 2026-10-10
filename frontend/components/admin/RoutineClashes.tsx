'use client';

import * as React from 'react';
import { AlertTriangle } from 'lucide-react';
import { adminAPI } from '@/lib/api/admin';
import { formatTime } from '@/lib/utils';
import { t } from '@/lib/i18n';

const SHOWN = 4;

/**
 * Routine page: where a teacher is booked in two classes at the same time.
 * New clashes can't be saved any more; this lists the ones already in the
 * routine so they can be fixed. Tapping a class opens its routine.
 */
export function RoutineClashes({ version, onOpenClass }: { version: number; onOpenClass: (classId: string) => void }) {
  const [clashes, setClashes] = React.useState<any[] | null>(null);
  const [all, setAll] = React.useState(false);

  React.useEffect(() => {
    adminAPI
      .getTimetableClashes()
      .then((r) => setClashes(r.data.data ?? []))
      .catch(() => setClashes(null));
  }, [version]);

  if (!clashes?.length) return null;
  const list = all ? clashes : clashes.slice(0, SHOWN);

  return (
    <section className="rounded-card border border-warning/40 bg-warning-bg p-4" aria-live="polite">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" strokeWidth={1.75} aria-hidden="true" />
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h2 className="text-dense font-semibold text-ink">
              {t('{n} routine clashes: a teacher in two classes at the same time', { n: clashes.length })}
            </h2>
            <p className="text-meta text-ink-muted">
              {t('Open a class and move one of the periods, or give it to another teacher. New clashes can’t be saved.')}
            </p>
          </div>
          <ul className="space-y-2">
            {list.map((c, i) => (
              <li key={i} className="rounded-btn bg-surface px-3 py-2 text-dense">
                <p className="text-ink">
                  <span className="font-medium">{c.teacher?.fullName}</span>
                  <span className="text-ink-muted">
                    {' · '}
                    {t(c.day)} {formatTime(c.startTime)}–{formatTime(c.endTime)}
                  </span>
                </p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {c.periods.map((p: any) => (
                    <button
                      key={p._id}
                      type="button"
                      onClick={() => onOpenClass(String(p.classId))}
                      className="rounded-chip border border-line px-2 py-0.5 text-meta text-ink-muted transition-colors hover:border-brand/40 hover:bg-brand-wash hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                    >
                      {p.className} · {p.subject}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
          {clashes.length > SHOWN && (
            <button
              type="button"
              onClick={() => setAll((v) => !v)}
              className="text-meta font-medium text-ink underline underline-offset-2"
            >
              {all ? t('Show fewer') : t('Show all {n}', { n: clashes.length })}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
