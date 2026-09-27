'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, Plus, AlertCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminAPI } from '@/lib/api/admin';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState, ErrorState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { TimetableGrid, TimetableDayList } from '@/components/shared/TimetableGrid';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Combobox } from '@/components/ui/combobox';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
} from '@/components/ui/sheet';
import { DAYS, SHORT_DAYS, PERIODS } from '@/lib/constants';
import { apiErrorMessage, cn, formatTime } from '@/lib/utils';
import { subjectBn } from '@/lib/design/subjects';

const emptyForm = {
  dayOfWeek: 0,
  startTime: '',
  endTime: '',
  teacherAssignmentId: '',
  room: '',
};

export default function TimetablePage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [timetable, setTimetable] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  /** The backend's 409 conflict message, shown in the sheet rather than as a toast. */
  const [conflict, setConflict] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<any>(null);
  const [removing, setRemoving] = useState(false);

  // Phones show one day at a time; default to today when it is a school day.
  const [mobileDay, setMobileDay] = useState(() => {
    const today = new Date().getDay();
    return [0, 1, 2, 3, 4].includes(today) ? today : 0;
  });

  useEffect(() => {
    adminAPI
      .getClasses()
      .then((r) => {
        const list = r.data.data ?? [];
        setClasses(list);
        if (list.length) setSelectedClass(list[0]._id);
      })
      .catch(() => toast.error('Could not load classes'))
      .finally(() => setLoading(false));
    adminAPI.getAssignments().then((r) => setAssignments(r.data.data ?? [])).catch(() => setAssignments([]));
    // The school week and period times are configured, not hardcoded.
    adminAPI.getSettings().then((r) => setSettings(r.data.data)).catch(() => setSettings(null));
  }, []);

  const loadTimetable = useCallback(() => {
    if (!selectedClass) return;
    setFailed(false);
    adminAPI
      .getTimetable({ classId: selectedClass })
      .then((r) => setTimetable(r.data.data ?? []))
      .catch(() => {
        setFailed(true);
        toast.error('Could not load the routine');
      });
  }, [selectedClass]);

  useEffect(loadTimetable, [loadTimetable]);

  const days: number[] = settings?.activeDays?.length ? settings.activeDays : [0, 1, 2, 3, 4];
  const periods = settings?.periods?.length ? settings.periods : PERIODS;

  const classOptions = useMemo(
    () =>
      classes.map((c: any) => ({
        value: c._id,
        label: `${c.name} ${c.section ?? ''}`.trim(),
        hint: c.room || undefined,
      })),
    [classes]
  );

  /** Only assignments for the class on screen can go into its routine. */
  const assignmentOptions = useMemo(
    () =>
      assignments
        .filter((a: any) => a.classId?._id === selectedClass)
        .map((a: any) => ({
          value: a._id,
          label: a.subjectId?.name ?? 'Subject',
          hint: [subjectBn(a.subjectId), a.teacherId?.fullName].filter(Boolean).join(' · '),
        })),
    [assignments, selectedClass]
  );

  const openSlot = (day: number, period: { start: string; end: string }) => {
    setEditing(null);
    setForm({
      dayOfWeek: day,
      startTime: period.start,
      endTime: period.end,
      teacherAssignmentId: '',
      room: '',
    });
    setConflict(null);
    setOpen(true);
  };

  const openEntry = (entry: any) => {
    setEditing(entry);
    setForm({
      dayOfWeek: entry.dayOfWeek,
      startTime: entry.startTime,
      endTime: entry.endTime,
      teacherAssignmentId: entry.teacherAssignmentId?._id ?? '',
      room: entry.room ?? '',
    });
    setConflict(null);
    setOpen(true);
  };

  const openBlank = () => {
    const first = periods[0];
    setEditing(null);
    setForm({
      dayOfWeek: days[0],
      startTime: first?.startTime ?? first?.start ?? '',
      endTime: first?.endTime ?? first?.end ?? '',
      teacherAssignmentId: '',
      room: '',
    });
    setConflict(null);
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConflict(null);
    setSaving(true);
    try {
      if (editing) {
        await adminAPI.updateTimetableEntry(editing._id, { ...form, classId: selectedClass });
        toast.success('Routine updated');
      } else {
        await adminAPI.createTimetableEntry({ ...form, classId: selectedClass });
        toast.success('Class added to the routine');
      }
      setOpen(false);
      loadTimetable();
    } catch (err) {
      setConflict(apiErrorMessage(err, 'Could not save this routine entry'));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setRemoving(true);
    try {
      await adminAPI.deleteTimetableEntry(deleting._id);
      toast.success('Removed from the routine');
      setDeleting(null);
      setOpen(false);
      loadTimetable();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not remove this entry'));
    } finally {
      setRemoving(false);
    }
  };

  const currentClass = classes.find((c: any) => c._id === selectedClass);

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-96 w-full rounded-card" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Routine"
        description="Sunday to Thursday, 9:00 am to 2:00 pm."
        actions={
          <Button onClick={openBlank} disabled={!selectedClass}>
            <Plus className="h-4 w-4" strokeWidth={1.75} />
            Add a class
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-52">
          <Combobox
            options={classOptions}
            value={selectedClass}
            onChange={setSelectedClass}
            placeholder="Choose a class"
            searchPlaceholder="Find a class"
          />
        </div>
        {currentClass?.room && (
          <p className="text-meta text-ink-subtle">{currentClass.room}</p>
        )}
      </div>

      {!selectedClass ? (
        <div className="rounded-card border border-line bg-surface shadow-card">
          <EmptyState
            icon={CalendarDays}
            title="No class selected"
            description="Choose a class to see its routine."
          />
        </div>
      ) : failed ? (
        <ErrorState description="The routine did not load." onRetry={loadTimetable} />
      ) : (
        <>
          {/* Desktop and tablet: the full week, as it hangs on the notice board. */}
          <div className="hidden sm:block">
            <TimetableGrid
              entries={timetable}
              days={days}
              periods={periods}
              onSelectSlot={openSlot}
              onSelectEntry={openEntry}
              secondary="teacher"
            />
          </div>

          {/* Phones: day tabs and a vertical list. */}
          <div className="space-y-3 sm:hidden">
            <div
              role="tablist"
              aria-label="Day"
              className="flex gap-1 overflow-x-auto rounded-btn border border-line p-0.5"
            >
              {days.map((d) => (
                <button
                  key={d}
                  role="tab"
                  aria-selected={mobileDay === d}
                  onClick={() => setMobileDay(d)}
                  className={cn(
                    'min-h-[2.25rem] flex-1 rounded-chip px-2 text-meta font-medium transition-colors',
                    mobileDay === d ? 'bg-wash text-brand' : 'text-ink-muted'
                  )}
                >
                  {SHORT_DAYS[d]}
                </button>
              ))}
            </div>
            <TimetableDayList
              entries={timetable}
              day={mobileDay}
              periods={periods}
              onSelectEntry={openEntry}
              secondary="teacher"
            />
          </div>
        </>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editing ? 'Edit this period' : 'Add to the routine'}</SheetTitle>
            <SheetDescription>
              {DAYS[form.dayOfWeek]}, {formatTime(form.startTime)} to {formatTime(form.endTime)}
              {currentClass ? ` · ${currentClass.name} ${currentClass.section ?? ''}`.trim() : ''}
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <SheetBody className="space-y-4">
              {conflict && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-card border border-danger/30 bg-danger-bg px-3 py-2.5"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" strokeWidth={1.75} />
                  <div>
                    <p className="text-dense font-medium text-danger">Clash in the routine</p>
                    <p className="mt-0.5 text-dense text-danger">{conflict}</p>
                  </div>
                </div>
              )}

              <Field label="Subject and teacher" required>
                {(p) =>
                  assignmentOptions.length ? (
                    <Combobox
                      {...p}
                      options={assignmentOptions}
                      value={form.teacherAssignmentId}
                      onChange={(v) => setForm((f) => ({ ...f, teacherAssignmentId: v }))}
                      placeholder="Choose a subject"
                      searchPlaceholder="Find a subject"
                    />
                  ) : (
                    <p className="rounded-chip border border-line bg-surface-sunken px-3 py-2 text-dense text-ink-muted">
                      No teachers are assigned to this class yet.
                    </p>
                  )
                }
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Day" required>
                  {(p) => (
                    <Combobox
                      {...p}
                      options={days.map((d) => ({ value: String(d), label: DAYS[d] }))}
                      value={String(form.dayOfWeek)}
                      onChange={(v) => setForm((f) => ({ ...f, dayOfWeek: parseInt(v, 10) }))}
                      placeholder="Choose a day"
                      searchPlaceholder="Find a day"
                    />
                  )}
                </Field>
                <Field label="Room">
                  {(p) => (
                    <Input
                      {...p}
                      value={form.room}
                      onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}
                      placeholder={currentClass?.room || 'Room 107'}
                    />
                  )}
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Starts" required>
                  {(p) => (
                    <Input
                      {...p}
                      type="time"
                      value={form.startTime}
                      onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                      required
                    />
                  )}
                </Field>
                <Field label="Ends" required>
                  {(p) => (
                    <Input
                      {...p}
                      type="time"
                      value={form.endTime}
                      onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                      required
                    />
                  )}
                </Field>
              </div>
            </SheetBody>

            <SheetFooter className="sm:justify-between">
              {editing ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-danger hover:bg-danger-bg hover:text-danger"
                  onClick={() => setDeleting(editing)}
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                  Remove
                </Button>
              ) : (
                <span className="hidden sm:block" />
              )}
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={saving} disabled={!form.teacherAssignmentId}>
                  {editing ? 'Save changes' : 'Add to routine'}
                </Button>
              </div>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Remove this from the routine?"
        description={
          <>
            <strong className="text-ink">
              {deleting?.teacherAssignmentId?.subjectId?.name ?? 'This class'}
            </strong>{' '}
            on {DAYS[deleting?.dayOfWeek ?? 0]} at {formatTime(deleting?.startTime)} will be removed
            from {currentClass?.name} {currentClass?.section}.
          </>
        }
        confirmLabel="Remove"
        destructive
        loading={removing}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
