'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { BellRing, CheckCircle2, Award, Sheet, CalendarClock } from 'lucide-react';
import { toast } from 'sonner';
import { teacherAPI } from '@/lib/api/teacher';
import { Button } from '@/components/ui/button';
import { apiErrorMessage, cn, termLabel } from '@/lib/utils';
import { subjectTint } from '@/lib/design/subjects';
import { t } from '@/lib/i18n';

const fmt = (d?: string) => (d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '');

/**
 * What the office has asked this teacher to submit. Shown on the teacher's
 * profile and at the top of their dashboard (only when something is open).
 */
export function TeacherRequests({ compact = false }: { compact?: boolean }) {
  const [items, setItems] = useState<any[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    teacherAPI
      .getRequests()
      .then((r) => setItems(r.data.data ?? []))
      .catch(() => setItems([]));
  }, []);

  useEffect(load, [load]);

  const done = async (r: any) => {
    setBusy(r._id);
    try {
      await teacherAPI.completeRequest(r._id);
      toast.success(t('Marked as done — the office can see it'));
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, t('Could not update the request')));
    } finally {
      setBusy(null);
    }
  };

  if (items === null) return null;
  const open = items.filter((r) => r.status === 'OPEN');
  const finished = items.filter((r) => r.status === 'DONE').slice(0, 5);
  if (compact && !open.length) return null;

  const overdue = (r: any) => r.dueDate && new Date(r.dueDate).getTime() < Date.now() - 864e5;

  return (
    <section className="space-y-3" aria-labelledby="requests-heading">
      <div className="flex items-center gap-2">
        <BellRing className="h-4 w-4 text-warning" strokeWidth={1.75} aria-hidden="true" />
        <h2 id="requests-heading" className="text-section text-ink">
          {t('Requests from the office')}
        </h2>
        {open.length > 0 && <span className="rounded-full bg-warning-bg px-2 py-0.5 text-meta font-semibold text-warning">{t('{length} open', { length: open.length })}</span>}
      </div>

      {!open.length ? (
        <p className="rounded-[18px] border border-line bg-surface px-4 py-5 text-dense text-ink-muted shadow-card">{t('Nothing waiting — you’re up to date.')}</p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {open.map((r) => (
            <li key={r._id} className="flex overflow-hidden rounded-[18px] border border-line bg-surface shadow-card">
              <span className={cn('w-1.5 shrink-0', subjectTint(r.subjectId))} aria-hidden="true" />
              <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-dense font-semibold text-ink">
                      {r.type === 'GRADES' ? t('{termLabel} final grades', { termLabel: termLabel(r.term) }) : t('Attendance')}
                    </p>
                    <p className="truncate text-meta text-ink-muted">
                      {r.classId?.name} {r.classId?.section} · {r.subjectId?.name}
                    </p>
                  </div>
                  {r.dueDate && (
                    <span
                      className={cn(
                        'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-meta font-medium',
                        overdue(r) ? 'bg-danger-bg text-danger' : 'bg-warning-bg text-warning'
                      )}
                    >
                      <CalendarClock className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
                      {overdue(r) ? t('Overdue') : t('Due')} {fmt(r.dueDate)}
                    </span>
                  )}
                </div>
                {r.type === 'ATTENDANCE' && r.upTo && <p className="text-meta text-ink-muted">{t('Up to {fmt}', { fmt: fmt(r.upTo) })}</p>}
                {r.message && <p className="rounded-xl bg-surface-sunken px-3 py-2 text-dense text-ink">“{r.message}”</p>}
                <div className="mt-auto flex flex-wrap gap-2 pt-1">
                  {r.type === 'GRADES' ? (
                    <Button size="sm" asChild>
                      <Link href={`/teacher/grades?assignment=${r.teacherAssignmentId}&term=${r.term ?? 'TERM_1'}`}>
                        <Award className="h-4 w-4" strokeWidth={1.75} />
                        {t('Submit grades')}
                      </Link>
                    </Button>
                  ) : (
                    <>
                      <Button size="sm" variant="secondary" asChild>
                        <Link href="/teacher/register">
                          <Sheet className="h-4 w-4" strokeWidth={1.75} />
                          {t('Open register')}
                        </Link>
                      </Button>
                      <Button size="sm" onClick={() => done(r)} loading={busy === r._id}>
                        <CheckCircle2 className="h-4 w-4" strokeWidth={1.75} />
                        {t('Mark as done')}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!compact && finished.length > 0 && (
        <ul className="space-y-1.5">
          {finished.map((r) => (
            <li key={r._id} className="flex items-center gap-2 text-meta text-ink-muted">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" strokeWidth={2} aria-hidden="true" />
              {r.type === 'GRADES' ? t('{termLabel} grades', { termLabel: termLabel(r.term) }) : t('Attendance')}{' '}{t('· {name} {section} · {name2} — done {fmt}', { name: r.classId?.name, section: r.classId?.section, name2: r.subjectId?.name, fmt: fmt(r.completedAt) })}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
