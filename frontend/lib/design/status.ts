import {
  Check,
  X,
  Clock,
  CircleDashed,
  FileCheck2,
  Award,
  Archive,
  Lock,
  PenLine,
  CircleSlash,
  GraduationCap,
  ArrowRightLeft,
  type LucideIcon,
} from 'lucide-react';

/**
 * One status vocabulary for the whole product.
 *
 * Every status is an icon *and* a word. Colour is never the only carrier of
 * meaning, so the UI still reads correctly in greyscale and for colour-blind
 * users. The keys are exactly the enum values the API returns.
 */

export type StatusTone = 'success' | 'danger' | 'warning' | 'info' | 'neutral';

export interface StatusMeta {
  label: string;
  icon: LucideIcon;
  tone: StatusTone;
}

const STATUSES: Record<string, StatusMeta> = {
  // Attendance
  PRESENT: { label: 'Present', icon: Check, tone: 'success' },
  ABSENT: { label: 'Absent', icon: X, tone: 'danger' },
  LEAVE: { label: 'Leave', icon: Clock, tone: 'warning' },

  // Homework submission
  NOT_SUBMITTED: { label: 'Not submitted', icon: CircleDashed, tone: 'neutral' },
  SUBMITTED: { label: 'Submitted', icon: FileCheck2, tone: 'success' },
  LATE: { label: 'Late', icon: Clock, tone: 'warning' },
  GRADED: { label: 'Graded', icon: Award, tone: 'info' },

  // Homework / assessment lifecycle
  DRAFT: { label: 'Draft', icon: PenLine, tone: 'warning' },
  PUBLISHED: { label: 'Published', icon: Check, tone: 'success' },
  CLOSED: { label: 'Closed', icon: CircleSlash, tone: 'neutral' },
  ARCHIVED: { label: 'Archived', icon: Archive, tone: 'neutral' },
  LOCKED: { label: 'Locked', icon: Lock, tone: 'neutral' },
  FINAL: { label: 'Final', icon: Check, tone: 'success' },

  // Attendance session
  OPEN: { label: 'Open', icon: CircleDashed, tone: 'warning' },

  // People
  ACTIVE: { label: 'Active', icon: Check, tone: 'success' },
  INACTIVE: { label: 'Inactive', icon: CircleSlash, tone: 'neutral' },
  GRADUATED: { label: 'Graduated', icon: GraduationCap, tone: 'info' },
  TRANSFERRED: { label: 'Transferred', icon: ArrowRightLeft, tone: 'neutral' },
};

const FALLBACK: StatusMeta = { label: 'Unknown', icon: CircleDashed, tone: 'neutral' };

export function statusMeta(status?: string | null): StatusMeta {
  if (!status) return FALLBACK;
  const found = STATUSES[status.toUpperCase()];
  if (found) return found;
  // Render an unrecognised enum value readably rather than as "Unknown".
  return {
    label: status.replace(/_/g, ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase()),
    icon: CircleDashed,
    tone: 'neutral',
  };
}

export const TONE_CLASSES: Record<StatusTone, string> = {
  success: 'bg-success-bg text-success',
  danger: 'bg-danger-bg text-danger',
  warning: 'bg-warning-bg text-warning',
  info: 'bg-info-bg text-info',
  neutral: 'bg-surface-sunken text-ink-muted',
};
