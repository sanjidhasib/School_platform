'use client';
import { useEffect, useState } from 'react';
import { adminAPI } from '@/lib/api/admin';
import { StatCard } from '@/components/shared/StatCard';
import { PageHeader } from '@/components/shared/PageHeader';
import { CardSkeleton, TableSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { Users, GraduationCap, BookOpen, Calendar } from 'lucide-react';
import { DAYS } from '@/lib/constants';
import toast from 'react-hot-toast';

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getDashboard().then(r => setData(r.data.data)).catch(() => toast.error('Failed to load dashboard')).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-6"><div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({length:4}).map((_,i) => <CardSkeleton key={i} />)}</div><TableSkeleton /></div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="School overview for today" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Students" value={data?.totalStudents ?? 0} icon={GraduationCap} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard label="Total Teachers" value={data?.totalTeachers ?? 0} icon={Users} iconColor="text-green-600" iconBg="bg-green-50" />
        <StatCard label="Active Classes" value={data?.activeClasses ?? 0} icon={BookOpen} iconColor="text-purple-600" iconBg="bg-purple-50" />
        <StatCard label="Today's Sessions" value={data?.todaySessionsCount ?? 0} icon={Calendar} iconColor="text-orange-600" iconBg="bg-orange-50" />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="p-4 border-b border-slate-100"><h2 className="font-semibold text-slate-900">Today's Timetable — {DAYS[new Date().getDay()]}</h2></div>
        {!data?.todayTimetable?.length ? <EmptyState title="No classes scheduled today" description="Add timetable entries to see today's schedule" /> : (
          <div className="divide-y divide-slate-100">
            {data.todayTimetable.map((entry: any) => (
              <div key={entry._id} className="flex items-center gap-4 p-4">
                <div className="w-24 text-sm font-mono text-slate-500">{entry.startTime}–{entry.endTime}</div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{entry.teacherAssignmentId?.subjectId?.name}</p>
                  <p className="text-sm text-slate-500">{entry.classId?.name} {entry.classId?.section} · {entry.teacherAssignmentId?.teacherId?.fullName}</p>
                </div>
                {entry.room && <div className="text-sm text-slate-400">Room {entry.room}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
