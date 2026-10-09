'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Trash2, Check, BookMarked, BookOpenCheck, NotebookPen } from 'lucide-react';
import { toast } from 'sonner';
import { studentAPI } from '@/lib/api/student';
import { Combobox } from '@/components/ui/combobox';
import { Button } from '@/components/ui/button';
import { apiErrorMessage, cn, formatDateLong } from '@/lib/utils';
import { t, getLanguage } from '@/lib/i18n';
import { subjectBn } from '@/lib/design/subjects';

type Kind = 'HOMEWORK' | 'STUDY';
const dayKey = (d: Date) => d.toLocaleDateString('en-CA');
const shift = (key: string, n: number) => {
  const d = new Date(`${key}T12:00:00`);
  d.setDate(d.getDate() + n);
  return dayKey(d);
};

/**
 * The student's own diary: a book that opens on the page, one spread per
 * day. The left page lists what to do — homework, and study to prepare for
 * the next class — with a tick for each; the right page is where they write.
 * Turning to another day turns the page.
 */
export function StudyDiary() {
  const [date, setDate] = React.useState(() => dayKey(new Date()));
  const [direction, setDirection] = React.useState<1 | -1>(1);
  const [entries, setEntries] = React.useState<any[] | null>(null);
  const [subjects, setSubjects] = React.useState<any[]>([]);
  const [kind, setKind] = React.useState<Kind>('HOMEWORK');
  const [subjectId, setSubjectId] = React.useState('');
  const [text, setText] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const bangla = getLanguage() === 'bn';

  React.useEffect(() => {
    studentAPI
      .getSubjects()
      .then((r) => setSubjects(r.data.data ?? []))
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    setEntries(null);
    studentAPI
      .getDiary(date)
      .then((r) => setEntries(r.data.data ?? []))
      .catch(() => {
        setEntries([]);
        toast.error(t('Could not open your diary'));
      });
  }, [date]);

  const turn = (n: 1 | -1) => {
    setDirection(n);
    setDate((d) => shift(d, n));
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    try {
      const r = await studentAPI.addDiaryEntry({ date, kind, subjectId: subjectId || undefined, text: text.trim() });
      setEntries((list) => [...(list ?? []), r.data.data]);
      setText('');
    } catch (err) {
      toast.error(apiErrorMessage(err, t('Could not save to your diary')));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (entry: any) => {
    setEntries((list) => list?.map((x) => (x._id === entry._id ? { ...x, done: !x.done } : x)) ?? null);
    try {
      await studentAPI.updateDiaryEntry(entry._id, { done: !entry.done });
    } catch (err) {
      setEntries((list) => list?.map((x) => (x._id === entry._id ? { ...x, done: entry.done } : x)) ?? null);
      toast.error(apiErrorMessage(err, t('Could not update your diary')));
    }
  };

  const remove = async (entry: any) => {
    const before = entries;
    setEntries((list) => list?.filter((x) => x._id !== entry._id) ?? null);
    try {
      await studentAPI.deleteDiaryEntry(entry._id);
    } catch (err) {
      setEntries(before);
      toast.error(apiErrorMessage(err, t('Could not update your diary')));
    }
  };

  const isToday = date === dayKey(new Date());
  const homework = (entries ?? []).filter((e) => e.kind === 'HOMEWORK');
  const study = (entries ?? []).filter((e) => e.kind === 'STUDY');
  const left = (entries ?? []).filter((e) => !e.done).length;
  const subjectName = (s: any) => (bangla && subjectBn(s) ? subjectBn(s) : s?.name);

  return (
    <section aria-labelledby="diary-heading" className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="diary-heading" className="flex items-center gap-2 text-section text-ink">
            <NotebookPen className="h-5 w-5 text-brand" strokeWidth={1.75} aria-hidden="true" />
            {t('My diary')}
          </h2>
          <p className="text-dense text-ink-muted">{t('Write down your homework and what to study before the next class.')}</p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => turn(-1)} aria-label={t('Previous day')}>
            <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
          </Button>
          {!isToday && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const today = dayKey(new Date());
                setDirection(today > date ? 1 : -1);
                setDate(today);
              }}
            >
              {t('Today')}
            </Button>
          )}
          <Button variant="ghost" size="icon-sm" onClick={() => turn(1)} aria-label={t('Next day')}>
            <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
          </Button>
        </div>
      </div>

      {/* The book. Perspective on the wrapper gives the pages real depth. */}
      <div className="relative mx-auto max-w-4xl [perspective:2200px]">
        <div className="relative rounded-[22px] bg-[#7A2E2E] p-2.5 shadow-[0_30px_60px_-25px_rgb(0_0_0/0.55),0_10px_20px_-10px_rgb(0_0_0/0.3)] sm:p-3 dark:bg-[#4A1F2A]">
          {/* Spine shadow down the middle on wide screens */}
          <div
            className="pointer-events-none absolute inset-y-3 left-1/2 z-20 hidden w-8 -translate-x-1/2 bg-[linear-gradient(90deg,transparent,rgb(0_0_0/0.18)_45%,rgb(0_0_0/0.28)_50%,rgb(0_0_0/0.18)_55%,transparent)] md:block"
            aria-hidden="true"
          />

          {/* The cover swings open once, when the diary first appears. */}
          <motion.div
            initial={{ rotateY: 0 }}
            animate={{ rotateY: -180 }}
            transition={{ duration: 1.1, delay: 0.25, ease: [0.65, 0, 0.35, 1] }}
            style={{ transformOrigin: 'left center', backfaceVisibility: 'hidden', transformStyle: 'preserve-3d' }}
            className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 rounded-[22px] bg-[#7A2E2E] text-[#F3D9A4] shadow-[inset_0_0_0_6px_rgb(0_0_0/0.12),inset_0_0_0_8px_rgb(243_217_164/0.35)] dark:bg-[#4A1F2A]"
            aria-hidden="true"
          >
            <NotebookPen className="h-10 w-10" strokeWidth={1.5} />
            <span className="text-2xl font-bold tracking-wide">{t('My diary')}</span>
          </motion.div>

          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={date}
              custom={direction}
              initial={{ rotateY: direction > 0 ? 70 : -70, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: direction > 0 ? -70 : 70, opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformOrigin: direction > 0 ? 'left center' : 'right center', transformStyle: 'preserve-3d' }}
              className="grid overflow-hidden rounded-[16px] md:grid-cols-2"
            >
              {/* Left page: the day's list */}
              <Page side="left">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-[0.95rem] font-semibold text-[#5A2323] dark:text-[#F0C9A8]">{formatDateLong(`${date}T12:00:00`)}</p>
                  {entries && entries.length > 0 && (
                    <span className="text-meta text-[#8A6A55] dark:text-[#C9A98F]">
                      {left ? t('{n} left to do', { n: left }) : t('All done!')}
                    </span>
                  )}
                </div>

                {!entries ? (
                  <div className="mt-6 space-y-3" aria-hidden="true">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="h-4 w-3/4 animate-pulse rounded bg-black/5 dark:bg-white/10" />
                    ))}
                  </div>
                ) : !entries.length ? (
                  <p className="mt-8 text-center text-dense italic text-[#8A6A55] dark:text-[#C9A98F]">
                    {t('Nothing written for this day yet.')}
                  </p>
                ) : (
                  <div className="mt-3 space-y-4">
                    <EntryGroup
                      icon={BookMarked}
                      title={t('Homework')}
                      items={homework}
                      onToggle={toggle}
                      onRemove={remove}
                      subjectName={subjectName}
                    />
                    <EntryGroup
                      icon={BookOpenCheck}
                      title={t('Study for next class')}
                      items={study}
                      onToggle={toggle}
                      onRemove={remove}
                      subjectName={subjectName}
                    />
                  </div>
                )}
              </Page>

              {/* Right page: write */}
              <Page side="right">
                <form onSubmit={add} className="flex h-full flex-col gap-3">
                  <p className="text-[0.95rem] font-semibold text-[#5A2323] dark:text-[#F0C9A8]">{t('Write in your diary')}</p>
                  <div className="grid grid-cols-2 gap-1 rounded-full bg-black/[0.06] p-1 dark:bg-white/10" role="group" aria-label={t('What is it?')}>
                    {(
                      [
                        ['HOMEWORK', t('Homework')],
                        ['STUDY', t('Study for next class')],
                      ] as [Kind, string][]
                    ).map(([k, label]) => (
                      <button
                        key={k}
                        type="button"
                        aria-pressed={kind === k}
                        onClick={() => setKind(k)}
                        className={cn(
                          'rounded-full px-3 py-1.5 text-meta font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                          kind === k ? 'bg-[#7A2E2E] text-white shadow-sm dark:bg-[#B5574E]' : 'text-[#6B4B3B] hover:text-[#3A2A20] dark:text-[#D9BFA8]'
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <Combobox
                    options={[
                      { value: '', label: t('Any subject') },
                      ...subjects.map((s) => ({ value: s._id, label: subjectName(s), hint: bangla ? s.name : subjectBn(s) ?? undefined })),
                    ]}
                    value={subjectId}
                    onChange={setSubjectId}
                    placeholder={t('Subject (optional)')}
                    searchPlaceholder={t('Find a subject')}
                    className="border-[#E3D6C3] bg-white/70 dark:border-white/15 dark:bg-white/5"
                  />
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    maxLength={500}
                    rows={4}
                    placeholder={kind === 'HOMEWORK' ? t('e.g. Exercise 3.2, questions 1 to 5') : t('e.g. Read chapter 4 before Sunday’s class')}
                    aria-label={t('Diary entry')}
                    lang={bangla ? 'bn' : undefined}
                    className="min-h-[7rem] w-full flex-1 resize-none rounded-xl border border-[#E3D6C3] bg-[repeating-linear-gradient(transparent,transparent_27px,rgb(160_140_120/0.25)_27px,rgb(160_140_120/0.25)_28px)] bg-white/50 px-3 py-1 text-body leading-[28px] text-[#2F2520] placeholder:text-[#A8907C] focus:border-[#7A2E2E] focus:outline-none focus:ring-2 focus:ring-[#7A2E2E]/20 dark:border-white/15 dark:bg-white/5 dark:text-[#F4E9DC] dark:placeholder:text-[#9C8774]"
                  />
                  <Button type="submit" loading={saving} disabled={!text.trim()} className="self-end bg-[#7A2E2E] text-white hover:bg-[#652424] dark:bg-[#B5574E] dark:hover:bg-[#A04A42]">
                    <Plus className="h-4 w-4" strokeWidth={2} />
                    {t('Add to diary')}
                  </Button>
                </form>
              </Page>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

/** A paper page: cream, ruled, with a red margin line. */
function Page({ side, children }: { side: 'left' | 'right'; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'relative min-h-[22rem] bg-[#FFFBF2] px-5 py-5 pl-10 sm:px-7 sm:pl-12 dark:bg-[#232843]',
        'bg-[repeating-linear-gradient(transparent,transparent_31px,rgb(173_150_120/0.22)_31px,rgb(173_150_120/0.22)_32px)] dark:bg-[repeating-linear-gradient(transparent,transparent_31px,rgb(255_255_255/0.06)_31px,rgb(255_255_255/0.06)_32px)]',
        side === 'left'
          ? 'md:shadow-[inset_-18px_0_24px_-20px_rgb(0_0_0/0.25)]'
          : 'border-t border-[#EADFCC] md:border-t-0 md:shadow-[inset_18px_0_24px_-20px_rgb(0_0_0/0.25)] dark:border-white/10'
      )}
    >
      <span className="pointer-events-none absolute inset-y-0 left-6 w-px bg-[#E07A7A]/60 sm:left-8" aria-hidden="true" />
      {children}
    </div>
  );
}

function EntryGroup({
  icon: Icon,
  title,
  items,
  onToggle,
  onRemove,
  subjectName,
}: {
  icon: any;
  title: string;
  items: any[];
  onToggle: (e: any) => void;
  onRemove: (e: any) => void;
  subjectName: (s: any) => string;
}) {
  if (!items.length) return null;
  return (
    <div>
      <p className="flex items-center gap-1.5 text-meta font-semibold uppercase tracking-wide text-[#8A4B3B] dark:text-[#E3A98E]">
        <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
        {title}
      </p>
      <ul className="mt-1.5 space-y-1">
        <AnimatePresence initial={false}>
          {items.map((e) => (
            <motion.li
              key={e._id}
              layout
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="group flex items-start gap-2.5 py-0.5"
            >
              <button
                type="button"
                role="checkbox"
                aria-checked={e.done}
                aria-label={e.text}
                onClick={() => onToggle(e)}
                className={cn(
                  'mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                  e.done ? 'border-[#3F7A4E] bg-[#3F7A4E] text-white' : 'border-[#B9A28C] hover:border-[#7A2E2E] dark:border-[#8A7766]'
                )}
              >
                {e.done && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
              </button>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    'whitespace-pre-wrap break-words text-body leading-[1.6] text-[#2F2520] dark:text-[#F4E9DC]',
                    e.done && 'text-[#9C8A7A] line-through decoration-[#9C8A7A]/70 dark:text-[#8A7A6C]'
                  )}
                >
                  {e.text}
                </p>
                {e.subjectId && <p className="text-meta text-[#8A6A55] dark:text-[#C9A98F]">{subjectName(e.subjectId)}</p>}
              </div>
              <button
                type="button"
                onClick={() => onRemove(e)}
                aria-label={t('Remove from diary')}
                className="mt-0.5 rounded-md p-1 text-[#B9A28C] opacity-0 transition hover:text-[#A33A3A] focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
