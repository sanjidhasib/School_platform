'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { studentAPI } from '@/lib/api/student';
import { PageHeader } from '@/components/shared/PageHeader';
import { NotificationList } from '@/components/shared/NotificationList';
import { ErrorState } from '@/components/shared/EmptyState';
import { ListSkeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { apiErrorMessage } from '@/lib/utils';

export default function StudentNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [marking, setMarking] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setFailed(false);
    studentAPI
      .getNotifications()
      .then((r) => setNotifications(r.data.data ?? []))
      .catch(() => {
        setFailed(true);
        toast.error('Could not load notifications');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const markRead = async (id: string) => {
    // Update straight away so the row does not wait on the round trip.
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
      toast.success('All marked as read');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not mark them as read'));
    } finally {
      setMarking(false);
    }
  };

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Notifications"
        description={unread ? `${unread} unread` : undefined}
        actions={
          unread > 0 ? (
            <Button variant="secondary" onClick={markAllRead} loading={marking}>
              Mark all as read
            </Button>
          ) : undefined
        }
      />

      {loading ? (
        <ListSkeleton rows={5} />
      ) : failed ? (
        <ErrorState description="Notifications did not load." onRetry={load} />
      ) : (
        <NotificationList
          notifications={notifications}
          role="STUDENT"
          onMarkRead={markRead}
          emptyTitle="Nothing new"
          emptyDescription="Messages about your attendance, homework and results appear here."
        />
      )}
    </div>
  );
}
