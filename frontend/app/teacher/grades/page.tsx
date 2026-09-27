'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Award, Send, Save, Wand2, Info, BellRing } from 'lucide-react';
import { toast } from 'sonner';
import { teacherAPI } from '@/lib/api/teacher';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState, ErrorState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Combobox } from '@/components/ui/combobox';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { apiErrorMessage, cn, gradeTone, termLabel } from '@/lib/utils';
import { t } from '@/lib/i18n';

const TERMS = [
  { value: 'TERM_1', label: 'Term 1 (half-yearly)' },
  { value: 'TERM_2', label: 'Term 2' },
  { value: 'FINAL', label: 'Final (annual)' },
];

export default function TeacherGradesRoute() {
  return (
    <Suspense>
      <TeacherGradesPage />
    </Suspense>
  );
}

function TeacherGradesPage() {
  const search = useSearchParams();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [assignmentId, setAssignmentId] = useState(search.get('assignment') ?? '');
  const [term, setTerm] = useState(search.get('term') ?? 'TERM_1');
  const [sheet, setSheet] = useState<any>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState<null | 'draft' | 'submit'>(null);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    Promise.all([teacherAPI.getAssignments(), teacherAPI.getRequests()])
      .then(([a, r]) => {
        const list = a.data.data ?? [];
        setAssignments(list);
        setRequests(r.data.data ?? []);
        setAssignmentId((cur) => cur || list[0]?._id || '');
      })
      .catch(() => toast.error(t('Could not load your classes')));
  }, []);

  const load = useCallback(() => {
    if (!assignmentId) return;
    setLoading(true);
    setFailed(false);
    teacherAPI
      .getGradeSheet({ assignmentId, term })
      .then((r) => {
        const d = r.data.data;
        setSheet(d);
        setValues(
          Object.fromEntries(
            d.rows.map((row: any) => [row.student._id, row.saved ? String(row.saved.percentage) : row.suggested !== null ? String(row.suggested) : ''])
          )
        );
      })
      .catch((err) => {
        setFailed(true);
        toast.error(apiErrorMessage(err, t('Could not load the grade sheet')));
      })
      .finally(() => setLoading(false));
  }, [assignmentId, term]);

  useEffect(load, [load]);

  const scale: any[] = sheet?.scale ?? [];
  const band = useCallback(
    (v: string) => {
      const n = parseFloat(v);
      if (!Number.isFinite(n)) return null;
      return scale.find((g) => n >= g.minPercentage) ?? scale[scale.length - 1];
    },
    [scale]
  );

  const filled = useMemo(() => Object.values(values).filter((v) => v !== '' && Number.isFinite(parseFloat(v))).length, [values]);
  const invalid = useMemo(() => Object.values(values).some((v) => v !== '' && (!Number.isFinite(parseFloat(v)) || parseFloat(v) < 0 || parseFloat(v) > 100)), [values]);
  const total = sheet?.rows?.length ?? 0;
  const openRequest = requests.find((r) => r.status === 'OPEN' && r.type === 'GRADES' && String(r.teacherAssignmentId) === assignmentId && (!r.term || r.term === term));

  const save = async (submit: boolean) => {
    setSaving(submit ? 'submit' : 'draft');
    try {
      const grades = Object.entries(values)
        .filter(([, v]) => v !== '')
        .map(([studentId, v]) => ({ studentId, percentage: parseFloat(v) }));
      const r = await teacherAPI.saveGrades({ assignmentId, term, grades, submit });
      const d = r.data.data;
      toast.success(
        d.status === 'FINAL'
          ? t('Submitted {saved} grades{value}', { saved: d.saved, value: d.requestsClosed ? ' — the office’s request is marked done' : '' })
          : t('Draft saved ({saved} grades)', { saved: d.saved })
      );
      setConfirm(false);
      load();
      teacherAPI.getRequests().then((x) => setRequests(x.data.data ?? [])).catch(() => {});
    } catch (err) {
      toast.error(apiErrorMessage(err, t('Could not save the grades')));
    } finally {
      setSaving(null);
    }
  };

  const useSuggested = () =>
    setValues((v) => {
      const next = { ...v };
      for (const row of sheet?.rows ?? []) if (row.suggested !== null) next[row.student._id] = String(row.suggested);
      return next;
    });

  const options = assignments.map((a) => ({
    value: a._id,
    label: `${a.classId?.name ?? ''} ${a.classId?.section ?? ''} · ${a.subjectId?.name ?? ''}`.trim(),
  }));

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('Final grades')}
        description={t('Each student\'s subject grade for the term. Only submitted grades reach students, guardians and report cards.')}
      />

      <div className="flex flex-col gap-3 rounded-[18px] border border-line bg-surface p-4 shadow-card sm:flex-row sm:items-end">
        <div className="w-full sm:w-72">
          <p className="mb-1.5 text-meta font-medium text-ink-muted">{t('Class and subject')}</p>
          <Combobox options={options} value={assignmentId} onChange={setAssignmentId} placeholder={t('Choose a class')} searchPlaceholder={t('Find a class')} />
        </div>
        <div className="w-full sm:w-56">
          <p className="mb-1.5 text-meta font-medium text-ink-muted">{t('Term')}</p>
          <Combobox options={TERMS} value={term} onChange={setTerm} />
        </div>
        {sheet && (
          <span
            className={cn(
              'rounded-full px-3 py-1 text-meta font-semibold sm:ml-auto',
              sheet.submitted ? 'bg-success-bg text-success' : 'bg-surface-sunken text-ink-muted'
            )}
          >
            {sheet.submitted ? t('Submitted') : t('Not submitted yet')}
          </span>
        )}
      </div>

      {openRequest && (
        <p className="flex items-start gap-2 rounded-[18px] border border-warning/30 bg-warning-bg px-4 py-3 text-dense text-ink">
          <BellRing className="mt-0.5 h-4 w-4 shrink-0 text-warning" strokeWidth={1.75} aria-hidden="true" />
          <span>
            {t('The office asked for {termLabel} grades', { termLabel: termLabel(term) })}
            {openRequest.dueDate ? t(' by {toLocaleDateString}', { toLocaleDateString: new Date(openRequest.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }) }) : ''}.
            {openRequest.message ? ` “${openRequest.message}”` : ''}{' '}{t('Submitting marks it done.')}
          </span>
        </p>
      )}

      {!assignments.length ? (
        <div className="rounded-card border border-line bg-surface shadow-card">
          <EmptyState icon={Award} title={t('No classes assigned')} />
        </div>
      ) : loading || !sheet ? (
        failed ? <ErrorState description={t('The grade sheet did not load.')} onRetry={load} /> : <Skeleton className="h-96 w-full rounded-[18px]" />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <p className="flex items-center gap-2 text-dense text-ink-muted">
              <Info className="h-4 w-4 text-brand" strokeWidth={1.75} aria-hidden="true" />
              {sheet.assessments.length
                ? t('Suggested % = weighted average of {length} {termLabel} {value}. Adjust any you need to.', { length: sheet.assessments.length, termLabel: termLabel(term), value: sheet.assessments.length === 1 ? 'assessment' : 'assessments' })
                : t('No {termLabel} marks yet — enter each percentage yourself.', { termLabel: termLabel(term) })}
            </p>
            <div className="ml-auto flex flex-wrap gap-2">
              {sheet.assessments.length > 0 && (
                <Button variant="ghost" onClick={useSuggested}>
                  <Wand2 className="h-4 w-4" strokeWidth={1.75} />
                  {t('Use suggested')}
                </Button>
              )}
              {!sheet.submitted && (
                <Button variant="secondary" onClick={() => save(false)} loading={saving === 'draft'} disabled={!filled || invalid}>
                  <Save className="h-4 w-4" strokeWidth={1.75} />
                  {t('Save draft')}
                </Button>
              )}
              <Button onClick={() => setConfirm(true)} disabled={!filled || invalid}>
                <Send className="h-4 w-4" strokeWidth={1.75} />
                {sheet.submitted ? t('Update submitted grades') : t('Submit final grades')}
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-[18px] border border-line bg-surface shadow-card">
            <div className="scrollbar-thin max-h-[68vh] overflow-auto">
              <table className="w-full min-w-max border-separate border-spacing-0 text-dense">
                <thead>
                  <tr className="text-meta text-ink-muted">
                    <th className="sticky left-0 top-0 z-20 w-12 border-b border-line bg-surface-sunken px-3 py-2.5 text-left font-semibold">{t('Roll')}</th>
                    <th className="sticky left-12 top-0 z-20 border-b border-r border-line bg-surface-sunken px-3 py-2.5 text-left font-semibold">{t('Student')}</th>
                    {sheet.assessments.map((a: any) => (
                      <th key={a._id} className="sticky top-0 z-10 border-b border-line bg-surface-sunken px-3 py-2.5 text-right font-semibold" title={t('{title} — weight {weight}', { title: a.title, weight: a.weight })}>
                        <span className="block max-w-[7rem] truncate">{a.title}</span>
                        <span className="font-normal text-ink-subtle">/ {a.maxMarks}</span>
                      </th>
                    ))}
                    <th className="sticky top-0 z-10 border-b border-l border-line bg-surface-sunken px-3 py-2.5 text-right font-semibold">{t('Suggested')}</th>
                    <th className="sticky top-0 z-10 border-b border-line bg-surface-sunken px-3 py-2.5 text-center font-semibold">{t('Final %')}</th>
                    <th className="sticky top-0 z-10 border-b border-line bg-surface-sunken px-3 py-2.5 text-center font-semibold">{t('Grade')}</th>
                    <th className="sticky top-0 z-10 border-b border-line bg-surface-sunken px-3 py-2.5 text-right font-semibold">{t('GPA')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sheet.rows.map((row: any, i: number) => {
                    const v = values[row.student._id] ?? '';
                    const b = band(v);
                    const bad = v !== '' && (!Number.isFinite(parseFloat(v)) || parseFloat(v) < 0 || parseFloat(v) > 100);
                    return (
                      <tr key={row.student._id} className="group">
                        <td className="sticky left-0 z-10 border-b border-line bg-surface px-3 py-2 text-ink-muted tabular group-hover:bg-wash">{row.student.rollNumber || i + 1}</td>
                        <td className="sticky left-12 z-10 border-b border-r border-line bg-surface px-3 py-2 font-medium text-ink group-hover:bg-wash">
                          {row.student.fullName}
                        </td>
                        {row.marks.map((m: any, j: number) => (
                          <td key={j} className="border-b border-line px-3 py-2 text-right text-ink-muted tabular">
                            {m === null ? '—' : m === 'ABS' ? <span className="text-danger">{t('Abs')}</span> : m}
                          </td>
                        ))}
                        <td className="border-b border-l border-line px-3 py-2 text-right text-ink-subtle tabular">{row.suggested ?? '—'}</td>
                        <td className="border-b border-line px-2 py-1.5 text-center">
                          <input
                            inputMode="decimal"
                            value={v}
                            onChange={(e) => setValues((x) => ({ ...x, [row.student._id]: e.target.value.replace(/[^\d.]/g, '') }))}
                            aria-label={t('Final percentage for {fullName}', { fullName: row.student.fullName })}
                            aria-invalid={bad || undefined}
                            className={cn(
                              'h-8 w-20 rounded-chip border bg-surface px-2 text-center text-ink tabular focus:outline-none focus:ring-2',
                              bad ? 'border-danger focus:ring-danger/25' : 'border-line focus:border-brand focus:ring-brand/25'
                            )}
                          />
                        </td>
                        <td className="border-b border-line px-3 py-2 text-center">
                          {b && !bad ? <span className={cn('inline-flex rounded-chip px-2 py-0.5 text-meta font-semibold', gradeTone(b.grade))}>{b.grade}</span> : <span className="text-ink-subtle">—</span>}
                        </td>
                        <td className="border-b border-line px-3 py-2 text-right font-medium text-ink tabular">{b && !bad ? b.gradePoint.toFixed(2) : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-meta text-ink-muted tabular">
            {t('{filled} of {total} students have a percentage.', { filled, total })}
          </p>
        </>
      )}

      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={sheet?.submitted ? t('Update the submitted grades?') : t('Submit final grades?')}
        description={t('{filled} of {total} students{value}. Students and guardians will see these grades, and they go on the report card.', { filled, total, value: filled < total ? ' — students without a percentage are left out' : '' })}
        confirmLabel={sheet?.submitted ? t('Update') : t('Submit')}
        loading={saving === 'submit'}
        onConfirm={() => save(true)}
      />
    </div>
  );
}
