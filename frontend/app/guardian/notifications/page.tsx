'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { guardianAPI } from '@/lib/api/guardian';
import { studentAPI } from '@/lib/api/student';
import { PageHeader } from '@/components/shared/PageHeader';
import { NotificationList } from '@/components/shared/NotificationList';
import { ErrorState } from '@/components/shared/EmptyState';
import { ListSkeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { apiErrorMessage } from '@/lib/utils';
import { t } from '@/lib/i18n';

/**
 * The notifications endpoint already allowed GUARDIAN; there was simply no page
 * for it. Read and read-all go through the same routes the student page uses.
 */
export default function GuardianNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [marking, setMarking] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setFailed(false);
    guardianAPI
      .getNotifications()
      .then((r) => setNotifications(r.data.data ?? []))
      .catch(() => {
        setFailed(true);
        toast.error(t('Could not load notifications'));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const markRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    try {
      await studentAPI.markNotificationRead(id);
    } catch {
      load();
    }
  };

  const markAllRead = async () => {
    setMarking(true);
    try {
      await studentAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success(t('All marked as read'));
    } catch (err) {
      toast.error(apiErrorMessage(err, t('Could not mark them as read')));
    } finally {
      setMarking(false);
    }
  };

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('Notifications')}
        description={unread ? t('{unread} unread', { unread }) : undefined}
        actions={
          unread > 0 ? (
            <Button variant="secondary" onClick={markAllRead} loading={marking}>
              {t('Mark all as read')}
            </Button>
          ) : undefined
        }
      />

      {loading ? (
        <ListSkeleton rows={5} />
      ) : failed ? (
        <ErrorState description={t('Notifications did not load.')} onRetry={load} />
      ) : (
        <NotificationList
          notifications={notifications}
          role="GUARDIAN"
          onMarkRead={markRead}
          emptyTitle="Nothing new"
          emptyDescription="Messages about your child's attendance, homework and results appear here."
        />
      )}
    </div>
  );
}
