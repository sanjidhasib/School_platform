'use client';
import { useEffect, useState } from 'react';
import { studentAPI } from '@/lib/api/student';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Bell, AlertCircle, BookMarked, Trophy } from 'lucide-react';
import { formatRelativeTime, cn } from '@/lib/utils';
import { toast } from 'sonner';

const typeIcons: Record<string, any> = { ABSENCE: AlertCircle, MISSING_HOMEWORK: BookMarked, HOMEWORK: BookMarked, NOTICE: Bell, DEFAULT: Bell };

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => { studentAPI.getNotifications().then(r => setNotifications(r.data.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const markRead = async (id: string) => { await studentAPI.markNotificationRead(id); load(); };
  const markAllRead = async () => { await studentAPI.markAllRead(); load(); toast.success('All marked as read'); };

  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" actions={<Button variant="secondary" size="sm" onClick={markAllRead}>Mark all read</Button>} />
      {!notifications.length ? <EmptyState icon={Bell} title="No notifications" description="You're all caught up!" /> : (
        <div className="space-y-2">
          {notifications.map((n: any) => {
            const Icon = typeIcons[n.type] || typeIcons.DEFAULT;
            return (
              <div key={n._id} onClick={() => !n.isRead && markRead(n._id)} className={cn('flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-colors', n.isRead ? 'bg-white border-slate-200' : 'bg-blue-50 border-blue-200 hover:bg-blue-100')}>
                <div className={cn('h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0', n.isRead ? 'bg-slate-100' : 'bg-blue-100')}><Icon className={cn('h-4 w-4', n.isRead ? 'text-slate-500' : 'text-blue-600')} /></div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-medium', n.isRead ? 'text-slate-700' : 'text-slate-900')}>{n.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                  <p className="text-xs text-slate-400 mt-1">{formatRelativeTime(n.createdAt)}</p>
                </div>
                {!n.isRead && <div className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0 mt-1" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
