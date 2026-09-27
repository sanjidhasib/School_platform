'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CalendarClock, Check, Users, CheckCircle2, Sheet } from 'lucide-react';
import { toast } from 'sonner';
import { teacherAPI } from '@/lib/api/teacher';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState, ErrorState } from '@/components/shared/EmptyState';
import { SubjectLabel } from '@/components/shared/SubjectLabel';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PersonAvatar } from '@/components/ui/avatar';
import { StatusSegmented } from '@/components/ui/segmented';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { apiErrorMessage, cn, formatDateLong, formatTime } from '@/lib/utils';
import { subjectTint } from '@/lib/design/subjects';

type Status = 'PRESENT' | 'ABSENT' | 'LEAVE';

const OPTIONS = [{ value: 'PRESENT' }, { value: 'ABSENT' }, { value: 'LEAVE' }];

export default function TeacherAttendancePage() {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [failed, setFailed] = useState(false);

  const [session, setSession] = useState<any>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [attendance, setAttendance] = useState<Record<string, Status>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [opening, setOpening] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [step, setStep] = useState<'select' | 'mark'>('select');

  const load = () => {
    setLoadingSchedule(true);
    setFailed(false);
    teacherAPI
      .getTodaySchedule()
      .then((r) => setSchedule(r.data.data.schedule ?? []))
      .catch(() => {
        setFailed(true);
        toast.error('Could not load your schedule');
      })
      .finally(() => setLoadingSchedule(false));
  };

  useEffect(load, []);

  const openSession = async (slot: any) => {
    setOpening(slot._id);
    try {
      const sessionRes = await teacherAPI.createAttendanceSession({
        timetableId: slot._id,
        teacherAssignmentId: slot.teacherAssignmentId._id,
        classId: slot.classId._id,
        subjectId: slot.teacherAssignmentId.subjectId._id,
        sessionDate: new Date().toISOString(),
        startTime: slot.startTime,
        endTime: slot.endTime,
      });
      const created = sessionRes.data.data;
      setSession(created);

      const detail = await teacherAPI.getAttendanceSession(created._id);
      const payload = detail.data.data;
      setSessionData(payload);

      const initial: Record<string, Status> = {};
      const initialNotes: Record<string, string> = {};
      payload.students.forEach((s: any) => {
        initial[s._id] = (payload.records[s._id]?.status as Status) || 'PRESENT';
        if (payload.records[s._id]?.note) initialNotes[s._id] = payload.records[s._id].note;
      });
      setAttendance(initial);
      setNotes(initialNotes);
      setSavedAt(null);
      setStep('mark');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not open this class'));
    } finally {
      setOpening(null);
    }
  };

  const setAll = (status: Status) => {
    if (!sessionData?.students) return;
    const next: Record<string, Status> = {};
    sessionData.students.forEach((s: any) => {
      next[s._id] = status;
    });
    setAttendance(next);
  };

  const saveAttendance = async () => {
    setSaving(true);
    try {
      const records = Object.entries(attendance).map(([studentId, status]) => ({
        studentId,
        status,
        ...(notes[studentId] ? { note: notes[studentId] } : {}),
      }));
      await teacherAPI.saveAttendance(session._id, { records });
      setSavedAt(Date.now());
      toast.success('Attendance saved');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not save attendance'));
    } finally {
      setSaving(false);
    }
  };

  const counts = useMemo(() => {
    const c = { PRESENT: 0, ABSENT: 0, LEAVE: 0 };
    Object.values(attendance).forEach((s) => {
      c[s] = (c[s] ?? 0) + 1;
    });
    return c;
  }, [attendance]);

  const total = sessionData?.students?.length ?? 0;
  const marked = Object.keys(attendance).length;

  // Clear the "saved" confirmation as soon as anything changes again.
  useEffect(() => {
    if (savedAt) setSavedAt(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attendance, notes]);

  if (step === 'mark' && sessionData) {
    const subject = sessionData.session?.subjectId;

    return (
      <div className="space-y-5 pb-24">
        <Button variant="ghost" size="sm" onClick={() => setStep('select')} className="-ml-2">
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
          All classes
        </Button>

        {/* Labelled facts, not a middle-dot string. */}
        <div className="space-y-3">
          <h1 className="text-page text-ink">Take attendance</h1>
          <dl className="flex flex-wrap gap-x-8 gap-y-3 border-b border-line pb-4">
            <div>
              <dt className="text-meta text-ink-subtle">Class</dt>
              <dd className="mt-0.5 text-dense font-medium text-ink">
                {sessionData.session?.classId?.name} {sessionData.session?.classId?.section}
              </dd>
            </div>
            <div>
              <dt className="text-meta text-ink-subtle">Subject</dt>
              <dd className="mt-0.5">
                <SubjectLabel subject={subject} className="text-dense font-medium text-ink" inline />
              </dd>
            </div>
            <div>
              <dt className="text-meta text-ink-subtle">Date</dt>
              <dd className="mt-0.5 text-dense font-medium text-ink">
                {formatDateLong(sessionData.session?.sessionDate ?? new Date())}
              </dd>
            </div>
            <div>
              <dt className="text-meta text-ink-subtle">Time</dt>
              <dd className="mt-0.5 text-dense font-medium text-ink tabular">
                {formatTime(sessionData.session?.startTime)} –{' '}
                {formatTime(sessionData.session?.endTime)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setAll('PRESENT')}>
            Mark all present
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setAll('ABSENT')}>
            Mark all absent
          </Button>

          <div className="ml-auto flex items-center gap-2" aria-live="polite">
            <CountChip label="Present" value={counts.PRESENT} tone="success" />
            <CountChip label="Absent" value={counts.ABSENT} tone="danger" />
            <CountChip label="Leave" value={counts.LEAVE} tone="warning" />
          </div>
        </div>

        <ul className="divide-y divide-line rounded-card border border-line bg-surface shadow-card">
          {sessionData.students.map((student: any, idx: number) => {
            const status = attendance[student._id] ?? 'PRESENT';
            const needsNote = status === 'ABSENT' || status === 'LEAVE';

            return (
              <li key={student._id} className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="w-6 shrink-0 text-meta text-ink-subtle tabular">{idx + 1}</span>
                  <PersonAvatar name={student.fullName} src={student.photoUrl} className="h-8 w-8" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-dense font-medium text-ink">{student.fullName}</p>
                    <p className="text-meta text-ink-subtle tabular">{student.studentId}</p>
                  </div>
                  <StatusSegmented
                    value={status}
                    onValueChange={(v) =>
                      setAttendance((prev) => ({ ...prev, [student._id]: v as Status }))
                    }
                    options={OPTIONS}
                    ariaLabel={`Attendance for ${student.fullName}`}
                  />
                </div>

                {needsNote && (
                  <div className="mt-2 pl-9">
                    <Input
                      value={notes[student._id] ?? ''}
                      onChange={(e) =>
                        setNotes((prev) => ({ ...prev, [student._id]: e.target.value }))
                      }
                      placeholder="Add a note (optional)"
                      aria-label={`Note for ${student.fullName}`}
                      className="h-8 max-w-md text-meta"
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {/* Sticky save bar: progress on the left, the action on the right. */}
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:left-60">
          <div className="mx-auto flex max-w-[1440px] items-center gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-meta text-ink-muted tabular">
                {marked} of {total} marked
              </p>
              <Progress value={total ? (marked / total) * 100 : 0} className="mt-1 max-w-xs" />
            </div>
            {savedAt && (
              <span className="flex items-center gap-1.5 text-meta font-medium text-success">
                <CheckCircle2 className="h-4 w-4" strokeWidth={1.75} />
                Saved
              </span>
            )}
            <Button onClick={saveAttendance} loading={saving}>
              <Check className="h-4 w-4" strokeWidth={1.75} />
              Save attendance
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Attendance"
        description={formatDateLong(new Date())}
        actions={
          <Button variant="secondary" asChild>
            <Link href="/teacher/register">
              <Sheet className="h-4 w-4" strokeWidth={1.75} />
              Open register
            </Link>
          </Button>
        }
      />

      {loadingSchedule ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-card" />
          ))}
        </div>
      ) : failed ? (
        <ErrorState description="Your schedule did not load." onRetry={load} />
      ) : !schedule.length ? (
        <div className="rounded-card border border-line bg-surface shadow-card">
          <EmptyState
            icon={CalendarClock}
            title="No classes scheduled today"
            description="Attendance is taken from a scheduled class. Nothing is on your routine for today."
          />
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {schedule.map((slot: any) => (
            <li key={slot._id}>
              <Card className="flex h-full flex-col p-4">
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      'h-10 w-1 shrink-0 rounded-full',
                      subjectTint(slot.teacherAssignmentId?.subjectId)
                    )}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <SubjectLabel
                      subject={slot.teacherAssignmentId?.subjectId}
                      className="text-dense font-semibold text-ink"
                    />
                  </div>
                </div>

                <dl className="mt-3 flex-1 space-y-2">
                  <div className="flex justify-between gap-2">
                    <dt className="text-meta text-ink-subtle">Class</dt>
                    <dd className="text-meta font-medium text-ink">
                      {slot.classId?.name} {slot.classId?.section}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-meta text-ink-subtle">Time</dt>
                    <dd className="text-meta font-medium text-ink tabular">
                      {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                    </dd>
                  </div>
                  {(slot.room || slot.classId?.room) && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-meta text-ink-subtle">Room</dt>
                      <dd className="text-meta font-medium text-ink">
                        {slot.room || slot.classId?.room}
                      </dd>
                    </div>
                  )}
                </dl>

                <Button
                  className="mt-4 w-full"
                  onClick={() => openSession(slot)}
                  loading={opening === slot._id}
                >
                  <Users className="h-4 w-4" strokeWidth={1.75} />
                  Take attendance
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CountChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'success' | 'danger' | 'warning';
}) {
  const toneClass = {
    success: 'bg-success-bg text-success',
    danger: 'bg-danger-bg text-danger',
    warning: 'bg-warning-bg text-warning',
  }[tone];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-chip px-2 py-1 text-meta font-medium transition-colors',
        toneClass
      )}
    >
      {label}
      <span className="tabular font-semibold">{value}</span>
    </span>
  );
}
