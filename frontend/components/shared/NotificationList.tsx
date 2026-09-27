'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  AlertCircle,
  BookMarked,
  Award,
  CalendarDays,
  type LucideIcon,
} from 'lucide-react';
import { cn, formatDayGroup, formatRelativeTime } from '@/lib/utils';
import { EmptyState } from '@/components/shared/EmptyState';

/**
 * Shared by the student, guardian and admin notification pages. Grouped by
 * Today / Yesterday / date, with the type carried by an icon as well as the
 * unread marker, so nothing depends on colour alone.
 */

const TYPE_ICONS: Record<string, LucideIcon> = {
  ABSENCE: AlertCircle,
  MISSING_HOMEWORK: BookMarked,
  HOMEWORK: BookMarked,
  RESULT: Award,
  NOTICE: CalendarDays,
};

/** Where a notification of each type should take the reader, per role. */
const TARGETS: Record<string, Record<string, string>> = {
  STUDENT: {
    ABSENCE: '/student/attendance',
    MISSING_HOMEWORK: '/student/homework',
    HOMEWORK: '/student/homework',
    RESULT: '/student/results',
  },
  GUARDIAN: {
    ABSENCE: '/guardian/attendance',
    MISSING_HOMEWORK: '/guardian/dashboard',
    HOMEWORK: '/guardian/dashboard',
    RESULT: '/guardian/results',
  },
};

export interface NotificationItem {
  _id: string;
  type?: string;
  title: string;
  message: string;
  isRead?: boolean;
  createdAt: string;
}

export function NotificationList({
  notifications,
  role,
  onMarkRead,
  emptyTitle = 'No notifications',
  emptyDescription = 'Anything the school sends you will appear here.',
}: {
  notifications: NotificationItem[];
  role?: string | null;
  onMarkRead?: (id: string) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const router = useRouter();

  const groups = React.useMemo(() => {
    const out: { label: string; items: NotificationItem[] }[] = [];
    notifications.forEach((n) => {
      const label = formatDayGroup(n.createdAt);
      const last = out[out.length - 1];
      if (last && last.label === label) last.items.push(n);
      else out.push({ label, items: [n] });
    });
    return out;
  }, [notifications]);

  if (!notifications.length) {
    return (
      <div className="rounded-card border border-line bg-surface shadow-card">
        <EmptyState icon={Bell} title={emptyTitle} description={emptyDescription} />
      </div>
    );
  }

  const open = (n: NotificationItem) => {
    if (!n.isRead) onMarkRead?.(n._id);
    const target = role ? TARGETS[role]?.[n.type ?? ''] : undefined;
    if (target) router.push(target);
  };

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section key={group.label} className="space-y-2">
          <h2 className="text-meta font-medium text-ink-subtle">{group.label}</h2>
          <ul className="divide-y divide-line rounded-card border border-line bg-surface shadow-card">
            {group.items.map((n) => {
              const Icon = TYPE_ICONS[n.type ?? ''] ?? Bell;
              const actionable = role ? Boolean(TARGETS[role]?.[n.type ?? '']) : false;
              const interactive = actionable || (!n.isRead && Boolean(onMarkRead));

              const body = (
                <>
                  <span
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                      n.isRead ? 'bg-surface-sunken text-ink-subtle' : 'bg-wash text-brand'
                    )}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          'truncate text-dense',
                          n.isRead ? 'font-normal text-ink-muted' : 'font-semibold text-ink'
                        )}
                      >
                        {n.title}
                      </span>
                      {!n.isRead && (
                        <span className="shrink-0 rounded-chip bg-brand-wash px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand">
                          New
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-dense text-ink-muted">{n.message}</span>
                    <span className="mt-1 block text-meta text-ink-subtle">
                      {formatRelativeTime(n.createdAt)}
                    </span>
                  </span>
                </>
              );

              return (
                <li key={n._id}>
                  {interactive ? (
                    <button
                      type="button"
                      onClick={() => open(n)}
                      className={cn(
                        'flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-wash/50',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand',
                        !n.isRead && 'bg-wash/30'
                      )}
                    >
                      {body}
                    </button>
                  ) : (
                    <div className={cn('flex gap-3 px-4 py-3', !n.isRead && 'bg-wash/30')}>{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
