'use client';
import { useEffect, useState } from 'react';
import { studentAPI } from '@/lib/api/student';
import { StatCard } from '@/components/shared/StatCard';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { CardSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { CheckSquare, BookMarked, BarChart3, Bell, Cpu, Clock } from 'lucide-react';
import { formatDate, formatPercentage } from '@/lib/utils';
import { DAYS } from '@/lib/constants';
import Link from 'next/link';
import { toast } from 'sonner';

export default function StudentDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { studentAPI.getDashboard().then(r => setData(r.data.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="space-y-6"><div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({length:4}).map((_,i) => <CardSkeleton key={i} />)}</div></div>;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{greeting}, {data?.student?.fullName?.split(' ')[0]}! 👋</h1>
        <p className="text-slate-500 text-sm mt-1">{data?.student?.classId?.name} {data?.student?.classId?.section} · {DAYS[new Date().getDay()]}</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Attendance" value={formatPercentage(data?.attendancePercentage ?? 0)} icon={CheckSquare} iconColor="text-green-600" iconBg="bg-green-50" />
        <StatCard label="Pending Homework" value={data?.pendingHomework?.length ?? 0} icon={BookMarked} iconColor="text-orange-600" iconBg="bg-orange-50" />
        <StatCard label="Unread Alerts" value={data?.unreadNotifications ?? 0} icon={Bell} iconColor="text-red-600" iconBg="bg-red-50" />
        <Link href="/student/ai-learning"><div className="rounded-xl border border-blue-200 bg-blue-600 p-6 shadow-sm cursor-pointer hover:bg-blue-700 transition-colors"><div className="flex items-center gap-3"><div className="h-12 w-12 rounded-xl bg-blue-500 flex items-center justify-center"><Cpu className="h-6 w-6 text-white" /></div><div><p className="text-sm text-blue-100 font-medium">AI Learning</p><p className="text-white font-bold">Ask a question</p></div></div></div></Link>
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="p-4 border-b border-slate-100"><h2 className="font-semibold text-slate-900">Today's Classes</h2></div>
          {!data?.todaySchedule?.length ? <EmptyState title="No classes today" /> : (
            <div className="divide-y divide-slate-100">
              {data.todaySchedule.map((e: any) => (
                <div key={e._id} className="flex items-center gap-3 p-4">
                  <div className="flex items-center gap-1 text-slate-400 text-xs"><Clock className="h-3 w-3" />{e.startTime}</div>
                  <div className="flex-1"><p className="font-medium text-sm text-slate-900">{e.teacherAssignmentId?.subjectId?.name}</p></div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between"><h2 className="font-semibold text-slate-900">Pending Homework</h2><Link href="/student/homework"><Button variant="ghost" size="sm">View all</Button></Link></div>
          {!data?.pendingHomework?.length ? <EmptyState title="No pending homework" description="You're all caught up!" /> : (
            <div className="divide-y divide-slate-100">
              {data.pendingHomework.slice(0,4).map((hw: any) => (
                <div key={hw._id} className="p-4 flex items-center gap-3">
                  <div className="flex-1"><p className="font-medium text-sm text-slate-900">{hw.title}</p><p className="text-xs text-slate-500">{hw.subjectId?.name} · Due {formatDate(hw.dueAt)}</p></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {data?.recentNotices?.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="p-4 border-b border-slate-100"><h2 className="font-semibold text-slate-900">School Notices</h2></div>
          <div className="divide-y divide-slate-100">
            {data.recentNotices.map((n: any) => (
              <div key={n._id} className="p-4">
                <p className="font-medium text-sm text-slate-900">{n.title}</p>
                <p className="text-xs text-slate-500 mt-1">{n.description?.slice(0,100)}...</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
