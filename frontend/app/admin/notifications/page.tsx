'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { adminAPI } from '@/lib/api/admin';
import { PageHeader } from '@/components/shared/PageHeader';
import { NotificationList } from '@/components/shared/NotificationList';
import { ErrorState } from '@/components/shared/EmptyState';
import { ListSkeleton } from '@/components/ui/skeleton';
import { t } from '@/lib/i18n';

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setFailed(false);
    adminAPI
      .getNotifications()
      .then((r) => setNotifications(r.data.data ?? []))
      .catch(() => {
        setFailed(true);
        toast.error(t('Could not load notifications'));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('Notifications')}
        description={unread ? t('{unread} unread', { unread }) : t('Everything sent to this account.')}
      />

      {loading ? (
        <ListSkeleton rows={5} />
      ) : failed ? (
        <ErrorState description={t('Notifications did not load.')} onRetry={load} />
      ) : (
        <NotificationList
          notifications={notifications}
          role="ADMIN"
          emptyTitle="Nothing here yet"
          emptyDescription="System notices sent to this account will appear here."
        />
      )}
    </div>
  );
}
