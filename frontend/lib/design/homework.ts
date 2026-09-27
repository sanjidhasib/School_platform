import { BookMarked, ClipboardList, BookOpenCheck, type LucideIcon } from 'lucide-react';

/**
 * The three kinds of work a teacher can set. One definition, shared by the
 * student dashboard, the homework page and the teacher's form, so a piece of
 * work reads the same way everywhere.
 */
export type HomeworkType = 'ASSIGNMENT' | 'HOMEWORK' | 'NEXT_CLASS';

export interface HomeworkTypeMeta {
  value: HomeworkType;
  label: string;
  plural: string;
  labelBn: string;
  hint: string;
  icon: LucideIcon;
  /** Chip colours: tinted background with matching text. */
  tone: string;
}

export const HOMEWORK_TYPES: HomeworkTypeMeta[] = [
  {
    value: 'ASSIGNMENT',
    label: 'Assignment',
    plural: 'Assignments',
    labelBn: 'অ্যাসাইনমেন্ট',
    hint: 'A longer piece of work, marked by the teacher.',
    icon: ClipboardList,
    tone: 'bg-info-bg text-info',
  },
  {
    value: 'HOMEWORK',
    label: 'Homework',
    plural: 'Homework',
    labelBn: 'বাড়ির কাজ',
    hint: 'Work to do at home and hand in.',
    icon: BookMarked,
    tone: 'bg-brand-wash text-brand',
  },
  {
    value: 'NEXT_CLASS',
    label: 'Prepare for next class',
    plural: 'Prepare for next class',
    labelBn: 'পরের ক্লাসের প্রস্তুতি',
    hint: 'Reading or practice to do before the next lesson.',
    icon: BookOpenCheck,
    tone: 'bg-success-bg text-success',
  },
];

export function homeworkType(type?: string | null): HomeworkTypeMeta {
  return HOMEWORK_TYPES.find((t) => t.value === type) ?? HOMEWORK_TYPES[1];
}
