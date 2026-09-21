'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { studentAPI } from '@/lib/api/student';
import { adminAPI } from '@/lib/api/admin';
import { cn, formatRelativeTime } from '@/lib/utils';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { EmptyState } from '@/components/shared/EmptyState';

/** Where a role's own notification list lives. Admin got one in this branch. */
const LIST_PATH: Record<string, string> = {
  STUDENT: '/student/notifications',
  GUARDIAN: '/guardian/notifications',
  ADMIN: '/admin/notifications',
};

export function NotificationBell() {
  const { user } = useAuth();
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const prevUnread = React.useRef<number | null>(null);
  const [pop, setPop] = React.useState(false);

  const role = user?.role;
  const listPath = role ? LIST_PATH[role] : undefined;

  const load = React.useCallback(() => {
    if (!role) return;
    // Teachers have no notification feed of their own in this API.
    const request =
      role === 'ADMIN' ? adminAPI.getNotifications() : role === 'TEACHER' ? null : studentAPI.getNotifications();
    if (!request) {
      setLoading(false);
      return;
    }
    request
      .then((r) => setItems(r.data.data ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [role]);

  React.useEffect(() => {
    load();
  }, [load]);

  const unread = items.filter((n) => !n.isRead).length;

  // The badge pops only when a new one actually arrives, never on first paint.
  React.useEffect(() => {
    if (prevUnread.current !== null && unread > prevUnread.current) {
      setPop(true);
      const t = setTimeout(() => setPop(false), 400);
      return () => clearTimeout(t);
    }
    prevUnread.current = unread;
  }, [unread]);

  if (!role || role === 'TEACHER') return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
          className="relative flex h-8 w-8 items-center justify-center rounded-btn text-ink-subtle transition-colors hover:bg-wash hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <Bell className="h-4 w-4" strokeWidth={1.75} />
          <AnimatePresence>
            {unread > 0 && (
              <motion.span
                key="badge"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: pop ? 1.25 : 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold leading-none text-white tabular"
              >
                {unread > 9 ? '9+' : unread}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-line px-3 py-2.5">
          <p className="text-dense font-semibold text-ink">Notifications</p>
          {unread > 0 && <span className="text-meta text-ink-subtle tabular">{unread} unread</span>}
        </div>
        <div className="scrollbar-thin max-h-80 overflow-y-auto">
          {loading ? (
            <div className="space-y-2 p-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="space-y-1.5">
                  <div className="skeleton h-3 w-2/3" />
                  <div className="skeleton h-2.5 w-full" />
                </div>
              ))}
            </div>
          ) : !items.length ? (
            <EmptyState icon={Bell} title="Nothing new" compact />
          ) : (
            <ul className="divide-y divide-line">
              {items.slice(0, 6).map((n) => (
                <li
                  key={n._id}
                  className={cn('px-3 py-2.5', !n.isRead && 'bg-wash/50')}
                >
                  <p className="text-dense font-medium text-ink">{n.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-meta text-ink-muted">{n.message}</p>
                  <p className="mt-1 text-meta text-ink-subtle">{formatRelativeTime(n.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
        {listPath && (
          <div className="border-t border-line p-2">
            <Link
              href={listPath}
              className="block rounded-chip px-2 py-1.5 text-center text-dense font-medium text-brand transition-colors hover:bg-wash focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              See all notifications
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
