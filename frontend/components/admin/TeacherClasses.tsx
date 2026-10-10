'use client';

import * as React from 'react';
import { BookOpen, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { adminAPI } from '@/lib/api/admin';
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { Field } from '@/components/ui/field';
import { apiErrorMessage } from '@/lib/utils';
import { t } from '@/lib/i18n';

const classLabel = (c: any) => (c ? `${c.name}${c.section ? ` ${c.section}` : ''}` : '');

/**
 * Teachers → a teacher → "Classes & subjects": everything they teach, and a
 * way to give them another class and subject from here instead of going to
 * each class page. The server refuses anything that would put them in two
 * classes at the same time in the routine, and says which periods clash.
 */
export function TeacherClasses({
  teacher,
  assignments,
  onOpenChange,
  onChanged,
}: {
  teacher: any | null;
  /** Every active assignment in the school (to show who teaches a slot now). */
  assignments: any[];
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}) {
  const [classes, setClasses] = React.useState<any[]>([]);
  const [subjects, setSubjects] = React.useState<any[]>([]);
  const [classId, setClassId] = React.useState('');
  const [subjectId, setSubjectId] = React.useState('');
  const [busy, setBusy] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!teacher) return;
    setClassId('');
    setSubjectId('');
    adminAPI
      .getClasses()
      .then((r) => setClasses((r.data.data ?? []).filter((c: any) => c.isActive !== false)))
      .catch(() => toast.error(t('Could not load classes')));
  }, [teacher]);

  React.useEffect(() => {
    setSubjectId('');
    setSubjects([]);
    if (!classId) return;
    adminAPI
      .getSubjects({ classId })
      .then((r) => setSubjects((r.data.data ?? []).filter((s: any) => s.isActive !== false)))
      .catch(() => toast.error(t('Could not load subjects')));
  }, [classId]);

  const mine = React.useMemo(
    () =>
      assignments
        .filter((a) => (a.teacherId?._id ?? a.teacherId) === teacher?._id)
        .sort(
          (a, b) =>
            (a.classId?.gradeNumber ?? 0) - (b.classId?.gradeNumber ?? 0) ||
            String(a.subjectId?.name).localeCompare(String(b.subjectId?.name))
        ),
    [assignments, teacher]
  );

  const holder = (cid: string, sid: string) =>
    assignments.find((a) => (a.classId?._id ?? a.classId) === cid && (a.subjectId?._id ?? a.subjectId) === sid);

  const current = classId && subjectId ? holder(classId, subjectId) : null;
  const alreadyMine = current && (current.teacherId?._id ?? current.teacherId) === teacher?._id;

  const assign = async () => {
    if (!teacher || !classId || !subjectId) return;
    setBusy('add');
    try {
      await adminAPI.assignClassTeacher(classId, { subjectId, teacherId: teacher._id });
      const cls = classes.find((c) => c._id === classId);
      const sub = subjects.find((s) => s._id === subjectId);
      toast.success(t('{name} now teaches {subject} in {class}', { name: teacher.fullName, subject: sub?.name ?? '', class: classLabel(cls) }));
      setSubjectId('');
      onChanged();
    } catch (err) {
      toast.error(apiErrorMessage(err, t('Could not assign the teacher')), { duration: 10000 });
    } finally {
      setBusy(null);
    }
  };

  const remove = async (a: any) => {
    setBusy(a._id);
    try {
      await adminAPI.assignClassTeacher(a.classId?._id ?? a.classId, { subjectId: a.subjectId?._id ?? a.subjectId, teacherId: null });
      toast.success(t('Removed from {subject} in {class}', { subject: a.subjectId?.name ?? '', class: classLabel(a.classId) }));
      onChanged();
    } catch (err) {
      toast.error(apiErrorMessage(err, t('Could not remove the class')));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Sheet open={!!teacher} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t('Classes & subjects')}</SheetTitle>
          <SheetDescription>
            {t('What {name} teaches. A teacher can take any number of classes, but never two at the same time in the routine.', {
              name: teacher?.fullName ?? '',
            })}
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="space-y-6">
          <section className="space-y-2">
            <h3 className="text-dense font-semibold text-ink">{t('Teaching now')}</h3>
            {mine.length ? (
              <ul className="divide-y divide-line rounded-card border border-line">
                {mine.map((a) => (
                  <li key={a._id} className="flex items-center gap-3 px-3 py-2.5">
                    <BookOpen className="h-4 w-4 shrink-0 text-ink-subtle" strokeWidth={1.75} aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-dense font-medium text-ink">{a.subjectId?.name}</p>
                      <p className="text-meta text-ink-muted">{classLabel(a.classId)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      loading={busy === a._id}
                      onClick={() => remove(a)}
                      aria-label={t('Remove {subject} in {class}', { subject: a.subjectId?.name ?? '', class: classLabel(a.classId) })}
                    >
                      <X className="h-4 w-4" strokeWidth={1.75} />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-card border border-dashed border-line px-3 py-4 text-center text-dense text-ink-muted">
                {t('Not teaching any class yet.')}
              </p>
            )}
          </section>

          <section className="space-y-3 border-t border-line pt-5">
            <h3 className="text-dense font-semibold text-ink">{t('Add a class')}</h3>
            <Field label={t('Class')}>
              {() => (
                <Combobox
                  options={classes.map((c) => ({ value: c._id, label: classLabel(c) }))}
                  value={classId}
                  onChange={setClassId}
                  placeholder={t('Choose a class')}
                  searchPlaceholder={t('Find a class')}
                />
              )}
            </Field>
            <Field label={t('Subject')}>
              {() => (
                <Combobox
                  options={subjects.map((s) => {
                    const h = holder(classId, s._id);
                    return { value: s._id, label: s.name, hint: h ? t('Now: {name}', { name: h.teacherId?.fullName ?? '' }) : t('No teacher yet') };
                  })}
                  value={subjectId}
                  onChange={setSubjectId}
                  placeholder={classId ? t('Choose a subject') : t('Choose a class first')}
                  searchPlaceholder={t('Find a subject')}
                  disabled={!classId}
                />
              )}
            </Field>

            {current && !alreadyMine && (
              <p className="rounded-btn bg-warning-bg px-3 py-2 text-meta text-warning">
                {t('{name} teaches this now and will be replaced. Their past attendance and marks are kept.', { name: current.teacherId?.fullName ?? '' })}
              </p>
            )}
            {alreadyMine && <p className="text-meta text-ink-muted">{t('Already teaching this.')}</p>}

            <Button className="w-full" onClick={assign} loading={busy === 'add'} disabled={!classId || !subjectId || !!alreadyMine}>
              <Plus className="h-4 w-4" strokeWidth={1.75} />
              {current && !alreadyMine ? t('Replace and assign') : t('Assign')}
            </Button>
          </section>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
