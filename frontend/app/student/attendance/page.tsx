'use client';
import { useEffect, useState } from 'react';
import { studentAPI } from '@/lib/api/student';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TableSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { Progress } from '@/components/ui/progress';
import { formatDate, formatPercentage } from '@/lib/utils';
import { CheckSquare } from 'lucide-react';
import { toast } from 'sonner';

export default function StudentAttendancePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { studentAPI.getAttendance().then(r => setData(r.data.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false)); }, []);

  if (loading) return <TableSkeleton rows={8} />;

  return (
    <div className="space-y-6">
      <PageHeader title="My Attendance" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-5"><p className="text-sm text-slate-500">Total Sessions</p><p className="text-2xl font-bold">{data?.summary?.total ?? 0}</p></div>
        <div className="bg-white rounded-xl border p-5"><p className="text-sm text-green-600">Present</p><p className="text-2xl font-bold text-green-700">{data?.summary?.present ?? 0}</p></div>
        <div className="bg-white rounded-xl border p-5"><p className="text-sm text-red-500">Absent</p><p className="text-2xl font-bold text-red-600">{data?.summary?.absent ?? 0}</p></div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-slate-500">Percentage</p>
          <p className="text-2xl font-bold">{formatPercentage(data?.summary?.percentage ?? 0)}</p>
          <Progress value={data?.summary?.percentage ?? 0} className="mt-2" />
        </div>
      </div>
      {!data?.attendance?.length ? <EmptyState icon={CheckSquare} title="No attendance records yet" description="Attendance records will appear once classes begin" /> : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b"><tr><th className="px-4 py-3 text-left font-medium text-slate-500 text-xs uppercase">Date</th><th className="px-4 py-3 text-left font-medium text-slate-500 text-xs uppercase">Subject</th><th className="px-4 py-3 text-left font-medium text-slate-500 text-xs uppercase">Time</th><th className="px-4 py-3 text-left font-medium text-slate-500 text-xs uppercase">Status</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {data.attendance.map(({ session, record }: any) => (
                <tr key={session._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">{formatDate(session.sessionDate)}</td>
                  <td className="px-4 py-3">{session.subjectId?.name || '—'}</td>
                  <td className="px-4 py-3 font-mono text-slate-500">{session.startTime}</td>
                  <td className="px-4 py-3"><StatusBadge status={record?.status || 'NOT_SUBMITTED'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
