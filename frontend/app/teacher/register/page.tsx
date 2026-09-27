'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Download, Plus, Save, Undo2, CalendarRange, Info, Sheet as SheetIcon } from 'lucide-react';
import { toast } from 'sonner';
import { teacherAPI } from '@/lib/api/teacher';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState, ErrorState } from '@/components/shared/EmptyState';
import { Combobox } from '@/components/ui/combobox';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { apiErrorMessage, cn } from '@/lib/utils';
import { t } from '@/lib/i18n';
import { num } from '@/lib/i18n';

type Status = 'PRESENT' | 'ABSENT' | 'LEAVE';
type Cell = Status | null;

const CYCLE: Cell[] = ['PRESENT', 'ABSENT', 'LEAVE', null];
const LETTER: Record<Status, string> = { PRESENT: 'P', ABSENT: 'A', LEAVE: 'L' };
const CELL_TONE: Record<Status, string> = {
  PRESENT: 'bg-success-bg text-success',
  ABSENT: 'bg-danger-bg text-danger',
  LEAVE: 'bg-warning-bg text-warning',
};

const todayKey = () => new Date().toLocaleDateString('en-CA');
const addDays = (key: string, n: number) => {
  const d = new Date(`${key}T12:00:00`);
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString('en-CA');
};
const fmtShort = (key: string) =>
  new Date(`${key}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

type Preset = 'halfYearly' | 'year' | 'month' | 'last30' | 'custom';

export default function AttendanceRegisterPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [assignmentId, setAssignmentId] = useState('');
  const [preset, setPreset] = useState<Preset>('year');
  const [from, setFrom] = useState<string | undefined>();
  const [to, setTo] = useState<string | undefined>();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [edits, setEdits] = useState<Record<string, Cell>>({}); // "studentId|date" → status
  const [extraDates, setExtraDates] = useState<string[]>([]);
  const [newDate, setNewDate] = useState('');
  const [saving, setSaving] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    teacherAPI
      .getAssignments()
      .then((r) => {
        const list = r.data.data ?? [];
        setAssignments(list);
        if (list.length) setAssignmentId(list[0]._id);
      })
      .catch(() => toast.error(t('Could not load your classes')));
  }, []);

  const load = useCallback(() => {
    if (!assignmentId) return;
    setLoading(true);
    setFailed(false);
    teacherAPI
      .getRegister({ assignmentId, from, to })
      .then((r) => {
        setData(r.data.data);
        setEdits({});
        setExtraDates([]);
      })
      .catch((err) => {
        setFailed(true);
        toast.error(apiErrorMessage(err, t('Could not load the register')));
      })
      .finally(() => setLoading(false));
  }, [assignmentId, from, to]);

  useEffect(load, [load]);

  const dirty = Object.keys(edits).length;

  // Leaving with unsaved marks asks first.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const choosePreset = (p: Preset) => {
    if (dirty && !window.confirm(t('You have unsaved changes. Discard them?'))) return;
    setPreset(p);
    const today = todayKey();
    const year = data?.academicYear;
    if (p === 'year') {
      setFrom(year?.start);
      setTo(today);
    } else if (p === 'halfYearly' && data?.examDates?.halfYearly) {
      setFrom(year?.start);
      setTo(addDays(data.examDates.halfYearly, -1));
    } else if (p === 'month') {
      setFrom(`${today.slice(0, 7)}-01`);
      setTo(today);
    } else if (p === 'last30') {
      setFrom(addDays(today, -29));
      setTo(today);
    }
  };

  const students: any[] = data?.students ?? [];
  const dates: string[] = useMemo(
    () => Array.from(new Set([...(data?.dates ?? []), ...extraDates])).sort(),
    [data, extraDates]
  );
  const locked = useMemo(() => new Set<string>(data?.locked ?? []), [data]);

  const cellOf = useCallback(
    (sid: string, date: string): Cell => {
      const k = `${sid}|${date}`;
      if (k in edits) return edits[k];
      return (data?.cells?.[sid]?.[date] as Cell) ?? null;
    },
    [edits, data]
  );

  const setCell = (sid: string, date: string, value: Cell) => {
    if (locked.has(date)) return;
    const original = (data?.cells?.[sid]?.[date] as Cell) ?? null;
    setEdits((prev) => {
      const next = { ...prev };
      const k = `${sid}|${date}`;
      if (value === original) delete next[k];
      else next[k] = value;
      return next;
    });
  };

  const cycle = (sid: string, date: string) => {
    const cur = cellOf(sid, date);
    setCell(sid, date, CYCLE[(CYCLE.indexOf(cur) + 1) % CYCLE.length]);
  };

  const markColumn = (date: string, value: Cell) => students.forEach((s) => setCell(s._id, date, value));

  // Totals include unsaved edits, so the percentage moves as you mark.
  const summary = useMemo(() => {
    const out: Record<string, { p: number; a: number; l: number; pct: number | null }> = {};
    for (const s of students) {
      let p = 0, a = 0, l = 0;
      for (const d of dates) {
        const c = cellOf(s._id, d);
        if (c === 'PRESENT') p++;
        else if (c === 'ABSENT') a++;
        else if (c === 'LEAVE') l++;
      }
      const marked = p + a + l;
      out[s._id] = { p, a, l, pct: marked ? Math.round((p / marked) * 1000) / 10 : null };
    }
    return out;
  }, [students, dates, cellOf]);

  const dayTotals = useMemo(
    () => Object.fromEntries(dates.map((d) => [d, students.filter((s) => cellOf(s._id, d) === 'PRESENT').length])),
    [dates, students, cellOf]
  );

  const classAverage = useMemo(() => {
    const vals = Object.values(summary).map((s) => s.pct).filter((v): v is number => v !== null);
    return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
  }, [summary]);

  const addDate = () => {
    const d = newDate || todayKey();
    if (d > todayKey()) {
      toast.error(t('You can’t mark attendance for a future day'));
      return;
    }
    if (!dates.includes(d)) setExtraDates((x) => [...x, d]);
    // A new day starts with everyone present — one click fixes the absentees.
    students.forEach((s) => {
      if (!cellOf(s._id, d)) setCell(s._id, d, 'PRESENT');
    });
    setNewDate('');
    setTimeout(() => gridRef.current?.scrollTo({ left: gridRef.current.scrollWidth, behavior: 'smooth' }), 50);
  };

  const save = async () => {
    const changes = Object.entries(edits).map(([k, status]) => {
      const [studentId, date] = k.split('|');
      return { studentId, date, status };
    });
    setSaving(true);
    try {
      await teacherAPI.saveRegister({ assignmentId, changes });
      toast.success(t('Saved {length} {value}', { length: changes.length, value: changes.length === 1 ? 'mark' : 'marks' }));
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, t('Could not save the register')));
    } finally {
      setSaving(false);
    }
  };

  const exportCsv = () => {
    const a = data?.assignment;
    const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const header = [t('Roll'), t('Student'), ...dates, t('Present'), t('Absent'), t('Leave'), t('Attendance %')];
    const rows = students.map((s) => {
      const sum = summary[s._id];
      return [
        s.rollNumber,
        s.fullName,
        ...dates.map((d) => {
          const c = cellOf(s._id, d);
          return c ? LETTER[c] : '';
        }),
        sum.p,
        sum.a,
        sum.l,
        sum.pct ?? '',
      ];
    });
    const csv = [header, ...rows].map((r) => r.map(esc).join(',')).join('\r\n');
    // BOM so Excel reads Bangla names correctly.
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-${a?.class?.name ?? 'class'}-${a?.subject?.name ?? ''}-${data?.range?.from}-to-${data?.range?.to}.csv`.replace(/\s+/g, '-');
    link.click();
    URL.revokeObjectURL(url);
  };

  const onCellKey = (e: React.KeyboardEvent<HTMLButtonElement>, sid: string, date: string, r: number, c: number) => {
    const map: Record<string, Cell> = { p: 'PRESENT', a: 'ABSENT', l: 'LEAVE', Delete: null, Backspace: null };
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (key in map) {
      e.preventDefault();
      setCell(sid, date, map[key]);
      focusCell(r + 1, c);
      return;
    }
    const moves: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    if (moves[e.key]) {
      e.preventDefault();
      focusCell(r + moves[e.key][0], c + moves[e.key][1]);
    }
  };
  const focusCell = (r: number, c: number) => {
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-cell="${r}-${c}"]`)?.focus();
  };

  const assignmentOptions = assignments.map((a) => ({
    value: a._id,
    label: `${a.classId?.name ?? ''} ${a.classId?.section ?? ''} · ${a.subjectId?.name ?? ''}`.trim(),
  }));
  const hy = data?.examDates?.halfYearly;

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('Attendance register')}
        description={t('Every class day for a subject, like the paper register — with each student\'s percentage for any period.')}
      />

      {/* Controls */}
      <div className="flex flex-col gap-3 rounded-[18px] border border-line bg-surface p-4 shadow-card lg:flex-row lg:items-end">
        <div className="w-full lg:w-72">
          <p className="mb-1.5 text-meta font-medium text-ink-muted">{t('Class and subject')}</p>
          <Combobox
            options={assignmentOptions}
            value={assignmentId}
            onChange={(v) => {
              if (dirty && !window.confirm(t('You have unsaved changes. Discard them?'))) return;
              setAssignmentId(v);
            }}
            placeholder={t('Choose a class')}
            searchPlaceholder={t('Find a class')}
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="mb-1.5 text-meta font-medium text-ink-muted">{t('Period')}</p>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ['halfYearly', 'Until half-yearly exam'],
                ['year', 'This year so far'],
                ['month', 'This month'],
                ['last30', 'Last 30 days'],
                ['custom', 'Custom'],
              ] as [Preset, string][]
            ).map(([p, label]) => (
              <button
                key={p}
                type="button"
                onClick={() => (p === 'custom' ? setPreset('custom') : choosePreset(p))}
                disabled={p === 'halfYearly' && !hy}
                title={p === 'halfYearly' && !hy ? t('The school office hasn’t set the half-yearly exam date yet') : undefined}
                aria-pressed={preset === p}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-dense font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                  preset === p ? 'border-brand bg-brand text-brand-contrast' : 'border-line text-ink-muted hover:border-line-strong hover:text-ink'
                )}
              >
                {t(label)}
              </button>
            ))}
          </div>
          {preset === 'custom' && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-dense">
              <input
                type="date"
                aria-label={t('From')}
                value={from ?? data?.range?.from ?? ''}
                max={todayKey()}
                onChange={(e) => setFrom(e.target.value || undefined)}
                className="h-9 rounded-chip border border-line bg-surface px-2 text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
              />
              <span className="text-ink-subtle">{t('to')}</span>
              <input
                type="date"
                aria-label={t('To')}
                value={to ?? data?.range?.to ?? ''}
                max={todayKey()}
                onChange={(e) => setTo(e.target.value || undefined)}
                className="h-9 rounded-chip border border-line bg-surface px-2 text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
              />
            </div>
          )}
        </div>
      </div>

      {!assignments.length && !loading ? (
        <div className="rounded-card border border-line bg-surface shadow-card">
          <EmptyState icon={SheetIcon} title={t('No classes assigned')} description={t('Your classes appear here once the office assigns them.')} />
        </div>
      ) : loading || !data ? (
        failed ? (
          <ErrorState description={t('The register did not load.')} onRetry={load} />
        ) : (
          <Skeleton className="h-[480px] w-full rounded-[18px]" />
        )
      ) : (
        <>
          {/* Range summary + toolbar */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <p className="flex items-center gap-2 text-dense text-ink-muted">
              <CalendarRange className="h-4 w-4 text-brand" strokeWidth={1.75} aria-hidden="true" />
              <span>
                <span className="font-medium text-ink">{fmtShort(data.range.from)}</span>{' '}{t('to')}{' '}
                <span className="font-medium text-ink">{fmtShort(data.range.to)}</span> ·{' '}
                <span className="tabular">{dates.length}</span>{' '}{t('class')}{' '}{dates.length === 1 ? t('day') : t('days')}
                {classAverage !== null && (
                  <>
                    {' '}· {t('class average')} <span className="font-semibold text-ink tabular">{num(classAverage)}%</span>
                  </>
                )}
              </span>
            </p>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  aria-label={t('Day to add')}
                  value={newDate}
                  max={todayKey()}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="h-9 rounded-chip border border-line bg-surface px-2 text-dense text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
                />
                <Button variant="secondary" onClick={addDate}>
                  <Plus className="h-4 w-4" strokeWidth={1.75} />
                  {newDate ? t('Add day') : t('Add today')}
                </Button>
              </div>
              <Button variant="secondary" onClick={exportCsv} disabled={!students.length}>
                <Download className="h-4 w-4" strokeWidth={1.75} />
                {t('Excel (CSV)')}
              </Button>
              {dirty > 0 && (
                <Button variant="ghost" onClick={() => { setEdits({}); setExtraDates([]); }}>
                  <Undo2 className="h-4 w-4" strokeWidth={1.75} />
                  {t('Discard')}
                </Button>
              )}
              <Button onClick={save} loading={saving} disabled={!dirty}>
                <Save className="h-4 w-4" strokeWidth={1.75} />
                {dirty ? t('Save {dirty} {value}', { dirty, value: dirty === 1 ? 'change' : 'changes' }) : t('Saved')}
              </Button>
            </div>
          </div>

          {!students.length ? (
            <div className="rounded-card border border-line bg-surface shadow-card">
              <EmptyState icon={SheetIcon} title={t('No students in this class')} />
            </div>
          ) : (
            <div className="overflow-hidden rounded-[18px] border border-line bg-surface shadow-card">
              <div ref={gridRef} className="scrollbar-thin max-h-[70vh] overflow-auto">
                <table className="w-max min-w-full border-separate border-spacing-0 text-dense">
                  <thead>
                    <tr>
                      <th className="sticky left-0 top-0 z-30 w-14 border-b border-r border-line bg-surface-sunken px-2 py-2 text-left text-meta font-semibold text-ink-muted">
                        {t('Roll')}
                      </th>
                      <th className="sticky left-14 top-0 z-30 min-w-[12rem] border-b border-r border-line bg-surface-sunken px-3 py-2 text-left text-meta font-semibold text-ink-muted">
                        {t('Student')}
                      </th>
                      {dates.map((d, c) => {
                        const dt = new Date(`${d}T12:00:00`);
                        const isToday = d === todayKey();
                        return (
                          <th
                            key={d}
                            className={cn(
                              'group sticky top-0 z-20 w-11 border-b border-r border-line px-0 py-1 text-center font-medium',
                              isToday ? 'bg-brand-wash text-brand' : 'bg-surface-sunken text-ink-muted',
                              extraDates.includes(d) && !data.dates.includes(d) && 'bg-highlighter-wash'
                            )}
                            title={t('{toLocaleDateString} — click to mark everyone present', { toLocaleDateString: dt.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) })}
                          >
                            <button
                              type="button"
                              onClick={() => markColumn(d, 'PRESENT')}
                              disabled={locked.has(d)}
                              className="flex w-full flex-col items-center leading-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
                              aria-label={t('Mark everyone present on {fmtShort}', { fmtShort: fmtShort(d) })}
                            >
                              <span className="text-[10px] uppercase tracking-wide opacity-75">
                                {dt.toLocaleDateString('en-GB', { month: 'short' })}
                              </span>
                              <span className="text-dense font-semibold tabular">{dt.getDate()}</span>
                              <span className="text-[10px] opacity-75">{dt.toLocaleDateString('en-GB', { weekday: 'narrow' })}</span>
                            </button>
                          </th>
                        );
                      })}
                      {['P', 'A', 'L'].map((h) => (
                        <th key={h} className="sticky top-0 z-20 w-11 border-b border-r border-line bg-surface-sunken px-1 py-2 text-center text-meta font-semibold text-ink-muted">
                          {h}
                        </th>
                      ))}
                      <th className="sticky right-0 top-0 z-30 w-20 border-b border-l border-line bg-surface-sunken px-2 py-2 text-center text-meta font-semibold text-ink-muted">
                        %
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, r) => {
                      const sum = summary[s._id];
                      return (
                        <tr key={s._id} className="group/row">
                          <td className="sticky left-0 z-10 border-b border-r border-line bg-surface px-2 py-1 text-ink-muted tabular group-hover/row:bg-wash">
                            {s.rollNumber || r + 1}
                          </td>
                          <td className="sticky left-14 z-10 border-b border-r border-line bg-surface px-3 py-1 font-medium text-ink group-hover/row:bg-wash">
                            <span className="block max-w-[14rem] truncate">{s.fullName}</span>
                          </td>
                          {dates.map((d, c) => {
                            const v = cellOf(s._id, d);
                            const changed = `${s._id}|${d}` in edits;
                            return (
                              <td key={d} className="border-b border-r border-line p-0.5 text-center">
                                <button
                                  type="button"
                                  data-cell={`${r}-${c}`}
                                  onClick={() => cycle(s._id, d)}
                                  onKeyDown={(e) => onCellKey(e, s._id, d, r, c)}
                                  disabled={locked.has(d)}
                                  aria-label={`${s.fullName}, ${fmtShort(d)}: ${v ? v.toLowerCase() : 'not marked'}`}
                                  className={cn(
                                    'relative h-8 w-9 rounded-md text-dense font-bold transition-colors',
                                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                                    v ? CELL_TONE[v] : 'text-ink-subtle hover:bg-wash',
                                    changed && 'ring-2 ring-highlighter'
                                  )}
                                >
                                  {v ? LETTER[v] : '·'}
                                </button>
                              </td>
                            );
                          })}
                          <td className="border-b border-r border-line text-center text-success tabular">{sum.p}</td>
                          <td className="border-b border-r border-line text-center text-danger tabular">{sum.a}</td>
                          <td className="border-b border-r border-line text-center text-warning tabular">{sum.l}</td>
                          <td className="sticky right-0 z-10 border-b border-l border-line bg-surface px-2 text-center group-hover/row:bg-wash">
                            {sum.pct === null ? (
                              <span className="text-ink-subtle">—</span>
                            ) : (
                              <span
                                className={cn(
                                  'inline-flex rounded-full px-2 py-0.5 text-meta font-semibold tabular',
                                  sum.pct >= 90 ? 'bg-success-bg text-success' : sum.pct >= 75 ? 'bg-warning-bg text-warning' : 'bg-danger-bg text-danger'
                                )}
                              >
                                {sum.pct}%
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td className="sticky bottom-0 left-0 z-20 border-r border-t border-line bg-surface-sunken px-2 py-2" />
                      <td className="sticky bottom-0 left-14 z-20 border-r border-t border-line bg-surface-sunken px-3 py-2 text-meta font-semibold text-ink-muted">
                        {t('Present each day')}
                      </td>
                      {dates.map((d) => (
                        <td key={d} className="sticky bottom-0 z-10 border-r border-t border-line bg-surface-sunken text-center text-meta font-semibold text-ink tabular">
                          {dayTotals[d]}
                        </td>
                      ))}
                      <td colSpan={3} className="sticky bottom-0 z-10 border-r border-t border-line bg-surface-sunken" />
                      <td className="sticky bottom-0 right-0 z-20 border-l border-t border-line bg-surface-sunken text-center text-meta font-semibold text-ink tabular">
                        {classAverage !== null ? `${classAverage}%` : '—'}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          <p className="flex flex-wrap items-center gap-x-4 gap-y-2 text-meta text-ink-muted">
            <Info className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            <Legend tone={CELL_TONE.PRESENT} letter="P" label={t('Present')} />
            <Legend tone={CELL_TONE.ABSENT} letter="A" label={t('Absent')} />
            <Legend tone={CELL_TONE.LEAVE} letter="L" label={t('Leave')} />
            <span>{t('Click a cell to change it, or type P, A or L. Arrow keys move. Click a date to mark everyone present.')}</span>
            <span>{t('Percentage = days present ÷ days marked.')}</span>
          </p>
        </>
      )}
    </div>
  );
}

function Legend({ tone, letter, label }: { tone: string; letter: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('inline-flex h-5 w-5 items-center justify-center rounded text-[11px] font-bold', tone)}>{letter}</span>
      {label}
    </span>
  );
}
